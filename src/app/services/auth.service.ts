import { Injectable } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { AngularFirestore } from '@angular/fire/compat/firestore';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  constructor(private afAuth: AngularFireAuth, private firestore: AngularFirestore) {}

  // Registrar usuario con correo electrónico
  async register(email: string, password: string) {
    try {
      const credenciales = await this.afAuth.createUserWithEmailAndPassword(email, password);
      
      // Enviar el correo de verificación
      if (credenciales.user) {
        await credenciales.user.sendEmailVerification();
      }

      // Guardar los datos del usuario en Firestore
      if (credenciales.user) {
        const userData = {
          uid: credenciales.user.uid,
          email: credenciales.user.email,
          emailVerified: credenciales.user.emailVerified,
        };
        await this.saveUserData(userData);

        // Guardar en localStorage
        this.saveUserToLocalStorage(userData);
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
      // Asegúrate de que estás usando el UID para guardar el documento del usuario en Firestore
      return await this.firestore.collection('users').doc(user.uid).set(user);
    } catch (error) {
      console.error('Error al guardar datos del usuario en Firestore:', error);
      throw error;
    }
  }

  // Guardar datos del usuario en localStorage
  private saveUserToLocalStorage(user: any) {
    localStorage.setItem('user', JSON.stringify(user));
  }

  // Obtener datos del usuario desde localStorage
  getUserFromLocalStorage() {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  }

  // Iniciar sesión con correo electrónico
  async login(email: string, password: string) {
    try {
      const credenciales = await this.afAuth.signInWithEmailAndPassword(email, password);

      // Verificar si el correo ha sido verificado
      if (credenciales.user?.emailVerified) {
        // Guardar datos del usuario en Firestore y localStorage si no están guardados
        if (credenciales.user) {
          const userData = {
            uid: credenciales.user.uid,
            email: credenciales.user.email,
            emailVerified: credenciales.user.emailVerified,
          };

          // Guardar en Firestore y localStorage
          await this.saveUserData(userData);
          this.saveUserToLocalStorage(userData);
        }

        return credenciales;
      } else {
        throw new Error('Correo no verificado. Por favor, verifica tu correo antes de iniciar sesión.');
      }
    } catch (error) {
      console.error('Error al iniciar sesión:', error);
      throw error;
    }
  }

  // Cerrar sesión
  async logout() {
    try {
      // Limpiar el localStorage al cerrar sesión
      localStorage.removeItem('user');
      await this.afAuth.signOut();
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
      throw error;
    }
  }

  // Comprobar si el usuario está autenticado usando localStorage
  isAuthenticated() {
    return this.getUserFromLocalStorage() !== null;
  }
}
