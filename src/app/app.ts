import {
  ChangeDetectorRef,
  Component,
  ElementRef,
  inject,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import catalogoVerificato from './catalogo-verificato.json';

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
const FALLBACK_IMAGE = '/images/immagine-non-disponibile.svg';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './app.html',
  styleUrls: ['./app.scss'],
})
export class AppComponent implements OnInit, OnDestroy {
  @ViewChild('addDialog') private addDialog?: ElementRef<HTMLDialogElement>;
  @ViewChild('nuovaImmagineInput') private nuovaImmagineInput?: ElementRef<HTMLInputElement>;

  private readonly http = inject(HttpClient);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly apiUrl = SUPABASE_API_URL;
  private readonly supabaseHeaders = new HttpHeaders({
    apikey: SUPABASE_PUBLIC_KEY,
    Authorization: `Bearer ${SUPABASE_PUBLIC_KEY}`,
    Prefer: 'return=representation',
  });

  prodotti: Prodotto[] = [];
  ricerca = '';
  marcaSelezionata = 'Tutti';
  filtroDisponibilita = 'tutti';
  ordinamento = 'selezione';
  gestioneId: string | null = null;
  readonly pendingIds = new Set<string>();
  readonly dataVerifica = '08/09/2026';
  readonly formatiEuro = new Intl.NumberFormat('it-IT', {
    style: 'currency',
    currency: 'EUR',
    useGrouping: true,
  });

  formattaPrezzo(prezzo: number): string {
    return this.formatiEuro.format(prezzo);
  }

  scheda(prodotto: Prodotto) {
    return catalogoVerificato.find(
      (item) => item.nome.toLowerCase() === prodotto.nome.toLowerCase().trim(),
    );
  }

  marca(prodotto: Prodotto): string {
    return (
      this.scheda(prodotto)?.marca ??
      (/iphone/i.test(prodotto.nome)
        ? 'Apple'
        : /galaxy|samsung/i.test(prodotto.nome)
          ? 'Samsung'
          : /pixel/i.test(prodotto.nome)
            ? 'Google'
            : /oppo/i.test(prodotto.nome)
              ? 'OPPO'
              : /realme/i.test(prodotto.nome)
                ? 'realme'
                : /xiaomi|redmi|poco/i.test(prodotto.nome)
                  ? 'Xiaomi'
                  : 'Altri')
    );
  }

  titolo(prodotto: Prodotto): string {
    return prodotto.nome.replace(/^(Samsung|Apple|Google|OPPO|realme)\s+/i, '');
  }

  prezzoVerificato(prodotto: Prodotto): boolean {
    return this.scheda(prodotto)?.prezzo === prodotto.prezzo;
  }

  get marche(): string[] {
    return [...new Set(this.prodotti.map((p) => this.marca(p)))].sort((a, b) =>
      a.localeCompare(b, 'it'),
    );
  }

  contaMarca(marca: string): number {
    return this.prodotti.filter((p) => this.marca(p) === marca).length;
  }

  get prodottiFiltrati(): Prodotto[] {
    const parole = this.ricerca.toLocaleLowerCase('it').trim().split(/\s+/).filter(Boolean);
    const prodotti = this.prodotti.filter((p) => {
      const testo = (
        p.nome +
        ' ' +
        this.marca(p) +
        ' ' +
        (this.scheda(p)?.memoria ?? '')
      ).toLocaleLowerCase('it');
      return (
        parole.every((parola) => testo.includes(parola)) &&
        (this.marcaSelezionata === 'Tutti' || this.marca(p) === this.marcaSelezionata) &&
        (this.filtroDisponibilita === 'tutti' ||
          (this.filtroDisponibilita === 'disponibili' ? p.disponibile : !p.disponibile))
      );
    });
    return prodotti.sort((a, b) =>
      this.ordinamento === 'prezzo-asc'
        ? a.prezzo - b.prezzo
        : this.ordinamento === 'prezzo-desc'
          ? b.prezzo - a.prezzo
          : this.ordinamento === 'nome'
            ? a.nome.localeCompare(b.nome, 'it')
            : this.confrontaProdotti(a, b),
    );
  }

