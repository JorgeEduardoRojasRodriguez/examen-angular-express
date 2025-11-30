import { Injectable, signal, computed } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, tap, catchError, throwError, finalize, BehaviorSubject, Subject, ReplaySubject } from 'rxjs';
import { environment } from '../../../environments/environment';
import { User, UserCreate, UserUpdate, ApiResponse, PaginatedResponse, Pagination } from '../interfaces';

export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private readonly apiUrl = `${environment.apiUrl}/users`;

  private usersSignal = signal<User[]>([]);
  private paginationSignal = signal<Pagination | null>(null);
  private loadingStateSignal = signal<LoadingState>('idle');
  private errorSignal = signal<string | null>(null);

  readonly users = this.usersSignal.asReadonly();
  readonly pagination = this.paginationSignal.asReadonly();
  readonly loadingState = this.loadingStateSignal.asReadonly();
  readonly error = this.errorSignal.asReadonly();

  readonly isLoading = computed(() => this.loadingStateSignal() === 'loading');
  readonly isEmpty = computed(() => this.usersSignal().length === 0 && this.loadingStateSignal() === 'success');
  readonly hasError = computed(() => this.loadingStateSignal() === 'error');

  private searchSubject = new Subject<string>();
  private currentPageSubject = new BehaviorSubject<number>(1);
  private recentSearchesSubject = new ReplaySubject<string>(5);

  constructor(private http: HttpClient) {}

  getUsers(page: number = 1, limit: number = 10, search?: string): Observable<PaginatedResponse<User>> {
    this.loadingStateSignal.set('loading');
    this.errorSignal.set(null);

    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());

    if (search) {
      params = params.set('search', search);
      this.recentSearchesSubject.next(search);
    }

    return this.http.get<PaginatedResponse<User>>(this.apiUrl, { params }).pipe(
      tap(response => {
        if (response.success) {
          this.usersSignal.set(response.data.users);
          this.paginationSignal.set(response.data.pagination);
          this.loadingStateSignal.set('success');
        }
      }),
      catchError(error => {
        this.loadingStateSignal.set('error');
        this.errorSignal.set(error.error?.message || 'Error al cargar usuarios');
        return throwError(() => error);
      })
    );
  }

  getUserById(id: string): Observable<ApiResponse<User>> {
    return this.http.get<ApiResponse<User>>(`${this.apiUrl}/${id}`);
  }

  createUser(user: UserCreate): Observable<ApiResponse<User>> {
    return this.http.post<ApiResponse<User>>(this.apiUrl, user).pipe(
      tap(() => {
        const currentPage = this.paginationSignal()?.page || 1;
        this.getUsers(currentPage).subscribe();
      })
    );
  }

  updateUser(id: string, user: UserUpdate): Observable<ApiResponse<User>> {
    return this.http.put<ApiResponse<User>>(`${this.apiUrl}/${id}`, user).pipe(
      tap(response => {
        if (response.success) {
          const currentUsers = this.usersSignal();
          const index = currentUsers.findIndex(u => u.id === id);
          if (index !== -1) {
            const updatedUsers = [...currentUsers];
            updatedUsers[index] = response.data;
            this.usersSignal.set(updatedUsers);
          }
        }
      })
    );
  }

  deleteUser(id: string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/${id}`).pipe(
      tap(() => {
        const currentUsers = this.usersSignal();
        this.usersSignal.set(currentUsers.filter(u => u.id !== id));
      })
    );
  }

  filterUsersByName(name: string): User[] {
    const searchTerm = name.toLowerCase();
    return this.usersSignal().filter(user =>
      user.firstName.toLowerCase().includes(searchTerm) ||
      user.lastName.toLowerCase().includes(searchTerm) ||
      user.email.toLowerCase().includes(searchTerm)
    );
  }

  resetState(): void {
    this.usersSignal.set([]);
    this.paginationSignal.set(null);
    this.loadingStateSignal.set('idle');
    this.errorSignal.set(null);
  }
}
