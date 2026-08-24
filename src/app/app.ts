import { ChangeDetectorRef, Component, ElementRef, inject, OnDestroy, OnInit, ViewChild } from '@angular/core';
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
type NuovoProdottoFormErrors = {
  nome: string;
  prezzo: string;
  quantita: string;
  immagine: string;
};

const SUPABASE_API_URL = 'https://cmpjcuwijckpdgfdkuat.supabase.co/rest/v1/prodotti';
const SUPABASE_PUBLIC_KEY = 'sb_publishable_L3PkG0FllnfMqrW8mYUAew_V4yGv742';
const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=520&q=80';


const ORDINE_PRODOTTI_INIZIALI: Record<string, number> = {
  '1': 1,
  '2': 2,
  '3': 3,
  '4': 4,
  '5': 5,
  '6': 6,
  '7': 7,
  '8': 8,
  '9': 9,
  '10': 10,
  acde: 11,
  '2968': 12,
  f022: 13,
  '2269': 14,
  zfl6: 15
};
const IMMAGINI_PRODOTTO: Record<string, string> = {
  'galaxy s22 ultra': 'https://fdn2.gsmarena.com/vv/bigpic/samsung-galaxy-s22-ultra-5g.jpg',
  'galaxy s23 ultra': 'https://fdn2.gsmarena.com/vv/bigpic/samsung-galaxy-s23-ultra-5g.jpg',
  'iphone 14 pro': 'https://fdn2.gsmarena.com/vv/bigpic/apple-iphone-14-pro.jpg',
  'pixel 6': 'https://fdn2.gsmarena.com/vv/bigpic/google-pixel-6.jpg',
  'oneplus 10 pro': 'https://fdn2.gsmarena.com/vv/bigpic/oneplus-10-pro.jpg',
  'xperia 1 iii': 'https://fdn2.gsmarena.com/vv/bigpic/sony-xperia-1-iii.jpg',
  'moto g power 2022': 'https://p4-ofp.static.pub//fes/cms/2024/11/15/qlbq5a3q9e3t7uzw0ptg6kspws1dga729330.jpg',
  'moto g power': 'https://p4-ofp.static.pub//fes/cms/2024/11/15/qlbq5a3q9e3t7uzw0ptg6kspws1dga729330.jpg',
  'nokia xr20': 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/71/Nokia_XR20-front_PNr%C2%B01006.jpg/250px-Nokia_XR20-front_PNr%C2%B01006.jpg',
  'asus rog phone 5': 'https://fdn2.gsmarena.com/vv/bigpic/asus-rog-phone-5.jpg',
  'lg velvet': 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d4/LG_Velvet_Aurora_Green_version.jpg/250px-LG_Velvet_Aurora_Green_version.jpg',
  'htc u12+': 'https://fdn2.gsmarena.com/vv/bigpic/htc-u12-plus-.jpg',
  'iphone 15': 'https://fdn2.gsmarena.com/vv/bigpic/apple-iphone-15.jpg',
  'iphone 15 pro': 'https://fdn2.gsmarena.com/vv/bigpic/apple-iphone-15-pro.jpg',
  'galaxy s25 ultra': 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/28/%E7%AC%AC%E4%B8%80%E6%89%8B%EF%BC%81Samsung_Galaxy_S25%E7%B3%BB%E5%88%97%E6%8B%BF%E5%88%B0%E4%BA%86%EF%BC%9A5%E4%B8%AA%E5%8D%87%E7%BA%A7%EF%BC%81S_Pen%E4%B8%8D%E6%94%AF%E6%8C%81%E8%93%9D%E7%89%99%E4%BA%86%EF%BC%9F_%282160p_50fps_VP9-96kbit_AAC%29-00.06.03.789.png/250px-%E7%AC%AC%E4%B8%80%E6%89%8B%EF%BC%81Samsung_Galaxy_S25%E7%B3%BB%E5%88%97%E6%8B%BF%E5%88%B0%E4%BA%86%EF%BC%9A5%E4%B8%AA%E5%8D%87%E7%BA%A7%EF%BC%81S_Pen%E4%B8%8D%E6%94%AF%E6%8C%81%E8%93%9D%E7%89%99%E4%BA%86%EF%BC%9F_%282160p_50fps_VP9-96kbit_AAC%29-00.06.03.789.png',
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
  @ViewChild('nuovaImmagineInput') private nuovaImmagineInput?: ElementRef<HTMLInputElement>;

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
  nuovaQuantita: number | null = null;
  nuovaImmaginePreview = '';
  nuovoProdottoErrors: NuovoProdottoFormErrors = this.creaErroriNuovoProdotto();
  isProcessingImage = false;

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


  get nuovoNomeValido(): boolean {
    return this.nuovoNome.trim().length > 0;
  }

  get nuovoPrezzoValido(): boolean {
    return this.nuovoNomeValido && this.nuovoPrezzo !== null && Number(this.nuovoPrezzo) > 0;
  }

  get nuovaQuantitaValida(): boolean {
    return this.nuovoPrezzoValido && this.nuovaQuantita !== null && Number.isFinite(Number(this.nuovaQuantita)) && Number(this.nuovaQuantita) >= 0;
  }

  get nuovaImmagineValida(): boolean {
    return this.nuovaImmaginePreview.trim().length > 0;
  }
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
          this.prodotti = prodotti
            .map((prodotto) => this.normalizzaProdotto(prodotto))
            .sort((a, b) => this.confrontaProdotti(a, b));
          this.isLoading = false;
          this.cdr.detectChanges();
        },
        error: () => {
          this.isLoading = false;
          this.errorMessage = 'Impossibile caricare i dispositivi da Supabase. Riprova tra poco.';
          this.cdr.detectChanges();
        }
      });
  }

  aggiungiProdotto(): void {
    if (this.isProcessingImage) {
      this.nuovoProdottoErrors = { ...this.creaErroriNuovoProdotto(), immagine: 'Attendi la preparazione dell\'immagine prima di salvare.' };
      this.errorMessage = '';
      this.cdr.detectChanges();
      return;
    }

    const nome = this.nuovoNome.trim();
    const quantita = this.normalizzaQuantita(this.nuovaQuantita);

    this.nuovoProdottoErrors = this.validaNuovoProdotto();

    if (this.haErroriNuovoProdotto()) {
      this.errorMessage = '';
      this.cdr.detectChanges();
      return;
    }

    const nuovoProdotto: NuovoProdottoPayload = {
      id: this.creaIdProdotto(nome),
      nome,
      prezzo: this.nuovoPrezzo!,
      disponibile: quantita > 0,
      quantita,
      immagine: this.nuovaImmaginePreview
    };

    this.isSaving = true;
    this.http.post<Prodotto[]>(this.apiUrl, nuovoProdotto, { headers: this.supabaseHeaders }).subscribe({
      next: () => {
        this.resetNuovoProdottoForm();
        this.isSaving = false;
        this.mostraSuccesso('Dispositivo aggiunto al catalogo.');
        this.caricaDati();
      },
      error: () => {
        this.isSaving = false;
        this.mostraErrore('Non riesco ad aggiungere il dispositivo su Supabase. Riprova tra poco.');
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
          this.mostraSuccesso('Dispositivo eliminato.');
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
      immagine: prodottoCorrente?.immagine || this.trovaImmagine(nome)
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
          this.mostraSuccesso('Dispositivo aggiornato.');
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
    const quantita = disponibile ? Math.max(1, prodotto.quantita) : 0;

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


  selezionaImmagine(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file) {
      this.rimuoviImmagineSelezionata();
      return;
    }

    if (!file.type.startsWith('image/')) {
      this.nuovoProdottoErrors.immagine = 'Seleziona un file immagine valido.';
      this.errorMessage = '';
      input.value = '';
      return;
    }

    if (file.size > 4 * 1024 * 1024) {
      this.nuovoProdottoErrors.immagine = 'Seleziona un\'immagine più leggera di 4 MB.';
      this.errorMessage = '';
      input.value = '';
      return;
    }

    this.isProcessingImage = true;
    this.errorMessage = '';

    this.preparaImmagine(file)
      .then((immagine) => {
        this.nuovaImmaginePreview = immagine;
        this.isProcessingImage = false;
        this.cdr.detectChanges();
      })
      .catch(() => {
        this.isProcessingImage = false;
        this.nuovoProdottoErrors.immagine = 'Non riesco a preparare questa immagine. Prova con un altro file.';
        this.errorMessage = '';
        this.cdr.detectChanges();
      });
  }

  rimuoviImmagineSelezionata(): void {
    this.nuovaImmaginePreview = '';
    this.isProcessingImage = false;
    this.nuovoProdottoErrors.immagine = '';
    if (this.nuovaImmagineInput?.nativeElement) {
      this.nuovaImmagineInput.nativeElement.value = '';
    }
  }

  pulisciErroreNuovoProdotto(campo: keyof NuovoProdottoFormErrors): void {
    this.nuovoProdottoErrors[campo] = '';
  }

  usaImmagineFallback(prodotto: Prodotto): void {
    if (prodotto.immagine !== FALLBACK_IMAGE) {
      prodotto.immagine = FALLBACK_IMAGE;
    }
  }


  private creaErroriNuovoProdotto(): NuovoProdottoFormErrors {
    return {
      nome: '',
      prezzo: '',
      quantita: '',
      immagine: ''
    };
  }

  private validaNuovoProdotto(): NuovoProdottoFormErrors {
    const errors = this.creaErroriNuovoProdotto();

    if (!this.nuovoNomeValido) {
      errors.nome = 'Inserisci il nome del dispositivo.';
    }

    if (!this.nuovoPrezzoValido) {
      errors.prezzo = 'Inserisci un prezzo maggiore di 0.';
    }

    if (!this.nuovaQuantitaValida) {
      errors.quantita = 'Inserisci una quantità iniziale valida.';
    }

    if (!this.nuovaImmagineValida) {
      errors.immagine = 'Carica una foto reale e specifica del dispositivo.';
    }

    return errors;
  }

  private haErroriNuovoProdotto(): boolean {
    return Object.values(this.nuovoProdottoErrors).some(Boolean);
  }

  private resetNuovoProdottoForm(): void {
    this.nuovoNome = '';
    this.nuovoPrezzo = null;
    this.nuovaQuantita = null;
    this.nuovaImmaginePreview = '';
    this.nuovoProdottoErrors = this.creaErroriNuovoProdotto();
    this.isProcessingImage = false;

    if (this.nuovaImmagineInput?.nativeElement) {
      this.nuovaImmagineInput.nativeElement.value = '';
    }
  }
  private preparaImmagine(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onerror = () => reject();
      reader.onload = () => {
        const image = new Image();

        image.onerror = () => reject();
        image.onload = () => {
          const maxSize = 640;
          const ratio = Math.min(1, maxSize / Math.max(image.width, image.height));
          const width = Math.max(1, Math.round(image.width * ratio));
          const height = Math.max(1, Math.round(image.height * ratio));
          const canvas = document.createElement('canvas');
          const context = canvas.getContext('2d');

          if (!context) {
            reject();
            return;
          }

          canvas.width = width;
          canvas.height = height;
          context.fillStyle = '#ffffff';
          context.fillRect(0, 0, width, height);
          context.drawImage(image, 0, 0, width, height);
          resolve(canvas.toDataURL('image/webp', 0.82));
        };

        image.src = String(reader.result);
      };

      reader.readAsDataURL(file);
    });
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

  private confrontaProdotti(a: Prodotto, b: Prodotto): number {
    const ordineA = ORDINE_PRODOTTI_INIZIALI[a.id] ?? Number.MAX_SAFE_INTEGER;
    const ordineB = ORDINE_PRODOTTI_INIZIALI[b.id] ?? Number.MAX_SAFE_INTEGER;

    if (ordineA !== ordineB) {
      return ordineA - ordineB;
    }

    return a.nome.localeCompare(b.nome, 'it');
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
    const immagineUfficiale = this.trovaImmagine(prodotto.nome);

    return {
      ...prodotto,
      quantita,
      disponibile: prodotto.disponibile && quantita > 0,
      immagine: immagineUfficiale !== FALLBACK_IMAGE ? immagineUfficiale : prodotto.immagine || FALLBACK_IMAGE
    };
  }

  private normalizzaQuantita(valore: number | null | undefined): number {
    const numero = Number(valore);
    return Number.isFinite(numero) ? Math.max(0, Math.round(numero)) : 0;
  }

  private trovaImmagine(nome: string): string {
    const nomeNormalizzato = nome.toLowerCase().trim();
    const chiave = Object.keys(IMMAGINI_PRODOTTO)
      .sort((a, b) => b.length - a.length)
      .find((prodotto) => nomeNormalizzato.includes(prodotto));

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
