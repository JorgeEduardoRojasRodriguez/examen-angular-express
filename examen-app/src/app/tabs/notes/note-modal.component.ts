import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, ModalController } from '@ionic/angular';
import { Note, NoteCreate } from '../../services/note.service';

@Component({
  selector: 'app-note-modal',
  templateUrl: './note-modal.component.html',
  styleUrls: ['./note-modal.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule]
})
export class NoteModalComponent implements OnInit {
  @Input() note: Note | null = null;
  @Input() isEdit: boolean = false;

  noteData: NoteCreate = {
    title: '',
    content: '',
    color: 'yellow'
  };

  colors: Note['color'][] = ['yellow', 'blue', 'green', 'pink', 'purple'];

  colorLabels: Record<Note['color'], string> = {
    yellow: 'Amarillo',
    blue: 'Azul',
    green: 'Verde',
    pink: 'Rosa',
    purple: 'Morado'
  };

  constructor(private modalController: ModalController) {}

  ngOnInit() {
    if (this.note) {
      this.noteData = {
        title: this.note.title,
        content: this.note.content,
        color: this.note.color
      };
    }
  }

  dismiss() {
    this.modalController.dismiss();
  }

  save() {
    if (!this.noteData.title?.trim()) {
      return;
    }
    this.modalController.dismiss(this.noteData, 'save');
  }

  delete() {
    this.modalController.dismiss(null, 'delete');
  }

  selectColor(color: Note['color']) {
    this.noteData.color = color;
  }

  getColorClass(color: string): string {
    return `color-${color}`;
  }

  isFormValid(): boolean {
    return !!this.noteData.title?.trim();
  }
}
