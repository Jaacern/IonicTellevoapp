import { Injectable } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { AngularFirestore } from '@angular/fire/compat/firestore';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  constructor(private afAuth: AngularFireAuth, private firestore: AngularFirestore) {}

  // Registrar usuario con correo electrónico
  // Modificar el método register
  async register(email: string, password: string) {
    try {
      // Agregar un pequeño retraso aleatorio
      await new Promise(resolve => setTimeout(resolve, Math.random() * 2000 + 1000));
      
      const credenciales = await this.afAuth.createUserWithEmailAndPassword(email, password);
      
      // Enviar el correo de verificación
      if (credenciales.user) {
        await credenciales.user.sendEmailVerification();
      }

      return credenciales;
    } catch (error: any) {
      console.error('Error al registrar el usuario:', error);
      
      // Manejar específicamente el error de demasiadas solicitudes
      if (error.code === 'auth/too-many-requests') {
        throw new Error('Demasiados intentos. Por favor, espera unos minutos e intenta de nuevo.');
      }
      
      throw error;
    }
  }

  async saveUserData(user: any) {
    try {
      // Asegúrate de usar el UID del usuario actual
      const currentUser = this.afAuth.currentUser;
      if (!currentUser) {
        throw new Error('No hay usuario autenticado');
      }
  
      return await this.firestore.collection('users').doc(user.uid).set({
        // Elimina campos sensibles antes de guardar
        uid: user.uid,
        nombre: user.nombre,
        apellido: user.apellido,
        email: user.email,
        emailVerified: false,
        // No guardes la contraseña en texto plano
      });
    } catch (error) {
      console.error('Error al guardar datos del usuario en Firestore:', error);
      throw error;
    }
  }

  // Iniciar sesión con correo electrónico
  async login(email: string, password: string) {
    try {
      const credenciales = await this.afAuth.signInWithEmailAndPassword(email, password);

      // Verificar si el correo ha sido verificado
      if (credenciales.user?.emailVerified) {
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
      await this.afAuth.signOut();
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
      throw error;
    }
  }
}
