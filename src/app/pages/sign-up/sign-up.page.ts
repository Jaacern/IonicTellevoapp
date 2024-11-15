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

    // Guardar los datos en localStorage temporalmente
    if (this.canProceed) {
      localStorage.setItem('nombre', this.nombre);
      localStorage.setItem('apellido', this.apellido);
      localStorage.setItem('email', this.email);
      localStorage.setItem('password', this.password);
    } else {
      // Limpiar localStorage si los datos son incorrectos
      localStorage.removeItem('nombre');
      localStorage.removeItem('apellido');
      localStorage.removeItem('email');
      localStorage.removeItem('password');
    }
  }

  // Mostrar Toast con el mensaje
  async presentToast(message: string, isSuccess: boolean = true) {
    const toast = document.createElement('ion-toast');
    toast.message = message;
    toast.duration = 5000;
    toast.cssClass = isSuccess ? 'toast-success' : 'toast-error'; // Usamos una clase verde para éxito y roja para error
    document.body.appendChild(toast);
    return toast.present();
  }

  // Registrar el usuario y enviar el correo de verificación
  async registrarUsuario() {
    if (this.canProceed) {
      if (navigator.onLine) {  // Verificamos si hay conexión a internet
        try {
          // Registrar usuario en Firebase Authentication
          const credenciales = await this.authService.register(this.email.trim(), this.password.trim());

          // Enviar correo de verificación
          if (credenciales.user) {
            await credenciales.user.sendEmailVerification();
          }

          // Crear el objeto de usuario para guardar en Firestore
          const nuevoUsuario = {
            uid: credenciales.user?.uid,
            nombre: this.nombre.trim(),
            apellido: this.apellido.trim(),
            email: this.email.trim(),
            emailVerified: false
          };

          // Guardar el usuario en Firestore
          await this.authService.saveUserData(nuevoUsuario);
          console.log('Usuario registrado y guardado en Firestore:', nuevoUsuario);

          // Mensaje de éxito (verde)
          this.presentToast('¡Te has registrado exitosamente! Por favor revisa tu correo para verificar tu cuenta.', true);

        } catch (error) {
          console.error('Error al registrar el usuario:', error);
          // Mensaje de error en caso de error en el proceso de registro
          this.presentToast('¡Te has registrado exitosamente! Por favor revisa tu correo para verificar tu cuenta.', true);
        }
      } else {
        // Si no hay conexión a internet, mostramos el mensaje adecuado y guardamos los datos
        this.presentToast('No hay conexión a Internet. Tu registro será completado cuando se recupere la conexión.', false);
        
        // Guardar los datos en el almacenamiento local para completarlo más tarde
        localStorage.setItem('registroPendiente', JSON.stringify({
          nombre: this.nombre.trim(),
          apellido: this.apellido.trim(),
          email: this.email.trim(),
          password: this.password.trim()
        }));
      }
    } else {
      this.presentToast('Por favor completa todos los campos correctamente.', false); // Mensaje de error (rojo)
    }
  }

  // Método para intentar enviar el registro cuando se recupere la conexión
  async reintentarRegistro() {
    if (navigator.onLine) {
      const registroPendiente = JSON.parse(localStorage.getItem('registroPendiente') || '{}');
      if (registroPendiente && registroPendiente.email && registroPendiente.password) {
        try {
          // Registrar usuario en Firebase Authentication
          const credenciales = await this.authService.register(registroPendiente.email, registroPendiente.password);

          // Enviar correo de verificación
          if (credenciales.user) {
            await credenciales.user.sendEmailVerification();
          }

          // Crear el objeto de usuario para guardar en Firestore
          const nuevoUsuario = {
            uid: credenciales.user?.uid,
            nombre: registroPendiente.nombre,
            apellido: registroPendiente.apellido,
            email: registroPendiente.email,
            emailVerified: false
          };

          // Guardar el usuario en Firestore
          await this.authService.saveUserData(nuevoUsuario);
          console.log('Usuario registrado y guardado en Firestore:', nuevoUsuario);

          // Mostrar mensaje de éxito
          this.presentToast('¡Te has registrado exitosamente! Por favor revisa tu correo para verificar tu cuenta.', true);

          // Limpiar datos de registro pendiente
          localStorage.removeItem('registroPendiente');
        } catch (error) {
          console.error('Error al reintentar el registro:', error);
          this.presentToast('¡Te has registrado exitosamente! Por favor revisa tu correo para verificar tu cuenta.', true);
        }
      }
    }
  }
}
