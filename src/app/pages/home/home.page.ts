import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';       // Servicio de Autenticación
import { StorageService } from '../../services/storage.service'; // Servicio de Storage

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
})
export class HomePage implements OnInit {
  email: string = '';
  password: string = '';
  showPassword: boolean = false; // Variable para controlar la visibilidad de la contraseña

  constructor(
    private authService: AuthService, 
    private storageService: StorageService, 
    private router: Router
  ) {}

  async ngOnInit() {
    // Intentar cargar la sesión desde el almacenamiento local si no hay conexión
    const usuarioGuardado = await this.storageService.getItem('usuario_actual');
    if (usuarioGuardado) {
      // Redirigir directamente a la página de selección de rol si hay un usuario guardado
      this.router.navigate(['/role-selection']);
    } else {
      // Si no hay usuario guardado, intentar cargar el email y password desde localStorage
      const emailGuardado = localStorage.getItem('email');
      const passwordGuardado = localStorage.getItem('password');
      
      if (emailGuardado && passwordGuardado) {
        this.email = emailGuardado;
        this.password = passwordGuardado;
      }
    }
  }

  // Función para mostrar un toast con el mensaje
  async mostrarToast(message: string, color: string = 'danger') {
    const toast = document.createElement('ion-toast');
    toast.message = message;
    toast.duration = 3000; // Duración en milisegundos
    toast.color = color; // Puede ser 'danger', 'success', 'primary', etc.
    document.body.appendChild(toast);
    return toast.present();
  }

  async onSubmit() {
    try {
      // Iniciar sesión en Firebase Authentication
      const credenciales = await this.authService.login(this.email.trim(), this.password.trim());

      // Guardar sólo datos simples como uid, email en el storage
      const usuarioInfo = {
        uid: credenciales.user?.uid,
        email: credenciales.user?.email
      };

      // Guardar el usuario actual en el storage
      await this.storageService.setItem('usuario_actual', usuarioInfo);

      // Además, guardar email y password en localStorage
      localStorage.setItem('email', this.email.trim());
      localStorage.setItem('password', this.password.trim());

      // Redirigir a la página de selección de rol
      this.router.navigate(['/role-selection']);
    } catch (error) {
      console.error('Error al iniciar sesión:', error);
    
      // Verificar si el error tiene la propiedad 'message'
      if (error instanceof Error) {
        this.mostrarToast(error.message);  // Mostrar el mensaje del error en un toast
      } else {
        this.mostrarToast('Ocurrió un error desconocido.');  // Mostrar un mensaje genérico
      }
    }
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword; // Alternar la visibilidad de la contraseña
  }
}
