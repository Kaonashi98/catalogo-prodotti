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
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import {
  Product,
  ProductFormErrors,
  ProductPayload,
} from './features/products/models/product.model';
import {
  FALLBACK_IMAGE,
  ProductCatalogService,
} from './features/products/services/product-catalog.service';
import { ProductApiService } from './features/products/services/product-api.service';
import { DemoInventoryService } from './features/products/services/demo-inventory.service';
import { ProductImageService } from './features/products/services/product-image.service';
import { ProductFormService } from './features/products/services/product-form.service';

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

  private readonly api = inject(ProductApiService);
  private readonly inventory = inject(DemoInventoryService);
  private readonly catalog = inject(ProductCatalogService);
  private readonly images = inject(ProductImageService);
  private readonly productForm = inject(ProductFormService);
  private readonly cdr = inject(ChangeDetectorRef);
  private seedProducts: Product[] = [];

  prodotti: Product[] = [];
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

  nuovoNome = '';
  nuovoPrezzo: number | null = null;
  nuovaQuantita: number | null = null;
  nuovaImmaginePreview = '';
  nuovoProdottoErrors: ProductFormErrors = this.creaErroriNuovoProdotto();
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

  ngOnInit(): void {
    this.caricaDati();
  }
  ngOnDestroy(): void {
    this.pulisciTimerMessaggi();
  }
  formattaPrezzo(prezzo: number): string {
    return this.formatiEuro.format(prezzo);
  }
  scheda(prodotto: Product) {
    return this.catalog.entryFor(prodotto);
  }
  marca(prodotto: Product): string {
    return this.catalog.brandFor(prodotto);
  }
  titolo(prodotto: Product): string {
    return prodotto.nome.replace(/^(Samsung|Apple|Google|OPPO|realme)\s+/i, '');
  }
  prezzoVerificato(prodotto: Product): boolean {
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
  get prodottiFiltrati(): Product[] {
    return this.catalog.filterAndSort(this.prodotti, {
      ricerca: this.ricerca,
      marca: this.marcaSelezionata,
      disponibilita: this.filtroDisponibilita,
      ordinamento: this.ordinamento,
    });
  }
  get filtriAttivi(): boolean {
    return (
      !!this.ricerca || this.marcaSelezionata !== 'Tutti' || this.filtroDisponibilita !== 'tutti'
    );
  }
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
    return this.prodotti.filter((p) => p.disponibile && p.quantita > 0).length;
  }
  get prodottiEsauriti(): number {
    return this.prodotti.length - this.prodottiDisponibili;
  }
  get pezziTotali(): number {
    return this.prodotti.reduce((totale, p) => totale + Math.max(0, p.quantita), 0);
  }

  caricaDati(): void {
    if (this.isLoading) return;
    this.isLoading = true;
    this.errorMessage = '';
    this.api
      .loadProducts()
      .pipe(
        finalize(() => {
          this.isLoading = false;
          this.cdr.detectChanges();
        }),
      )
      .subscribe({
        next: (prodotti) => {
          this.seedProducts = this.normalizzaEOrdina(prodotti);
          this.prodotti = this.normalizzaEOrdina(this.inventory.initialize(this.seedProducts));
        },
        error: () => {
          this.prodotti = [];
          this.errorMessage = 'Impossibile caricare i dispositivi da Supabase. Riprova tra poco.';
        },
      });
  }

  ripristinaDemo(): void {
    if (!this.seedProducts.length) return;
    try {
      this.prodotti = this.normalizzaEOrdina(this.inventory.reset(this.seedProducts));
      this.gestioneId = null;
      this.pendingDeleteId = null;
      this.annullaModifica();
      this.resetFiltri();
      this.mostraSuccesso('Sandbox ripristinata ai dati originali.');
    } catch {
      this.mostraErrore('Ripristino della sandbox non riuscito. Riprova.');
    }
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
  toggleGestione(prodotto: Product): void {
    this.gestioneId = this.gestioneId === prodotto.id ? null : prodotto.id;
    this.pendingDeleteId = null;
    this.annullaModifica();
  }

  aggiungiProdotto(): void {
    if (this.isSaving) return;
    if (this.isProcessingImage) {
      this.nuovoProdottoErrors = {
        ...this.creaErroriNuovoProdotto(),
        immagine: "Attendi la preparazione dell'immagine prima di salvare.",
      };
      return;
    }
    const quantita = this.catalog.normalizeQuantity(this.nuovaQuantita);
    const formValue = {
      nome: this.nuovoNome,
      prezzo: this.nuovoPrezzo,
      quantita: this.nuovaQuantita,
      immagine: this.nuovaImmaginePreview,
    };
    this.nuovoProdottoErrors = this.productForm.validate(formValue);
    if (Object.values(this.nuovoProdottoErrors).some(Boolean)) return;
    const prodotto = this.productForm.createProduct(formValue, quantita);
    this.isSaving = true;
    try {
      this.prodotti = this.normalizzaEOrdina(this.inventory.create(this.prodotti, prodotto));
      this.resetNuovoProdottoForm();
      this.chiudiNuovoProdotto();
      this.resetFiltri();
      this.mostraSuccesso('Dispositivo aggiunto alla sandbox.');
    } catch {
      this.mostraErrore('Non riesco ad aggiungere il dispositivo alla sandbox. Riprova.');
    } finally {
      this.isSaving = false;
    }
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
    try {
      this.prodotti = this.inventory.delete(this.prodotti, id);
      this.pendingDeleteId = null;
      this.gestioneId = null;
      this.mostraSuccesso('Dispositivo eliminato dalla sandbox.');
    } catch {
      this.mostraErrore('Eliminazione non riuscita. Riprova.');
    } finally {
      this.pendingIds.delete(id);
    }
  }

  iniziaModifica(prodotto: Product): void {
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
    if (this.editingId === null || this.isSaving) return;
    const nome = this.editNome.trim();
    const quantita = this.editDisponibile ? this.catalog.normalizeQuantity(this.editQuantita) : 0;
    if (!nome || !Number.isFinite(this.editPrezzo) || !this.editPrezzo || this.editPrezzo <= 0) {
      this.mostraErrore('Completa correttamente i campi di modifica.');
      return;
    }
    const id = this.editingId;
    const corrente = this.prodotti.find((p) => p.id === id);
    const scheda = corrente ? this.scheda(corrente) : undefined;
    const payload: ProductPayload = {
      nome,
      prezzo: this.editPrezzo,
      disponibile: this.editDisponibile && quantita > 0,
      quantita,
      immagine:
        corrente && corrente.immagine === scheda?.immagine
          ? scheda.immagineFonte
          : corrente?.immagine || this.catalog.imageForName(nome),
    };
    this.isSaving = true;
    try {
      this.prodotti = this.normalizzaEOrdina(this.inventory.update(this.prodotti, id, payload));
      this.annullaModifica();
      this.mostraSuccesso('Dispositivo aggiornato nella sandbox.');
    } catch {
      this.editingId = id;
      this.mostraErrore('Aggiornamento non riuscito. Riprova.');
    } finally {
      this.isSaving = false;
    }
  }

  toggleDisponibile(prodotto: Product): void {
    const disponibile = !prodotto.disponibile;
    this.aggiornaProdotto(
      prodotto,
      { disponibile, quantita: disponibile ? Math.max(1, prodotto.quantita) : 0 },
      'Disponibilità aggiornata nella sandbox.',
    );
  }
  diminuisciQuantita(prodotto: Product): void {
    this.aggiornaQuantita(prodotto, prodotto.quantita - 1);
  }
  aumentaQuantita(prodotto: Product): void {
    this.aggiornaQuantita(prodotto, prodotto.quantita + 1);
  }
  aggiornaQuantita(prodotto: Product, valore: number): void {
    const quantita = this.catalog.normalizeQuantity(valore);
    this.aggiornaProdotto(
      prodotto,
      { quantita, disponibile: quantita > 0 },
      'Quantità aggiornata nella sandbox.',
    );
  }
  aggiornaQuantitaDaInput(prodotto: Product, event: Event): void {
    this.aggiornaQuantita(prodotto, Number((event.target as HTMLInputElement).value));
  }

  selezionaImmagine(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) {
      this.rimuoviImmagineSelezionata();
      return;
    }
    const validation = this.images.validate(file);
    if (!validation.valid) {
      this.nuovoProdottoErrors.immagine = validation.message;
      input.value = '';
      return;
    }
    this.isProcessingImage = true;
    this.errorMessage = '';
    this.images
      .prepare(file)
      .then((immagine) => {
        this.nuovaImmaginePreview = immagine;
        this.nuovoProdottoErrors.immagine = '';
      })
      .catch(() => {
        this.nuovoProdottoErrors.immagine =
          'Non riesco a preparare questa immagine. Prova con un altro file.';
      })
      .finally(() => {
        this.isProcessingImage = false;
        this.cdr.detectChanges();
      });
  }
  rimuoviImmagineSelezionata(): void {
    this.nuovaImmaginePreview = '';
    this.isProcessingImage = false;
    this.nuovoProdottoErrors.immagine = '';
    if (this.nuovaImmagineInput?.nativeElement) this.nuovaImmagineInput.nativeElement.value = '';
  }
  pulisciErroreNuovoProdotto(campo: keyof ProductFormErrors): void {
    this.nuovoProdottoErrors[campo] = '';
  }
  usaImmagineFallback(prodotto: Product): void {
    if (prodotto.immagine !== FALLBACK_IMAGE) prodotto.immagine = FALLBACK_IMAGE;
  }

  private aggiornaProdotto(
    prodotto: Product,
    modifiche: Partial<ProductPayload>,
    messaggio: string,
  ): void {
    if (this.pendingIds.has(prodotto.id)) return;
    this.pendingIds.add(prodotto.id);
    const backup = this.prodotti;
    try {
      const quantita = this.catalog.normalizeQuantity(modifiche.quantita ?? prodotto.quantita);
      const changes = {
        ...modifiche,
        quantita,
        disponibile: Boolean((modifiche.disponibile ?? prodotto.disponibile) && quantita > 0),
      };
      this.prodotti = this.inventory.update(this.prodotti, prodotto.id, changes);
      this.mostraSuccesso(messaggio);
    } catch {
      this.prodotti = backup;
      this.mostraErrore('Aggiornamento non riuscito. Riprova.');
    } finally {
      this.pendingIds.delete(prodotto.id);
    }
  }
  private normalizzaEOrdina(prodotti: Product[]): Product[] {
    return prodotti
      .map((p) => this.catalog.normalizeProduct(p))
      .sort((a, b) => this.catalog.compare(a, b));
  }
  private creaErroriNuovoProdotto(): ProductFormErrors {
    return { nome: '', prezzo: '', quantita: '', immagine: '' };
  }
  private resetNuovoProdottoForm(): void {
    this.nuovoNome = '';
    this.nuovoPrezzo = null;
    this.nuovaQuantita = null;
    this.nuovaImmaginePreview = '';
    this.nuovoProdottoErrors = this.creaErroriNuovoProdotto();
    this.isProcessingImage = false;
    if (this.nuovaImmagineInput?.nativeElement) this.nuovaImmagineInput.nativeElement.value = '';
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
    if (this.fadeTimer) clearTimeout(this.fadeTimer);
    if (this.clearTimer) clearTimeout(this.clearTimer);
    this.fadeTimer = null;
    this.clearTimer = null;
  }
}
