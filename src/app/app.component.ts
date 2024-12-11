import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { Platform } from '@ionic/angular';
import { AuthService } from './services/auth.service';
import { StorageService } from './services/storage.service';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
})
export class AppComponent {
  constructor(
    private platform: Platform,
    private authService: AuthService,
    private router: Router,
    private storage: StorageService
  ) {
    this.initializeApp();
  }

  async initializeApp() {
    await this.platform.ready();
    
    try {
      // Verificar si hay una sesión activa
      const authState = await this.storage.getItem('auth_state');
      if (authState) {
        // Si hay una sesión activa, restaurar la última página visitada
        const lastPage = await this.storage.getItem('last_page');
        if (lastPage) {
          this.router.navigate([lastPage]);
        } else {
          this.router.navigate(['/role-selection']);
        }
      } else {
        // Si no hay sesión, ir al login
        this.router.navigate(['/home']);
      }
    } catch (error) {
      console.error('Error al inicializar la app:', error);
      this.router.navigate(['/home']);
    }
  }
}