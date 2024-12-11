import { Component, OnInit } from '@angular/core';
import { AngularFireDatabase } from '@angular/fire/compat/database';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { AuthService } from '../../services/auth.service'; 
import { Router } from '@angular/router'; 
@Component({
  selector: 'app-notificaciones',
  templateUrl: './notificaciones.page.html',
  styleUrls: ['./notificaciones.page.scss'],
})
export class NotificacionesPage implements OnInit {
  userId: string | null = null;
  notificaciones: any[] = [];

  constructor(
    private db: AngularFireDatabase,
    private afAuth: AngularFireAuth,
    private authService: AuthService,
    private router: Router,
  ) {
    // Guardar esta ruta como la última visitada
    this.authService.saveLastPage(this.router.url);
  }

  ngOnInit() {
    this.afAuth.authState.subscribe((user) => {
      if (user) {
        this.userId = user.uid;
        this.cargarNotificaciones();
      }
    });
  }

  cargarNotificaciones() {
    if (this.userId) {
      this.db.list(`usuarios/${this.userId}/notificaciones`)
        .valueChanges()
        .subscribe((notificaciones: any[]) => {
          this.notificaciones = notificaciones.reverse(); // Mostrar las más recientes primero
        });
    }
  }
}
