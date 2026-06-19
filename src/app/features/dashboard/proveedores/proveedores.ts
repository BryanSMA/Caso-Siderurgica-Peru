import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProveedorService, Proveedor } from '../../../core/services/proveedor.service';

@Component({
  selector: 'app-proveedores',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './proveedores.html',
  styles: []
})
export class ProveedoresComponent implements OnInit {
  proveedores: Proveedor[] = [];
  provSearch = ''; provFiltroEstado = '';
  showModal = false; modalMode: 'crear' | 'editar' | 'ver' | 'eliminar' = 'crear';
  proveedorForm: Partial<Proveedor> = {};
  deleteTarget: Proveedor | null = null;
  toastMsg = ''; toastType: 'success' | 'error' | 'info' = 'success'; toastVisible = false;

  constructor(private proveedorService: ProveedorService, private cdr: ChangeDetectorRef) {}

  ngOnInit() { this.cargar(); }

  cargar() {
    this.proveedorService.listar().subscribe({
      next: p => { this.proveedores = p; this.cdr.detectChanges(); },
      error: err => console.error('ERROR proveedores:', err)
    });
  }

  get proveedoresFiltrados(): Proveedor[] {
    return this.proveedores.filter(p => {
      const matchSearch = !this.provSearch ||
        (p.nombre || '').toLowerCase().includes(this.provSearch.toLowerCase()) ||
        (p.ruc || '').toLowerCase().includes(this.provSearch.toLowerCase());
      return matchSearch && (!this.provFiltroEstado || p.estado === this.provFiltroEstado);
    });
  }

  getBadgeClass(estado: string): string {
    const map: Record<string,string> = { 'Activo':'badge-green', 'Inactivo':'badge-red' };
    return map[estado] || 'badge-yellow';
  }

  openModalCrear() { this.modalMode = 'crear'; this.proveedorForm = { estado:'Activo', calificacion:4.0 }; this.showModal = true; }
  openModalEditar(p: any) { this.modalMode = 'editar'; this.proveedorForm = { ...p }; this.showModal = true; }
  openModalVer(p: Proveedor) { this.modalMode = 'ver'; this.proveedorForm = { ...p }; this.showModal = true; }
  pedirEliminar(p: Proveedor) { this.modalMode = 'eliminar'; this.deleteTarget = p; this.showModal = true; }
  closeModal() { this.showModal = false; this.deleteTarget = null; }

  guardarProveedor() {
    if (!this.proveedorForm.nombre || !this.proveedorForm.ruc) { this.showToast('Complete los campos requeridos','error'); return; }
    if (this.modalMode === 'crear') {
      this.proveedorService.crear(this.proveedorForm as Proveedor).subscribe({
        next: () => { this.showToast('Proveedor agregado'); this.cargar(); this.closeModal(); },
        error: err => this.showToast(err.error?.message || 'Error al guardar','error')
      });
    } else {
      this.proveedorService.actualizar(this.proveedorForm.id!, this.proveedorForm as Proveedor).subscribe({
        next: () => { this.showToast('Proveedor actualizado'); this.cargar(); this.closeModal(); },
        error: () => this.showToast('Error al actualizar','error')
      });
    }
  }

  confirmarEliminar() {
    if (!this.deleteTarget?.id) return;
    this.proveedorService.eliminar(this.deleteTarget.id).subscribe(() => {
      this.showToast('Proveedor eliminado'); this.cargar(); this.closeModal();
    });
  }

  showToast(msg: string, type: 'success'|'error'|'info' = 'success') {
    this.toastMsg = msg; this.toastType = type; this.toastVisible = true;
    setTimeout(() => this.toastVisible = false, 3000);
  }
}