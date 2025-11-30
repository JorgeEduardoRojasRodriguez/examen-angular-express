import { Component, OnInit, OnDestroy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Subject, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { ToastService } from '../../../../shared/services/toast.service';

interface Task {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed';
  priority: 'low' | 'medium' | 'high';
  dueDate: string;
  createdAt: string;
}

interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

@Component({
  selector: 'app-task-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './task-list.component.html',
  styleUrls: ['./task-list.component.css']
})
export class TaskListComponent implements OnInit, OnDestroy {
  private http = inject(HttpClient);
  private toastService = inject(ToastService);
  private apiUrl = `${environment.apiUrl}/tasks`;
  private searchSubject = new Subject<string>();
  private destroy$ = new Subject<void>();

  tasks = signal<Task[]>([]);
  pagination = signal<Pagination | null>(null);
  isLoading = signal(false);
  hasError = signal(false);
  errorMessage = signal('');

  searchTerm = signal('');
  statusFilter = signal('all');
  priorityFilter = signal('all');
  currentPage = signal(1);
  itemsPerPage = signal(10);

  showModal = signal(false);
  editingTask = signal<Task | null>(null);
  isSaving = signal(false);
  formData = signal({
    title: '',
    description: '',
    status: 'pending' as Task['status'],
    priority: 'medium' as Task['priority'],
    dueDate: ''
  });

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

  ngOnInit(): void {
    this.loadTasks();

    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(term => {
      this.searchTerm.set(term);
      this.currentPage.set(1);
      this.loadTasks();
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadTasks(): void {
    this.isLoading.set(true);
    this.hasError.set(false);

    let params = new HttpParams()
      .set('page', this.currentPage().toString())
      .set('limit', this.itemsPerPage().toString());

    if (this.searchTerm()) {
      params = params.set('search', this.searchTerm());
    }
    if (this.statusFilter() !== 'all') {
      params = params.set('status', this.statusFilter());
    }
    if (this.priorityFilter() !== 'all') {
      params = params.set('priority', this.priorityFilter());
    }

    this.http.get<{ success: boolean; data: { tasks: Task[]; pagination: Pagination } }>(
      this.apiUrl, { params }
    ).subscribe({
      next: (response) => {
        this.tasks.set(response.data?.tasks || []);
        this.pagination.set(response.data?.pagination || null);
        this.isLoading.set(false);
      },
      error: () => {
        this.hasError.set(true);
        this.errorMessage.set('Error al cargar las tareas');
        this.isLoading.set(false);
      }
    });
  }

  onSearch(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.searchSubject.next(value);
  }

  onStatusFilterChange(event: Event): void {
    this.statusFilter.set((event.target as HTMLSelectElement).value);
    this.currentPage.set(1);
    this.loadTasks();
  }

  onPriorityFilterChange(event: Event): void {
    this.priorityFilter.set((event.target as HTMLSelectElement).value);
    this.currentPage.set(1);
    this.loadTasks();
  }

  onPageChange(page: number): void {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
      this.loadTasks();
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

  openCreateModal(): void {
    this.editingTask.set(null);
    this.formData.set({
      title: '',
      description: '',
      status: 'pending',
      priority: 'medium',
      dueDate: ''
    });
    this.showModal.set(true);
  }

  openEditModal(task: Task): void {
    this.editingTask.set(task);
    this.formData.set({
      title: task.title,
      description: task.description,
      status: task.status,
      priority: task.priority,
      dueDate: task.dueDate ? task.dueDate.split('T')[0] : ''
    });
    this.showModal.set(true);
  }

  closeModal(): void {
    this.showModal.set(false);
    this.editingTask.set(null);
  }

  saveTask(): void {
    const data = this.formData();
    const editing = this.editingTask();

    this.isSaving.set(true);

    if (editing) {
      this.http.put(`${this.apiUrl}/${editing.id}`, data).subscribe({
        next: () => {
          this.loadTasks();
          this.closeModal();
          this.isSaving.set(false);
          this.toastService.success('Tarea actualizada correctamente');
        },
        error: () => {
          this.isSaving.set(false);
          this.toastService.error('Error al actualizar la tarea');
        }
      });
    } else {
      this.http.post(this.apiUrl, data).subscribe({
        next: () => {
          this.loadTasks();
          this.closeModal();
          this.isSaving.set(false);
          this.toastService.success('Tarea creada correctamente');
        },
        error: () => {
          this.isSaving.set(false);
          this.toastService.error('Error al crear la tarea');
        }
      });
    }
  }

  deleteTask(task: Task): void {
    if (confirm(`¿Eliminar la tarea "${task.title}"?`)) {
      this.http.delete(`${this.apiUrl}/${task.id}`).subscribe({
        next: () => {
          this.loadTasks();
          this.toastService.success('Tarea eliminada correctamente');
        },
        error: () => {
          this.toastService.error('Error al eliminar la tarea');
        }
      });
    }
  }

  updateField(field: string, event: Event): void {
    const value = (event.target as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement).value;
    this.formData.update(f => ({ ...f, [field]: value }));
  }

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      pending: 'Pendiente',
      in_progress: 'En Progreso',
      completed: 'Completada'
    };
    return labels[status] || status;
  }

  getPriorityLabel(priority: string): string {
    const labels: Record<string, string> = {
      low: 'Baja',
      medium: 'Media',
      high: 'Alta'
    };
    return labels[priority] || priority;
  }
}
