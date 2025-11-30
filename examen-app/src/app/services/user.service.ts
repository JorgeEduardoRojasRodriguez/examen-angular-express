import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';

export interface User {
  id?: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'admin' | 'user';
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateUserRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role?: 'admin' | 'user';
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface UsersListData {
  users: User[];
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
export class UserService {
  private readonly API_URL = 'http://localhost:3000/api';

  constructor(private http: HttpClient) {}

  getUsers(page: number = 1, limit: number = 10): Observable<UsersListData> {
    return this.http.get<ApiResponse<UsersListData>>(
      `${this.API_URL}/users?page=${page}&limit=${limit}`
    ).pipe(
      map(response => response.data)
    );
  }

  getUserById(id: string): Observable<User> {
    return this.http.get<ApiResponse<User>>(`${this.API_URL}/users/${id}`).pipe(
      map(response => response.data)
    );
  }

  createUser(user: CreateUserRequest): Observable<User> {
    return this.http.post<ApiResponse<User>>(`${this.API_URL}/users`, user).pipe(
      map(response => response.data)
    );
  }

  updateUser(id: string, user: Partial<User>): Observable<User> {
    return this.http.put<ApiResponse<User>>(`${this.API_URL}/users/${id}`, user).pipe(
      map(response => response.data)
    );
  }

  deleteUser(id: string): Observable<void> {
    return this.http.delete<ApiResponse<void>>(`${this.API_URL}/users/${id}`).pipe(
      map(() => undefined)
    );
  }
}
