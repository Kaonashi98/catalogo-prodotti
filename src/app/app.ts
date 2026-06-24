import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';

type Prodotto = {
  id: string;
  nome: string;
  prezzo: number;
  disponibile: boolean;
};

type ProdottoPayload = Omit<Prodotto, 'id'>;

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './app.html',
  styleUrls: ['./app.scss']
})
export class AppComponent implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly apiUrl = 'http://localhost:3000/prodotti';

  prodotti: Prodotto[] = [];
  nuovoNome = '';
  nuovoPrezzo: number | null = null;

  editingId: string | null = null;
  pendingDeleteId: string | null = null;
  editNome = '';
  editPrezzo: number | null = null;
  editDisponibile = true;

  isLoading = false;
  isSaving = false;
  errorMessage = '';
  successMessage = '';

  get prodottiDisponibili(): number {
    return this.prodotti.filter((prodotto) => prodotto.disponibile).length;
  }

  get prodottiEsauriti(): number {
    return this.prodotti.length - this.prodottiDisponibili;
  }

  ngOnInit(): void {
    this.caricaDati();
  }

  caricaDati(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.http.get<Prodotto[]>(this.apiUrl).subscribe({
      next: (prodotti) => {
        this.prodotti = prodotti;
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.isLoading = false;
        this.errorMessage = 'Impossibile caricare i prodotti. Avvia JSON Server sulla porta 3000.';
        this.cdr.detectChanges();
      }
    });
  }

  aggiungiProdotto(): void {
    const nome = this.nuovoNome.trim();

    if (!nome || !this.nuovoPrezzo || this.nuovoPrezzo <= 0) {
      this.mostraErrore('Inserisci un nome e un prezzo maggiore di 0.');
      return;
    }

    const nuovoProdotto: ProdottoPayload = {
      nome,
      prezzo: this.nuovoPrezzo,
      disponibile: true
    };

    this.isSaving = true;
    this.http.post<Prodotto>(this.apiUrl, nuovoProdotto).subscribe({
      next: () => {
        this.nuovoNome = '';
        this.nuovoPrezzo = null;
        this.isSaving = false;
        this.mostraSuccesso('Prodotto aggiunto al catalogo.');
        this.caricaDati();
      },
      error: () => {
        this.isSaving = false;
        this.mostraErrore('Non riesco ad aggiungere il prodotto. Controlla JSON Server.');
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

    this.http.delete(`${this.apiUrl}/${id}`).subscribe({
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
    this.editDisponibile = prodotto.disponibile;
    this.errorMessage = '';
    this.successMessage = '';
  }

  annullaModifica(): void {
    this.editingId = null;
    this.editNome = '';
    this.editPrezzo = null;
    this.editDisponibile = true;
  }

  salvaModifica(): void {
    if (this.editingId === null) return;

    const nome = this.editNome.trim();
    if (!nome || !this.editPrezzo || this.editPrezzo <= 0) {
      this.mostraErrore('Completa correttamente i campi di modifica.');
      return;
    }

    const editingIdBackup = this.editingId;
    const payload: ProdottoPayload = {
      nome,
      prezzo: this.editPrezzo,
      disponibile: this.editDisponibile
    };

    this.isSaving = true;
    this.editingId = null;
    this.cdr.detectChanges();

    this.http.put<Prodotto>(`${this.apiUrl}/${editingIdBackup}`, payload).subscribe({
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
    const precedente = prodotto.disponibile;
    const nuovoStato = !precedente;

    prodotto.disponibile = nuovoStato;
    this.cdr.detectChanges();

    this.http.patch<Prodotto>(`${this.apiUrl}/${prodotto.id}`, { disponibile: nuovoStato }).subscribe({
      next: () => this.mostraSuccesso('Disponibilita aggiornata.'),
      error: () => {
        prodotto.disponibile = precedente;
        this.mostraErrore('Non riesco ad aggiornare la disponibilita.');
        this.cdr.detectChanges();
      }
    });
  }

  private mostraErrore(message: string): void {
    this.errorMessage = message;
    this.successMessage = '';
    this.cdr.detectChanges();
  }

  private mostraSuccesso(message: string): void {
    this.successMessage = message;
    this.errorMessage = '';
    this.cdr.detectChanges();
  }
}
