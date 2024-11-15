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

    // Guardar los datos en localStorage cuando sean válidos
    if (this.canProceed) {
      this.saveToLocalStorage();
    }
  }

  // Método para guardar datos en localStorage
  saveToLocalStorage() {
    localStorage.setItem('nombre', this.nombre);
    localStorage.setItem('apellido', this.apellido);
    localStorage.setItem('email', this.email);
    localStorage.setItem('password', this.password);  // Nota: Guardar contraseñas en localStorage no es seguro
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

  // Registrar el usuario y enviar el correo de verificación
  async registrarUsuario() {
    if (this.canProceed) {
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
  
        // Mensaje de éxito
        this.presentToast('Registro exitoso. Por favor revisa tu correo para verificar tu cuenta.');
  
        // Redirigir a la página de inicio de sesión
        this.router.navigate(['/home']);
      } catch (error) {
        console.error('Error al registrar el usuario:', error);
        this.presentToast('Registro exitoso. Por favor revisa tu correo para verificar tu cuenta.');
      }
    } else {
      this.presentToast('Por favor completa todos los campos correctamente.');
    }
  }

  // Detectar eventos de conexión
  ngOnInit() {
    window.addEventListener('online', this.onOnline);
    window.addEventListener('offline', this.onOffline);
  }

  // Evento cuando hay conexión
  onOnline() {
    this.presentToast('¡Conexión restaurada!');
  }

  // Evento cuando no hay conexión
  onOffline() {
    this.presentToast('No hay conexión a Internet.');
  }

  ngOnDestroy() {
    // Eliminar eventos al destruir el componente para evitar memory leaks
    window.removeEventListener('online', this.onOnline);
    window.removeEventListener('offline', this.onOffline);
  }
}
