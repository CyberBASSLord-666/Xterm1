import { Injectable, signal, inject } from '@angular/core';
import { ToastService } from './toast.service';

/**
 * Mock authentication service used for prototyping flows.
 * Real authentication is out of scope for this app, so the service only emits toast notifications.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private toastService = inject(ToastService);

  private loggedIn = signal<boolean>(false);
  public isLoggedIn = this.loggedIn.asReadonly();

  public login(): void {
    this.loggedIn.set(true);
    this.toastService.show('Logged in successfully! (Mocked)');
  }

  public logout(): void {
    this.loggedIn.set(false);
    this.toastService.show('You have been logged out.');
  }
}
