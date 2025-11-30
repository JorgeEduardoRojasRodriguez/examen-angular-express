import { Component, OnInit, OnDestroy, inject, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Subject, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs';
import { UserService, LoadingState } from '../../../../core/services/user.service';
import { User, Pagination } from '../../../../core/interfaces';
import { environment } from '../../../../../environments/environment';
import { ToastService } from '../../../../shared/services/toast.service';

interface UserFormData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: 'admin' | 'user';
  isActive: boolean;
}

@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './user-list.component.html',
  styleUrls: ['./user-list.component.css']
})
export class UserListComponent implements OnInit, OnDestroy {
  private http = inject(HttpClient);
  private toastService = inject(ToastService);
  private apiUrl = `${environment.apiUrl}/users`;

  private searchSubject = new Subject<string>();
  private destroy$ = new Subject<void>();

  searchTerm = signal<string>('');
  currentPage = signal<number>(1);
  itemsPerPage = signal<number>(10);

  showModal = signal(false);
  editingUser = signal<User | null>(null);
  isSaving = signal(false);
  formData = signal<UserFormData>({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    role: 'user',
    isActive: true
  });

  users = computed(() => this.userService.users());
  pagination = computed(() => this.userService.pagination());
  isLoading = computed(() => this.userService.isLoading());
  isEmpty = computed(() => this.userService.isEmpty());
  hasError = computed(() => this.userService.hasError());
  errorMessage = computed(() => this.userService.error());

  totalPages = computed(() => this.pagination()?.totalPages || 0);
  pages = computed(() => {
    const total = this.totalPages();
    const current = this.currentPage();
    const pages: number[] = [];
    let start = Math.max(1, current - 2);
    let end = Math.min(total, start + 4);
    if (end - start < 4) {
      start = Math.max(1, end - 4);
    }
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  });

  constructor(public userService: UserService) {}

  ngOnInit(): void {
    this.loadUsers();
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(term => {
      this.searchTerm.set(term);
      this.currentPage.set(1);
      this.loadUsers();
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadUsers(): void {
    this.userService.getUsers(
      this.currentPage(),
      this.itemsPerPage(),
      this.searchTerm() || undefined
    ).subscribe();
  }

  onSearch(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.searchSubject.next(target.value);
  }

  onPageChange(page: number): void {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
      this.loadUsers();
    }
  }

  onPrevious(): void {
    if (this.currentPage() > 1) {
      this.onPageChange(this.currentPage() - 1);
    }
  }

  onNext(): void {
    if (this.currentPage() < this.totalPages()) {
      this.onPageChange(this.currentPage() + 1);
    }
  }

  onRetry(): void {
    this.loadUsers();
  }

  trackByUserId(index: number, user: User): string {
    return user.id;
  }

  openCreateModal(): void {
    this.editingUser.set(null);
    this.formData.set({
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      role: 'user',
      isActive: true
    });
    this.showModal.set(true);
  }

  openEditModal(user: User): void {
    this.editingUser.set(user);
    this.formData.set({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      password: '',
      role: user.role as 'admin' | 'user',
      isActive: user.isActive
    });
    this.showModal.set(true);
  }

  closeModal(): void {
    this.showModal.set(false);
    this.editingUser.set(null);
  }

  saveUser(): void {
    const data = this.formData();
    const editing = this.editingUser();

    const payload: any = { ...data };
    if (!payload.password) {
      delete payload.password;
    }

    this.isSaving.set(true);

    if (editing) {
      this.http.put(`${this.apiUrl}/${editing.id}`, payload).subscribe({
        next: () => {
          this.loadUsers();
          this.closeModal();
          this.isSaving.set(false);
          this.toastService.success('Usuario actualizado correctamente');
        },
        error: () => {
          this.isSaving.set(false);
          this.toastService.error('Error al actualizar el usuario');
        }
      });
    } else {
      this.http.post(this.apiUrl, payload).subscribe({
        next: () => {
          this.loadUsers();
          this.closeModal();
          this.isSaving.set(false);
          this.toastService.success('Usuario creado correctamente');
        },
        error: () => {
          this.isSaving.set(false);
          this.toastService.error('Error al crear el usuario');
        }
      });
    }
  }

  deleteUser(user: User): void {
    if (confirm(`¿Eliminar al usuario "${user.firstName} ${user.lastName}"?`)) {
      this.http.delete(`${this.apiUrl}/${user.id}`).subscribe({
        next: () => {
          this.loadUsers();
          this.toastService.success('Usuario eliminado correctamente');
        },
        error: () => {
          this.toastService.error('Error al eliminar el usuario');
        }
      });
    }
  }

  updateField(field: keyof UserFormData, event: Event): void {
    const target = event.target as HTMLInputElement | HTMLSelectElement;
    const value = target.type === 'checkbox' ? (target as HTMLInputElement).checked : target.value;
    this.formData.update(f => ({ ...f, [field]: value }));
  }
}
