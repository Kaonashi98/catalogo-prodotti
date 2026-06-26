# Catalogo Prodotti

Applicazione Angular per gestire un catalogo di smartphone con operazioni CRUD complete. Il progetto mostra form controllati, validazione essenziale, gestione dell'inventario e integrazione con un backend online basato su Supabase.

## Funzionalità

- Visualizzazione dei prodotti con prezzo, immagine, quantità e stato di disponibilità.
- Aggiunta di nuovi prodotti tramite form controllato.
- Modifica di nome, prezzo, quantità e disponibilità.
- Eliminazione con richiesta di conferma.
- Aggiornamento rapido dello stato disponibile/esaurito.
- Incremento e decremento delle quantità disponibili.
- Messaggi di errore e successo direttamente nella pagina.
- Dati salvati online tramite Supabase e API REST.

## Stack

- Angular 21
- TypeScript
- Angular Forms
- HttpClient
- Supabase
- PostgreSQL
- SCSS

## Avvio locale

Installa le dipendenze:

```bash
npm install
```

Avvia Angular:

```bash
npm start
```

Apri il browser su:

```text
http://localhost:4200
```

## Backend

Il progetto usa Supabase come backend online. La tabella `prodotti` espone le operazioni CRUD tramite API REST e Row Level Security configurata per l'accesso pubblico della demo.

La chiave usata nel frontend è una chiave pubblicabile Supabase. Non è una chiave segreta e non concede privilegi amministrativi.

## Script disponibili

```bash
npm start
npm run build
npm test
```

## Obiettivo del progetto

Questo progetto è pensato come esercizio portfolio: dimostra gestione dello stato lato componente, comunicazione HTTP, operazioni CRUD, form controllati, aggiornamenti ottimistici e integrazione con un database online.