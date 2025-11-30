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
