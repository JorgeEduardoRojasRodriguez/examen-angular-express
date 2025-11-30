import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../../../environments/environment';
import { ToastService } from '../../../../shared/services/toast.service';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  category: string;
  OrderProduct?: {
    quantity: number;
    unitPrice: number;
    subtotal: number;
  };
}

interface Order {
  id: string;
  orderNumber: string;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  totalAmount: number;
  shippingAddress: string;
  notes?: string;
  createdAt: string;
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  products?: Product[];
}

interface CartItem {
  product: Product;
  quantity: number;
}

interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

@Component({
  selector: 'app-order-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './order-list.component.html',
  styleUrls: ['./order-list.component.css']
})
export class OrderListComponent implements OnInit {
  private http = inject(HttpClient);
  private toastService = inject(ToastService);
  private apiUrl = environment.apiUrl;

  orders = signal<Order[]>([]);
  products = signal<Product[]>([]);
  users = signal<User[]>([]);
  pagination = signal<Pagination | null>(null);
  isLoading = signal(false);
  hasError = signal(false);
  errorMessage = signal('');

  statusFilter = signal('all');
  currentPage = signal(1);
  itemsPerPage = signal(10);

  showModal = signal(false);
  showDetailModal = signal(false);
  selectedOrder = signal<Order | null>(null);
  isSaving = signal(false);

  cart = signal<CartItem[]>([]);
  shippingAddress = signal('');
  notes = signal('');
  selectedUserId = signal('');

  cartTotal = computed(() => {
    return this.cart().reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
  });

  totalPages = computed(() => this.pagination()?.totalPages || 0);

  statusOptions = [
    { value: 'all', label: 'Todos' },
    { value: 'pending', label: 'Pendiente' },
    { value: 'processing', label: 'Procesando' },
    { value: 'shipped', label: 'Enviado' },
    { value: 'delivered', label: 'Entregado' },
    { value: 'cancelled', label: 'Cancelado' }
  ];

  ngOnInit(): void {
    this.loadOrders();
    this.loadProducts();
    this.loadUsers();
  }

  loadOrders(): void {
    this.isLoading.set(true);
    this.hasError.set(false);

    let params = new HttpParams()
      .set('page', this.currentPage().toString())
      .set('limit', this.itemsPerPage().toString());

    if (this.statusFilter() !== 'all') {
      params = params.set('status', this.statusFilter());
    }

    this.http.get<{ success: boolean; data: { orders: Order[]; pagination: Pagination } }>(
      `${this.apiUrl}/orders`, { params }
    ).subscribe({
      next: (response) => {
        this.orders.set(response.data?.orders || []);
        this.pagination.set(response.data?.pagination || null);
        this.isLoading.set(false);
      },
      error: () => {
        this.hasError.set(true);
        this.errorMessage.set('Error al cargar las órdenes');
        this.isLoading.set(false);
      }
    });
  }

  loadProducts(): void {
    this.http.get<{ success: boolean; data: { products: Product[] } }>(
      `${this.apiUrl}/products`
    ).subscribe({
      next: (response) => {
        this.products.set(response.data?.products || []);
      },
      error: () => {}
    });
  }

  loadUsers(): void {
    this.http.get<{ success: boolean; data: { users: User[] } }>(
      `${this.apiUrl}/users`
    ).subscribe({
      next: (response) => {
        this.users.set(response.data?.users || []);
      },
      error: () => {}
    });
  }

  onStatusFilterChange(event: Event): void {
    this.statusFilter.set((event.target as HTMLSelectElement).value);
    this.currentPage.set(1);
    this.loadOrders();
  }

  onPageChange(page: number): void {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
      this.loadOrders();
    }
  }

  openCreateModal(): void {
    this.cart.set([]);
    this.shippingAddress.set('');
    this.notes.set('');
    this.selectedUserId.set('');
    this.showModal.set(true);
  }

  closeModal(): void {
    this.showModal.set(false);
  }

  openDetailModal(order: Order): void {
    this.selectedOrder.set(order);
    this.showDetailModal.set(true);
  }

  closeDetailModal(): void {
    this.showDetailModal.set(false);
    this.selectedOrder.set(null);
  }

  addToCart(product: Product): void {
    const currentCart = this.cart();
    const existingItem = currentCart.find(item => item.product.id === product.id);

    if (existingItem) {
      if (existingItem.quantity < product.stock) {
        this.cart.set(currentCart.map(item =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        ));
      } else {
        this.toastService.warning('No hay más stock disponible');
      }
    } else {
      this.cart.set([...currentCart, { product, quantity: 1 }]);
    }
  }

  removeFromCart(productId: string): void {
    this.cart.set(this.cart().filter(item => item.product.id !== productId));
  }

  updateQuantity(productId: string, quantity: number): void {
    if (quantity < 1) return;
    const item = this.cart().find(i => i.product.id === productId);
    if (item && quantity > item.product.stock) {
      this.toastService.warning('Cantidad excede el stock disponible');
      return;
    }
    this.cart.set(this.cart().map(item =>
      item.product.id === productId ? { ...item, quantity } : item
    ));
  }

  createOrder(): void {
    if (!this.selectedUserId()) {
      this.toastService.error('Selecciona un usuario para la orden');
      return;
    }

    if (this.cart().length === 0) {
      this.toastService.error('Agrega al menos un producto');
      return;
    }

    if (!this.shippingAddress().trim()) {
      this.toastService.error('Ingresa la dirección de envío');
      return;
    }

    this.isSaving.set(true);

    const orderData = {
      userId: this.selectedUserId(),
      shippingAddress: this.shippingAddress(),
      notes: this.notes(),
      items: this.cart().map(item => ({
        productId: item.product.id,
        quantity: item.quantity
      }))
    };

    this.http.post(`${this.apiUrl}/orders`, orderData).subscribe({
      next: () => {
        this.loadOrders();
        this.loadProducts(); // Actualizar stock
        this.closeModal();
        this.isSaving.set(false);
        this.toastService.success('Orden creada correctamente');
      },
      error: (err) => {
        this.isSaving.set(false);
        if (err.error?.errors && Array.isArray(err.error.errors)) {
          err.error.errors.forEach((error: string) => {
            this.toastService.error(error);
          });
        } else {
          this.toastService.error(err.error?.message || 'Error al crear la orden');
        }
      }
    });
  }

  cancelOrder(order: Order): void {
    if (order.status !== 'pending') {
      this.toastService.error('Solo se pueden cancelar órdenes pendientes');
      return;
    }

    if (confirm(`¿Cancelar la orden ${order.orderNumber}?`)) {
      this.http.delete(`${this.apiUrl}/orders/${order.id}`).subscribe({
        next: () => {
          this.loadOrders();
          this.loadProducts();
          this.toastService.success('Orden cancelada correctamente');
        },
        error: () => {
          this.toastService.error('Error al cancelar la orden');
        }
      });
    }
  }

  updateOrderStatus(order: Order, status: string): void {
    this.http.put(`${this.apiUrl}/orders/${order.id}`, { status }).subscribe({
      next: () => {
        this.loadOrders();
        this.toastService.success('Estado actualizado correctamente');
      },
      error: () => {
        this.toastService.error('Error al actualizar el estado');
      }
    });
  }

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      pending: 'Pendiente',
      processing: 'Procesando',
      shipped: 'Enviado',
      delivered: 'Entregado',
      cancelled: 'Cancelado'
    };
    return labels[status] || status;
  }

  getStatusClass(status: string): string {
    return `status-${status}`;
  }
}
