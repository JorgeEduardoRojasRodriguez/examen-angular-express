import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../../environments/environment';
import { ToastService } from '../../../../shared/services/toast.service';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  category: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface ProductForm {
  name: string;
  description: string;
  price: number;
  stock: number;
  category: string;
}

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './product-list.component.html',
  styleUrl: './product-list.component.css'
})
export class ProductListComponent implements OnInit {
  private apiUrl = `${environment.apiUrl}/products`;

  products = signal<Product[]>([]);
  loading = signal(false);
  saving = signal(false);
  showModal = signal(false);
  editingProduct = signal<Product | null>(null);
  searchTerm = signal('');
  selectedCategory = signal('all');

  currentPage = signal(1);
  totalPages = signal(1);
  totalItems = signal(0);
  itemsPerPage = 10;

  form: ProductForm = this.getEmptyForm();

  categories = ['Electrónica', 'Ropa', 'Hogar', 'Deportes', 'Libros', 'Otros'];

  filteredProducts = computed(() => {
    let filtered = this.products();

    if (this.searchTerm()) {
      const term = this.searchTerm().toLowerCase();
      filtered = filtered.filter(p =>
        p.name.toLowerCase().includes(term) ||
        p.description?.toLowerCase().includes(term)
      );
    }

    if (this.selectedCategory() !== 'all') {
      filtered = filtered.filter(p => p.category === this.selectedCategory());
    }

    return filtered;
  });

  constructor(
    private http: HttpClient,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.loadProducts();
  }

  loadProducts(): void {
    this.loading.set(true);
    const params = new URLSearchParams({
      page: this.currentPage().toString(),
      limit: this.itemsPerPage.toString()
    });

    this.http.get<any>(`${this.apiUrl}?${params}`).subscribe({
      next: (response) => {
        if (response.success) {
          this.products.set(response.data.products);
          this.totalPages.set(response.data.pagination.totalPages);
          this.totalItems.set(response.data.pagination.total);
        }
        this.loading.set(false);
      },
      error: (error) => {
        this.toastService.error('Error al cargar productos');
        this.loading.set(false);
      }
    });
  }

  openCreateModal(): void {
    this.form = this.getEmptyForm();
    this.editingProduct.set(null);
    this.showModal.set(true);
  }

  openEditModal(product: Product): void {
    this.form = {
      name: product.name,
      description: product.description || '',
      price: product.price,
      stock: product.stock,
      category: product.category
    };
    this.editingProduct.set(product);
    this.showModal.set(true);
  }

  closeModal(): void {
    this.showModal.set(false);
    this.editingProduct.set(null);
    this.form = this.getEmptyForm();
  }

  saveProduct(): void {
    if (!this.form.name || this.form.price <= 0) {
      this.toastService.error('Nombre y precio son requeridos');
      return;
    }

    this.saving.set(true);
    const editing = this.editingProduct();

    if (editing) {
      this.http.put<any>(`${this.apiUrl}/${editing.id}`, this.form).subscribe({
        next: (response) => {
          if (response.success) {
            this.toastService.success('Producto actualizado');
            this.loadProducts();
            this.closeModal();
          }
          this.saving.set(false);
        },
        error: (error) => {
          this.showValidationErrors(error, 'Error al actualizar');
          this.saving.set(false);
        }
      });
    } else {
      this.http.post<any>(this.apiUrl, this.form).subscribe({
        next: (response) => {
          if (response.success) {
            this.toastService.success('Producto creado');
            this.loadProducts();
            this.closeModal();
          }
          this.saving.set(false);
        },
        error: (error) => {
          this.showValidationErrors(error, 'Error al crear');
          this.saving.set(false);
        }
      });
    }
  }

  private showValidationErrors(error: any, defaultMessage: string): void {
    if (error.error?.errors && Array.isArray(error.error.errors)) {
      error.error.errors.forEach((err: string) => {
        this.toastService.error(err);
      });
    } else {
      this.toastService.error(error.error?.message || defaultMessage);
    }
  }

  deleteProduct(product: Product): void {
    if (!confirm(`¿Eliminar "${product.name}"?`)) return;

    this.http.delete<any>(`${this.apiUrl}/${product.id}`).subscribe({
      next: (response) => {
        if (response.success) {
          this.toastService.success('Producto eliminado');
          this.loadProducts();
        }
      },
      error: (error) => {
        this.toastService.error(error.error?.message || 'Error al eliminar');
      }
    });
  }

  toggleActive(product: Product): void {
    this.http.put<any>(`${this.apiUrl}/${product.id}`, {
      isActive: !product.isActive
    }).subscribe({
      next: (response) => {
        if (response.success) {
          this.toastService.success(product.isActive ? 'Producto desactivado' : 'Producto activado');
          this.loadProducts();
        }
      },
      error: (error) => {
        this.toastService.error('Error al actualizar estado');
      }
    });
  }

  onSearch(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.searchTerm.set(value);
  }

  onCategoryFilter(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    this.selectedCategory.set(value);
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
      this.loadProducts();
    }
  }

  formatPrice(price: number): string {
    return new Intl.NumberFormat('es-EC', {
      style: 'currency',
      currency: 'USD'
    }).format(price);
  }

  private getEmptyForm(): ProductForm {
    return {
      name: '',
      description: '',
      price: 0,
      stock: 0,
      category: 'Otros'
    };
  }
}
