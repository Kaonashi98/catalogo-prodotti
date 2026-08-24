import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { AppComponent } from './app';

const SUPABASE_PRODUCTS_URL =
  'https://cmpjcuwijckpdgfdkuat.supabase.co/rest/v1/prodotti?select=*&order=created_at.asc';

describe('AppComponent', () => {
  let httpTesting: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()]
    }).compileComponents();

    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('crea correttamente il componente principale', () => {
    const fixture = TestBed.createComponent(AppComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('mostra il titolo del catalogo', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();

    const request = httpTesting.expectOne(SUPABASE_PRODUCTS_URL);
    request.flush([]);

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('h1')?.textContent).toContain('DeviceHub');
  });

  it('calcola correttamente disponibilità e quantità totali', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();

    const request = httpTesting.expectOne(SUPABASE_PRODUCTS_URL);
    request.flush([
      {
        id: '1',
        nome: 'iPhone 15',
        prezzo: 999,
        disponibile: true,
        quantita: 3,
        immagine: 'iphone.jpg'
      },
      {
        id: '2',
        nome: 'Pixel 6',
        prezzo: 599,
        disponibile: false,
        quantita: 0,
        immagine: 'pixel.jpg'
      }
    ]);

    expect(fixture.componentInstance.prodottiDisponibili).toBe(1);
    expect(fixture.componentInstance.prodottiEsauriti).toBe(1);
    expect(fixture.componentInstance.pezziTotali).toBe(3);
  });
  it('mantiene stabile l\'ordine dei prodotti iniziali', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();

    const request = httpTesting.expectOne(SUPABASE_PRODUCTS_URL);
    request.flush([
      {
        id: '2',
        nome: 'iPhone 14 Pro',
        prezzo: 799,
        disponibile: false,
        quantita: 0,
        immagine: 'iphone.jpg'
      },
      {
        id: '1',
        nome: 'Galaxy S22 Ultra',
        prezzo: 899,
        disponibile: true,
        quantita: 2,
        immagine: 'galaxy.jpg'
      }
    ]);

    expect(fixture.componentInstance.prodotti[0].nome).toBe('Galaxy S22 Ultra');
    expect(fixture.componentInstance.prodotti[1].nome).toBe('iPhone 14 Pro');
  });

  it('usa immagini ufficiali per i dispositivi noti anche se il backend contiene una foto sbagliata', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();

    const request = httpTesting.expectOne(SUPABASE_PRODUCTS_URL);
    request.flush([
      {
        id: '7',
        nome: 'Nokia XR20',
        prezzo: 90,
        disponibile: true,
        quantita: 4,
        immagine: 'immagine-sbagliata.jpg'
      },
      {
        id: '2968',
        nome: 'Galaxy S25 Ultra',
        prezzo: 1699,
        disponibile: true,
        quantita: 2,
        immagine: 'foto-non-corrispondente.jpg'
      }
    ]);

    expect(fixture.componentInstance.prodotti[0].immagine.toLowerCase()).toContain('nokia_xr20');
    expect(fixture.componentInstance.prodotti[1].immagine).toContain('upload.wikimedia.org');
  });

  it('sceglie la corrispondenza immagine piu specifica quando i nomi sono simili', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();

    const request = httpTesting.expectOne(SUPABASE_PRODUCTS_URL);
    request.flush([
      {
        id: '2269',
        nome: 'iPhone 15 Pro',
        prezzo: 1239,
        disponibile: true,
        quantita: 1,
        immagine: 'iphone-generico.jpg'
      }
    ]);

    expect(fixture.componentInstance.prodotti[0].immagine).toContain('apple-iphone-15-pro.jpg');
  });

  it('resetta i campi del form dopo avere aggiunto un dispositivo', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();

    const initialRequest = httpTesting.expectOne(SUPABASE_PRODUCTS_URL);
    initialRequest.flush([]);

    fixture.componentInstance.nuovoNome = 'Galaxy Watch 7';
    fixture.componentInstance.nuovoPrezzo = 299;
    fixture.componentInstance.nuovaQuantita = 5;
    fixture.componentInstance.nuovaImmaginePreview = 'data:image/webp;base64,preview';
    fixture.componentInstance.aggiungiProdotto();

    const addRequest = httpTesting.expectOne('https://cmpjcuwijckpdgfdkuat.supabase.co/rest/v1/prodotti');
    addRequest.flush([]);

    expect(fixture.componentInstance.nuovoNome).toBe('');
    expect(fixture.componentInstance.nuovoPrezzo).toBeNull();
    expect(fixture.componentInstance.nuovaQuantita).toBeNull();
    expect(fixture.componentInstance.nuovaImmaginePreview).toBe('');
    expect(fixture.componentInstance.nuovoProdottoErrors).toEqual({
      nome: '',
      prezzo: '',
      quantita: '',
      immagine: ''
    });

    const reloadRequest = httpTesting.expectOne(SUPABASE_PRODUCTS_URL);
    reloadRequest.flush([]);
  });
  it('richiede una foto specifica prima di aggiungere un dispositivo', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();

    const request = httpTesting.expectOne(SUPABASE_PRODUCTS_URL);
    request.flush([]);

    fixture.componentInstance.nuovoNome = 'Galaxy S23 Ultra';
    fixture.componentInstance.nuovoPrezzo = 899;
    fixture.componentInstance.nuovaQuantita = 2;
    fixture.componentInstance.aggiungiProdotto();

    expect(fixture.componentInstance.errorMessage).toBe('');
    expect(fixture.componentInstance.nuovoProdottoErrors.immagine).toBe('Carica una foto reale e specifica del dispositivo.');
  });

  it('azzera la quantità quando un dispositivo viene segnato come esaurito', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();

    const initialRequest = httpTesting.expectOne(SUPABASE_PRODUCTS_URL);
    initialRequest.flush([
      {
        id: '6',
        nome: 'Moto G Power',
        prezzo: 80,
        disponibile: true,
        quantita: 5,
        immagine: 'moto-g-power.jpg'
      }
    ]);

    const prodotto = fixture.componentInstance.prodotti[0];
    fixture.componentInstance.toggleDisponibile(prodotto);

    expect(prodotto.disponibile).toBe(false);
    expect(prodotto.quantita).toBe(0);

    const updateRequest = httpTesting.expectOne(
      'https://cmpjcuwijckpdgfdkuat.supabase.co/rest/v1/prodotti?id=eq.6'
    );
    expect(updateRequest.request.method).toBe('PATCH');
    expect(updateRequest.request.body).toEqual({ disponibile: false, quantita: 0 });
    updateRequest.flush([]);
  });
});
