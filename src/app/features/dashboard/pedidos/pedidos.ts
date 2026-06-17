// src/app/features/dashboard/pedidos/pedidos.ts
import { Component, OnInit, ChangeDetectorRef, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PedidoService, Pedido } from '../../../core/services/pedido.service';
import { InventarioService, Inventario } from '../../../core/services/inventario.service';
import { AuthService } from '../../../core/services/auth.service';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import jsPDF from 'jspdf';

@Component({
  selector: 'app-pedidos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './pedidos.html',
  styles: [],
  encapsulation: ViewEncapsulation.None
})
export class PedidosComponent implements OnInit {

  private readonly API = 'http://localhost:3000';

  pedidos: Pedido[] = [];
  pedidoSearch = '';
  pedidoFiltroEstado = '';
  loadingPedidos = false;
  loadingAction = false;
  showModal = false;
  modalMode: 'crear' | 'ver' = 'crear';
  pedidoForm: Partial<Pedido> = { cantidad: 1, precio_unitario: 0 };
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

  constructor(
    private pedidoService: PedidoService,
    private inventarioService: InventarioService,
    private authService: AuthService,
    private http: HttpClient,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.usuarioActual = this.authService.getUser();
    this.rolActual = this.authService.getRol();
    this.cargarPedidos();
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
      try { const u = JSON.parse(userStr); token = btoa(`${u.username}:123456`); }
      catch { token = userStr; }
    }
    return new HttpHeaders({ 'Content-Type': 'application/json', 'Authorization': `Basic ${token}` });
  }

  // ── Inventario ───────────────────────────────────────────────────────────
  cargarInventario() {
    this.inventarioService.listarInventario().subscribe({
      next: (data) => {
        this.productosInventario = data.filter(p => p.stock > 0);
        this.productosFiltrados = [...this.productosInventario];
      },
      error: () => {}
    });
  }

  onProductoInput(event: Event) {
    const val = (event.target as HTMLInputElement).value;
    this.productoSearch = val;
    this.pedidoForm.producto = val;
    this.productoSeleccionado = null;
    this.pedidoForm.precio_unitario = 0;
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
    this.pedidoForm.producto = p.producto;
    this.productoSearch = p.producto;
    this.pedidoForm.precio_unitario = p.precioUnitario || p.precio_unitario || 0;
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

  onCantidadChange() {
    this.errorCantidad = '';
    if (!this.productoSeleccionado) return;
    const cant = Number(this.pedidoForm.cantidad);
    if (cant <= 0) { this.errorCantidad = 'La cantidad debe ser mayor a 0.'; return; }
    if (cant > this.productoSeleccionado.stock) {
      this.errorCantidad = `Stock disponible: ${this.productoSeleccionado.stock} ${this.productoSeleccionado.unidad || 'unidades'}`;
    }
  }

  // ── CRUD Pedidos ─────────────────────────────────────────────────────────
  cargarPedidos() {
    this.loadingPedidos = true;
    this.pedidoService.listarPedidos().subscribe({
      next: (data) => { this.pedidos = data; this.loadingPedidos = false; this.cdr.detectChanges(); },
      error: () => { this.loadingPedidos = false; this.showToast('Error al cargar pedidos', 'error'); }
    });
  }

  puedeRegistrar(): boolean { return this.rolActual === 'ADMIN' || this.rolActual === 'VENTAS'; }

  openModalCrear() {
    this.modalMode = 'crear';
    this.pedidoForm = { cantidad: 1, precio_unitario: 0 };
    this.productoSearch = '';
    this.productoSeleccionado = null;
    this.errorCantidad = '';
    this.showDropdownProducto = false;
    this.showModal = true;
  }

  openModalVer(p: Pedido) {
    this.modalMode = 'ver';
    this.pedidoForm = { ...p };
    this.showModal = true;
  }

  closeModal() { this.showModal = false; this.showDropdownProducto = false; }

  guardarPedido() {
    if (!this.pedidoForm.cliente || !this.pedidoForm.producto) {
      this.showToast('Complete cliente y producto', 'error'); return;
    }
    if (this.errorCantidad) { this.showToast(this.errorCantidad, 'error'); return; }
    this.guardando = true;
    const nuevo = {
      cliente: this.pedidoForm.cliente!,
      ruc: this.pedidoForm.ruc || '',
      producto: this.pedidoForm.producto!,
      cantidad: Number(this.pedidoForm.cantidad),
      precio_unitario: Number(this.pedidoForm.precio_unitario),
      usuario_id: this.usuarioActual?.id || null
    };
    this.pedidoService.registrarPedido(nuevo).subscribe({
      next: () => {
        this.guardando = false;
        this.closeModal();
        this.showToast('✅ Pedido registrado exitosamente', 'success');
        this.cargarPedidos();
        this.cargarInventario();
      },
      error: () => { this.guardando = false; this.showToast('Error al registrar pedido', 'error'); }
    });
  }

  cambiarEstado(p: Pedido, estado: string) {
    this.loadingAction = true;
    this.http.patch<any>(`${this.API}/pedidos/${p.id}/estado`, { estado }, { headers: this.getHeaders() }).subscribe({
      next: (res) => {
        const pedidoActualizado: Pedido = res.pedido || res;
        if (res.warning) {
          this.showToast(`Pedido ${pedidoActualizado.codigo} ${estado}. ⚠ ${res.warning}`, 'info');
        } else if (estado === 'APROBADO') {
          let msg = `Pedido ${pedidoActualizado.codigo} aprobado. Stock actualizado.`;
          if (res.bajoPstock) msg += ' ⚠ Stock por debajo del mínimo.';
          this.showToast(msg, 'success');
        } else {
          this.showToast(`Pedido ${pedidoActualizado.codigo} → ${estado}`);
        }
        this.cargarPedidos();
        this.cargarInventario();
        this.loadingAction = false;
      },
      error: (err) => {
        this.showToast(err.error?.error || 'Error al cambiar estado', 'error');
        this.cargarPedidos();
        this.loadingAction = false;
        this.cdr.detectChanges();
      }
    });
  }

  generarVenta(p: Pedido) {
    if (!confirm(`¿Generar venta para el pedido ${p.codigo}?\nCliente: ${p.cliente}\nProducto: ${p.producto} × ${p.cantidad}`)) return;
    this.loadingAction = true;
    this.http.post<any>(`${this.API}/ventas/desde-pedido/${p.id}`, {}, { headers: this.getHeaders() }).subscribe({
      next: (venta) => {
        this.showToast(`✅ Venta ${venta.codigo} generada. Total: S/ ${Number(venta.total).toFixed(2)}`, 'success');
        this.cargarPedidos();
        this.loadingAction = false;
      },
      error: (err) => {
        this.showToast(err.error?.error || 'Error al generar la venta', 'error');
        this.loadingAction = false;
        this.cdr.detectChanges();
      }
    });
  }

  get pedidosFiltrados(): Pedido[] {
    return this.pedidos.filter(p => {
      const search = this.pedidoSearch.toLowerCase();
      const matchSearch = !this.pedidoSearch ||
        p.codigo?.toLowerCase().includes(search) ||
        p.cliente?.toLowerCase().includes(search) ||
        p.producto?.toLowerCase().includes(search) ||
        p.ruc?.toLowerCase().includes(search);
      const matchEstado = !this.pedidoFiltroEstado || p.estado === this.pedidoFiltroEstado;
      return matchSearch && matchEstado;
    });
  }

  getPedidosPendientes(): number { return this.pedidos.filter(p => p.estado === 'PENDIENTE').length; }
  getTotalPedidos(): number { return this.pedidos.reduce((s, p) => s + Number(p.total || 0), 0); }
  formatMoney(n: number): string { return 'S/ ' + Number(n).toLocaleString('es-PE', { minimumFractionDigits: 2 }); }

  getBadgeClass(estado: string): string {
    const map: Record<string, string> = {
      'PENDIENTE': 'badge-orange', 'APROBADO': 'badge-green',
      'RECHAZADO': 'badge-red', 'FACTURADO': 'badge-blue'
    };
    return map[estado] || 'badge-yellow';
  }

  showToast(msg: string, type: 'success' | 'error' | 'info' = 'success') {
    this.toastMsg = msg; this.toastType = type; this.toastVisible = true;
    setTimeout(() => { this.toastVisible = false; this.cdr.detectChanges(); }, 4000);
  }

  generarComprobantePDF(pedido: Partial<Pedido>) {
    const doc = new jsPDF();
    const fecha = pedido.fecha_registro ? new Date(pedido.fecha_registro).toLocaleDateString('es-PE') : new Date().toLocaleDateString('es-PE');
    const azul = [26,54,93] as [number,number,number];
    const grisClaro = [245,247,250] as [number,number,number];
    const grisLinea = [220,220,220] as [number,number,number];
    const verde = [56,161,105] as [number,number,number];
    const negro = [30,30,30] as [number,number,number];

    doc.setFillColor(...azul); doc.rect(0,0,210,35,'F');
    doc.setTextColor(255,255,255); doc.setFontSize(18); doc.setFont('helvetica','bold');
    doc.text('SIDERÚRGICA PERÚ S.A.C.',14,14);
    doc.setFontSize(9); doc.setFont('helvetica','normal');
    doc.text('RUC: 20100012345',14,21); doc.text('Av. Industrial 1234, Lima - Perú',14,27);
    doc.text('Tel: (01) 234-5678  |  ventas@siderurgica.pe',14,33);
    doc.setFillColor(255,255,255); doc.roundedRect(140,8,58,16,3,3,'F');
    doc.setTextColor(...azul); doc.setFontSize(10); doc.setFont('helvetica','bold');
    doc.text('COMPROBANTE DE PAGO',169,18,{align:'center'});
    doc.setFillColor(...grisClaro); doc.rect(0,35,210,22,'F');
    doc.setTextColor(...negro); doc.setFontSize(9); doc.setFont('helvetica','bold');
    doc.text('N° COMPROBANTE:',14,44); doc.text('FECHA:',80,44); doc.text('ESTADO:',150,44);
    doc.setFont('helvetica','normal'); doc.text(pedido.codigo||'—',14,51); doc.text(fecha,80,51);
    const estado = pedido.estado||'PENDIENTE';
    const colorEstado = estado==='APROBADO'?verde:estado==='RECHAZADO'?[229,62,62] as [number,number,number]:[221,107,32] as [number,number,number];
    doc.setFillColor(...colorEstado); doc.roundedRect(150,46,32,7,2,2,'F');
    doc.setTextColor(255,255,255); doc.setFontSize(8); doc.setFont('helvetica','bold');
    doc.text(estado,166,51,{align:'center'});
    let y=68;
    doc.setTextColor(...azul); doc.setFontSize(10); doc.setFont('helvetica','bold');
    doc.text('DATOS DEL CLIENTE',14,y);
    doc.setDrawColor(...grisLinea); doc.line(14,y+2,196,y+2);
    doc.setFillColor(...grisClaro); doc.rect(14,y+4,182,20,'F');
    doc.setTextColor(...negro); doc.setFontSize(9); doc.setFont('helvetica','bold');
    doc.text('CLIENTE:',18,y+12); doc.text('RUC:',110,y+12); doc.text('VENDEDOR:',18,y+19);
    doc.setFont('helvetica','normal');
    doc.text(pedido.cliente||'—',40,y+12); doc.text(pedido.ruc||'—',122,y+12); doc.text(pedido.vendedor||'—',44,y+19);
    y+=32;
    doc.setTextColor(...azul); doc.setFontSize(10); doc.setFont('helvetica','bold');
    doc.text('DETALLE DEL PEDIDO',14,y); doc.line(14,y+2,196,y+2); y+=6;
    doc.setFillColor(...azul); doc.rect(14,y,182,9,'F');
    doc.setTextColor(255,255,255); doc.setFontSize(8); doc.setFont('helvetica','bold');
    doc.text('DESCRIPCIÓN',18,y+6); doc.text('CANT.',120,y+6,{align:'center'});
    doc.text('P. UNIT.',148,y+6,{align:'center'}); doc.text('SUBTOTAL',185,y+6,{align:'right'});
    y+=9;
    doc.setFillColor(255,255,255); doc.rect(14,y,182,12,'F');
    doc.setDrawColor(...grisLinea); doc.rect(14,y,182,12);
    doc.setTextColor(...negro); doc.setFontSize(9); doc.setFont('helvetica','normal');
    doc.text(pedido.producto||'—',18,y+8);
    doc.text(String(pedido.cantidad||0),120,y+8,{align:'center'});
    doc.text(`S/ ${Number(pedido.precio_unitario||0).toFixed(2)}`,148,y+8,{align:'center'});
    doc.text(`S/ ${Number(pedido.subtotal||0).toFixed(2)}`,185,y+8,{align:'right'});
    y+=22;
    doc.setFillColor(...grisClaro); doc.rect(110,y,86,36,'F');
    doc.setDrawColor(...grisLinea); doc.rect(110,y,86,36);
    doc.setTextColor(...negro); doc.setFontSize(9); doc.setFont('helvetica','normal');
    doc.text('Subtotal:',115,y+9); doc.text(`S/ ${Number(pedido.subtotal||0).toFixed(2)}`,193,y+9,{align:'right'});
    doc.text('IGV (18%):',115,y+18); doc.text(`S/ ${Number(pedido.igv||0).toFixed(2)}`,193,y+18,{align:'right'});
    doc.line(115,y+21,193,y+21);
    doc.setFont('helvetica','bold'); doc.setFontSize(11); doc.setTextColor(...azul);
    doc.text('TOTAL:',115,y+30); doc.text(`S/ ${Number(pedido.total||0).toFixed(2)}`,193,y+30,{align:'right'});
    doc.setFillColor(...grisClaro); doc.rect(0,272,210,25,'F');
    doc.setTextColor(120,120,120); doc.setFontSize(8); doc.setFont('helvetica','normal');
    doc.text('Este comprobante es generado electrónicamente — Siderúrgica Perú S.A.C.',105,280,{align:'center'});
    doc.text(`Generado el: ${new Date().toLocaleString('es-PE')}`,105,292,{align:'center'});
    doc.save(`Comprobante_${pedido.codigo}.pdf`);
    this.showToast(`Comprobante ${pedido.codigo} generado en PDF`);
  }
}