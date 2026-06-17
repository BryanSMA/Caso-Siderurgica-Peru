import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InventarioService, Inventario as InventarioBD } from '../../../core/services/inventario.service';
import { AuthService } from '../../../core/services/auth.service'

@Component({
  selector: 'app-inventario',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './inventario.html',
   styles: []
})
export class InventarioComponent implements OnInit {

  inventarioBD: InventarioBD[] = [];
  alertasBajoStock = 0;
  loadingInventario = false;
  inventarioSearch = '';
  inventarioFiltroEstado = '';
  showModal = false;
  modalMode: 'crear' | 'editar' = 'crear';
  inventarioForm: Partial<InventarioBD> = {};
  guardando = false;
  toastMsg = '';
  toastType: 'success' | 'error' | 'info' = 'success';
  toastVisible = false;
  rolActual: string | null = null;

  constructor(
    private inventarioService: InventarioService,
    private authService: AuthService,
    private cdr: ChangeDetectorRef
  ) {}

  valorTotalInventario: number = 0;

ngOnInit() {
  this.rolActual = this.authService.getRol();
  this.cargarInventario();
  this.cargarAlertas();
  this.cargarValorTotal(); // ← así
}

  cargarInventario() {
    this.loadingInventario = true;
    this.inventarioService.listarInventario().subscribe({
      next: (data) => {
        this.inventarioBD = data;
        this.loadingInventario = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.loadingInventario = false;
        this.showToast('Error al cargar inventario', 'error');
      }
    });
  }

  cargarAlertas() {
    this.inventarioService.listarBajoStock().subscribe({
      next: (data) => {
        this.alertasBajoStock = data.total;
        this.cdr.detectChanges();
      },
      error: () => {}
    });
  }

  openModalCrear() {
    this.modalMode = 'crear';
    this.inventarioForm = {};
    this.showModal = true;
  }

  openModalEditar(p: InventarioBD) {
    this.modalMode = 'editar';
    this.inventarioForm = { ...p };
    this.showModal = true;
  }

  closeModal() {
    this.showModal = false;
  }

  guardarInventario() {
    if (!this.inventarioForm.producto) {
      this.showToast('El nombre del producto es obligatorio', 'error'); return;
    }
    this.guardando = true;
    const item: InventarioBD = {
      producto: this.inventarioForm.producto!,
      categoria: this.inventarioForm.categoria,
      stock: Number(this.inventarioForm.stock) || 0,
      stockMinimo: Number(this.inventarioForm.stockMinimo) || 10,
      precioUnitario: Number(this.inventarioForm.precioUnitario) || 0,
      unidad: this.inventarioForm.unidad || 'unidad'
    };

    if (this.modalMode === 'crear') {
      this.inventarioService.crearProducto(item).subscribe({
        next: () => {
          this.guardando = false;
          this.closeModal();
          this.showToast('✅ Producto agregado correctamente', 'success');
          this.cargarInventario();
          this.cargarAlertas();
          this.cargarValorTotal();
        },
        error: () => { this.guardando = false; this.showToast('Error al agregar producto', 'error'); }
      });
    } else {
      this.inventarioService.actualizarProducto(this.inventarioForm.id!, item).subscribe({
        next: () => {
          this.guardando = false;
          this.closeModal();
          this.showToast('✅ Producto actualizado correctamente', 'success');
          this.cargarInventario();
          this.cargarAlertas();
           this.cargarValorTotal(); 
        },
        error: () => { this.guardando = false; this.showToast('Error al actualizar producto', 'error'); }
      });
    }
  }

  get inventarioBDFiltrado(): InventarioBD[] {
    return this.inventarioBD.filter(p => {
      const search = this.inventarioSearch.toLowerCase();
      const matchSearch = !this.inventarioSearch ||
        p.producto?.toLowerCase().includes(search) ||
        p.categoria?.toLowerCase().includes(search);
      const estado = this.getEstadoInventario(p);
      const matchEstado = !this.inventarioFiltroEstado || estado === this.inventarioFiltroEstado;
      return matchSearch && matchEstado;
    });
  }

  getEstadoInventario(p: InventarioBD): string {
    if (p.stock === 0) return 'Sin stock';
    if (p.stock <= (p.stockMinimo || 0)) return 'Bajo stock';
    return 'Normal';
  }

  formatMoney(n: number): string {
    return 'S/ ' + n.toLocaleString('es-PE');
  }

  getBadgeClass(estado: string): string {
    const map: Record<string, string> = {
      'Normal': 'badge-green', 'Bajo stock': 'badge-orange', 'Sin stock': 'badge-red'
    };
    return map[estado] || 'badge-yellow';
  }

  showToast(msg: string, type: 'success' | 'error' | 'info' = 'success') {
    this.toastMsg = msg;
    this.toastType = type;
    this.toastVisible = true;
    setTimeout(() => this.toastVisible = false, 3000);
  }
cargarValorTotal() {
  this.inventarioService.obtenerValorTotal().subscribe({
    next: (data) => {
      this.valorTotalInventario = data.valorTotal;
      this.cdr.detectChanges();
    },
    error: () => {}
  });
}
  
// En ngOnInit o cargarInventario():

}