import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, ModalController, AlertController, ToastController } from '@ionic/angular';
import { TaskService, Task } from '../../services/task.service';
import { TaskModalComponent } from './task-modal.component';
import { AppHeaderComponent } from '../../components/app-header/app-header.component';

@Component({
  selector: 'app-tasks',
  templateUrl: './tasks.page.html',
  styleUrls: ['./tasks.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule, AppHeaderComponent]
})
export class TasksPage implements OnInit {
  tasks: Task[] = [];
  isLoading = false;
  isLoadingMore = false;
  currentPage = 1;
  totalTasks = 0;
  limit = 10;
  hasMoreData = true;

  isEmpty = false;
  hasError = false;
  errorMessage = '';

  constructor(
    private taskService: TaskService,
    private modalController: ModalController,
    private alertController: AlertController,
    private toastController: ToastController
  ) {}

  ngOnInit() {
    this.loadTasks();
  }

  loadTasks(event?: any) {
    if (this.isLoading) return;

    this.isLoading = true;
    this.hasError = false;
    this.currentPage = 1;

    this.taskService.getTasks(this.currentPage, this.limit).subscribe({
      next: (response) => {
        this.tasks = response.tasks || [];
        this.totalTasks = response.pagination?.total || 0;
        this.hasMoreData = this.tasks.length < this.totalTasks;
        this.isEmpty = this.tasks.length === 0;
        this.isLoading = false;

        if (event) {
          event.target.complete();
        }
      },
      error: () => {
        this.isLoading = false;
        this.hasError = true;
        this.errorMessage = 'Error al cargar las tareas';

        if (event) {
          event.target.complete();
        }
      }
    });
  }

  loadMoreTasks(event: any) {
    if (!this.hasMoreData || this.isLoadingMore) {
      event.target.complete();
      return;
    }

    this.isLoadingMore = true;
    this.currentPage++;

    this.taskService.getTasks(this.currentPage, this.limit).subscribe({
      next: (response) => {
        const newTasks = response.tasks || [];
        this.tasks = [...this.tasks, ...newTasks];
        this.hasMoreData = this.tasks.length < this.totalTasks;
        this.isLoadingMore = false;
        event.target.complete();

        if (!this.hasMoreData) {
          event.target.disabled = true;
        }
      },
      error: (error) => {
        this.isLoadingMore = false;
        this.currentPage--;
        event.target.complete();
        this.showToast('Error al cargar más tareas', 'danger');
      }
    });
  }

  doRefresh(event: any) {
    this.loadTasks(event);
  }

  async openTaskModal(task?: Task) {
    const modal = await this.modalController.create({
      component: TaskModalComponent,
      componentProps: {
        task: task || null,
        isEdit: !!task
      }
    });

    await modal.present();

    const { data, role } = await modal.onWillDismiss();

    if (role === 'save' && data) {
      if (task) {
        this.updateTask(task.id!, data);
      } else {
        this.createTask(data);
      }
    } else if (role === 'delete' && task) {
      this.confirmDeleteTask(task);
    }
  }

  createTask(taskData: Partial<Task>) {
    this.taskService.createTask(taskData).subscribe({
      next: (newTask) => {
        this.tasks.unshift(newTask);
        this.totalTasks++;
        this.isEmpty = false;
        this.showToast('Tarea creada correctamente', 'success');
      },
      error: (error) => {
        this.showToast('Error al crear la tarea', 'danger');
      }
    });
  }

  updateTask(id: string, taskData: Partial<Task>) {
    this.taskService.updateTask(id, taskData).subscribe({
      next: (updatedTask) => {
        const index = this.tasks.findIndex(t => t.id === id);
        if (index !== -1) {
          this.tasks[index] = updatedTask;
        }
        this.showToast('Tarea actualizada correctamente', 'success');
      },
      error: (error) => {
        this.showToast('Error al actualizar la tarea', 'danger');
      }
    });
  }

  async confirmDeleteTask(task: Task) {
    const alert = await this.alertController.create({
      header: 'Eliminar Tarea',
      message: `¿Estás seguro de eliminar "${task.title}"?`,
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Eliminar',
          role: 'destructive',
          handler: () => {
            this.deleteTask(task);
          }
        }
      ]
    });

    await alert.present();
  }

  deleteTask(task: Task) {
    this.taskService.deleteTask(task.id!).subscribe({
      next: () => {
        this.tasks = this.tasks.filter(t => t.id !== task.id);
        this.totalTasks--;
        this.isEmpty = this.tasks.length === 0;
        this.showToast('Tarea eliminada correctamente', 'success');
      },
      error: (error) => {
        this.showToast('Error al eliminar la tarea', 'danger');
      }
    });
  }

  toggleTaskComplete(task: Task) {
    this.taskService.toggleComplete(task).subscribe({
      next: (updatedTask) => {
        const index = this.tasks.findIndex(t => t.id === task.id);
        if (index !== -1) {
          this.tasks[index] = updatedTask;
        }
      },
      error: (error) => {
        this.showToast('Error al actualizar la tarea', 'danger');
      }
    });
  }

  isTaskCompleted(task: Task): boolean {
    return task.status === 'completed';
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
