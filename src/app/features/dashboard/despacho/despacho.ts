import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface Despacho {
  guia: string; cliente: string; direccion: string; producto: string;
  peso: string; transportista: string; estado: 'Entregado' | 'Enviado' | 'Pendiente';
}

@Component({
  selector: 'app-despacho',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './despacho.html',
  styles: []
})
export class DespachoComponent {

  despachos: Despacho[] = [
    { guia: '#GUI-1842', cliente: 'Constructora Lima S.A.', direccion: 'Av. Javier Prado 4200', producto: 'Acero A36', peso: '12 TM', transportista: 'Fletes Andes SAC', estado: 'Entregado' },
    { guia: '#GUI-1841', cliente: 'Minera Andina Corp.', direccion: 'Carretera Central Km 45', producto: 'Barras 3/4"', peso: '5 TM', transportista: 'TransMetro Perú', estado: 'Enviado' },
    { guia: '#GUI-1840', cliente: 'Infraestructura Sur SAC', direccion: 'Av. Separadora Industrial', producto: 'Perfiles H', peso: '20 TM', transportista: 'Fletes Andes SAC', estado: 'Pendiente' },
  ];

  despachoSearch = '';
  despachoFiltroEstado = '';
  showModal = false;
  modalMode: 'crear' | 'editar' | 'eliminar' = 'crear';
  despachoForm: Partial<Despacho> = {};
  deleteTarget: Despacho | null = null;
  toastMsg = ''; toastType: 'success' | 'error' = 'success'; toastVisible = false;

  get despachosFiltrados(): Despacho[] {
    return this.despachos.filter(d => {
      const matchSearch = !this.despachoSearch ||
        d.cliente.toLowerCase().includes(this.despachoSearch.toLowerCase()) ||
        d.guia.toLowerCase().includes(this.despachoSearch.toLowerCase());
      const matchEstado = !this.despachoFiltroEstado || d.estado === this.despachoFiltroEstado;
      return matchSearch && matchEstado;
    });
  }

  getBadgeClass(estado: string): string {
    const map: Record<string, string> = {
      'Entregado': 'badge-green', 'Enviado': 'badge-blue', 'Pendiente': 'badge-orange'
    };
    return map[estado] || 'badge-yellow';
  }

  openModalCrear() { this.modalMode = 'crear'; this.despachoForm = { estado: 'Pendiente' }; this.showModal = true; }
  openModalEditar(d: Despacho) { this.modalMode = 'editar'; this.despachoForm = { ...d }; this.showModal = true; }
  pedirEliminar(d: Despacho) { this.modalMode = 'eliminar'; this.deleteTarget = d; this.showModal = true; }
  closeModal() { this.showModal = false; this.deleteTarget = null; }

  guardarDespacho() {
    if (!this.despachoForm.cliente || !this.despachoForm.producto) { this.showToast('Complete los campos requeridos', 'error'); return; }
    if (this.modalMode === 'crear') {
      const nuevo: Despacho = {
        guia: `#GUI-${1843 + this.despachos.length}`, cliente: this.despachoForm.cliente!,
        direccion: this.despachoForm.direccion || '—', producto: this.despachoForm.producto!,
        peso: this.despachoForm.peso || '—', transportista: this.despachoForm.transportista || '—',
        estado: 'Pendiente',
      };
      this.despachos.unshift(nuevo);
      this.showToast('Despacho registrado');
    } else {
      const idx = this.despachos.findIndex(d => d.guia === this.despachoForm.guia);
      if (idx !== -1) this.despachos[idx] = { ...this.despachos[idx], ...this.despachoForm } as Despacho;
      this.showToast('Despacho actualizado');
    }
    this.closeModal();
  }

  cambiarEstado(d: Despacho, estado: Despacho['estado']) { d.estado = estado; this.showToast(`Guía ${d.guia} → ${estado}`); }
  confirmarEntrega(d: Despacho) { d.estado = 'Entregado'; this.showToast(`Entrega confirmada: ${d.guia}`); }

  confirmarEliminar() {
    if (this.deleteTarget) { this.despachos = this.despachos.filter(d => d !== this.deleteTarget); this.showToast('Despacho eliminado'); }
    this.closeModal();
  }

  showToast(msg: string, type: 'success' | 'error' = 'success') {
    this.toastMsg = msg; this.toastType = type; this.toastVisible = true;
    setTimeout(() => this.toastVisible = false, 3000);
  }
}