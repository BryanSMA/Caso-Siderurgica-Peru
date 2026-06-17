// src/app/features/dashboard/cotizaciones/cotizaciones.ts
import { Component, OnInit, ChangeDetectorRef, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { CotizacionService, Cotizacion } from '../../../core/services/cotizacion.service';
import { InventarioService, Inventario } from '../../../core/services/inventario.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-cotizaciones',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './cotizaciones.html',
  styles: [],
  encapsulation: ViewEncapsulation.None
})
export class CotizacionesComponent implements OnInit {

  private readonly API = 'http://localhost:3000';

  cotizaciones: Cotizacion[] = [];
  cotizacionSearch = '';
  cotizacionFiltroEstado = '';
  loadingCotizaciones = false;
  loadingAction = false;
  showModal = false;
  modalMode: 'crear' | 'ver' | 'confirmar' = 'crear';
  cotizacionForm: Partial<Cotizacion> = { cantidad: 1, precio_unitario: 0 };
  guardando = false;
  toastMsg = '';
  toastType: 'success' | 'error' | 'info' = 'success';
  toastVisible = false;
  usuarioActual: any = null;
  rolActual: string | null = null;

  // ── Inventario / dropdown ────────────────────────────────────────────────
  productosInventario: Inventario[] = [];
  productosFiltrados: Inventario[] = [];
  productoSearch = '';
  showDropdownProducto = false;
  productoSeleccionado: Inventario | null = null;
  errorCantidad = '';

  // ── Cotización recién guardada para ofrecer conversión ────────────────────
  cotizacionGuardada: Cotizacion | null = null;

  constructor(
    private cotizacionService: CotizacionService,
    private inventarioService: InventarioService,
    private authService: AuthService,
    private http: HttpClient,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.usuarioActual = this.authService.getUser();
    this.rolActual = this.authService.getRol();
    this.cargarCotizaciones();
    this.cargarInventario();
    document.addEventListener('click', () => {
      this.showDropdownProducto = false;
      this.cdr.detectChanges();
    });
  }

  private getHeaders(): HttpHeaders {
    const userStr = localStorage.getItem('erp_user');
    let token = '';
    if (userStr) {
      try {
        const u = JSON.parse(userStr);
        token = btoa(`${u.username}:123456`);
      } catch { token = userStr; }
    }
    return new HttpHeaders({ 'Content-Type': 'application/json', 'Authorization': `Basic ${token}` });
  }

  // ── Cargar inventario ────────────────────────────────────────────────────
  cargarInventario() {
    this.inventarioService.listarInventario().subscribe({
      next: (data) => {
        // Solo productos con stock > 0
        this.productosInventario = data.filter(p => p.stock > 0);
        this.productosFiltrados = [...this.productosInventario];
      },
      error: () => {}
    });
  }

  // ── Dropdown producto ────────────────────────────────────────────────────
  onProductoInput(event: Event) {
    const val = (event.target as HTMLInputElement).value;
    this.productoSearch = val;
    this.cotizacionForm.producto = val;
    this.productoSeleccionado = null;
    this.cotizacionForm.precio_unitario = 0;
    this.errorCantidad = '';

    this.productosFiltrados = this.productosInventario.filter(p =>
      p.producto.toLowerCase().includes(val.toLowerCase()) ||
      (p.categoria || '').toLowerCase().includes(val.toLowerCase())
    );
    this.showDropdownProducto = this.productosFiltrados.length > 0;
    this.cdr.detectChanges();
  }

  seleccionarProducto(p: Inventario, event: Event) {
    event.stopPropagation();
    this.productoSeleccionado = p;
    this.cotizacionForm.producto = p.producto;
    this.productoSearch = p.producto;
    // Precio fijo del inventario
    this.cotizacionForm.precio_unitario = p.precioUnitario || p.precio_unitario || 0;
    this.showDropdownProducto = false;
    this.errorCantidad = '';
    this.cdr.detectChanges();
  }

  onAbrirDropdown(event: Event) {
    event.stopPropagation();
    this.productosFiltrados = this.productosInventario.filter(p =>
      !this.productoSearch || p.producto.toLowerCase().includes(this.productoSearch.toLowerCase())
    );
    this.showDropdownProducto = true;
    this.cdr.detectChanges();
  }

  // ── Validar cantidad contra stock ────────────────────────────────────────
  onCantidadChange() {
    this.errorCantidad = '';
    if (!this.productoSeleccionado) return;
    const cant = Number(this.cotizacionForm.cantidad);
    if (cant <= 0) { this.errorCantidad = 'La cantidad debe ser mayor a 0.'; return; }
    if (cant > this.productoSeleccionado.stock) {
      this.errorCantidad = `Stock disponible: ${this.productoSeleccionado.stock} ${this.productoSeleccionado.unidad || 'unidades'}`;
    }
  }

  // ── CRUD Cotizaciones ────────────────────────────────────────────────────
  cargarCotizaciones() {
    this.loadingCotizaciones = true;
    this.cotizacionService.listarCotizaciones().subscribe({
      next: (data) => { this.cotizaciones = data; this.loadingCotizaciones = false; this.cdr.detectChanges(); },
      error: () => { this.loadingCotizaciones = false; this.showToast('Error al cargar cotizaciones', 'error'); }
    });
  }

