import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface Empleado {
  id: string; iniciales: string; color: string; nombre: string;
  cargo: string; area: string; horaEntrada: string; tardanza: string;
  asistencia: 'Presente' | 'Tardanza' | 'Ausente'; observacion: string;
}

@Component({
  selector: 'app-rrhh',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './rrhh.html',
   styles: []
})
export class RrhhComponent {

  empleados: Empleado[] = [
    { id: 'EMP-0041', iniciales: 'JR', color: '#1A365D', nombre: 'Juan Ramírez', cargo: 'Ing. Producción', area: 'Planta', horaEntrada: '08:02', tardanza: '—', asistencia: 'Presente', observacion: '—' },
    { id: 'EMP-0055', iniciales: 'MT', color: '#38A169', nombre: 'María Torres', cargo: 'Vendedora Sr.', area: 'Comercial', horaEntrada: '08:18', tardanza: '18 min', asistencia: 'Tardanza', observacion: 'Tráfico' },
    { id: 'EMP-0062', iniciales: 'CM', color: '#DD6B20', nombre: 'Carlos Mendoza', cargo: 'Jefe Logística', area: 'Logística', horaEntrada: '07:55', tardanza: '—', asistencia: 'Presente', observacion: '—' },
    { id: 'EMP-0078', iniciales: 'AP', color: '#E53E3E', nombre: 'Ana Paredes', cargo: 'Contadora', area: 'Finanzas', horaEntrada: '—', tardanza: '—', asistencia: 'Ausente', observacion: 'Licencia médica' },
  ];

  rrhhFiltroArea = '';
  showModal = false; modalMode: 'crear' | 'editar' | 'eliminar' = 'crear';
  empleadoForm: Partial<Empleado> = {}; deleteTarget: Empleado | null = null;
  toastMsg = ''; toastType: 'success' | 'error' | 'info' = 'success'; toastVisible = false;

  openModalCrear() { this.modalMode = 'crear'; this.empleadoForm = { asistencia: 'Presente' }; this.showModal = true; }
  openModalEditar(e: Empleado) { this.modalMode = 'editar'; this.empleadoForm = { ...e }; this.showModal = true; }
  pedirEliminar(e: Empleado) { this.deleteTarget = e; this.modalMode = 'eliminar'; this.showModal = true; }
  closeModal() { this.showModal = false; this.deleteTarget = null; }

  guardarEmpleado() {
    if (!this.empleadoForm.nombre) { this.showToast('Complete los campos requeridos', 'error'); return; }
    if (this.modalMode === 'crear') {
      const colores = ['#1A365D','#38A169','#DD6B20','#E53E3E','#805AD5'];
      this.empleados.push({
        id: `EMP-0${100 + this.empleados.length}`,
        iniciales: this.empleadoForm.nombre!.split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase(),
        color: colores[this.empleados.length % colores.length],
        nombre: this.empleadoForm.nombre!, cargo: this.empleadoForm.cargo || '—',
        area: this.empleadoForm.area || '—', horaEntrada: '—', tardanza: '—',
        asistencia: 'Presente', observacion: '—',
      });
      this.showToast('Empleado registrado');
    } else {
      const idx = this.empleados.findIndex(e => e.id === this.empleadoForm.id);
      if (idx !== -1) this.empleados[idx] = { ...this.empleados[idx], ...this.empleadoForm } as Empleado;
      this.showToast('Empleado actualizado');
    }
    this.closeModal();
  }

  confirmarEliminar() { this.empleados = this.empleados.filter(e => e !== this.deleteTarget); this.showToast('Empleado eliminado'); this.closeModal(); }
  cambiarAsistencia(emp: Empleado, asistencia: Empleado['asistencia']) { emp.asistencia = asistencia; this.showToast(`${emp.nombre} → ${asistencia}`); }
  areasUnicas(): string[] { return [...new Set(this.empleados.map(e => e.area))]; }

  get empleadosFiltrados(): Empleado[] {
    return this.empleados.filter(e => !this.rrhhFiltroArea || e.area === this.rrhhFiltroArea);
  }

  getBadgeClass(estado: string): string {
    const map: Record<string, string> = { 'Presente': 'badge-green', 'Tardanza': 'badge-yellow', 'Ausente': 'badge-red' };
    return map[estado] || 'badge-gray';
  }
  showToast(msg: string, type: 'success' | 'error' | 'info' = 'success') { this.toastMsg = msg; this.toastType = type; this.toastVisible = true; setTimeout(() => this.toastVisible = false, 3000); }
}