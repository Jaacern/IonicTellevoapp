// src/app/app.component.ts
import { Component, OnInit } from '@angular/core';
import { ConnectionService } from './services/connection.service';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
})
export class AppComponent implements OnInit {

  constructor(private connectionService: ConnectionService) {}

  ngOnInit() {
    this.connectionService.onlineStatus$.subscribe(isOnline => {
      if (isOnline) {
        console.log('Conexión restaurada');
      } else {
        console.log('No hay conexión a Internet');
      }
    });
  }
}
