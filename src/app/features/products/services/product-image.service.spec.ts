import { TestBed } from '@angular/core/testing';
import { ProductImageService } from './product-image.service';

describe('ProductImageService', () => {
  const service = TestBed.inject(ProductImageService);

  it('rifiuta file non immagine e immagini oltre 4 MB', () => {
    const text = new File(['testo'], 'nota.txt', { type: 'text/plain' });
    const svg = new File(['<svg/>'], 'vettore.svg', { type: 'image/svg+xml' });
    const large = new File([new Uint8Array(4 * 1024 * 1024 + 1)], 'foto.png', {
      type: 'image/png',
    });
    expect(service.validate(text)).toEqual({
      valid: false,
      message: 'Seleziona un file immagine valido.',
    });
    expect(service.validate(svg).valid).toBe(false);
    expect(service.validate(large).valid).toBe(false);
  });

  it('accetta i file immagine entro il limite', () => {
    expect(service.validate(new File(['x'], 'foto.webp', { type: 'image/webp' }))).toEqual({
      valid: true,
    });
  });
});
