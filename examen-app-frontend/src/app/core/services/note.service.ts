import { Injectable, inject, signal } from '@angular/core';
import {
  Firestore,
  collection,
  collectionData,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  Timestamp
} from '@angular/fire/firestore';
import { Observable, from, map } from 'rxjs';
import { Note, NoteCreate } from '../interfaces';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class NoteService {
  private firestore = inject(Firestore);
  private authService = inject(AuthService);

  private readonly COLLECTION_NAME = 'notes';

  notes = signal<Note[]>([]);
  isLoading = signal(false);
  error = signal<string | null>(null);

  getNotes(): Observable<Note[]> {
    const userId = this.authService.currentUser()?.id;
    if (!userId) {
      return new Observable(subscriber => subscriber.next([]));
    }

    const notesRef = collection(this.firestore, this.COLLECTION_NAME);
    const q = query(
      notesRef,
      where('userId', '==', userId)
    );

    return collectionData(q, { idField: 'id' }).pipe(
      map(notes => {
        const mapped = notes.map(note => ({
          ...note,
          createdAt: (note['createdAt'] as Timestamp)?.toDate() || new Date(),
          updatedAt: (note['updatedAt'] as Timestamp)?.toDate() || new Date()
        })) as Note[];
        return mapped.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      })
    );
  }

  createNote(noteData: NoteCreate): Observable<string> {
    const userId = this.authService.currentUser()?.id;
    if (!userId) {
      return new Observable(subscriber => subscriber.error('Usuario no autenticado'));
    }

    const notesRef = collection(this.firestore, this.COLLECTION_NAME);
    const newNote = {
      ...noteData,
      userId,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    };

    return from(addDoc(notesRef, newNote)).pipe(
      map(docRef => docRef.id)
    );
  }

  updateNote(noteId: string, noteData: Partial<NoteCreate>): Observable<void> {
    const noteRef = doc(this.firestore, this.COLLECTION_NAME, noteId);
    const updateData = {
      ...noteData,
      updatedAt: Timestamp.now()
    };

    return from(updateDoc(noteRef, updateData));
  }

  deleteNote(noteId: string): Observable<void> {
    const noteRef = doc(this.firestore, this.COLLECTION_NAME, noteId);
    return from(deleteDoc(noteRef));
  }

  loadNotes(): void {
    this.isLoading.set(true);
    this.error.set(null);

    this.getNotes().subscribe({
      next: (notes) => {
        this.notes.set(notes);
        this.isLoading.set(false);
      },
      error: () => {
        this.error.set('Error al cargar las notas');
        this.isLoading.set(false);
      }
    });
  }
}
