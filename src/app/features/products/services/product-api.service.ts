import { HttpClient, HttpHeaders } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { SUPABASE_CONFIG } from '../../../core/config/supabase.config';
import { Product } from '../models/product.model';

@Injectable({ providedIn: 'root' })
export class ProductApiService {
  private readonly http = inject(HttpClient);
  private readonly headers = new HttpHeaders({
    apikey: SUPABASE_CONFIG.publishableKey,
  });

  loadProducts(): Observable<Product[]> {
    return this.http.get<Product[]>(
      `${SUPABASE_CONFIG.productsUrl}?select=*&order=created_at.asc`,
      {
        headers: this.headers,
      },
    );
  }
}
