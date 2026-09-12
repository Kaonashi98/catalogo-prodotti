import { TestBed } from '@angular/core/testing';
import { FALLBACK_IMAGE, ProductCatalogService } from './product-catalog.service';

describe('ProductCatalogService', () => {
  const service = TestBed.inject(ProductCatalogService);

  it('normalizza NaN, Infinity, decimali e quantità negative', () => {
    expect(service.normalizeQuantity(Number.NaN)).toBe(0);
    expect(service.normalizeQuantity(Infinity)).toBe(0);
    expect(service.normalizeQuantity(-2)).toBe(0);
    expect(service.normalizeQuantity(2.6)).toBe(3);
  });

  it('abbina il catalogo per nome esatto e usa fallback per nomi simili', () => {
    const custom = {
      id: 'x',
      nome: 'iPhone 17 Pro personalizzato',
      prezzo: 1,
      disponibile: true,
      quantita: 1,
      immagine: '',
    };
    expect(service.entryFor(custom)).toBeUndefined();
    expect(service.normalizeProduct(custom).immagine).toBe(FALLBACK_IMAGE);
  });

  it('combina filtri e ordinamento senza mutare la collezione originale', () => {
    const products = [
      {
        id: '1',
        nome: 'Google Pixel 11',
        prezzo: 999,
        disponibile: true,
        quantita: 1,
        immagine: '',
      },
      { id: '2', nome: 'iPhone 17', prezzo: 979, disponibile: false, quantita: 0, immagine: '' },
    ];
    const filtered = service.filterAndSort(products, {
      ricerca: 'pixel 256',
      marca: 'Google',
      disponibilita: 'disponibili',
      ordinamento: 'prezzo-asc',
    });
    expect(filtered.map((product) => product.id)).toEqual(['1']);
    expect(products.map((product) => product.id)).toEqual(['1', '2']);
  });
});
