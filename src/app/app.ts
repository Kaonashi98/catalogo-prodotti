import { ChangeDetectorRef, Component, inject, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { FormsModule } from '@angular/forms';

type Prodotto = {
  id: string;
  nome: string;
  prezzo: number;
  disponibile: boolean;
  quantita: number;
  immagine: string;
};

type ProdottoPayload = Omit<Prodotto, 'id'>;
type NuovoProdottoPayload = Prodotto;

const SUPABASE_API_URL = 'https://cmpjcuwijckpdgfdkuat.supabase.co/rest/v1/prodotti';
const SUPABASE_PUBLIC_KEY = 'sb_publishable_L3PkG0FllnfMqrW8mYUAew_V4yGv742';
const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=520&q=80';

const IMMAGINI_PRODOTTO: Record<string, string> = {
  'galaxy s22 ultra': 'https://fdn2.gsmarena.com/vv/bigpic/samsung-galaxy-s22-ultra-5g.jpg',
  'iphone 14 pro': 'https://fdn2.gsmarena.com/vv/bigpic/apple-iphone-14-pro.jpg',
  'pixel 6': 'https://fdn2.gsmarena.com/vv/bigpic/google-pixel-6.jpg',
  'oneplus 10 pro': 'https://fdn2.gsmarena.com/vv/bigpic/oneplus-10-pro.jpg',
  'xperia 1 iii': 'https://fdn2.gsmarena.com/vv/bigpic/sony-xperia-1-iii.jpg',
  'moto g power': 'https://fdn2.gsmarena.com/vv/bigpic/motorola-moto-g-power-2022.jpg',
  'nokia xr20': 'https://fdn2.gsmarena.com/vv/bigpic/nokia-xr20.jpg',
  'asus rog phone 5': 'https://fdn2.gsmarena.com/vv/bigpic/asus-rog-phone-5.jpg',
  'lg velvet': 'https://fdn2.gsmarena.com/vv/bigpic/lg-velvet.jpg',
  'htc u12+': 'https://fdn2.gsmarena.com/vv/bigpic/htc-u12-plus-.jpg',
  'iphone 15': 'https://fdn2.gsmarena.com/vv/bigpic/apple-iphone-15.jpg',
  'iphone 15 pro': 'https://fdn2.gsmarena.com/vv/bigpic/apple-iphone-15-pro.jpg',
  'galaxy s25 ultra': 'https://fdn2.gsmarena.com/vv/bigpic/samsung-galaxy-s25-ultra.jpg',
  'google pixel 9 pro xl': 'https://fdn2.gsmarena.com/vv/bigpic/google-pixel-9-pro-xl-.jpg',
  'galaxy z flip6': 'https://fdn2.gsmarena.com/vv/bigpic/samsung-galaxy-z-flip6.jpg'
};

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './app.html',
  styleUrls: ['./app.scss']
})
export class AppComponent implements OnInit, OnDestroy {
  private readonly http = inject(HttpClient);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly apiUrl = SUPABASE_API_URL;
  private readonly supabaseHeaders = new HttpHeaders({
    apikey: SUPABASE_PUBLIC_KEY,
    Authorization: `Bearer ${SUPABASE_PUBLIC_KEY}`,
    Prefer: 'return=representation'
  });

  prodotti: Prodotto[] = [];
  nuovoNome = '';
  nuovoPrezzo: number | null = null;
  nuovaQuantita = 1;

  editingId: string | null = null;
  pendingDeleteId: string | null = null;
  editNome = '';
  editPrezzo: number | null = null;
  editQuantita = 1;
  editDisponibile = true;

  isLoading = false;
  isSaving = false;
  errorMessage = '';
  successMessage = '';
  isSuccessFading = false;

  private fadeTimer: ReturnType<typeof setTimeout> | null = null;
  private clearTimer: ReturnType<typeof setTimeout> | null = null;

  get prodottiDisponibili(): number {
    return this.prodotti.filter((prodotto) => prodotto.disponibile && prodotto.quantita > 0).length;
  }

  get prodottiEsauriti(): number {
    return this.prodotti.length - this.prodottiDisponibili;
  }

  get pezziTotali(): number {
    return this.prodotti.reduce((totale, prodotto) => totale + Math.max(0, prodotto.quantita), 0);
  }

  ngOnInit(): void {
    this.caricaDati();
  }

  ngOnDestroy(): void {
    this.pulisciTimerMessaggi();
  }

