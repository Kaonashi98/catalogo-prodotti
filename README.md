# Catalogo Prodotti

Applicazione Angular per gestire un piccolo catalogo di smartphone. Il progetto mostra un flusso CRUD completo con form, validazione essenziale, aggiornamento dello stato di disponibilita e integrazione con un backend mock basato su JSON Server.

## Funzionalita

- Visualizzazione dei prodotti con prezzo e stato di disponibilita
- Aggiunta di nuovi prodotti
- Modifica di nome, prezzo e disponibilita
- Eliminazione con conferma
- Aggiornamento rapido dello stato disponibile/esaurito
- Messaggi di errore e successo direttamente nella pagina
- Dati serviti da `db.json` tramite JSON Server

## Stack

- Angular 21
- TypeScript
- Angular Forms
- HttpClient
- JSON Server
- SCSS

## Avvio locale

Installa le dipendenze:

```bash
npm install
```

Avvia il backend mock:

```bash
npm run json-server
```

In un secondo terminale avvia Angular:

```bash
npm start
```

Apri il browser su:

```text
http://localhost:4200
```

JSON Server espone i dati su:

```text
http://localhost:3000/prodotti
```

## Script disponibili

```bash
npm start
npm run build
npm test
npm run json-server
```

## Obiettivo del progetto

Questo progetto e pensato come esercizio portfolio: dimostra gestione dello stato lato componente, comunicazione HTTP, operazioni CRUD, form controllati e una UI responsive pronta per un piccolo gestionale.
