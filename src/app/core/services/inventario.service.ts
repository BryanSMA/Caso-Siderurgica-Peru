import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

// ─────────────────────────────────────────
// Interface — igual estructura que el backend
// ─────────────────────────────────────────
export interface Inventario {
  id?:                number;
  producto:           string;
  categoria?:         string;
  stock:              number;
  stock_minimo?:      number;
  stockMinimo?:       number;
  precio_unitario?:   number;
  precioUnitario?:    number;
  unidad?:            string;
  fecha_actualizacion?: string;
  fechaActualizacion?:  string;
  // HU11 — calculado por el backend
  bajoStock?:         boolean;
}

export interface BajoStockResponse {
  total:     number;
  productos: Inventario[];
}

@Injectable({ providedIn: 'root' })
export class InventarioService {

  private url = 'http://localhost:3000/inventario';

  constructor(private http: HttpClient) {}

  // Reutiliza el mismo patrón de auth que tus otros services
  private getHeaders(): HttpHeaders {
    const user = JSON.parse(localStorage.getItem('erp_user') || '{}');
    const credentials = btoa(`${user.username}:123456`);
    return new HttpHeaders({ Authorization: `Basic ${credentials}` });
  }

  // ─────────────────────────────────────────
  // HU09 — Visualizar stock disponible
  // ─────────────────────────────────────────

  listarInventario(): Observable<Inventario[]> {
    return this.http.get<Inventario[]>(this.url, { headers: this.getHeaders() });
  }

  buscarPorId(id: number): Observable<Inventario> {
    return this.http.get<Inventario>(`${this.url}/${id}`, { headers: this.getHeaders() });
  }

  // ─────────────────────────────────────────
  // HU10 — Actualizar inventario
  // ─────────────────────────────────────────

  crearProducto(inv: Inventario): Observable<any> {
    return this.http.post<any>(this.url, inv, { headers: this.getHeaders() });
  }

  actualizarProducto(id: number, inv: Inventario): Observable<any> {
    return this.http.put<any>(`${this.url}/${id}`, inv, { headers: this.getHeaders() });
  }

  // ENTRADA o SALIDA de stock
  actualizarStock(id: number, cantidad: number, tipo: 'ENTRADA' | 'SALIDA'): Observable<any> {
    return this.http.patch<any>(
      `${this.url}/${id}/stock`,
      { cantidad, tipo },
      { headers: this.getHeaders() }
    );
  }

  // ─────────────────────────────────────────
  // HU11 — Alertar bajo stock
  // ─────────────────────────────────────────

  listarBajoStock(): Observable<BajoStockResponse> {
    return this.http.get<BajoStockResponse>(
      `${this.url}/bajo-stock`,
      { headers: this.getHeaders() }
    );
  }

  obtenerValorTotal(): Observable<any> {
  return this.http.get(`${this.url}/valor-total`, { headers: this.getHeaders() });
}
}
