import { Injectable } from "@angular/core";
import { HttpClient, HttpHeaders } from "@angular/common/http";
import { Observable } from "rxjs";

export interface Cotizacion {
    id?: number;
    codigo?: string;
    cliente: string;
    ruc?: string;
    producto: string;
    cantidad: number;
    precio_unitario: number;
    subtotal?: number;
    descuento_porcentaje?: number;
    descuento_monto?: number;
    total?: number;
    estado?: string;
    usuario_id?: string;
    vendedor?: string;
    fecha_registro?: string;
}

@Injectable({
    providedIn: 'root'
})
export class CotizacionService {
    private apiurl = 'http://localhost:3000/cotizaciones';

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

    listarCotizaciones(): Observable<Cotizacion[]> {
        return this.http.get<Cotizacion[]>(this.apiurl, { headers: this.getHeaders() });
    }

    registrarCotizacion(cotizacion: Cotizacion): Observable<any> {
        return this.http.post<any>(this.apiurl, cotizacion, { headers: this.getHeaders() });
    }

    actualizarEstado(id: number, estado: string): Observable<any> {
        return this.http.patch<any>(`${this.apiurl}/${id}/estado`, { estado }, { headers: this.getHeaders() });
    }
}