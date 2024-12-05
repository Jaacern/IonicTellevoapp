import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { StorageService } from '../../services/storage.service';

@Component({
  selector: 'app-sign-up',
  templateUrl: './sign-up.page.html',
  styleUrls: ['./sign-up.page.scss'],
})
export class SignUpPage {
  nombre: string = '';
  apellido: string = '';
  email: string = '';
  password: string = '';
  canProceed: boolean = false;
  nombreError: string = '';
  apellidoError: string = '';
  emailError: string = '';
  passwordError: string = '';

  constructor(private authService: AuthService, private storageService: StorageService, private router: Router) {}

  // Validar todos los campos
  Validar() {
    this.nombreError = this.nombre.length >= 5 ? '' : 'El nombre debe tener al menos 5 caracteres.';
    this.apellidoError = this.apellido.length >= 5 ? '' : 'El apellido debe tener al menos 5 caracteres.';
    this.emailError = /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(this.email) ? '' : 'Introduce un correo electrónico válido.';
    this.passwordError = this.password.length >= 8 ? '' : 'La contraseña debe tener al menos 8 caracteres.';

    this.canProceed = !this.nombreError && !this.apellidoError && !this.emailError && !this.passwordError;
  }

  // Mostrar Toast con el mensaje
  async presentToast(message: string) {
    const toast = document.createElement('ion-toast');
    toast.message = message;
    toast.duration = 5000;
    toast.cssClass = 'toast-success'; // Aplica la clase personalizada
    document.body.appendChild(toast);
    return toast.present();
  }
  async registrarUsuario() {
    if (this.canProceed) {
      try {
        // Registrar usuario en Firebase Authentication
        const credenciales = await this.authService.register(
          this.email.trim(), 
          this.password.trim()
        );
  
        // Verificar que exista un usuario
        if (!credenciales.user) {
          throw new Error('Registro fallido');
        }
  
        // Crear el objeto de usuario para guardar en Firestore
        const nuevoUsuario = {
          uid: credenciales.user.uid,
          nombre: this.nombre.trim(),
          apellido: this.apellido.trim(),
          email: this.email.trim(),
          // NO incluyas la contraseña
          emailVerified: false,
        };
  
        // Guardar el usuario en Firestore
        await this.authService.saveUserData(nuevoUsuario);
  
        // Guardar el usuario en Ionic Storage para uso offline
        // Elimina información sensible antes de guardar
        await this.storageService.setItem('user', {
          uid: nuevoUsuario.uid,
          nombre: nuevoUsuario.nombre,
          apellido: nuevoUsuario.apellido,
          email: nuevoUsuario.email
        });
  
        // Mensaje de éxito
        await this.presentToast('Registro exitoso. Por favor revisa tu correo para verificar tu cuenta.');
  
        // Navegación con un pequeño retraso
        setTimeout(() => {
          this.router.navigate(['/home']);
        }, 3000);
  
      } catch (error: any) {
        console.error('Error completo:', error);
        
        // Manejo de errores específicos
        const errorMessage = error.message || 'Ocurrió un error durante el registro';
        this.presentToast(errorMessage);
      }
    } else {
      this.presentToast('Por favor completa todos los campos correctamente.');
    }
  }
}