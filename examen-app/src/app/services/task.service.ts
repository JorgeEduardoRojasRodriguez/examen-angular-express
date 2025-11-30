import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';

export interface Task {
  id?: string;
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed';
  priority: 'low' | 'medium' | 'high';
  userId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface TasksListData {
  tasks: Task[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

@Injectable({
  providedIn: 'root'
})
export class TaskService {
  private readonly API_URL = 'http://localhost:3000/api';

  constructor(private http: HttpClient) {}

  getTasks(page: number = 1, limit: number = 10): Observable<TasksListData> {
    return this.http.get<ApiResponse<TasksListData>>(
      `${this.API_URL}/tasks?page=${page}&limit=${limit}`
    ).pipe(
      map(response => response.data)
    );
  }

  getTaskById(id: string): Observable<Task> {
    return this.http.get<ApiResponse<Task>>(`${this.API_URL}/tasks/${id}`).pipe(
      map(response => response.data)
    );
  }

  createTask(task: Partial<Task>): Observable<Task> {
    return this.http.post<ApiResponse<Task>>(`${this.API_URL}/tasks`, task).pipe(
      map(response => response.data)
    );
  }

  updateTask(id: string, task: Partial<Task>): Observable<Task> {
    return this.http.put<ApiResponse<Task>>(`${this.API_URL}/tasks/${id}`, task).pipe(
      map(response => response.data)
    );
  }

  deleteTask(id: string): Observable<void> {
    return this.http.delete<ApiResponse<void>>(`${this.API_URL}/tasks/${id}`).pipe(
      map(() => undefined)
    );
  }

  toggleComplete(task: Task): Observable<Task> {
    const newStatus = task.status === 'completed' ? 'pending' : 'completed';
    return this.updateTask(task.id!, { status: newStatus });
  }
}
