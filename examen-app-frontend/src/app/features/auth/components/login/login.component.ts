import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  email = signal('');
  password = signal('');
  isLoading = signal(false);
  error = signal<string | null>(null);

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  onSubmit(): void {
    if (!this.email() || !this.password()) {
      this.error.set('Por favor complete todos los campos');
      return;
    }

    this.isLoading.set(true);
    this.error.set(null);

    this.authService.login({
      email: this.email(),
      password: this.password()
    }).subscribe({
      next: () => {
        this.router.navigate(['/users']);
      },
      error: (err) => {
        this.error.set(err.error?.message || 'Error al iniciar sesión');
        this.isLoading.set(false);
      }
    });
  }

  updateEmail(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.email.set(target.value);
  }

  updatePassword(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.password.set(target.value);
  }
}
