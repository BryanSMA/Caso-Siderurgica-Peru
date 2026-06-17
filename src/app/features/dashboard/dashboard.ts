import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

// ── Componentes hijos ──
import { VentasComponent }         from './ventas/ventas';
import { CotizacionesComponent }   from './cotizaciones/cotizaciones';
import { PedidosComponent }        from './pedidos/pedidos';
import { DespachoComponent }       from './despacho/despacho';
import { InventarioComponent }     from './inventario/inventario';
import { AbastecimientoComponent } from './abastecimiento/abastecimiento';
import { ProveedoresComponent }    from './proveedores/proveedores';
import { RrhhComponent }           from './rrhh/rrhh';
import { PlanillasComponent }      from './planillas/planillas';
import { ReportesComponent }       from './reportes/reportes';
import { MantenimientoComponent }  from './mantenimiento/mantenimiento';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    VentasComponent, CotizacionesComponent, PedidosComponent,
    DespachoComponent, InventarioComponent, AbastecimientoComponent,
    ProveedoresComponent, RrhhComponent, PlanillasComponent,
    ReportesComponent, MantenimientoComponent,
  ],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss'
})
export class DashboardComponent implements OnInit {

  activeView = 'dashboard';
  usuarioActual: any = null;
  rolActual: string | null = null;

  // Toast global
  toastMsg = ''; toastType: 'success' | 'error' | 'info' = 'success'; toastVisible = false;

  // Notificaciones
  showNotif = false;
  notificaciones = [
    { icono: '📦', titulo: 'Stock crítico', msg: 'Alambre galvanizado #16 sin stock', tiempo: 'Hace 5 min', leida: false },
    { icono: '🚚', titulo: 'Despacho pendiente', msg: 'Guía #GUI-1840 sin confirmar entrega', tiempo: 'Hace 20 min', leida: false },
    { icono: '💰', titulo: 'Nueva venta', msg: 'Pedido #PED-2847 aprobado por S/ 48,200', tiempo: 'Hace 1 hora', leida: true },
    { icono: '⚠️', titulo: 'Orden pendiente', msg: 'OC-0420 requiere aprobación', tiempo: 'Hace 2 horas', leida: true },
    { icono: '👤', titulo: 'Empleado ausente', msg: 'Ana Paredes registró licencia médica', tiempo: 'Hace 3 horas', leida: true },
  ];

  permisosPorRol: Record<string, string[]> = {
    ADMIN:    ['dashboard','ventas','cotizaciones','pedidos','despacho','inventario','abastecimiento','proveedores','rrhh','planillas','reportes','mantenimiento'],
    VENTAS:   ['dashboard','ventas','cotizaciones','pedidos','reportes'],
    ALMACEN:  ['dashboard','despacho','inventario','abastecimiento','proveedores'],
    RRHH:     ['dashboard','rrhh','planillas'],
    CONSULTA: ['dashboard','reportes'],
  };

  constructor(
    private router: Router,
    private authService: AuthService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.usuarioActual = this.authService.getUser();
    this.rolActual = this.authService.getRol();
  }

  // ── Permisos ──
  puedeVer(view: string): boolean {
    return this.permisosPorRol[this.rolActual || '']?.includes(view) ?? false;
  }
  puedeVerAlguno(views: string[]): boolean {
    return views.some(v => this.puedeVer(v));
  }

  // ── Navegación ──
  showView(view: string) {
    if (this.puedeVer(view)) this.activeView = view;
  }

  getCurrentTitle(): string {
    const titles: Record<string, string> = {
      dashboard: 'Dashboard', ventas: 'Gestión de Ventas', cotizaciones: 'Gestión de Cotizaciones',
      pedidos: 'Gestión de Pedidos', despacho: 'Gestión de Despacho', inventario: 'Gestión de Inventario',
      abastecimiento: 'Gestión de Abastecimiento', proveedores: 'Gestión de Proveedores',
      rrhh: 'Gestión de Recursos Humanos', planillas: 'Gestión de Planillas',
      reportes: 'Gestión de Reportes', mantenimiento: 'Mantenimiento del Sistema',
    };
    return titles[this.activeView] || '';
  }

  getCurrentSub(): string {
    const subs: Record<string, string> = {
      dashboard: 'Resumen ejecutivo del sistema', ventas: 'Control de pedidos y transacciones comerciales',
      cotizaciones: 'Registro, cálculo automático y consulta de cotizaciones',
      pedidos: 'Registro, validación y comprobantes de pedidos de venta',
      despacho: 'Seguimiento de envíos y entregas', inventario: 'Control de stock y almacén',
      abastecimiento: 'Órdenes de compra y proveedores', proveedores: 'Directorio de proveedores estratégicos',
      rrhh: 'Control de asistencia y personal', planillas: 'Gestión salarial — Julio 2025',
      reportes: 'Indicadores clave del negocio', mantenimiento: 'Administración de usuarios, roles y configuración',
    };
    return subs[this.activeView] || '';
  }

  logout() { this.authService.logout(); }

  // ── Notificaciones ──
  get notifNoLeidas(): number { return this.notificaciones.filter(n => !n.leida).length; }
  toggleNotif() { this.showNotif = !this.showNotif; }
  marcarLeida(n: any) { n.leida = true; }
  marcarTodasLeidas() { this.notificaciones.forEach(n => n.leida = true); }
  cerrarNotif() { this.showNotif = false; }

  showToast(msg: string, type: 'success' | 'error' | 'info' = 'success') {
    this.toastMsg = msg; this.toastType = type; this.toastVisible = true;
    setTimeout(() => this.toastVisible = false, 3000);
  }
}