  caricaDati(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.http
      .get<Prodotto[]>(`${this.apiUrl}?select=*&order=created_at.asc`, {
        headers: this.supabaseHeaders
      })
      .subscribe({
        next: (prodotti) => {
          this.prodotti = prodotti.map((prodotto) => this.normalizzaProdotto(prodotto));
          this.isLoading = false;
          this.cdr.detectChanges();
        },
        error: () => {
          this.isLoading = false;
          this.errorMessage = 'Impossibile caricare i prodotti da Supabase. Riprova tra poco.';
          this.cdr.detectChanges();
        }
      });
  }

  aggiungiProdotto(): void {
    const nome = this.nuovoNome.trim();
    const quantita = this.normalizzaQuantita(this.nuovaQuantita);

    if (!nome || !this.nuovoPrezzo || this.nuovoPrezzo <= 0) {
      this.mostraErrore('Inserisci un nome e un prezzo maggiore di 0.');
      return;
    }

    const nuovoProdotto: NuovoProdottoPayload = {
      id: this.creaIdProdotto(nome),
      nome,
      prezzo: this.nuovoPrezzo,
      disponibile: quantita > 0,
      quantita,
      immagine: this.trovaImmagine(nome)
    };

    this.isSaving = true;
    this.http.post<Prodotto[]>(this.apiUrl, nuovoProdotto, { headers: this.supabaseHeaders }).subscribe({
      next: () => {
        this.nuovoNome = '';
        this.nuovoPrezzo = null;
        this.nuovaQuantita = 1;
        this.isSaving = false;
        this.mostraSuccesso('Prodotto aggiunto al catalogo.');
        this.caricaDati();
      },
      error: () => {
        this.isSaving = false;
        this.mostraErrore('Non riesco ad aggiungere il prodotto su Supabase. Riprova tra poco.');
      }
    });
  }

  richiediEliminazione(id: string): void {
    this.pendingDeleteId = id;
    this.errorMessage = '';
    this.successMessage = '';
  }

  annullaEliminazione(): void {
    this.pendingDeleteId = null;
  }

  eliminaProdotto(id: string): void {
    if (!id) return;

    this.http
      .delete(`${this.apiUrl}?id=eq.${encodeURIComponent(id)}`, { headers: this.supabaseHeaders })
      .subscribe({
        next: () => {
          this.pendingDeleteId = null;
          this.mostraSuccesso('Prodotto eliminato.');
          this.caricaDati();
        },
        error: () => this.mostraErrore('Eliminazione non riuscita. Riprova tra poco.')
      });
  }

  iniziaModifica(prodotto: Prodotto): void {
    this.editingId = prodotto.id;
    this.pendingDeleteId = null;
    this.editNome = prodotto.nome;
    this.editPrezzo = prodotto.prezzo;
    this.editQuantita = prodotto.quantita;
    this.editDisponibile = prodotto.disponibile;
    this.errorMessage = '';
    this.successMessage = '';
  }

  annullaModifica(): void {
    this.editingId = null;
    this.editNome = '';
    this.editPrezzo = null;
    this.editQuantita = 1;
    this.editDisponibile = true;
  }

  salvaModifica(): void {
    if (this.editingId === null) return;

    const nome = this.editNome.trim();
    const quantita = this.normalizzaQuantita(this.editQuantita);

    if (!nome || !this.editPrezzo || this.editPrezzo <= 0) {
      this.mostraErrore('Completa correttamente i campi di modifica.');
      return;
    }

    const editingIdBackup = this.editingId;
    const prodottoCorrente = this.prodotti.find((prodotto) => prodotto.id === editingIdBackup);
    const payload: ProdottoPayload = {
      nome,
      prezzo: this.editPrezzo,
      disponibile: this.editDisponibile && quantita > 0,
      quantita,
      immagine:
        prodottoCorrente?.nome.toLowerCase().trim() === nome.toLowerCase()
          ? prodottoCorrente.immagine
          : this.trovaImmagine(nome)
    };

    this.isSaving = true;
    this.editingId = null;
    this.cdr.detectChanges();

    this.http
      .patch<Prodotto[]>(`${this.apiUrl}?id=eq.${encodeURIComponent(editingIdBackup)}`, payload, {
        headers: this.supabaseHeaders
      })
      .subscribe({
        next: () => {
          this.isSaving = false;
          this.annullaModifica();
          this.mostraSuccesso('Prodotto aggiornato.');
          this.caricaDati();
        },
        error: () => {
          this.isSaving = false;
          this.editingId = editingIdBackup;
          this.mostraErrore('Aggiornamento non riuscito. Riprova tra poco.');
          this.cdr.detectChanges();
        }
      });
  }

