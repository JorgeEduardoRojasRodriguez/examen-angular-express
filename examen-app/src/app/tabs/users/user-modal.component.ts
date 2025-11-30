import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, ModalController } from '@ionic/angular';
import { User } from '../../services/user.service';

@Component({
  selector: 'app-user-modal',
  templateUrl: './user-modal.component.html',
  styleUrls: ['./user-modal.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule]
})
export class UserModalComponent implements OnInit {
  @Input() user: User | null = null;
  @Input() isEdit: boolean = false;

  userData: any = {
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    role: 'user'
  };

  constructor(private modalController: ModalController) {}

  ngOnInit() {
    if (this.user) {
      this.userData = {
        email: this.user.email,
        firstName: this.user.firstName,
        lastName: this.user.lastName,
        role: this.user.role
      };
    }
  }

  dismiss() {
    this.modalController.dismiss();
  }

  save() {
    if (!this.userData.email?.trim() || !this.userData.firstName?.trim() || !this.userData.lastName?.trim()) {
      return;
    }

    if (!this.isEdit && !this.userData.password?.trim()) {
      return;
    }

    const dataToSend = { ...this.userData };
    if (this.isEdit) {
      delete dataToSend.password;
    }

    this.modalController.dismiss(dataToSend, 'save');
  }

  delete() {
    this.modalController.dismiss(null, 'delete');
  }

  isFormValid(): boolean {
    const hasRequiredFields = !!(
      this.userData.email?.trim() &&
      this.userData.firstName?.trim() &&
      this.userData.lastName?.trim()
    );

    if (!this.isEdit) {
      return hasRequiredFields && !!this.userData.password?.trim();
    }

    return hasRequiredFields;
  }
}
