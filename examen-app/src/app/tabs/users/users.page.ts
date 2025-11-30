import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, ModalController, AlertController, ToastController } from '@ionic/angular';
import { UserService, User } from '../../services/user.service';
import { UserModalComponent } from './user-modal.component';
import { AppHeaderComponent } from '../../components/app-header/app-header.component';

@Component({
  selector: 'app-users',
  templateUrl: './users.page.html',
  styleUrls: ['./users.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule, AppHeaderComponent]
})
export class UsersPage implements OnInit {
  users: User[] = [];
  isLoading = false;
  isLoadingMore = false;
  currentPage = 1;
  totalUsers = 0;
  limit = 10;
  hasMoreData = true;

  isEmpty = false;
  hasError = false;
  errorMessage = '';

  constructor(
    private userService: UserService,
    private modalController: ModalController,
    private alertController: AlertController,
    private toastController: ToastController
  ) {}

  ngOnInit() {
    this.loadUsers();
  }

  loadUsers(event?: any) {
    if (this.isLoading) return;

    this.isLoading = true;
    this.hasError = false;
    this.currentPage = 1;

    this.userService.getUsers(this.currentPage, this.limit).subscribe({
      next: (response) => {
        this.users = response.users || [];
        this.totalUsers = response.pagination?.total || 0;
        this.hasMoreData = this.users.length < this.totalUsers;
        this.isEmpty = this.users.length === 0;
        this.isLoading = false;

        if (event) {
          event.target.complete();
        }
      },
      error: () => {
        this.isLoading = false;
        this.hasError = true;
        this.errorMessage = 'Error al cargar los usuarios';

        if (event) {
          event.target.complete();
        }
      }
    });
  }

  loadMoreUsers(event: any) {
    if (!this.hasMoreData || this.isLoadingMore) {
      event.target.complete();
      return;
    }

    this.isLoadingMore = true;
    this.currentPage++;

    this.userService.getUsers(this.currentPage, this.limit).subscribe({
      next: (response) => {
        const newUsers = response.users || [];
        this.users = [...this.users, ...newUsers];
        this.hasMoreData = this.users.length < this.totalUsers;
        this.isLoadingMore = false;
        event.target.complete();

        if (!this.hasMoreData) {
          event.target.disabled = true;
        }
      },
      error: () => {
        this.isLoadingMore = false;
        this.currentPage--;
        event.target.complete();
        this.showToast('Error al cargar más usuarios', 'danger');
      }
    });
  }

  doRefresh(event: any) {
    this.loadUsers(event);
  }

  async openUserModal(user?: User) {
    const modal = await this.modalController.create({
      component: UserModalComponent,
      componentProps: {
        user: user || null,
        isEdit: !!user
      }
    });

    await modal.present();

    const { data, role } = await modal.onWillDismiss();

    if (role === 'save' && data) {
      if (user) {
        this.updateUser(user.id!, data);
      } else {
        this.createUser(data);
      }
    } else if (role === 'delete' && user) {
      this.confirmDeleteUser(user);
    }
  }

  createUser(userData: any) {
    this.userService.createUser(userData).subscribe({
      next: (newUser) => {
        this.users.unshift(newUser);
        this.totalUsers++;
        this.isEmpty = false;
        this.showToast('Usuario creado correctamente', 'success');
      },
      error: (error) => {
        const message = error.error?.message || 'Error al crear el usuario';
        this.showToast(message, 'danger');
      }
    });
  }

  updateUser(id: string, userData: Partial<User>) {
    this.userService.updateUser(id, userData).subscribe({
      next: (updatedUser) => {
        const index = this.users.findIndex(u => u.id === id);
        if (index !== -1) {
          this.users[index] = updatedUser;
        }
        this.showToast('Usuario actualizado correctamente', 'success');
      },
      error: (error) => {
        const message = error.error?.message || 'Error al actualizar el usuario';
        this.showToast(message, 'danger');
      }
    });
  }

  async confirmDeleteUser(user: User) {
    const alert = await this.alertController.create({
      header: 'Eliminar Usuario',
      message: `¿Estás seguro de eliminar a "${user.firstName} ${user.lastName}"?`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Eliminar',
          role: 'destructive',
          handler: () => this.deleteUser(user)
        }
      ]
    });
    await alert.present();
  }

  deleteUser(user: User) {
    this.userService.deleteUser(user.id!).subscribe({
      next: () => {
        this.users = this.users.filter(u => u.id !== user.id);
        this.totalUsers--;
        this.isEmpty = this.users.length === 0;
        this.showToast('Usuario eliminado correctamente', 'success');
      },
      error: (error) => {
        const message = error.error?.message || 'Error al eliminar el usuario';
        this.showToast(message, 'danger');
      }
    });
  }

  getFullName(user: User): string {
    return `${user.firstName} ${user.lastName}`;
  }

  getRoleBadgeColor(role: string): string {
    return role === 'admin' ? 'primary' : 'medium';
  }

  getRoleLabel(role: string): string {
    return role === 'admin' ? 'Admin' : 'Usuario';
  }

  async showToast(message: string, color: string) {
    const toast = await this.toastController.create({
      message,
      duration: 2000,
      color,
      position: 'bottom'
    });
    await toast.present();
  }
}
