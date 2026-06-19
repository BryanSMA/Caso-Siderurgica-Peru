import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class DespachoService {
  private url = 'http://localhost:3000/despacho';
  constructor(private http: HttpClient) {}

  listar(): Observable<any[]> { return this.http.get<any[]>(this.url); }
  crear(d: any): Observable<any> { return this.http.post<any>(this.url, d); }
  actualizar(id: number, d: any): Observable<any> { return this.http.put<any>(`${this.url}/${id}`, d); }
  eliminar(id: number): Observable<any> { return this.http.delete(`${this.url}/${id}`); }
  preparar(id: number): Observable<any> { return this.http.patch<any>(`${this.url}/${id}/preparar`, {}); }
  validarComprobante(id: number, comprobante: string): Observable<any> { return this.http.patch<any>(`${this.url}/${id}/comprobante`, { comprobante }); }
  confirmarEntrega(id: number): Observable<any> { return this.http.patch<any>(`${this.url}/${id}/confirmar-entrega`, {}); }
}