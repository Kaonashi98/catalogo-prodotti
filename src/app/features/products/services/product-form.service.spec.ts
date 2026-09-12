import { TestBed } from '@angular/core/testing';
import { ProductFormService } from './product-form.service';

describe('ProductFormService', () => {
  const service = TestBed.inject(ProductFormService);

  it('rifiuta valori non finiti, quantità negative e immagini mancanti', () => {
    const errors = service.validate({ nome: 'Demo', prezzo: Infinity, quantita: -1, immagine: '' });
    expect(errors.prezzo).not.toBe('');
    expect(errors.quantita).not.toBe('');
    expect(errors.immagine).not.toBe('');
  });

  it('crea un prodotto tipizzato con id normalizzato e disponibilità coerente', () => {
    const product = service.createProduct(
      { nome: '  Téléfono Demo  ', prezzo: 299, quantita: 0, immagine: 'data:image/webp,x' },
      0,
    );
    expect(product.id).toMatch(/^telefono-demo-/);
    expect(product).toMatchObject({
      nome: 'Téléfono Demo',
      prezzo: 299,
      quantita: 0,
      disponibile: false,
    });
  });
});
