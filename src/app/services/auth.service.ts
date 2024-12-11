import { Injectable } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { BehaviorSubject } from 'rxjs';
import { StorageService } from './storage.service';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private authState = new BehaviorSubject<any>(null);
  
  constructor(
    private afAuth: AngularFireAuth, 
    private firestore: AngularFirestore,
    private storage: StorageService,
    private router: Router
  ) {}

  // Obtener el estado actual de autenticación
  getCurrentUser() {
    return this.authState.value;
  }

  // Observable para escuchar cambios en el estado de autenticación
  getAuthState() {
    return this.authState.asObservable();
  }

  // Registrar usuario con correo electrónico
  async register(email: string, password: string) {
    try {
      const credenciales = await this.afAuth.createUserWithEmailAndPassword(email, password);
      
      // Enviar el correo de verificación
      if (credenciales.user) {
        await credenciales.user.sendEmailVerification();
      }

      return credenciales;
    } catch (error) {
      console.error('Error al registrar el usuario:', error);
      throw error;
    }
  }

  // Guardar datos de usuario en Firestore
  async saveUserData(user: any) {
    try {
      return await this.firestore.collection('users').doc(user.uid).set(user);
    } catch (error) {
      console.error('Error al guardar datos del usuario en Firestore:', error);
      throw error;
    }
  }

  // Iniciar sesión con correo electrónico
  async login(email: string, password: string) {
    try {
      // Intentar login online
      const credenciales = await this.afAuth.signInWithEmailAndPassword(email, password);

      if (credenciales.user?.emailVerified) {
        // Guardar datos de sesión
        const usuarioInfo = {
          uid: credenciales.user.uid,
          email: credenciales.user.email,
          emailVerified: credenciales.user.emailVerified
        };
        
        // Guardar para modo offline y persistencia de sesión
        await this.storage.setItem('usuario_actual', {
          ...usuarioInfo,
          password: password // Solo para modo offline
        });
        
        await this.storage.setItem('auth_state', usuarioInfo);
        this.authState.next(usuarioInfo);
        return credenciales;
      } else {
        throw new Error('Correo no verificado. Por favor, verifica tu correo antes de iniciar sesión.');
      }
    } catch (error: any) {
      console.error('Error al iniciar sesión:', error);
      
      // Si hay error de red, intentar login offline
      if (error.code === 'auth/network-request-failed') {
        const usuarioGuardado = await this.storage.getItem('usuario_actual');
        if (usuarioGuardado && 
            usuarioGuardado.email === email && 
            usuarioGuardado.password === password) {
          
          // Actualizar el estado de autenticación con los datos guardados
          await this.storage.setItem('auth_state', usuarioGuardado);
          this.authState.next(usuarioGuardado);
          return { user: usuarioGuardado };
        } else {
          throw new Error('Credenciales incorrectas o usuario no encontrado en modo offline');
        }
      }
      throw error;
    }
  }

  // Cerrar sesión
  async logout() {
    try {
      // Intentar logout online
      try {
        await this.afAuth.signOut();
      } catch (error) {
        console.log('Error en logout online, continuando con logout offline');
      }
      
      // Limpiar datos de sesión
      await this.storage.removeItem('auth_state');
      await this.storage.removeItem('usuario_actual');
      await this.storage.removeItem('last_page');
      this.authState.next(null);
      
      // Redirigir al login
      this.router.navigate(['/home']);
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
      throw error;
    }
  }

  // Verificar estado de autenticación
  async checkAuthState(): Promise<boolean> {
    const authState = await this.storage.getItem('auth_state');
    return authState !== null;
  }

  // Guardar la última página visitada
  async saveLastPage(url: string) {
    if (await this.checkAuthState()) {
      await this.storage.setItem('last_page', url);
    }
  }

  // Obtener la última página visitada
  async getLastPage(): Promise<string> {
    const lastPage = await this.storage.getItem('last_page');
    return lastPage || '/role-selection';
  }
}