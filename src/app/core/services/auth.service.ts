import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private apiUrl = 'http://localhost:3000';
  private userKey = 'erp_user';

  constructor(
    private http: HttpClient,
    private router: Router
  ) {}

  login(username: string, password: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/login`, { username, password }).pipe(
      tap((response: any) => {
        if (response.success && response.usuario) {
          localStorage.setItem(this.userKey, JSON.stringify(response.usuario));
        }
      })
    );
  }

  logout(): void {
    localStorage.removeItem(this.userKey);
    this.router.navigate(['/login']);
  }

  getUser(): any {
    const user = localStorage.getItem(this.userKey);
    return user ? JSON.parse(user) : null;
  }

  isAuthenticated(): boolean {
    return !!this.getUser();
  }

  getRol(): string | null {
    const user = this.getUser();
    return user ? user.rol : null;
  }
}