// Migrazione circoscritta dei 16 dispositivi originali, con quattro nuove righe.
// Senza --apply esegue soltanto la lettura e prepara il piano locale.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import assert from 'node:assert/strict';
const root = new URL('../', import.meta.url);
const catalogo = JSON.parse(
  readFileSync(new URL('src/app/catalogo-verificato.json', root), 'utf8'),
);
const app = readFileSync(new URL('src/app/app.ts', root), 'utf8');
const api = app.match(/const SUPABASE_API_URL = '([^']+)'/)[1];
const key =
  process.env.SUPABASE_PUBLISHABLE_KEY || app.match(/const SUPABASE_PUBLIC_KEY = '([^']+)'/)[1];
const headers = { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' };
const originali = [
  ['2968', 'Galaxy S25 Ultra', 'Samsung Galaxy S26 Ultra'],
  ['2269', 'iPhone 15 Pro', 'iPhone 17 Pro'],
  ['3', 'Pixel 6', 'Google Pixel 11 Pro'],
  ['4', 'OnePlus 10 Pro', 'Xiaomi 17 Ultra'],
  ['10', 'HTC U12+', 'OPPO Find X9 Ultra'],
  ['8', 'Asus ROG Phone 5', 'realme GT 8 Pro'],
  ['zfl6', 'Galaxy Z Flip6', 'Samsung Galaxy Z Fold8'],
  ['2', 'iPhone 14 Pro', 'iPhone Air'],
  ['galaxy-s23-ultra-mqv8xxp4', 'Galaxy S23 Ultra', 'Samsung Galaxy S26+'],
  ['acde', 'iPhone 15', 'iPhone 17'],
  ['f022', 'Google Pixel 9 Pro XL', 'Google Pixel 11 Pro XL'],
  ['6', 'Moto G Power', 'Xiaomi 17'],
  ['9', 'LG Velvet', 'OPPO Find X9 Pro'],
  ['5', 'Xperia 1 III', 'realme 16 Pro+ 5G'],
  ['1', 'Galaxy S22 Ultra', 'Samsung Galaxy S26'],
  ['7', 'Nokia XR20', 'iPhone 17e'],
];
async function request(suffix = '', options = {}) {
  const response = await fetch(api + suffix, {
    ...options,
    headers: { ...headers, ...options.headers },
    signal: AbortSignal.timeout(60000),
  });
  if (!response.ok) throw new Error(`Supabase: HTTP ${response.status}`);
  return response.json();
}
const current = await request('?select=*&order=id.asc');
assert.equal(catalogo.length, 20);
assert.equal(new Set(catalogo.map((p) => p.nome)).size, 20);
if (current.length === 20 && catalogo.every((p) => current.some((c) => c.nome === p.nome))) {
  console.log(
    'Catalogo già aggiornato: nessuna scrittura, quantità e modifiche successive conservate.',
  );
  process.exit(0);
}
assert.equal(current.length, 16, 'Numero di righe inatteso: migrazione interrotta.');
for (const [id, nome] of originali) {
  assert.equal(
    current.find((p) => p.id === id)?.nome,
    nome,
    `La riga ${id} è cambiata: non viene sovrascritta.`,
  );
}
const next = catalogo.map((p) => {
  const oldId = originali.find(([, , nome]) => nome === p.nome)?.[0];
  const old = current.find((c) => c.id === oldId);
  return {
    id: oldId || `catalogo-20260908-${p.immagine.split('/').pop().replace('.webp', '')}`,
    nome: p.nome,
    prezzo: p.prezzo,
    immagine: p.immagineFonte,
    quantita: old?.quantita ?? 0,
    disponibile: old?.disponibile ?? false,
  };
});
mkdirSync(new URL('tmp/', root), { recursive: true });
const stamp = new Date().toISOString().replace(/[:.]/g, '-');
writeFileSync(new URL(`tmp/catalogo-backup-${stamp}.json`, root), JSON.stringify(current, null, 2));
writeFileSync(new URL('tmp/catalogo-piano.json', root), JSON.stringify(next, null, 2));
console.table(next.map(({ id, nome, prezzo }) => ({ id, nome, prezzo })));
if (!process.argv.includes('--apply')) {
  console.log(
    'Piano pronto: 16 aggiornamenti e 4 inserimenti. Per applicare: node scripts/aggiorna-catalogo.mjs --apply',
  );
  process.exit(0);
}
assert.deepEqual(
  await request('?select=*&order=id.asc'),
  current,
  'Dati cambiati durante la preparazione: operazione annullata.',
);
await request('?on_conflict=id', {
  method: 'POST',
  headers: { Prefer: 'resolution=merge-duplicates,return=representation' },
  body: JSON.stringify(next),
});
const actual = await request('?select=*&order=id.asc');
assert.equal(actual.length, 20);
for (const planned of next) {
  const saved = actual.find((p) => p.id === planned.id);
  for (const field of Object.keys(planned))
    assert.deepEqual(saved?.[field], planned[field], `Verifica fallita: ${planned.nome}, ${field}`);
}
writeFileSync(
  new URL('tmp/catalogo-verificato-supabase.json', root),
  JSON.stringify(actual, null, 2),
);
console.log(
  'Supabase verificato: esattamente 20 modelli, prezzi e immagini corrispondenti al piano.',
);
