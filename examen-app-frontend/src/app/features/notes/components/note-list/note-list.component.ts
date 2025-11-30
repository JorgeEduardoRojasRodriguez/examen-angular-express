import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NoteService } from '../../../../core/services';
import { Note, NoteCreate } from '../../../../core/interfaces';
import { ToastService } from '../../../../shared/services/toast.service';

@Component({
  selector: 'app-note-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './note-list.component.html',
  styleUrls: ['./note-list.component.css']
})
export class NoteListComponent implements OnInit {
  private noteService = inject(NoteService);
  private toastService = inject(ToastService);

  notes = this.noteService.notes;
  isLoading = this.noteService.isLoading;
  error = this.noteService.error;

  showModal = signal(false);
  editingNote = signal<Note | null>(null);
  isSaving = signal(false);
  formData = signal<NoteCreate>({
    title: '',
    content: '',
    color: 'yellow'
  });

  colors: Note['color'][] = ['yellow', 'blue', 'green', 'pink', 'purple'];

  ngOnInit(): void {
    this.noteService.loadNotes();
  }

  openCreateModal(): void {
    this.editingNote.set(null);
    this.formData.set({
      title: '',
      content: '',
      color: 'yellow'
    });
    this.showModal.set(true);
  }

  openEditModal(note: Note): void {
    this.editingNote.set(note);
    this.formData.set({
      title: note.title,
      content: note.content,
      color: note.color
    });
    this.showModal.set(true);
  }

  closeModal(): void {
    this.showModal.set(false);
    this.editingNote.set(null);
  }

  saveNote(): void {
    const data = this.formData();
    const editing = this.editingNote();

    if (!data.title.trim()) return;

    this.isSaving.set(true);

    if (editing && editing.id) {
      this.noteService.updateNote(editing.id, data).subscribe({
        next: () => {
          this.noteService.loadNotes();
          this.closeModal();
          this.isSaving.set(false);
          this.toastService.success('Nota actualizada correctamente');
        },
        error: () => {
          this.isSaving.set(false);
          this.toastService.error('Error al actualizar la nota');
        }
      });
    } else {
      this.noteService.createNote(data).subscribe({
        next: () => {
          this.noteService.loadNotes();
          this.closeModal();
          this.isSaving.set(false);
          this.toastService.success('Nota creada correctamente');
        },
        error: () => {
          this.isSaving.set(false);
          this.toastService.error('Error al crear la nota');
        }
      });
    }
  }

  deleteNote(note: Note): void {
    if (!note.id) return;
    if (confirm(`¿Eliminar la nota "${note.title}"?`)) {
      this.noteService.deleteNote(note.id).subscribe({
        next: () => {
          this.noteService.loadNotes();
          this.toastService.success('Nota eliminada correctamente');
        },
        error: () => {
          this.toastService.error('Error al eliminar la nota');
        }
      });
    }
  }

  updateField(field: keyof NoteCreate, value: string): void {
    this.formData.update(f => ({ ...f, [field]: value }));
  }

  selectColor(color: Note['color']): void {
    this.formData.update(f => ({ ...f, color }));
  }

  getColorClass(color: string): string {
    return `color-${color}`;
  }

  retry(): void {
    this.noteService.loadNotes();
  }
}
