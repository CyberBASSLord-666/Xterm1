
import { Injectable, signal, inject } from '@angular/core';
import { ToastService } from './toast.service';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private toastService = inject(ToastService);

  private loggedIn = signal<boolean>(false);
  isLoggedIn = this.loggedIn.asReadonly();

  login() {
    this.loggedIn.set(true);
    this.toastService.show('Logged in successfully! (Mocked)');
  }

  logout() {
    this.loggedIn.set(false);
    this.toastService.show('You have been logged out.');
  }
}
