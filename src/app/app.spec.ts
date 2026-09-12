import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { AppComponent } from './app';
import { SUPABASE_CONFIG } from './core/config/supabase.config';
import catalogo from './catalogo-verificato.json';

const LIST = `${SUPABASE_CONFIG.productsUrl}?select=*&order=created_at.asc`;
const dati = catalogo.map((p, i) => ({
  id: String(i + 1),
  nome: p.nome,
  prezzo: p.prezzo,
  immagine: p.immagineFonte,
  disponibile: i % 2 === 0,
  quantita: i % 2 === 0 ? 3 : 0,
}));

describe('DeviceHub', () => {
  let http: HttpTestingController;

  beforeEach(async () => {
    sessionStorage.clear();
    await TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  function avvia(rows = dati) {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    http.expectOne(LIST).flush(rows.map((p) => ({ ...p })));
    fixture.detectChanges();
    return {
      fixture,
      app: fixture.componentInstance,
      element: fixture.nativeElement as HTMLElement,
    };
  }

  it('mostra venti schede, sei marchi e fonti specifiche', () => {
    const { app, element } = avvia();
    expect(element.querySelector('h1')?.textContent).toContain('DeviceHub');
    expect(element.querySelectorAll('article.card')).toHaveLength(20);
    expect(app.marche).toHaveLength(6);
    expect(element.querySelectorAll('a.source-link')).toHaveLength(20);
    expect(element.textContent).toContain('le modifiche restano soltanto in questa scheda');
  });

  it('normalizza fotografie remote e mantiene la selezione originale', () => {
    const { app } = avvia([...dati].reverse());
    expect(app.prodotti.map((p) => p.nome)).toEqual(catalogo.map((p) => p.nome));
    expect(app.prodotti.map((p) => p.immagine)).toEqual(catalogo.map((p) => p.immagine));
  });

  it('combina ricerca per parole, marchio e disponibilità', () => {
    const { app } = avvia();
    app.ricerca = ' PIXEL 256 ';
    app.marcaSelezionata = 'Google';
    app.filtroDisponibilita = 'disponibili';
    expect(app.prodottiFiltrati.map((p) => p.nome)).toEqual([
      'Google Pixel 11 Pro',
      'Google Pixel 11 Pro XL',
      'Google Pixel 11',
    ]);
    app.resetFiltri();
    expect(app.prodottiFiltrati).toHaveLength(20);
  });

  it('ordina per prezzo senza mutare l’ordine del catalogo', () => {
    const { app } = avvia();
    app.ordinamento = 'prezzo-asc';
    expect(app.prodottiFiltrati[0].nome).toBe('realme 16 Pro 5G');
    app.ordinamento = 'prezzo-desc';
    expect(app.prodottiFiltrati[0].nome).toBe('Samsung Galaxy Z Fold8');
    expect(app.prodotti[0].nome).toBe(catalogo[0].nome);
  });

  it('mostra lo stato vuoto quando la ricerca non trova modelli', () => {
    const { app, fixture, element } = avvia();
    app.ricerca = 'nessuna-corrispondenza';
    fixture.changeDetectorRef.markForCheck();
    fixture.detectChanges();
    expect(element.querySelectorAll('article.card')).toHaveLength(0);
    expect(element.textContent).toContain('Nessun dispositivo trovato');
  });

  it('calcola inventario e formatta gli euro in italiano', () => {
    const { app } = avvia();
    expect(app.prodottiDisponibili).toBe(10);
    expect(app.prodottiEsauriti).toBe(10);
    expect(app.pezziTotali).toBe(30);
    expect(app.formattaPrezzo(1599.99).replace(/\s/g, '')).toBe('1.599,99€');
  });

  it('valida valori non finiti, quantità negative e immagine obbligatoria', () => {
    const { app } = avvia([]);
    app.nuovoNome = 'Telefono personale';
    app.nuovoPrezzo = Infinity;
    app.nuovaQuantita = -1;
    app.aggiungiProdotto();
    expect(app.nuovoProdottoErrors.prezzo).not.toBe('');
    expect(app.nuovoProdottoErrors.quantita).not.toBe('');
    expect(app.nuovoProdottoErrors.immagine).toContain('foto reale');
    http.expectNone(SUPABASE_CONFIG.productsUrl);
  });

  it('esegue la creazione una sola volta nella sandbox senza POST', () => {
    const { app } = avvia([]);
    app.nuovoNome = 'Telefono personale';
    app.nuovoPrezzo = 299.99;
    app.nuovaQuantita = 0;
    app.nuovaImmaginePreview = 'data:image/webp;base64,preview';
    app.aggiungiProdotto();
    expect(app.prodotti).toHaveLength(1);
    expect(app.prodotti[0].disponibile).toBe(false);
    expect(app.nuovoNome).toBe('');
    expect(app.isSaving).toBe(false);
    http.expectNone(SUPABASE_CONFIG.productsUrl);
  });

  it('azzera quantità e disponibilità soltanto nella sandbox', () => {
    const { app } = avvia([dati[0]]);
    app.toggleDisponibile(app.prodotti[0]);
    expect(app.prodotti[0]).toMatchObject({ disponibile: false, quantita: 0 });
    expect(app.pendingIds.size).toBe(0);
    http.expectNone(`${SUPABASE_CONFIG.productsUrl}?id=eq.1`);
  });

  it('salva una modifica locale e preserva il riferimento immagine del catalogo', () => {
    const { app } = avvia([dati[0]]);
    app.iniziaModifica(app.prodotti[0]);
    app.editDisponibile = false;
    app.editQuantita = 8;
    app.editPrezzo = 1400;
    app.salvaModifica();
    expect(app.prodotti[0]).toMatchObject({ prezzo: 1400, disponibile: false, quantita: 0 });
    expect(app.prodotti[0].immagine).toBe(catalogo[0].immagine);
    expect(app.isSaving).toBe(false);
  });

  it('annulla e conferma l’eliminazione senza DELETE remoto', () => {
    const { app } = avvia([dati[0]]);
    app.richiediEliminazione('1');
    app.annullaEliminazione();
    expect(app.prodotti).toHaveLength(1);
    app.richiediEliminazione('1');
    app.eliminaProdotto('1');
    expect(app.prodotti).toHaveLength(0);
    http.expectNone(`${SUPABASE_CONFIG.productsUrl}?id=eq.1`);
  });

  it('ripristina il dataset originale dopo modifiche distruttive locali', () => {
    const { app } = avvia([dati[0], dati[1]]);
    app.eliminaProdotto('1');
    expect(app.prodotti).toHaveLength(1);
    app.ripristinaDemo();
    expect(app.prodotti.map((p) => p.id)).toEqual(['1', '2']);
    expect(app.successMessage).toContain('ripristinata');
  });

  it('riusa la sandbox nella stessa sessione dopo un nuovo caricamento', () => {
    const first = avvia([dati[0], dati[1]]);
    first.app.eliminaProdotto('1');
    first.fixture.destroy();
    const second = avvia([dati[0], dati[1]]);
    expect(second.app.prodotti.map((p) => p.id)).toEqual(['2']);
  });

  it('usa un fallback immagine senza creare cicli', () => {
    const { app } = avvia([dati[0]]);
    app.usaImmagineFallback(app.prodotti[0]);
    app.usaImmagineFallback(app.prodotti[0]);
    expect(app.prodotti[0].immagine).toBe('/images/immagine-non-disponibile.svg');
  });

  it('sblocca il loading e mostra un errore utile se Supabase non risponde', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    http.expectOne(LIST).flush({}, { status: 503, statusText: 'Non disponibile' });
    fixture.detectChanges();
    expect(fixture.componentInstance.isLoading).toBe(false);
    expect(fixture.nativeElement.textContent).toContain('Il catalogo non è disponibile');
    expect(fixture.nativeElement.textContent).toContain('Riprova');
  });
});