  toggleDisponibile(prodotto: Prodotto): void {
    const disponibile = !prodotto.disponibile;
    const quantita = disponibile && prodotto.quantita === 0 ? 1 : prodotto.quantita;

    this.aggiornaProdotto(prodotto, { disponibile, quantita }, 'Disponibilità aggiornata.');
  }

  diminuisciQuantita(prodotto: Prodotto): void {
    this.aggiornaQuantita(prodotto, prodotto.quantita - 1);
  }

  aumentaQuantita(prodotto: Prodotto): void {
    this.aggiornaQuantita(prodotto, prodotto.quantita + 1);
  }

  aggiornaQuantita(prodotto: Prodotto, valore: number): void {
    const quantita = this.normalizzaQuantita(valore);
    this.aggiornaProdotto(
      prodotto,
      {
        quantita,
        disponibile: quantita > 0
      },
      'Quantità aggiornata.'
    );
  }

  usaImmagineFallback(prodotto: Prodotto): void {
    if (prodotto.immagine !== FALLBACK_IMAGE) {
      prodotto.immagine = FALLBACK_IMAGE;
    }
  }

  private aggiornaProdotto(
    prodotto: Prodotto,
    modifiche: Partial<Prodotto>,
    messaggioSuccesso: string
  ): void {
    const backup: Prodotto = { ...prodotto };
    Object.assign(prodotto, modifiche);
    prodotto.quantita = this.normalizzaQuantita(prodotto.quantita);
    prodotto.disponibile = prodotto.disponibile && prodotto.quantita > 0;
    this.cdr.detectChanges();

    this.http
      .patch<Prodotto[]>(
        `${this.apiUrl}?id=eq.${encodeURIComponent(prodotto.id)}`,
        {
          disponibile: prodotto.disponibile,
          quantita: prodotto.quantita
        },
        { headers: this.supabaseHeaders }
      )
      .subscribe({
        next: () => this.mostraSuccesso(messaggioSuccesso),
        error: () => {
          Object.assign(prodotto, backup);
          this.mostraErrore('Aggiornamento non riuscito. Riprova tra poco.');
          this.cdr.detectChanges();
        }
      });
  }

  private creaIdProdotto(nome: string): string {
    const base =
      nome
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '')
        .slice(0, 36) || 'prodotto';

    return `${base}-${Date.now().toString(36)}`;
  }

  private normalizzaProdotto(prodotto: Prodotto): Prodotto {
    const quantita = this.normalizzaQuantita(prodotto.quantita ?? (prodotto.disponibile ? 3 : 0));

    return {
      ...prodotto,
      quantita,
      disponibile: prodotto.disponibile && quantita > 0,
      immagine: prodotto.immagine || this.trovaImmagine(prodotto.nome)
    };
  }

  private normalizzaQuantita(valore: number | null | undefined): number {
    const numero = Number(valore);
    return Number.isFinite(numero) ? Math.max(0, Math.round(numero)) : 0;
  }

  private trovaImmagine(nome: string): string {
    const nomeNormalizzato = nome.toLowerCase().trim();
    const chiave = Object.keys(IMMAGINI_PRODOTTO).find((prodotto) => nomeNormalizzato.includes(prodotto));
    return chiave ? IMMAGINI_PRODOTTO[chiave] : FALLBACK_IMAGE;
  }

  private mostraErrore(message: string): void {
    this.pulisciTimerMessaggi();
    this.errorMessage = message;
    this.successMessage = '';
    this.isSuccessFading = false;
    this.cdr.detectChanges();
  }

  private mostraSuccesso(message: string): void {
    this.pulisciTimerMessaggi();
    this.successMessage = message;
    this.errorMessage = '';
    this.isSuccessFading = false;
    this.cdr.detectChanges();

    this.fadeTimer = setTimeout(() => {
      this.isSuccessFading = true;
      this.cdr.detectChanges();
    }, 4300);

    this.clearTimer = setTimeout(() => {
      this.successMessage = '';
      this.isSuccessFading = false;
      this.cdr.detectChanges();
    }, 5000);
  }

  private pulisciTimerMessaggi(): void {
    if (this.fadeTimer) {
      clearTimeout(this.fadeTimer);
      this.fadeTimer = null;
    }

    if (this.clearTimer) {
      clearTimeout(this.clearTimer);
      this.clearTimer = null;
    }
  }
}