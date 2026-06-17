import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface Proveedor {
  nombre: string;
  origen: string;
  ruc: string;
  contacto: string;
  telefono: string;
  categoria: string;
  calificacion: number;
  estado: 'Activo' | 'Inactivo';
}

@Component({
  selector: 'app-proveedores',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './proveedores.html',
  styles: []
})
export class ProveedoresComponent {

  proveedores: Proveedor[] = [
    { nombre: 'SIDERPERU S.A.', origen: 'Lima, Perú', ruc: '20123456789', contacto: 'Ing. Carlos Flores', telefono: '+51 1 611-4000', categoria: 'Acero primario', calificacion: 4.8, estado: 'Activo' },
    { nombre: 'Aceros Arequipa', origen: 'Arequipa, Perú', ruc: '20234567890', contacto: 'Lic. Rosa Quispe', telefono: '+51 54 381-000', categoria: 'Barras y perfiles', calificacion: 4.5, estado: 'Activo' },
    { nombre: 'MetalPro Export', origen: 'Bogotá, Colombia', ruc: 'NIT-9001234', contacto: 'Mr. Andrés Vargas', telefono: '+57 1 300-1234', categoria: 'Perfiles importados', calificacion: 3.9, estado: 'Activo' },
  ];

  // ── Búsqueda y Filtros ──
  provSearch = '';
  provFiltroEstado = '';

  // ── Modal ──
  showModal = false;
  modalMode: 'crear' | 'editar' | 'ver' | 'eliminar' = 'crear';
  proveedorForm: Partial<Proveedor> = {};
  deleteTarget: Proveedor | null = null;

  // ── Toast ──
  toastMsg = '';
  toastType: 'success' | 'error' | 'info' = 'success';
  toastVisible = false;

  // ── Filtro ──
  get proveedoresFiltrados(): Proveedor[] {
    return this.proveedores.filter(p => {
      const matchSearch = !this.provSearch ||
        p.nombre.toLowerCase().includes(this.provSearch.toLowerCase()) ||
        p.ruc.toLowerCase().includes(this.provSearch.toLowerCase());
      const matchEstado = !this.provFiltroEstado || p.estado === this.provFiltroEstado;
      return matchSearch && matchEstado;
    });
  }

  // ── Helpers ──
  getBadgeClass(estado: string): string {
    const map: Record<string, string> = {
      'Aprobado': 'badge-green', 'Activo': 'badge-green', 'Entregado': 'badge-green',
      'Pendiente': 'badge-orange', 'En revisión': 'badge-yellow',
      'Rechazado': 'badge-red', 'Inactivo': 'badge-red',
      'Enviado': 'badge-blue', 'En tránsito': 'badge-blue',
    };
    return map[estado] || 'badge-yellow';
  }

  // ── Modal ──
  openModalCrear() {
    this.modalMode = 'crear';
    this.proveedorForm = { estado: 'Activo', calificacion: 4.0 };
    this.showModal = true;
  }

  openModalEditar(p: any) {
    this.modalMode = 'editar';
    this.proveedorForm = { ...p };
    this.showModal = true;
  }

  openModalVer(p: Proveedor) {
    this.modalMode = 'ver';
    this.proveedorForm = { ...p };
    this.showModal = true;
  }

  pedirEliminar(p: Proveedor) {
    this.modalMode = 'eliminar';
    this.deleteTarget = p;
    this.showModal = true;
  }

  closeModal() { this.showModal = false; this.deleteTarget = null; }

  // ── Guardar ──
  guardarProveedor() {
    if (!this.proveedorForm.nombre || !this.proveedorForm.ruc) {
      this.showToast('Complete los campos requeridos', 'error'); return;
    }
    if (this.modalMode === 'crear') {
      this.proveedores.push({ ...this.proveedorForm } as Proveedor);
      this.showToast('Proveedor agregado');
    } else {
      const idx = this.proveedores.findIndex(p => p.ruc === this.proveedorForm.ruc);
      if (idx !== -1) this.proveedores[idx] = { ...this.proveedores[idx], ...this.proveedorForm } as Proveedor;
      this.showToast('Proveedor actualizado');
    }
    this.closeModal();
  }

  confirmarEliminar() {
    if (this.deleteTarget) {
      this.proveedores = this.proveedores.filter(p => p !== this.deleteTarget);
      this.showToast('Proveedor eliminado');
    }
    this.closeModal();
  }

  showToast(msg: string, type: 'success' | 'error' | 'info' = 'success') {
    this.toastMsg = msg; this.toastType = type; this.toastVisible = true;
    setTimeout(() => this.toastVisible = false, 3000);
  }
}