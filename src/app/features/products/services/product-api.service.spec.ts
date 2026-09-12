import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { SUPABASE_CONFIG } from '../../../core/config/supabase.config';
import { ProductApiService } from './product-api.service';

describe('ProductApiService', () => {
  it('espone soltanto la lettura Supabase con la publishable key', () => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    const service = TestBed.inject(ProductApiService);
    const http = TestBed.inject(HttpTestingController);
    service.loadProducts().subscribe((products) => expect(products).toEqual([]));
    const request = http.expectOne(`${SUPABASE_CONFIG.productsUrl}?select=*&order=created_at.asc`);
    expect(request.request.method).toBe('GET');
    expect(request.request.headers.get('apikey')).toBe(SUPABASE_CONFIG.publishableKey);
    expect(request.request.headers.has('Authorization')).toBe(false);
    request.flush([]);
    http.verify();
  });
});
