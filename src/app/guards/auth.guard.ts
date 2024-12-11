import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { StorageService } from '../services/storage.service';
@Injectable({
    providedIn: 'root'
  })
  export class AuthGuard implements CanActivate {
    constructor(
      private authService: AuthService,
      private storage: StorageService,
      private router: Router
    ) {}
  
    async canActivate(): Promise<boolean> {
      const authState = await this.storage.getItem('auth_state');
      
      if (authState) {
        return true;
      } else {
        this.router.navigate(['/home']);
        return false;
      }
    }
  }