import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css'
})
export class RegisterComponent {
  firstName = signal('');
  lastName = signal('');
  email = signal('');
  password = signal('');
  confirmPassword = signal('');
  isLoading = signal(false);
  error = signal<string | null>(null);
  success = signal<string | null>(null);

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  onSubmit(): void {
    if (!this.firstName() || !this.lastName() || !this.email() || !this.password() || !this.confirmPassword()) {
      this.error.set('Por favor complete todos los campos');
      return;
    }

    if (this.password() !== this.confirmPassword()) {
      this.error.set('Las contraseñas no coinciden');
      return;
    }

    if (this.password().length < 6) {
      this.error.set('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    this.isLoading.set(true);
    this.error.set(null);

    this.authService.register({
      firstName: this.firstName(),
      lastName: this.lastName(),
      email: this.email(),
      password: this.password()
    }).subscribe({
      next: () => {
        this.success.set('Cuenta creada exitosamente. Redirigiendo...');
        setTimeout(() => {
          this.router.navigate(['/login']);
        }, 2000);
      },
      error: (err) => {
        this.error.set(err.error?.message || 'Error al crear la cuenta');
        this.isLoading.set(false);
      }
    });
  }

  updateField(field: string, event: Event): void {
    const target = event.target as HTMLInputElement;
    switch (field) {
      case 'firstName':
        this.firstName.set(target.value);
        break;
      case 'lastName':
        this.lastName.set(target.value);
        break;
      case 'email':
        this.email.set(target.value);
        break;
      case 'password':
        this.password.set(target.value);
        break;
      case 'confirmPassword':
        this.confirmPassword.set(target.value);
        break;
    }
  }
}
