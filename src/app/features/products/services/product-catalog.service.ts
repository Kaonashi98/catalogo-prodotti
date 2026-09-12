import { Injectable } from '@angular/core';
import catalog from '../../../catalogo-verificato.json';
import { CatalogEntry, Product, ProductFilters } from '../models/product.model';

export const FALLBACK_IMAGE = '/images/immagine-non-disponibile.svg';

@Injectable({ providedIn: 'root' })
export class ProductCatalogService {
  private readonly entries = catalog as CatalogEntry[];

  entryFor(product: Pick<Product, 'nome'>): CatalogEntry | undefined {
    const name = product.nome.toLocaleLowerCase('it').trim();
    return this.entries.find((entry) => entry.nome.toLocaleLowerCase('it') === name);
  }

  brandFor(product: Product): string {
    return (
      this.entryFor(product)?.marca ??
      (/iphone/i.test(product.nome)
        ? 'Apple'
        : /galaxy|samsung/i.test(product.nome)
          ? 'Samsung'
          : /pixel/i.test(product.nome)
            ? 'Google'
            : /oppo/i.test(product.nome)
              ? 'OPPO'
              : /realme/i.test(product.nome)
                ? 'realme'
                : /xiaomi|redmi|poco/i.test(product.nome)
                  ? 'Xiaomi'
                  : 'Altri')
    );
  }

  normalizeQuantity(value: number | null | undefined): number {
    const quantity = Number(value);
    return Number.isFinite(quantity) ? Math.max(0, Math.round(quantity)) : 0;
  }

  normalizeProduct(product: Product): Product {
    const quantity = this.normalizeQuantity(product.quantita ?? (product.disponibile ? 3 : 0));
    const entry = this.entryFor(product);
    const image =
      entry && (product.immagine === entry.immagineFonte || !product.immagine)
        ? entry.immagine
        : product.immagine;

    return {
      ...product,
      quantita: quantity,
      disponibile: product.disponibile && quantity > 0,
      immagine: image || FALLBACK_IMAGE,
    };
  }

  compare(a: Product, b: Product): number {
    const orderA = this.entryFor(a)?.ordine ?? Number.MAX_SAFE_INTEGER;
    const orderB = this.entryFor(b)?.ordine ?? Number.MAX_SAFE_INTEGER;
    return orderA !== orderB ? orderA - orderB : a.nome.localeCompare(b.nome, 'it');
  }

  imageForName(name: string): string {
    return (
      this.entries.find(
        (entry) => entry.nome.toLocaleLowerCase('it') === name.toLocaleLowerCase('it').trim(),
      )?.immagine ?? FALLBACK_IMAGE
    );
  }

  filterAndSort(products: Product[], filters: ProductFilters): Product[] {
    const words = filters.ricerca.toLocaleLowerCase('it').trim().split(/\s+/).filter(Boolean);
    return products
      .filter((product) => {
        const text =
          `${product.nome} ${this.brandFor(product)} ${this.entryFor(product)?.memoria ?? ''}`.toLocaleLowerCase(
            'it',
          );
        return (
          words.every((word) => text.includes(word)) &&
          (filters.marca === 'Tutti' || this.brandFor(product) === filters.marca) &&
          (filters.disponibilita === 'tutti' ||
            (filters.disponibilita === 'disponibili' ? product.disponibile : !product.disponibile))
        );
      })
      .sort((a, b) =>
        filters.ordinamento === 'prezzo-asc'
          ? a.prezzo - b.prezzo
          : filters.ordinamento === 'prezzo-desc'
            ? b.prezzo - a.prezzo
            : filters.ordinamento === 'nome'
              ? a.nome.localeCompare(b.nome, 'it')
              : this.compare(a, b),
      );
  }
}
