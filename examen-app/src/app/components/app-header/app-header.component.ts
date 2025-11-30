import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-header',
  templateUrl: './app-header.component.html',
  styleUrls: ['./app-header.component.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule]
})
export class AppHeaderComponent {
  @Input() title: string = '';
  @Input() showGreeting: boolean = true;

  constructor(private authService: AuthService) {}

  get userName(): string {
    return this.authService.getFullName();
  }

  logout() {
    this.authService.logout();
  }
}
