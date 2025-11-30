import { Injectable, inject } from '@angular/core';
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
import { AuthService } from './auth.service';

export interface Note {
  id?: string;
  title: string;
  content: string;
  color: 'yellow' | 'blue' | 'green' | 'pink' | 'purple';
  createdAt: Date;
  updatedAt: Date;
  userId: string;
}

export interface NoteCreate {
  title: string;
  content: string;
  color: Note['color'];
}

@Injectable({
  providedIn: 'root'
})
export class NoteService {
  private firestore = inject(Firestore);
  private authService = inject(AuthService);

  private readonly COLLECTION_NAME = 'notes';

  getNotes(): Observable<Note[]> {
    const user = this.authService.getCurrentUser();
    if (!user) {
      return new Observable(subscriber => subscriber.next([]));
    }

    const notesRef = collection(this.firestore, this.COLLECTION_NAME);
    const q = query(
      notesRef,
      where('userId', '==', user.id),
      orderBy('createdAt', 'desc')
    );

    return collectionData(q, { idField: 'id' }).pipe(
      map(notes => notes.map(note => ({
        ...note,
        createdAt: (note['createdAt'] as Timestamp)?.toDate() || new Date(),
        updatedAt: (note['updatedAt'] as Timestamp)?.toDate() || new Date()
      })) as Note[])
    );
  }

  createNote(noteData: NoteCreate): Observable<string> {
    const user = this.authService.getCurrentUser();
    if (!user) {
      return new Observable(subscriber => subscriber.error('Usuario no autenticado'));
    }

    const notesRef = collection(this.firestore, this.COLLECTION_NAME);
    const newNote = {
      ...noteData,
      userId: user.id,
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
}
