import { Injectable } from '@angular/core';
import { Product, ProductPayload } from '../models/product.model';

const STORAGE_KEY = 'devicehub_demo_inventory_v1';

@Injectable({ providedIn: 'root' })
export class DemoInventoryService {
  initialize(seed: Product[]): Product[] {
    const stored = this.read();
    return stored ?? this.reset(seed);
  }

  reset(seed: Product[]): Product[] {
    return this.persist(seed);
  }

  create(products: Product[], product: Product): Product[] {
    if (products.some((current) => current.id === product.id)) {
      throw new Error('Identificativo prodotto duplicato.');
    }
    return this.persist([...products, product]);
  }

  update(products: Product[], id: string, changes: Partial<ProductPayload>): Product[] {
    if (!products.some((product) => product.id === id)) {
      throw new Error('Prodotto non trovato.');
    }
    return this.persist(
      products.map((product) => (product.id === id ? { ...product, ...changes } : product)),
    );
  }

  delete(products: Product[], id: string): Product[] {
    if (!products.some((product) => product.id === id)) {
      throw new Error('Prodotto non trovato.');
    }
    return this.persist(products.filter((product) => product.id !== id));
  }

  private read(): Product[] | null {
    try {
      const value = sessionStorage.getItem(STORAGE_KEY);
      if (!value) return null;
      const parsed: unknown = JSON.parse(value);
      return Array.isArray(parsed) ? (parsed as Product[]) : null;
    } catch {
      return null;
    }
  }

  private persist(products: Product[]): Product[] {
    const snapshot = products.map((product) => ({ ...product }));
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
    return snapshot;
  }
}
