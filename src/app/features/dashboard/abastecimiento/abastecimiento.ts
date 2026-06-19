import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AbastecimientoService, Presupuesto } from '../../../core/services/abastecimiento.service';
import { ProveedorService, Proveedor } from '../../../core/services/proveedor.service';
import { InventarioService, Inventario } from '../../../core/services/inventario.service';

export interface OrdenCompra {
  id?: number;
  codigo?: string;
  proveedorId: number;
  producto: string;
  cantidad?: string;
  total: number;
  fechaEntrega?: string;
  estado?: 'Aprobada' | 'Pendiente' | 'En tránsito' | 'Rechazada';
  _open?: boolean;
}

@Component({
  selector: 'app-abastecimiento',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './abastecimiento.html',
  styles: []
})
export class AbastecimientoComponent implements OnInit {
  ordenes: OrdenCompra[] = [];
  proveedores: Proveedor[] = [];
  inventarios: Inventario[] = [];
  presupuesto: Presupuesto | null = null;

  abastSearch = ''; abastFiltroEstado = '';
  showModal = false; modalMode: 'crear' | 'editar' | 'eliminar' | 'compra' = 'crear';
  ordenForm: Partial<OrdenCompra> = {};
  compraForm: { inventarioId?: number; cantidad?: number; precioUnitario?: number } = {};
  deleteTarget: OrdenCompra | null = null;
  ordenActivaCompra: OrdenCompra | null = null;
  toastMsg = ''; toastType: 'success'|'error'|'info' = 'success'; toastVisible = false;

  constructor(
    private abastService: AbastecimientoService,
    private proveedorService: ProveedorService,
    private inventarioService: InventarioService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.proveedorService.listar().subscribe(p => {
      this.proveedores = p;
      this.cdr.detectChanges();
      this.cargarOrdenes();
    });
    this.cargarPresupuesto();
    this.inventarioService.listarInventario().subscribe(i => this.inventarios = i);
  }

  cargarOrdenes() {
    this.abastService.listarOrdenes().subscribe(o => {
      this.ordenes = o;
      this.cdr.detectChanges();
    });
  }

  cargarPresupuesto() {
    this.abastService.obtenerPresupuesto().subscribe(p => {
      this.presupuesto = p;
      this.cdr.detectChanges();
    });
  }

  nombreProveedor(id: number): string {
    return this.proveedores.find(p => p.id === id)?.nombre || '—';
  }

  openModalCrear() { this.modalMode = 'crear'; this.ordenForm = { estado: 'Pendiente' }; this.showModal = true; }
  openModalEditar(o: OrdenCompra) { this.modalMode = 'editar'; this.ordenForm = { ...o }; this.showModal = true; }
  pedirEliminar(o: OrdenCompra) { this.deleteTarget = o; this.modalMode = 'eliminar'; this.showModal = true; }
  abrirRegistrarCompra(o: OrdenCompra) { this.ordenActivaCompra = o; this.compraForm = {}; this.modalMode = 'compra'; this.showModal = true; }
  closeModal() { this.showModal = false; this.deleteTarget = null; this.ordenActivaCompra = null; }

  guardarOrden() {
    if (!this.ordenForm.proveedorId || !this.ordenForm.producto) { this.showToast('Complete los campos requeridos', 'error'); return; }
    if (this.modalMode === 'crear') {
      this.abastService.crearOrden(this.ordenForm as OrdenCompra).subscribe({
        next: () => { this.showToast('Orden de compra creada'); this.cargarOrdenes(); this.cargarPresupuesto(); this.closeModal(); },
        error: err => this.showToast(err.error?.message || 'Capital insuficiente', 'error')
      });
    } else {
      const idx = this.ordenes.findIndex(o => o.id === this.ordenForm.id);
      if (idx !== -1) this.ordenes[idx] = { ...this.ordenes[idx], ...this.ordenForm } as OrdenCompra;
      this.showToast('Orden actualizada'); this.closeModal();
    }
  }

  registrarCompra() {
    if (!this.ordenActivaCompra || !this.compraForm.cantidad || !this.compraForm.precioUnitario) { this.showToast('Complete cantidad y precio unitario', 'error'); return; }
    const o = this.ordenActivaCompra;
    this.abastService.registrarCompra({
      ordenCompraId: o.id, proveedorId: o.proveedorId, inventarioId: this.compraForm.inventarioId,
      producto: o.producto, cantidad: this.compraForm.cantidad, precioUnitario: this.compraForm.precioUnitario,
      total: this.compraForm.cantidad * this.compraForm.precioUnitario
    }).subscribe({
      next: () => { this.showToast('Compra registrada, stock actualizado'); this.closeModal(); },
      error: err => this.showToast(err.error?.message || 'Error al registrar compra', 'error')
    });
  }

  confirmarEliminar() {
    if (!this.deleteTarget?.id) return;
    this.abastService.eliminarOrden(this.deleteTarget.id).subscribe(() => {
      this.cargarOrdenes(); this.cargarPresupuesto(); this.showToast('Orden eliminada'); this.closeModal();
    });
  }

  cambiarEstado(o: OrdenCompra, estado: string) {
    if (!o.id) return;
    this.abastService.cambiarEstadoOrden(o.id, estado).subscribe({
      next: () => {
        o.estado = estado as OrdenCompra['estado'];
        o._open = false;
        this.showToast(`Orden ${o.codigo} → ${estado}`);
        this.cargarOrdenes();
        this.cargarPresupuesto();
      },
      error: err => this.showToast(err.error?.message || 'Error al cambiar estado', 'error')
    });
  }

  get ordenesFiltradas(): OrdenCompra[] {
    return this.ordenes.filter(o => {
      const matchSearch = !this.abastSearch ||
        this.nombreProveedor(o.proveedorId).toLowerCase().includes(this.abastSearch.toLowerCase()) ||
        (o.codigo || '').toLowerCase().includes(this.abastSearch.toLowerCase());
      return matchSearch && (!this.abastFiltroEstado || o.estado === this.abastFiltroEstado);
    });
  }

  formatMoney(n: number): string { return 'S/ ' + (n || 0).toLocaleString('es-PE'); }

  getBadgeClass(estado: string): string {
    const map: Record<string, string> = {
      'Aprobada': 'badge-green', 'Pendiente': 'badge-orange',
      'En tránsito': 'badge-blue', 'Rechazada': 'badge-red'
    };
    return map[estado] || 'badge-yellow';
  }

  showToast(msg: string, type: 'success'|'error'|'info' = 'success') {
    this.toastMsg = msg; this.toastType = type; this.toastVisible = true;
    setTimeout(() => this.toastVisible = false, 3000);
  }
}