  get filtriAttivi(): boolean {
    return (
      !!this.ricerca || this.marcaSelezionata !== 'Tutti' || this.filtroDisponibilita !== 'tutti'
    );
  }
  resetFiltri(): void {
    this.ricerca = '';
    this.marcaSelezionata = 'Tutti';
    this.filtroDisponibilita = 'tutti';
  }
  apriNuovoProdotto(): void {
    this.addDialog?.nativeElement.showModal();
  }
  chiudiNuovoProdotto(): void {
    if (this.addDialog?.nativeElement.open) this.addDialog.nativeElement.close();
  }
  toggleGestione(prodotto: Prodotto): void {
    this.gestioneId = this.gestioneId === prodotto.id ? null : prodotto.id;
    this.pendingDeleteId = null;
    this.annullaModifica();
  }
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
    return (
      this.nuovoNomeValido &&
      this.nuovoPrezzo !== null &&
      Number.isFinite(Number(this.nuovoPrezzo)) &&
      Number(this.nuovoPrezzo) > 0
    );
  }

  get nuovaQuantitaValida(): boolean {
    return (
      this.nuovoPrezzoValido &&
      this.nuovaQuantita !== null &&
      Number.isFinite(Number(this.nuovaQuantita)) &&
      Number(this.nuovaQuantita) >= 0
    );
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
        headers: this.supabaseHeaders,
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
        },
      });
  }

  aggiungiProdotto(): void {
    if (this.isSaving) return;
    if (this.isProcessingImage) {
      this.nuovoProdottoErrors = {
        ...this.creaErroriNuovoProdotto(),
        immagine: "Attendi la preparazione dell'immagine prima di salvare.",
      };
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
      immagine: this.nuovaImmaginePreview,
    };

    this.isSaving = true;
    this.http
      .post<Prodotto[]>(this.apiUrl, nuovoProdotto, { headers: this.supabaseHeaders })
      .subscribe({
        next: () => {
          this.resetNuovoProdottoForm();
          this.chiudiNuovoProdotto();
          this.resetFiltri();
          this.isSaving = false;
          this.mostraSuccesso('Dispositivo aggiunto al catalogo.');
          this.caricaDati();
        },
        error: () => {
          this.isSaving = false;
          this.mostraErrore(
            'Non riesco ad aggiungere il dispositivo su Supabase. Riprova tra poco.',
          );
        },
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
    if (!id || this.pendingIds.has(id)) return;
    this.pendingIds.add(id);

    this.http
      .delete(`${this.apiUrl}?id=eq.${encodeURIComponent(id)}`, { headers: this.supabaseHeaders })
      .subscribe({
        next: () => {
          this.pendingIds.delete(id);
          this.pendingDeleteId = null;
          this.mostraSuccesso('Dispositivo eliminato.');
          this.caricaDati();
        },
        error: () => {
          this.pendingIds.delete(id);
          this.mostraErrore('Eliminazione non riuscita. Riprova tra poco.');
        },
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
    const quantita = this.editDisponibile ? this.normalizzaQuantita(this.editQuantita) : 0;

    if (!nome || !Number.isFinite(this.editPrezzo) || !this.editPrezzo || this.editPrezzo <= 0) {
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
        prodottoCorrente && prodottoCorrente.immagine === this.scheda(prodottoCorrente)?.immagine
          ? this.scheda(prodottoCorrente)!.immagineFonte
          : prodottoCorrente?.immagine || this.trovaImmagine(nome),
    };

    this.isSaving = true;
    this.editingId = null;
    this.cdr.detectChanges();

    this.http
      .patch<Prodotto[]>(`${this.apiUrl}?id=eq.${encodeURIComponent(editingIdBackup)}`, payload, {
        headers: this.supabaseHeaders,
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
        },
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
        disponibile: quantita > 0,
      },
      'Quantità aggiornata.',
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
      this.nuovoProdottoErrors.immagine = "Seleziona un'immagine più leggera di 4 MB.";
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
        this.nuovoProdottoErrors.immagine =
          'Non riesco a preparare questa immagine. Prova con un altro file.';
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
      immagine: '',
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
    messaggioSuccesso: string,
  ): void {
    if (this.pendingIds.has(prodotto.id)) return;
    this.pendingIds.add(prodotto.id);
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
          quantita: prodotto.quantita,
        },
        { headers: this.supabaseHeaders },
      )
      .subscribe({
        next: () => {
          this.pendingIds.delete(prodotto.id);
          this.mostraSuccesso(messaggioSuccesso);
        },
        error: () => {
          this.pendingIds.delete(prodotto.id);
          Object.assign(prodotto, backup);
          this.mostraErrore('Aggiornamento non riuscito. Riprova tra poco.');
          this.cdr.detectChanges();
        },
      });
  }

  private confrontaProdotti(a: Prodotto, b: Prodotto): number {
    const ordineA = this.scheda(a)?.ordine ?? Number.MAX_SAFE_INTEGER;
    const ordineB = this.scheda(b)?.ordine ?? Number.MAX_SAFE_INTEGER;

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
    const scheda = this.scheda(prodotto);
    const immagine =
      scheda && (prodotto.immagine === scheda.immagineFonte || !prodotto.immagine)
        ? scheda.immagine
        : prodotto.immagine;

    return {
      ...prodotto,
      quantita,
      disponibile: prodotto.disponibile && quantita > 0,
      immagine: immagine || FALLBACK_IMAGE,
    };
  }

  private normalizzaQuantita(valore: number | null | undefined): number {
    const numero = Number(valore);
    return Number.isFinite(numero) ? Math.max(0, Math.round(numero)) : 0;
  }

  private trovaImmagine(nome: string): string {
    return (
      catalogoVerificato.find((p) => p.nome.toLowerCase() === nome.toLowerCase().trim())
        ?.immagine ?? FALLBACK_IMAGE
    );
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
