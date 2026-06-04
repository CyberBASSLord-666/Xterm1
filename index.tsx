
import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter, withHashLocation } from '@angular/router';
import { provideZonelessChangeDetection, ErrorHandler, APP_INITIALIZER } from '@angular/core';

import { AppComponent } from './src/app.component';
import { routes } from './src/app.routes';
import { GlobalErrorHandler } from './src/services/global-error-handler.service';
import { AppInitializerService, initializeApp } from './src/services/app-initializer.service';

bootstrapApplication(AppComponent, {
  providers: [
    provideZonelessChangeDetection(),
    provideRouter(routes, withHashLocation()),
    // Global error handler
    { provide: ErrorHandler, useClass: GlobalErrorHandler },
    // App initialization
    {
      provide: APP_INITIALIZER,
      useFactory: initializeApp,
      deps: [AppInitializerService],
      multi: true,
    },
  ],
}).catch((err) => console.error(err));

// AI Studio always uses an `index.tsx` file for all project types.