import { ErrorHandler, APP_INITIALIZER, provideZonelessChangeDetection } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter, withHashLocation } from '@angular/router';

import { AppComponent } from './app.component';
import { routes } from './app.routes';
import { AppInitializerService, initializeApp } from './services/app-initializer.service';
import { GlobalErrorHandler } from './services/global-error-handler.service';

bootstrapApplication(AppComponent, {
  providers: [
    provideZonelessChangeDetection(),
    provideRouter(routes, withHashLocation()),
    { provide: ErrorHandler, useClass: GlobalErrorHandler },
    {
      provide: APP_INITIALIZER,
      useFactory: initializeApp,
      deps: [AppInitializerService],
      multi: true,
    },
  ],
}).catch((err: unknown) => console.error(err));
