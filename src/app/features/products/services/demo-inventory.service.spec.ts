import { TestBed } from '@angular/core/testing';
import { DemoInventoryService } from './demo-inventory.service';

const seed = [
  { id: '1', nome: 'Demo', prezzo: 100, disponibile: true, quantita: 2, immagine: 'x' },
];

describe('DemoInventoryService', () => {
  let service: DemoInventoryService;
  beforeEach(() => {
    sessionStorage.clear();
    service = TestBed.inject(DemoInventoryService);
  });

  it('isola CRUD e persistenza nella sessione', () => {
    let products = service.initialize(seed);
    products = service.update(products, '1', { quantita: 4 });
    products = service.create(products, { ...seed[0], id: '2' });
    products = service.delete(products, '1');
    expect(products.map((p) => p.id)).toEqual(['2']);
    expect(service.initialize(seed)).toEqual(products);
  });

  it('ripristina una copia indipendente del seed', () => {
    const products = service.reset(seed);
    products[0].nome = 'Mutato solo in memoria';
    expect(service.initialize(seed)[0].nome).toBe('Demo');
  });
});
