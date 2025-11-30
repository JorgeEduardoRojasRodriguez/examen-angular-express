import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, ModalController, AlertController, ToastController } from '@ionic/angular';
import { Subscription } from 'rxjs';
import { NoteService, Note, NoteCreate } from '../../services/note.service';
import { NoteModalComponent } from './note-modal.component';
import { AppHeaderComponent } from '../../components/app-header/app-header.component';

@Component({
  selector: 'app-notes',
  templateUrl: './notes.page.html',
  styleUrls: ['./notes.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule, AppHeaderComponent]
})
export class NotesPage implements OnInit, OnDestroy {
  notes: Note[] = [];
  isLoading = false;
  hasError = false;
  errorMessage = '';
  private notesSubscription?: Subscription;

  constructor(
    private noteService: NoteService,
    private modalController: ModalController,
    private alertController: AlertController,
    private toastController: ToastController
  ) {}

  ngOnInit() {
    this.loadNotes();
  }

  ngOnDestroy() {
    this.notesSubscription?.unsubscribe();
  }

  loadNotes() {
    this.isLoading = true;
    this.hasError = false;

    this.notesSubscription?.unsubscribe();
    this.notesSubscription = this.noteService.getNotes().subscribe({
      next: (notes) => {
        this.notes = notes;
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
        this.hasError = true;
        this.errorMessage = 'Error al cargar las notas. Verifica la configuración de Firebase.';
      }
    });
  }

  doRefresh(event: any) {
    this.notesSubscription?.unsubscribe();
    this.notesSubscription = this.noteService.getNotes().subscribe({
      next: (notes) => {
        this.notes = notes;
        event.target.complete();
      },
      error: () => {
        event.target.complete();
        this.showToast('Error al actualizar las notas', 'danger');
      }
    });
  }

  async openNoteModal(note?: Note) {
    const modal = await this.modalController.create({
      component: NoteModalComponent,
      componentProps: {
        note: note || null,
        isEdit: !!note
      }
    });

    await modal.present();

    const { data, role } = await modal.onWillDismiss();

    if (role === 'save' && data) {
      if (note && note.id) {
        this.updateNote(note.id, data);
      } else {
        this.createNote(data);
      }
    } else if (role === 'delete' && note) {
      this.confirmDeleteNote(note);
    }
  }

  createNote(noteData: NoteCreate) {
    this.noteService.createNote(noteData).subscribe({
      next: () => {
        this.showToast('Nota creada correctamente', 'success');
      },
      error: () => {
        this.showToast('Error al crear la nota', 'danger');
      }
    });
  }

  updateNote(id: string, noteData: Partial<NoteCreate>) {
    this.noteService.updateNote(id, noteData).subscribe({
      next: () => {
        this.showToast('Nota actualizada correctamente', 'success');
      },
      error: () => {
        this.showToast('Error al actualizar la nota', 'danger');
      }
    });
  }

  async confirmDeleteNote(note: Note) {
    const alert = await this.alertController.create({
      header: 'Eliminar Nota',
      message: `¿Estás seguro de eliminar "${note.title}"?`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Eliminar',
          role: 'destructive',
          handler: () => this.deleteNote(note)
        }
      ]
    });
    await alert.present();
  }

  deleteNote(note: Note) {
    if (!note.id) return;

    this.noteService.deleteNote(note.id).subscribe({
      next: () => {
        this.showToast('Nota eliminada correctamente', 'success');
      },
      error: () => {
        this.showToast('Error al eliminar la nota', 'danger');
      }
    });
  }

  getColorClass(color: string): string {
    return `color-${color}`;
  }

  get isEmpty(): boolean {
    return !this.isLoading && !this.hasError && this.notes.length === 0;
  }

  async showToast(message: string, color: string) {
    const toast = await this.toastController.create({
      message,
      duration: 2000,
      color,
      position: 'bottom'
    });
    await toast.present();
  }
}
