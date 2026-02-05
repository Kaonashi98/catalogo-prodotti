import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms'; // <--- NECESSARIO PER GLI INPUT

type Prodotto = {
  id: number;
  nome: string;
  prezzo: number;
  disponibile: boolean;
};

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, CommonModule, FormsModule], // <--- AGGIUNTO QUI
  templateUrl: './app.html',
  styleUrls: ['./app.scss']
})
export class AppComponent implements OnInit {
  title = 'catalogo-prodotti';

  private http = inject(HttpClient);
  private cdr = inject(ChangeDetectorRef);
  prodotti: Prodotto[] = [];

  // Variabili per il NUOVO prodotto
  nuovoNome: string = '';
  nuovoPrezzo: number = 0;

  // Stato per UPDATE
  editingId: number | null = null;
  editNome: string = '';
  editPrezzo: number = 0;
  editDisponibile: boolean = true;

  ngOnInit(): void {
    this.caricaDati();
  }

  // 1. READ: Scarica e ASSEGNA i dati (tutto in una funzione)
  caricaDati() {
    this.http.get('http://localhost:3000/prodotti')
      .subscribe({
        next: (dati: any) => {
          this.prodotti = dati as Prodotto[];
          console.log('Dati ricevuti:', this.prodotti);
          // App senza ZoneJS: forza refresh UI dopo async (HTTP)
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Errore server:', err);
          this.cdr.detectChanges();
        }
      });
  }

  // 2. CREATE: Aggiunge un nuovo prodotto
  aggiungiProdotto() {
    // Controllo base
    if (this.nuovoNome.trim() === '' || this.nuovoPrezzo <= 0) {
      alert('Inserisci un nome valido e un prezzo maggiore di 0');
      return;
    }

    // Creo l'oggetto da spedire (l'ID lo mette il server in automatico)
    const nuovoProdotto = {
      nome: this.nuovoNome,
      prezzo: this.nuovoPrezzo,
      disponibile: true // Di default lo mettiamo disponibile
    };

    // Chiamata POST
    this.http.post('http://localhost:3000/prodotti', nuovoProdotto)
      .subscribe({
        next: (res) => {
          console.log('Prodotto aggiunto!', res);

          // Pulisco i campi
          this.nuovoNome = '';
          this.nuovoPrezzo = 0;

          // Aggiorno la lista
          this.caricaDati();
        },
        error: (err) => console.error('Errore creazione:', err)
      });
  }

  // 3. DELETE: Cancella
  eliminaProdotto(id: number) {
    if (!id) return;

    if (confirm('Confermi di voler eliminare questo prodotto?')) {
      this.http.delete('http://localhost:3000/prodotti/' + id)
        .subscribe({
          next: () => {
            console.log('Eliminato ID:', id);
            this.caricaDati(); // Ora funziona perché caricaDati ha il subscribe dentro
          },
          error: (err) => console.error('Errore eliminazione:', err)
        });
    }
  }

  // 4. UPDATE: Avvia modifica
  iniziaModifica(prodotto: Prodotto) {
    this.editingId = prodotto.id;
    this.editNome = prodotto.nome;
    this.editPrezzo = prodotto.prezzo;
    this.editDisponibile = prodotto.disponibile;
  }

  annullaModifica() {
    this.editingId = null;
    this.editNome = '';
    this.editPrezzo = 0;
    this.editDisponibile = true;
  }

  salvaModifica() {
    if (this.editingId === null) return;

    if (this.editNome.trim() === '' || this.editPrezzo <= 0) {
      alert('Inserisci un nome valido e un prezzo maggiore di 0');
      return;
    }

    // Aggiornamento ottimista: chiudi la modal subito
    const editingIdBackup = this.editingId;
    this.editingId = null;
    this.cdr.detectChanges();

    const payload = {
      nome: this.editNome.trim(),
      prezzo: this.editPrezzo,
      disponibile: this.editDisponibile
    };

    this.http.patch('http://localhost:3000/prodotti/' + editingIdBackup, payload)
      .subscribe({
        next: () => {
          console.log('Prodotto aggiornato ID:', editingIdBackup);
          this.annullaModifica();
          this.caricaDati();
        },
        error: (err) => {
          console.error('Errore aggiornamento:', err);
          this.editingId = editingIdBackup;
          this.cdr.detectChanges();
          alert('Errore aggiornamento prodotto');
        }
      });
  }

  // Update rapido disponibilita
  toggleDisponibile(prodotto: Prodotto) {
    const nuovoStato = !prodotto.disponibile;

    // Aggiornamento ottimista: aggiorna subito l'interfaccia, rollback su errore
    const precedente = prodotto.disponibile;
    prodotto.disponibile = nuovoStato;
    this.cdr.detectChanges();

    this.http.patch('http://localhost:3000/prodotti/' + prodotto.id, { disponibile: nuovoStato })
      .subscribe({
        next: () => {
          console.log('Disponibilita aggiornata ID:', prodotto.id);
        },
        error: (err) => {
          console.error('Errore aggiornamento disponibilita:', err);
          prodotto.disponibile = precedente;
          this.cdr.detectChanges();
          alert('Errore aggiornamento disponibilità');
        }
      });
  }
}
