import { Component, OnInit, inject } from '@angular/core';
import { FcmService } from './services/fcm.service';
import { AuthService } from './services/auth.service';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  standalone: false,
})
export class AppComponent implements OnInit {
  private fcmService = inject(FcmService);
  private authService = inject(AuthService);

  constructor() {}

  ngOnInit() {
    this.initializeApp();
  }

  private initializeApp() {
    if (this.authService.isLoggedIn()) {
      this.initializeFCM();
    }
  }

  private async initializeFCM() {
    try {
      await this.fcmService.initPush();
    } catch {
    }
  }
}
