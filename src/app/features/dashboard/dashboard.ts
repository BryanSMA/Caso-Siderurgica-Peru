import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { DataService } from '../../core/services/data.service';

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

  private router      = inject(Router);
  private authService = inject(AuthService);
  private cdr         = inject(ChangeDetectorRef);
  ds                  = inject(DataService);   // expuesto al template

  activeView = 'dashboard';
  usuarioActual: any       = null;
  rolActual: string | null = null;

  // Toast global
  toastMsg = ''; toastType: 'success' | 'error' | 'info' = 'success'; toastVisible = false;

  // Notificaciones
  showNotif = false;

  get notificaciones() {
    const base = [
      { icono: '⚠️', titulo: 'Orden pendiente',    msg: 'Hay órdenes de compra pendientes de aprobación', tiempo: 'Ahora',        leida: false, link: 'abastecimiento' },
      { icono: '🚚', titulo: 'Despachos pendientes',msg: `${this.ds.despachosRegistrados()} despachos activos en el sistema`, tiempo: 'Ahora', leida: false, link: 'despacho' },
    ];
    // Alertas dinámicas por SKUs críticos — datos reales del inventario
    const criticos = this.ds.skusCriticos();
    criticos.forEach(sku => base.unshift({
      icono:  '📦',
      titulo: 'Stock crítico',
      msg:    `${sku.producto} — stock: ${sku.stock} ${sku.unidad}`,
      tiempo: 'Ahora',
      leida:  false,
      link:   'inventario',
    }));
    return base;
  }

  permisosPorRol: Record<string, string[]> = {
    ADMIN:    ['dashboard','ventas','cotizaciones','pedidos','despacho','inventario','abastecimiento','proveedores','rrhh','planillas','reportes','mantenimiento'],
    VENTAS:   ['dashboard','ventas','cotizaciones','pedidos','reportes'],
    ALMACEN:  ['dashboard','despacho','inventario','abastecimiento','proveedores'],
    RRHH:     ['dashboard','rrhh','planillas'],
    CONSULTA: ['dashboard','reportes'],
  };

  ngOnInit() {
    this.usuarioActual = this.authService.getUser();
    this.rolActual     = this.authService.getRol();
    // ← carga datos reales del backend al entrar al dashboard
    this.ds.cargarDatos();
  }

  irANotif(n: any) {
    n.leida = true;
    this.showNotif = false;
    if (n.link && this.puedeVer(n.link)) this.activeView = n.link;
  }

  // ── Permisos ──────────────────────────────────────────────────────────────
  puedeVer(view: string): boolean {
    return this.permisosPorRol[this.rolActual || '']?.includes(view) ?? false;
  }
  puedeVerAlguno(views: string[]): boolean {
    return views.some(v => this.puedeVer(v));
  }

  // ── Navegación ────────────────────────────────────────────────────────────
  showView(view: string) {
    if (this.puedeVer(view)) this.activeView = view;
  }

  getCurrentTitle(): string {
    const titles: Record<string, string> = {
      dashboard: 'Dashboard', ventas: 'Gestión de Ventas',
      cotizaciones: 'Gestión de Cotizaciones', pedidos: 'Gestión de Pedidos',
      despacho: 'Gestión de Despacho', inventario: 'Gestión de Inventario',
      abastecimiento: 'Gestión de Abastecimiento', proveedores: 'Gestión de Proveedores',
      rrhh: 'Gestión de Recursos Humanos', planillas: 'Gestión de Planillas',
      reportes: 'Gestión de Reportes', mantenimiento: 'Mantenimiento del Sistema',
    };
    return titles[this.activeView] || '';
  }

  getCurrentSub(): string {
    const subs: Record<string, string> = {
      dashboard:      'Resumen ejecutivo del sistema',
      ventas:         'Control de pedidos y transacciones comerciales',
      cotizaciones:   'Registro, cálculo automático y consulta de cotizaciones',
      pedidos:        'Registro, validación y comprobantes de pedidos de venta',
      despacho:       'Seguimiento de envíos y entregas',
      inventario:     'Control de stock y almacén',
      abastecimiento: 'Órdenes de compra y proveedores',
      proveedores:    'Directorio de proveedores estratégicos',
      rrhh:           'Control de asistencia y personal',
      planillas:      'Gestión salarial',
      reportes:       'Indicadores clave del negocio',
      mantenimiento:  'Administración de usuarios, roles y configuración',
    };
    return subs[this.activeView] || '';
  }

  logout() { this.authService.logout(); }

  // ── Notificaciones ────────────────────────────────────────────────────────
  get notifNoLeidas(): number { return this.notificaciones.filter(n => !n.leida).length; }
  toggleNotif()       { this.showNotif = !this.showNotif; }
  marcarTodasLeidas() { this.notificaciones.forEach(n => n.leida = true); }
  cerrarNotif()       { this.showNotif = false; }

  showToast(msg: string, type: 'success' | 'error' | 'info' = 'success') {
    this.toastMsg = msg; this.toastType = type; this.toastVisible = true;
    setTimeout(() => this.toastVisible = false, 3000);
  }
}