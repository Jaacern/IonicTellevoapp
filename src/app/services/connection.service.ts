import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { ToastController } from '@ionic/angular';

@Injectable({
  providedIn: 'root'
})
export class ConnectionService {
  private onlineStatusSubject = new BehaviorSubject<boolean>(navigator.onLine);
  onlineStatus$ = this.onlineStatusSubject.asObservable();

  constructor(private toastController: ToastController) {
    window.addEventListener('online', () => this.updateConnectionStatus(true));
    window.addEventListener('offline', () => this.updateConnectionStatus(false));
  }

  private async updateConnectionStatus(isOnline: boolean) {
    this.onlineStatusSubject.next(isOnline);

    if (isOnline) {
      await this.presentToast('¡Conexión restaurada!', 'success');  // Cambio a color verde
    } else {
      await this.presentToast('No hay conexión a Internet.', 'danger'); // Mantener color rojo
    }
  }

  private async presentToast(message: string, color: string) {
    const toast = await this.toastController.create({
      message,
      duration: 3000,
      color,  // Usamos el color dinámico que se pasa como argumento
      position: 'top',
    });
    toast.present();
  }
}
