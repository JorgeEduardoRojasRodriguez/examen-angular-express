import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, ModalController } from '@ionic/angular';
import { Task } from '../../services/task.service';

@Component({
  selector: 'app-task-modal',
  templateUrl: './task-modal.component.html',
  styleUrls: ['./task-modal.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule]
})
export class TaskModalComponent implements OnInit {
  @Input() task: Task | null = null;
  @Input() isEdit: boolean = false;

  taskData: Partial<Task> = {
    title: '',
    description: '',
    status: 'pending',
    priority: 'medium'
  };

  constructor(private modalController: ModalController) {}

  ngOnInit() {
    if (this.task) {
      this.taskData = {
        title: this.task.title,
        description: this.task.description,
        status: this.task.status,
        priority: this.task.priority
      };
    }
  }

  dismiss() {
    this.modalController.dismiss();
  }

  save() {
    if (!this.taskData.title?.trim()) {
      return;
    }
    this.modalController.dismiss(this.taskData, 'save');
  }

  delete() {
    this.modalController.dismiss(null, 'delete');
  }
}
