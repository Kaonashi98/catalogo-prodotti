# Catalogo Prodotti

Applicazione Angular per gestire un piccolo catalogo di smartphone. Il progetto mostra un flusso CRUD completo con form, validazione essenziale, gestione dell'inventario e integrazione con un backend mock basato su JSON Server.

## Funzionalità

- Visualizzazione dei prodotti con prezzo, immagine, quantità e stato di disponibilità.
- Aggiunta di nuovi prodotti tramite form controllato.
- Modifica di nome, prezzo, quantità e disponibilità.
- Eliminazione con richiesta di conferma.
- Aggiornamento rapido dello stato disponibile/esaurito.
- Incremento e decremento delle quantità disponibili.
- Messaggi di errore e successo direttamente nella pagina.
- Dati serviti da `db.json` tramite JSON Server.

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

## Persistenza dei dati

Le modifiche fatte dall'interfaccia vengono salvate in `db.json` mentre JSON Server è in esecuzione. Questo rende il progetto utile per simulare un piccolo backend REST locale, senza dover configurare un database reale.

## Script disponibili

```bash
npm start
npm run build
npm test
npm run json-server
```

## Obiettivo del progetto

Questo progetto è pensato come esercizio portfolio: dimostra gestione dello stato lato componente, comunicazione HTTP, operazioni CRUD, form controllati, aggiornamenti ottimistici e una UI responsive pronta per un piccolo gestionale.