  puedeRegistrar(): boolean { return this.rolActual === 'ADMIN' || this.rolActual === 'VENTAS'; }

  openModalCrear() {
    this.modalMode = 'crear';
    this.cotizacionForm = { cantidad: 1, precio_unitario: 0 };
    this.productoSearch = '';
    this.productoSeleccionado = null;
    this.errorCantidad = '';
    this.showDropdownProducto = false;
    this.showModal = true;
  }

  openModalVer(c: Cotizacion) {
    this.modalMode = 'ver';
    this.cotizacionForm = { ...c };
    this.showModal = true;
  }

  closeModal() {
    this.showModal = false;
    this.cotizacionGuardada = null;
    this.showDropdownProducto = false;
  }

  guardarCotizacion() {
    if (!this.cotizacionForm.cliente || !this.cotizacionForm.producto) {
      this.showToast('Complete cliente y producto', 'error'); return;
    }
    if (this.errorCantidad) {
      this.showToast(this.errorCantidad, 'error'); return;
    }
    this.guardando = true;
    const nueva = {
      cliente: this.cotizacionForm.cliente!,
      ruc: this.cotizacionForm.ruc || '',
      producto: this.cotizacionForm.producto!,
      cantidad: Number(this.cotizacionForm.cantidad),
      precio_unitario: Number(this.cotizacionForm.precio_unitario),
      usuario_id: this.usuarioActual?.id || null
    };
    this.cotizacionService.registrarCotizacion(nueva).subscribe({
      next: (res) => {
        this.guardando = false;
        // Guardar la cotización creada y mostrar modal de confirmación
        const cotCreada: Cotizacion = res.cotizacion || { ...nueva, codigo: res.codigo, id: res.id, estado: 'PENDIENTE' };
        this.cotizacionGuardada = cotCreada;
        this.modalMode = 'confirmar';
        this.cargarCotizaciones();
        this.cargarInventario();
      },
      error: () => { this.guardando = false; this.showToast('Error al registrar cotización', 'error'); }
    });
  }

  cambiarEstado(c: any, estado: string) {
    this.cotizacionService.actualizarEstado(c.id, estado).subscribe({
      next: () => { this.showToast(`Cotización ${c.codigo} → ${estado}`); this.cargarCotizaciones(); },
      error: () => this.showToast('Error al cambiar estado', 'error')
    });
  }

  // ── Convertir a pedido ───────────────────────────────────────────────────
  convertirAPedido(c: Cotizacion) {
    this.loadingAction = true;
    this.http.post<any>(
      `${this.API}/cotizaciones/${c.id}/convertir-pedido`,
      {},
      { headers: this.getHeaders() }
    ).subscribe({
      next: (res) => {
        const pedidoCodigo = res.pedido?.codigo || res.codigo || '—';
        this.showToast(`✅ Pedido ${pedidoCodigo} creado desde cotización ${c.codigo}`, 'success');
        this.cargarCotizaciones();
        this.loadingAction = false;
        this.closeModal();
      },
      error: (err) => {
        this.showToast(err.error?.error || 'Error al convertir cotización', 'error');
        this.loadingAction = false;
        this.cdr.detectChanges();
      }
    });
  }

  convertirDesdeModal() {
    if (this.cotizacionForm?.id) {
      this.convertirAPedido(this.cotizacionForm as Cotizacion);
    }
  }

  convertirGuardada() {
    if (this.cotizacionGuardada?.id) {
      this.convertirAPedido(this.cotizacionGuardada);
    } else {
      // Si no tenemos id aún, recargamos y buscamos por código
      this.cargarCotizaciones();
      this.closeModal();
      this.showToast('Cotización registrada. Apruébala para convertir a pedido.', 'info');
    }
  }

  // ── Filtros ───────────────────────────────────────────────────────────────
  get cotizacionesFiltradas(): Cotizacion[] {
    return this.cotizaciones.filter(c => {
      const search = this.cotizacionSearch.toLowerCase();
      const matchSearch = !this.cotizacionSearch ||
        c.codigo?.toLowerCase().includes(search) ||
        c.cliente?.toLowerCase().includes(search) ||
        c.producto?.toLowerCase().includes(search) ||
        c.ruc?.toLowerCase().includes(search);
      const matchEstado = !this.cotizacionFiltroEstado || c.estado === this.cotizacionFiltroEstado;
      return matchSearch && matchEstado;
    });
  }

  getCotizacionesPendientes(): number { return this.cotizaciones.filter(c => c.estado === 'PENDIENTE').length; }
  getTotalCotizado(): number { return this.cotizaciones.reduce((s, c) => s + Number(c.total || 0), 0); }
  formatMoney(n: number): string { return 'S/ ' + Number(n).toLocaleString('es-PE', { minimumFractionDigits: 2 }); }

  getBadgeClass(estado: string): string {
    const map: Record<string, string> = {
      'PENDIENTE': 'badge-orange', 'APROBADA': 'badge-green',
      'RECHAZADA': 'badge-red', 'CONVERTIDA': 'badge-blue'
    };
    return map[estado] || 'badge-yellow';
  }

  showToast(msg: string, type: 'success' | 'error' | 'info' = 'success') {
    this.toastMsg = msg; this.toastType = type; this.toastVisible = true;
    setTimeout(() => { this.toastVisible = false; this.cdr.detectChanges(); }, 4000);
  }
}
