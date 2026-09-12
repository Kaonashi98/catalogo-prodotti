import { Injectable } from '@angular/core';
import { Product, ProductFormErrors } from '../models/product.model';

export interface NewProductFormValue {
  nome: string;
  prezzo: number | null;
  quantita: number | null;
  immagine: string;
}

@Injectable({ providedIn: 'root' })
export class ProductFormService {
  validate(value: NewProductFormValue): ProductFormErrors {
    const nameValid = value.nome.trim().length > 0;
    const priceValid =
      nameValid && value.prezzo !== null && Number.isFinite(value.prezzo) && value.prezzo > 0;
    const quantityValid =
      priceValid &&
      value.quantita !== null &&
      Number.isFinite(value.quantita) &&
      value.quantita >= 0;
    return {
      nome: nameValid ? '' : 'Inserisci il nome del dispositivo.',
      prezzo: priceValid ? '' : 'Inserisci un prezzo maggiore di 0.',
      quantita: quantityValid ? '' : 'Inserisci una quantità iniziale valida.',
      immagine: value.immagine.trim() ? '' : 'Carica una foto reale e specifica del dispositivo.',
    };
  }

  createProduct(value: NewProductFormValue, quantity: number): Product {
    const name = value.nome.trim();
    const base =
      name
        .toLocaleLowerCase('it')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '')
        .slice(0, 36) || 'prodotto';
    return {
      id: `${base}-${Date.now().toString(36)}`,
      nome: name,
      prezzo: value.prezzo!,
      disponibile: quantity > 0,
      quantita: quantity,
      immagine: value.immagine,
    };
  }
}
