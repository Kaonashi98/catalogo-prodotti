# DeviceHub

DeviceHub è una web app Angular per gestire un inventario digitale di dispositivi tech. Il progetto mostra un flusso CRUD completo con prodotti salvati online, immagini reali dei dispositivi, gestione delle quantità e interfaccia responsive.

Demo online: [catalogo-prodotti.vercel.app](https://catalogo-prodotti.vercel.app/)

## Funzionalità

- Visualizzazione dei dispositivi con prezzo, immagine, quantità e stato di disponibilità.
- Aggiunta di nuovi dispositivi tramite form controllato.
- Caricamento immagine dal computer con anteprima e compressione prima del salvataggio.
- Modifica di nome, prezzo, quantità e disponibilità.
- Eliminazione con richiesta di conferma.
- Aggiornamento rapido dello stato disponibile/esaurito.
- Incremento e decremento delle quantità disponibili.
- Messaggi di errore e successo direttamente nella pagina.
- Dati salvati online tramite Supabase e API REST.
- Layout responsive pubblicato su Vercel.

## Stack

- Angular 21
- TypeScript
- Angular Forms
- HttpClient
- Supabase
- PostgreSQL
- SCSS
- Vercel

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

Questo progetto è pensato come esercizio portfolio per mostrare gestione dello stato lato componente, comunicazione HTTP, operazioni CRUD, form controllati, aggiornamenti ottimistici, integrazione con un database online e cura dell'interfaccia utente.