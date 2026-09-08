# DeviceHub

DeviceHub è una web app Angular per gestire un inventario digitale di dispositivi tech. Il progetto mostra un flusso CRUD completo con prodotti salvati online, immagini reali dei dispositivi, gestione delle quantità e interfaccia responsive.

Demo online: [catalogo-prodotti.vercel.app](https://catalogo-prodotti.vercel.app/)

## Funzionalità

- Selezione di 20 smartphone recenti di Apple, Samsung, Google, OPPO, realme e Xiaomi, aggiornata all'8 settembre 2026.
- Prezzi reali per configurazione e colore, con data di verifica e link alla fonte su ogni scheda: [dettaglio delle fonti](docs/catalogo-2026-09-08.md).
- Fotografie originali ottimizzate in WebP e incluse nell'app, con immagine neutra in caso di errore.
- Ricerca per modello, marca e memoria, filtri combinabili e ordinamento per prezzo o nome.
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

Quantità e disponibilità appartengono all'inventario dimostrativo: non sono le scorte dei negozi citati. I prezzi sono una rilevazione datata, non un aggiornamento automatico. Se un prezzo viene modificato nell'inventario, la scheda smette di presentarlo come verificato.

Il logo e la favicon sono gli asset originali del progetto. La pubblicazione su Vercel segue il ramo `main` del repository collegato.

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
