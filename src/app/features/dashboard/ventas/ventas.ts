// src/app/features/dashboard/ventas/ventas.ts
import { Component, OnInit, ChangeDetectorRef, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AuthService } from '../../../core/services/auth.service';

export interface Venta {
  id?: number;
  codigo?: string;
  cliente: string;
  ruc: string;
  producto: string;
  cantidad: number;
  precioUnitario?: number;
  precio_unitario?: number;
  subtotal?: number;
  igv?: number;
  total?: number;
  vendedor?: string;
  estado?: string;
  fechaVenta?: string;
  pedidoId?: number;
  cotizacionId?: number;
  createdAt?: string;
}

@Component({
  selector: 'app-ventas',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './ventas.html',
  styles: [],
  encapsulation: ViewEncapsulation.None
})
export class VentasComponent implements OnInit {

  private readonly API = 'http://localhost:3000';

  ventas: Venta[] = [];
  ventaSearch = '';
  ventaFiltroEstado = '';
  loadingVentas = false;
  loadingAction = false;

  showModal = false;
  modalMode: 'crear' | 'ver' | 'eliminar' = 'crear';
  ventaForm: Partial<Venta> = {};
  deleteTarget: Venta | null = null;

  guardando = false;
  toastMsg = '';
  toastType: 'success' | 'error' | 'info' = 'success';
  toastVisible = false;

  usuarioActual: any = null;
  rolActual: string | null = null;

  constructor(
    private http: HttpClient,
    private authService: AuthService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.usuarioActual = this.authService.getUser();
    this.rolActual = this.authService.getRol();
    this.cargarVentas();
  }

  // ── Headers Basic Auth ────────────────────────────────────────────────────
  private getHeaders(): HttpHeaders {
    const userStr = localStorage.getItem('erp_user');
    let token = '';
    if (userStr) {
      try {
        const u = JSON.parse(userStr);
        token = btoa(`${u.username}:${u.password}`);
      } catch {
        token = userStr;
      }
    }
    return new HttpHeaders({ 'Content-Type': 'application/json', 'Authorization': `Basic ${token}` });
  }

  // ── Cargar ventas desde backend ───────────────────────────────────────────
  cargarVentas() {
    this.loadingVentas = true;
    this.http.get<Venta[]>(`${this.API}/ventas`, { headers: this.getHeaders() }).subscribe({
      next: (data) => {
        this.ventas = data;
        this.loadingVentas = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.loadingVentas = false;
        this.showToast('Error al cargar ventas', 'error');
      }
    });
  }

  // ── Generar Venta desde un Pedido APROBADO ────────────────────────────────
  // Llamado desde pedidos.ts o desde un botón externo vía referencia
  generarVentaDesdePedido(pedidoId: number, pedidoCodigo: string) {
    if (!confirm(`¿Generar venta para el pedido ${pedidoCodigo}?`)) return;
    this.loadingAction = true;
    this.http.post<Venta>(
      `${this.API}/ventas/desde-pedido/${pedidoId}`, {},
      { headers: this.getHeaders() }
    ).subscribe({
      next: (venta) => {
        this.showToast(`✅ Venta ${venta.codigo} generada. Total: S/ ${Number(venta.total).toFixed(2)}`, 'success');
        this.cargarVentas();
        this.loadingAction = false;
      },
      error: (err) => {
        this.showToast(err.error?.error || 'Error al generar la venta', 'error');
        this.loadingAction = false;
        this.cdr.detectChanges();
      }
    });
  }

  // ── Cambiar estado de una venta ───────────────────────────────────────────
  cambiarEstado(v: Venta, estado: string) {
    this.http.patch<Venta>(
      `${this.API}/ventas/${v.id}/estado`, { estado },
      { headers: this.getHeaders() }
    ).subscribe({
      next: (actualizada) => {
        v.estado = actualizada.estado;
        this.showToast(`Venta ${v.codigo} → ${estado}`);
        this.cargarVentas();
      },
      error: (err) => this.showToast(err.error?.error || 'Error al cambiar estado', 'error')
    });
  }

  // ── Generar Despacho desde una Venta APROBADO ─────────────────────────────
  generarDespacho(v: Venta) {
    if (!confirm(`¿Generar despacho para la venta ${v.codigo}?`)) return;
    this.loadingAction = true;
    this.http.post<any>(
      `${this.API}/despachos/desde-venta/${v.id}`, {},
      { headers: this.getHeaders() }
    ).subscribe({
      next: (despacho) => {
        this.showToast(`✅ Despacho ${despacho.codigo} generado correctamente`, 'success');
        this.cargarVentas();
        this.loadingAction = false;
      },
      error: (err) => {
        this.showToast(err.error?.error || 'Error al generar el despacho', 'error');
        this.loadingAction = false;
        this.cdr.detectChanges();
      }
    });
  }

  // ── Aprobar venta directamente ────────────────────────────────────────────
  aprobarVenta(v: Venta) {
    if (!confirm(`¿Aprobar la venta ${v.codigo}?`)) return;
    this.cambiarEstado(v, 'APROBADO');
  }

  anularVenta(v: Venta) {
    if (!confirm(`¿Anular la venta ${v.codigo}? Esta acción no se puede deshacer.`)) return;
    this.cambiarEstado(v, 'ANULADO');
  }

  // ── Modal ─────────────────────────────────────────────────────────────────
  openModalVer(v: Venta) { this.modalMode = 'ver'; this.ventaForm = { ...v }; this.showModal = true; }
  pedirEliminar(v: Venta) { this.modalMode = 'eliminar'; this.deleteTarget = v; this.showModal = true; }
  closeModal() { this.showModal = false; this.deleteTarget = null; }

  // ── Filtros y utilidades ──────────────────────────────────────────────────
  get ventasFiltradas(): Venta[] {
    return this.ventas.filter(v => {
      const s = this.ventaSearch.toLowerCase();
      const matchSearch = !this.ventaSearch ||
        v.codigo?.toLowerCase().includes(s) ||
        v.cliente?.toLowerCase().includes(s) ||
        v.producto?.toLowerCase().includes(s) ||
        v.ruc?.toLowerCase().includes(s);
      const matchEstado = !this.ventaFiltroEstado || v.estado === this.ventaFiltroEstado;
      return matchSearch && matchEstado;
    });
  }

  getVentasTotales(): number { return this.ventas.reduce((s, v) => s + Number(v.total || 0), 0); }
  getVentasPendientes(): number { return this.ventas.filter(v => v.estado === 'PENDIENTE').length; }
  getVentasAprobadas(): number { return this.ventas.filter(v => v.estado === 'APROBADO').length; }
  getVentasCompletadas(): number { return this.ventas.filter(v => v.estado === 'COMPLETADO').length; }

  formatMoney(n: number): string { return 'S/ ' + Number(n).toLocaleString('es-PE', { minimumFractionDigits: 2 }); }
  formatDate(d?: string): string {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }

  getBadgeClass(estado: string): string {
    const map: Record<string, string> = {
      'PENDIENTE':  'badge-orange',
      'APROBADO':   'badge-green',
      'COMPLETADO': 'badge-blue',
      'ANULADO':    'badge-red',
    };
    return map[estado] || 'badge-yellow';
  }

  showToast(msg: string, type: 'success' | 'error' | 'info' = 'success') {
    this.toastMsg = msg; this.toastType = type; this.toastVisible = true;
    setTimeout(() => { this.toastVisible = false; this.cdr.detectChanges(); }, 4000);
  }
}