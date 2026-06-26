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
    expect(compiled.querySelector('h1')?.textContent).toContain('Catalogo prodotti');
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
});