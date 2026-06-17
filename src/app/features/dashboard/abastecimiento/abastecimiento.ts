import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface OrdenCompra {
  id: string; proveedor: string; origen: string; producto: string;
  cantidad: string; total: number; fechaEntrega: string;
  estado: 'Aprobada' | 'Pendiente' | 'En tránsito';
}

@Component({
  selector: 'app-abastecimiento',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './abastecimiento.html',
   styles: []
})
export class AbastecimientoComponent {

  ordenes: OrdenCompra[] = [
    { id: '#OC-0421', proveedor: 'SIDERPERU S.A.', origen: 'Lima, Perú', producto: 'Acero A36 — Lote 50 TM', cantidad: '50 TM', total: 210000, fechaEntrega: '28 Jul 2025', estado: 'Aprobada' },
    { id: '#OC-0420', proveedor: 'Aceros Arequipa', origen: 'Arequipa, Perú', producto: 'Barras corrugadas 3/4"', cantidad: '30 TM', total: 114000, fechaEntrega: '02 Ago 2025', estado: 'Pendiente' },
    { id: '#OC-0419', proveedor: 'MetalPro Export', origen: 'Bogotá, Colombia', producto: 'Perfiles H 8x8 importados', cantidad: '80 TM', total: 408000, fechaEntrega: '15 Ago 2025', estado: 'En tránsito' },
  ];

  abastSearch = ''; abastFiltroEstado = '';
  showModal = false; modalMode: 'crear' | 'editar' | 'eliminar' = 'crear';
  ordenForm: Partial<OrdenCompra> = {}; deleteTarget: OrdenCompra | null = null;
  toastMsg = ''; toastType: 'success' | 'error' | 'info' = 'success'; toastVisible = false;

  openModalCrear() { this.modalMode = 'crear'; this.ordenForm = { estado: 'Pendiente' }; this.showModal = true; }
  openModalEditar(o: OrdenCompra) { this.modalMode = 'editar'; this.ordenForm = { ...o }; this.showModal = true; }
  pedirEliminar(o: OrdenCompra) { this.deleteTarget = o; this.modalMode = 'eliminar'; this.showModal = true; }
  closeModal() { this.showModal = false; this.deleteTarget = null; }

  guardarOrden() {
    if (!this.ordenForm.proveedor || !this.ordenForm.producto) { this.showToast('Complete los campos requeridos', 'error'); return; }
    if (this.modalMode === 'crear') {
      this.ordenes.unshift({ id: `#OC-0${422 + this.ordenes.length}`, proveedor: this.ordenForm.proveedor!, origen: this.ordenForm.origen || '—', producto: this.ordenForm.producto!, cantidad: this.ordenForm.cantidad || '—', total: this.ordenForm.total || 0, fechaEntrega: this.ordenForm.fechaEntrega || '—', estado: 'Pendiente' });
      this.showToast('Orden de compra creada');
    } else {
      const idx = this.ordenes.findIndex(o => o.id === this.ordenForm.id);
      if (idx !== -1) this.ordenes[idx] = { ...this.ordenes[idx], ...this.ordenForm } as OrdenCompra;
      this.showToast('Orden actualizada');
    }
    this.closeModal();
  }

  confirmarEliminar() { this.ordenes = this.ordenes.filter(o => o !== this.deleteTarget); this.showToast('Orden eliminada'); this.closeModal(); }
  cambiarEstado(o: OrdenCompra, estado: OrdenCompra['estado']) { o.estado = estado; this.showToast(`Orden ${o.id} → ${estado}`); }

  get ordenesFiltradas(): OrdenCompra[] {
    return this.ordenes.filter(o => {
      const matchSearch = !this.abastSearch || o.proveedor.toLowerCase().includes(this.abastSearch.toLowerCase()) || o.id.toLowerCase().includes(this.abastSearch.toLowerCase());
      return matchSearch && (!this.abastFiltroEstado || o.estado === this.abastFiltroEstado);
    });
  }

  formatMoney(n: number): string { return 'S/ ' + n.toLocaleString('es-PE'); }
  getBadgeClass(estado: string): string {
    const map: Record<string, string> = { 'Aprobada': 'badge-green', 'Pendiente': 'badge-orange', 'En tránsito': 'badge-blue' };
    return map[estado] || 'badge-yellow';
  }
  showToast(msg: string, type: 'success' | 'error' | 'info' = 'success') { this.toastMsg = msg; this.toastType = type; this.toastVisible = true; setTimeout(() => this.toastVisible = false, 3000); }
}