import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app'; // <--- Nota che ora importiamo AppComponent

bootstrapApplication(AppComponent, appConfig) // <--- E avviamo AppComponent
  .catch((err) => console.error(err));
