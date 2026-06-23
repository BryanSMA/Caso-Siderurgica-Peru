import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
@Injectable({ providedIn: 'root' })
export class AuthService {

  private apiUrl = environment.apiUrl;
  private userKey = 'erp_user';
  private tokenKey = 'erp_access_token';

  private isRefreshing$ = new BehaviorSubject<boolean>(false);

  constructor(private http: HttpClient, private router: Router) {}

  login(username: string, password: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/login`, { username, password }, {
      withCredentials: true
    }).pipe(
      tap((response: any) => {
        if (response.success && response.usuario) {
          localStorage.setItem(this.userKey, JSON.stringify(response.usuario));
          localStorage.setItem(this.tokenKey, response.accessToken);
        }
      })
    );
  }

  logout(): void {
    localStorage.removeItem(this.userKey);
    localStorage.removeItem(this.tokenKey);
    this.router.navigate(['/login']);
  }

  getAccessToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  setAccessToken(token: string): void {
    localStorage.setItem(this.tokenKey, token);
  }

  getUser(): any {
    const user = localStorage.getItem(this.userKey);
    return user ? JSON.parse(user) : null;
  }

  isAuthenticated(): boolean {
    return !!this.getAccessToken();
  }

  getRol(): string | null {
    return this.getUser()?.rol ?? null;
  }

  refreshToken(): Observable<any> {
    return this.http.post(`${this.apiUrl}/auth/refresh`, {}, {
      withCredentials: true
    }).pipe(
      tap((response: any) => {
        if (response.accessToken) {
          this.setAccessToken(response.accessToken);
        }
      })
    );
  }

  get refreshing$(): BehaviorSubject<boolean> {
    return this.isRefreshing$;
  }
}
