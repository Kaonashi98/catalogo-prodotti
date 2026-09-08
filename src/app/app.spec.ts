import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { AppComponent } from './app';
import catalogo from './catalogo-verificato.json';

const API = 'https://cmpjcuwijckpdgfdkuat.supabase.co/rest/v1/prodotti';
const LIST = `${API}?select=*&order=created_at.asc`;
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
    expect(new Set(catalogo.map((p) => p.nome)).size).toBe(20);
    expect(new Set(catalogo.map((p) => p.immagineFonte)).size).toBe(20);
    expect(element.querySelectorAll('a.source-link')).toHaveLength(20);
    catalogo.forEach((p) => {
      expect(p.prezzo).toBeGreaterThan(0);
      expect(p.fonte.startsWith('https://')).toBe(true);
      expect(p.verificatoIl).toBe('2026-09-08');
    });
  });

  it('usa copie locali delle fotografie verificate e mantiene l’ordine della selezione', () => {
    const { app } = avvia([...dati].reverse());
    expect(app.prodotti.map((p) => p.nome)).toEqual(catalogo.map((p) => p.nome));
    expect(app.prodotti.map((p) => p.immagine)).toEqual(catalogo.map((p) => p.immagine));
  });

  it('conserva una fotografia personalizzata anche per un modello conosciuto', () => {
    const { app } = avvia([{ ...dati[1], immagine: 'data:image/webp;base64,personalizzata' }]);
    expect(app.prodotti[0].immagine).toBe('data:image/webp;base64,personalizzata');
  });

  it('non attribuisce la scheda del Pro a un altro modello dal nome simile', () => {
    const { app } = avvia([{ ...dati[1], nome: 'iPhone 17 Pro personalizzato', immagine: '' }]);
    expect(app.scheda(app.prodotti[0])).toBeUndefined();
    expect(app.prodotti[0].immagine).toBe('/images/immagine-non-disponibile.svg');
  });

  it('sostituisce una fotografia non caricabile senza creare un ciclo di fallback', () => {
    const { app } = avvia();
    app.usaImmagineFallback(app.prodotti[0]);
    app.usaImmagineFallback(app.prodotti[0]);
    expect(app.prodotti[0].immagine).toBe('/images/immagine-non-disponibile.svg');
  });

  it('combina ricerca per parole, marchio e disponibilità', () => {
    const { app } = avvia();
    app.ricerca = '  PIXEL  256  ';
    app.marcaSelezionata = 'Google';
    app.filtroDisponibilita = 'disponibili';
    expect(app.prodottiFiltrati.map((p) => p.nome)).toEqual([
      'Google Pixel 11 Pro',
      'Google Pixel 11 Pro XL',
      'Google Pixel 11',
    ]);
    app.marcaSelezionata = 'Apple';
    expect(app.prodottiFiltrati).toHaveLength(0);
    app.resetFiltri();
    expect(app.prodottiFiltrati).toHaveLength(20);
  });

  it('ordina per prezzo senza cambiare l’ordine del catalogo originale', () => {
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

  it('calcola quantità e disponibilità e formatta gli euro in italiano', () => {
    const { app } = avvia();
    expect(app.prodottiDisponibili).toBe(10);
    expect(app.prodottiEsauriti).toBe(10);
    expect(app.pezziTotali).toBe(30);
    expect(app.formattaPrezzo(1599.99).replace(/\s/g, '')).toBe('1.599,99€');
  });

  it('toglie la fonte quando il prezzo dell’inventario viene modificato', () => {
    const { app, fixture, element } = avvia([dati[0]]);
    expect(app.prezzoVerificato(app.prodotti[0])).toBe(true);
    app.prodotti[0].prezzo = 123;
    fixture.changeDetectorRef.markForCheck();
    fixture.detectChanges();
    expect(element.querySelector('a.source-link')).toBeNull();
    expect(element.textContent).toContain('Prezzo inventario');
  });

  it('richiede foto e campi validi prima di inviare un nuovo dispositivo', () => {
    const { app } = avvia([]);
    app.nuovoNome = 'Telefono personale';
    app.nuovoPrezzo = Infinity;
    app.nuovaQuantita = -1;
    app.aggiungiProdotto();
    expect(app.nuovoProdottoErrors.prezzo).not.toBe('');
    expect(app.nuovoProdottoErrors.quantita).not.toBe('');
    expect(app.nuovoProdottoErrors.immagine).toContain('foto reale');
    http.expectNone(API);
  });

  it('aggiunge un dispositivo una sola volta, azzera il form e ricarica i dati', () => {
    const { app } = avvia([]);
    app.nuovoNome = 'Telefono personale';
    app.nuovoPrezzo = 299.99;
    app.nuovaQuantita = 0;
    app.nuovaImmaginePreview = 'data:image/webp;base64,preview';
    app.aggiungiProdotto();
    app.aggiungiProdotto();
    const add = http.expectOne(API);
    expect(add.request.method).toBe('POST');
    expect(add.request.body.disponibile).toBe(false);
    expect(add.request.body.prezzo).toBe(299.99);
    add.flush([]);
    http.expectOne(LIST).flush([]);
    expect(app.nuovoNome).toBe('');
    expect(app.nuovoPrezzo).toBeNull();
    expect(app.nuovaImmaginePreview).toBe('');
    expect(app.isSaving).toBe(false);
  });

  it('azzera le quantità quando si segna un prodotto esaurito', () => {
    const { app } = avvia([dati[0]]);
    const product = app.prodotti[0];
    app.toggleDisponibile(product);
    const req = http.expectOne(`${API}?id=eq.1`);
    expect(req.request.body).toEqual({ disponibile: false, quantita: 0 });
    req.flush([]);
    expect(product.quantita).toBe(0);
    expect(product.disponibile).toBe(false);
    expect(app.pendingIds.size).toBe(0);
  });

  it('ripristina i dati dopo un errore e impedisce aggiornamenti concorrenti sullo stesso prodotto', () => {
    const { app } = avvia([dati[0]]);
    const product = app.prodotti[0];
    app.aumentaQuantita(product);
    app.aumentaQuantita(product);
    const req = http.expectOne(`${API}?id=eq.1`);
    expect(req.request.body.quantita).toBe(4);
    req.flush({}, { status: 500, statusText: 'Errore server' });
    expect(product.quantita).toBe(3);
    expect(app.pendingIds.size).toBe(0);
    expect(app.errorMessage).toContain('Aggiornamento non riuscito');
  });

  it('salva una modifica rispettando lo stato esaurito e la fotografia originale remota', () => {
    const { app } = avvia([dati[0]]);
    app.iniziaModifica(app.prodotti[0]);
    app.editDisponibile = false;
    app.editQuantita = 8;
    app.editPrezzo = 1400;
    app.salvaModifica();
    const req = http.expectOne(`${API}?id=eq.1`);
    expect(req.request.body).toEqual({
      nome: dati[0].nome,
      prezzo: 1400,
      disponibile: false,
      quantita: 0,
      immagine: dati[0].immagine,
    });
    req.flush([]);
    http.expectOne(LIST).flush([]);
    expect(app.isSaving).toBe(false);
  });

  it('annulla l’eliminazione senza scritture e può eliminare dopo conferma', () => {
    const { app } = avvia([dati[0]]);
    app.richiediEliminazione('1');
    app.annullaEliminazione();
    expect(app.pendingDeleteId).toBeNull();
    http.expectNone(`${API}?id=eq.1`);
    app.richiediEliminazione('1');
    app.eliminaProdotto('1');
    const req = http.expectOne(`${API}?id=eq.1`);
    expect(req.request.method).toBe('DELETE');
    req.flush([]);
    http.expectOne(LIST).flush([]);
    expect(app.prodotti).toHaveLength(0);
  });

  it('mostra un errore utile se Supabase non risponde', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    http.expectOne(LIST).flush({}, { status: 503, statusText: 'Non disponibile' });
    expect(fixture.componentInstance.isLoading).toBe(false);
    expect(fixture.nativeElement.textContent).toContain('Il catalogo non è disponibile');
    expect(fixture.nativeElement.textContent).toContain('Riprova');
  });
});
