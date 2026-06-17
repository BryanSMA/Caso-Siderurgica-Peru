import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Usuario {
  id?: number;
  username: string;
  password?: string;
  rol: { id: number; nombre: string };
  rolNombre?: string;
  estado?: string;
}
@Injectable({ providedIn: 'root' })
export class UsuarioService {
  private url = 'http://localhost:3000/usuarios';

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    const user = localStorage.getItem('erp_user');
    if (user) {
      const usuario = JSON.parse(user);
      const credentials = btoa(`${usuario.username}:123456`);
      return new HttpHeaders({ Authorization: `Basic ${credentials}` });
    }
    return new HttpHeaders();
  }

  listarUsuarios(): Observable<Usuario[]> {
    return this.http.get<Usuario[]>(this.url, { headers: this.getHeaders() });
  }

  crearUsuario(usuario: { username: string; password: string; rolId: number }): Observable<any> {
    const body = {
      username: usuario.username,
      password: usuario.password,
      rol: { id: usuario.rolId }
    };
    return this.http.post(this.url, body, { headers: this.getHeaders() });
  }
}