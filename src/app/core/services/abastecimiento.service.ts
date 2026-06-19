import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Compra {
  id?: number; ordenCompraId?: number; proveedorId: number; inventarioId?: number;
  producto: string; cantidad: number; precioUnitario: number; total: number;
}
export interface Presupuesto { periodo: string; montoTotal: number; montoDisponible: number; }

@Injectable({ providedIn: 'root' })
export class AbastecimientoService {
  private base = 'http://localhost:3000';
  constructor(private http: HttpClient) {}

  listarOrdenes(): Observable<any[]> { return this.http.get<any[]>(`${this.base}/orden-compra`); }
  crearOrden(oc: any): Observable<any> { return this.http.post<any>(`${this.base}/orden-compra`, oc); }
  cambiarEstadoOrden(id: number, estado: string): Observable<any> { return this.http.patch<any>(`${this.base}/orden-compra/${id}/estado`, { estado }); }
  eliminarOrden(id: number): Observable<any> { return this.http.delete(`${this.base}/orden-compra/${id}`); }
  obtenerPresupuesto(): Observable<Presupuesto> { return this.http.get<Presupuesto>(`${this.base}/presupuesto`); }
  registrarCompra(c: Compra): Observable<Compra> { return this.http.post<Compra>(`${this.base}/compra`, c); }
}