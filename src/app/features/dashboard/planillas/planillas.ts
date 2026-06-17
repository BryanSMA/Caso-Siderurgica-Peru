import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface Planilla {
  iniciales: string; color: string; nombre: string; cargo: string;
  salarioBase: number; descuentos: number; bonos: number;
  estado: 'Pagado' | 'Pendiente';
}

@Component({
  selector: 'app-planillas',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './planillas.html',
   styles: []
})
export class PlanillasComponent {

  planillas: Planilla[] = [
    { iniciales: 'JR', color: '#1A365D', nombre: 'Juan Ramírez', cargo: 'Ing. Producción', salarioBase: 6500, descuentos: 715, bonos: 500, estado: 'Pagado' },
    { iniciales: 'MT', color: '#38A169', nombre: 'María Torres', cargo: 'Vendedora Sr.', salarioBase: 4200, descuentos: 462, bonos: 1200, estado: 'Pagado' },
    { iniciales: 'CM', color: '#DD6B20', nombre: 'Carlos Mendoza', cargo: 'Jefe Logística', salarioBase: 7800, descuentos: 858, bonos: 300, estado: 'Pendiente' },
  ];

  showModal = false;
  boletaEmpleado: Planilla | null = null;
  toastMsg = ''; toastType: 'success' | 'error' | 'info' = 'success'; toastVisible = false;

  verBoleta(p: Planilla) { this.boletaEmpleado = p; this.showModal = true; }
  closeModal() { this.showModal = false; }
  procesarPago(p: Planilla) { p.estado = 'Pagado'; this.showToast(`Pago procesado para ${p.nombre}`); }
  getTotalNeto(p: Planilla): number { return p.salarioBase - p.descuentos + p.bonos; }

  formatMoney(n: number): string { return 'S/ ' + n.toLocaleString('es-PE'); }
  getBadgeClass(estado: string): string {
    return estado === 'Pagado' ? 'badge-green' : 'badge-orange';
  }
  showToast(msg: string, type: 'success' | 'error' | 'info' = 'success') { this.toastMsg = msg; this.toastType = type; this.toastVisible = true; setTimeout(() => this.toastVisible = false, 3000); }
}