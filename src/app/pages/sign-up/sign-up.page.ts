import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ToastController } from '@ionic/angular';

@Component({
  selector: 'app-sign-up',
  templateUrl: './sign-up.page.html',
  styleUrls: ['./sign-up.page.scss'],
})
export class SignUpPage implements OnInit, OnDestroy {
  nombre: string = '';
  apellido: string = '';
  email: string = '';
  password: string = '';
  canProceed: boolean = false;
  nombreError: string = '';
  apellidoError: string = '';
  emailError: string = '';
  passwordError: string = '';
  isOnline: boolean = navigator.onLine;  // Establece el estado inicial de la conexión

  constructor(
    private authService: AuthService,
    private router: Router,
    private toastController: ToastController
  ) {}

  ngOnInit() {
    // Detectar eventos de conexión a Internet
    window.addEventListener('online', this.onOnline.bind(this));
    window.addEventListener('offline', this.onOffline.bind(this));
  }

  ngOnDestroy() {
    // Eliminar eventos de conexión cuando se destruye el componente
    window.removeEventListener('online', this.onOnline.bind(this));
    window.removeEventListener('offline', this.onOffline.bind(this));
  }

  // Validar los campos
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

  // Método para guardar los datos en localStorage
  saveToLocalStorage() {
    localStorage.setItem('nombre', this.nombre);
    localStorage.setItem('apellido', this.apellido);
    localStorage.setItem('email', this.email);
    localStorage.setItem('password', this.password);  // Guardar la contraseña en localStorage (aunque no es recomendable)
  }

  // Mostrar un mensaje de Toast
  async presentToast(message: string) {
    const toast = await this.toastController.create({
      message,
      duration: 3000,
      color: 'success',
      position: 'top',
    });
    toast.present();
  }

  // Registrar el usuario
  async registrarUsuario() {
    if (this.canProceed) {
      if (!this.isOnline) {
        // Si no hay conexión, mostramos un mensaje de alerta
        this.presentToast('No hay conexión a Internet. Los datos se guardaron localmente.');
        return; // No continuar con el registro si no hay internet
      }

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
        this.presentToast('Error al registrar usuario. Intenta nuevamente.');
      }
    } else {
      this.presentToast('Por favor completa todos los campos correctamente.');
    }
  }

  // Evento cuando hay conexión
  onOnline() {
    this.isOnline = true;
    this.presentToast('¡Conexión restaurada!');
  }

  // Evento cuando no hay conexión
  onOffline() {
    this.isOnline = false;
    this.presentToast('No hay conexión a Internet.');
  }
}
