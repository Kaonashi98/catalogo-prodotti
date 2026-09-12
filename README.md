# DeviceHub

DeviceHub è una web app Angular per esplorare e gestire un inventario dimostrativo di smartphone. Mostra un flusso CRUD completo, filtri combinabili, immagini ottimizzate e prezzi accompagnati da fonti datate, senza permettere ai visitatori di alterare permanentemente il dataset condiviso.

[Demo online](https://catalogo-prodotti.vercel.app/) · [Fonti del catalogo](docs/catalogo-2026-09-08.md)

## Funzionalità

- 20 smartphone di Apple, Samsung, Google, OPPO, realme e Xiaomi.
- Ricerca per modello, marchio e memoria, filtro per disponibilità e ordinamento.
- Creazione, modifica, eliminazione, quantità e disponibilità in una sandbox per scheda browser.
- Ripristino immediato della sandbox ai dati originali caricati da Supabase.
- Upload con validazione, limite di 4 MB, ridimensionamento e conversione WebP.
- Stati di caricamento, feedback accessibili e fallback per errori di rete o immagini.
- Layout responsive, navigabile da tastiera e pubblicato su Vercel.

Quantità e disponibilità sono dati dimostrativi, non scorte dei negozi citati. I prezzi sono una rilevazione dell'8 settembre 2026 e non si aggiornano automaticamente. Una scheda modificata non presenta più il prezzo come verificato.

## Stack

- Angular 21 e TypeScript 5.9
- Angular Forms e HttpClient
- RxJS
- Supabase/PostgreSQL
- SCSS
- Vitest
- GitHub Actions e Vercel

## Architettura

```text
src/app/
├── core/config/                  # configurazione infrastrutturale pubblica
├── features/products/
│   ├── models/                   # contratti TypeScript
│   └── services/
│       ├── product-api.service.ts       # lettura Supabase
│       ├── demo-inventory.service.ts    # CRUD isolato in sessionStorage
│       ├── product-catalog.service.ts   # normalizzazione e metadati
│       └── product-image.service.ts     # validazione e compressione immagini
├── app.ts                        # stato e coordinamento della vista
└── app.html                      # interfaccia principale
```

La dimensione attuale non giustifica uno store globale o un backend applicativo aggiuntivo. I servizi separano I/O, dominio e immagini, mentre il componente principale coordina un'unica pagina.

## Supabase e sicurezza della demo

Supabase è la fonte in sola lettura del dataset iniziale. Le operazioni CRUD dell'interfaccia lavorano su una copia in `sessionStorage`: ogni scheda del browser è isolata, un refresh conserva la prova in corso e **Ripristina dati originali** ricrea la copia dal dataset Supabase.

URL e publishable key sono centralizzati in `src/app/core/config/supabase.config.ts`. La publishable key deve essere disponibile al browser e quindi compare inevitabilmente nel bundle: non è un segreto e non sostituisce le policy Row Level Security. Service role key e altri segreti non devono mai essere inseriti nel frontend.

Per rendere il database realmente non modificabile tramite chiamate REST dirette, applica in Supabase SQL Editor:

```text
supabase/migrations/20260912_read_only_portfolio_demo.sql
```

La migration abilita RLS, conserva le policy esistenti, aggiunge una policy `SELECT` dedicata e revoca ogni privilegio diverso dalla lettura ai ruoli pubblici. Verificala prima su un progetto di staging: non è stata applicata automaticamente da questo repository. Prima della migration, genera e conserva il rollback fedele ai grant correnti eseguendo `supabase/rollback/20260912_generate_exact_grants_rollback.sql`.

## Avvio locale

Richiede Node.js 22 e npm 10.

```bash
npm install
npm start
```

Apri `http://localhost:4200`.

## Verifiche

```bash
npm test -- --watch=false
npm run build
```

I test coprono componente, filtri, normalizzazione, accesso Supabase in lettura, sandbox CRUD, ripristino e immagini. La workflow `.github/workflows/ci.yml` esegue `npm ci`, build e test a ogni push su `main` e pull request.

## Deployment

La demo è distribuita con Vercel dal repository GitHub. Prima di considerare pubblicato un cambiamento occorre verificare il deploy e il bundle effettivamente servito; una build locale riuscita non dimostra da sola l'aggiornamento della demo.

## Limiti dichiarati

- La sandbox è intenzionalmente limitata alla singola scheda e non sincronizza modifiche tra visitatori.
- Il frontend non amministra le policy Supabase; la migration RLS richiede applicazione manuale.
- Non esistono autenticazione, ruoli applicativi o aggiornamento automatico dei prezzi.
