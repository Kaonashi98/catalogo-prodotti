export interface Product {
  id: string;
  nome: string;
  prezzo: number;
  disponibile: boolean;
  quantita: number;
  immagine: string;
}

export type ProductPayload = Omit<Product, 'id'>;

export interface ProductFormErrors {
  nome: string;
  prezzo: string;
  quantita: string;
  immagine: string;
}

export interface ProductFilters {
  ricerca: string;
  marca: string;
  disponibilita: string;
  ordinamento: string;
}

export interface CatalogEntry {
  nome: string;
  marca: string;
  memoria: string;
  colore: string;
  prezzo: number;
  tipoPrezzo: string;
  negozio: string;
  fonte: string;
  immagineFonte: string;
  immagine: string;
  categoria: string;
  ordine: number;
  verificatoIl: string;
}
