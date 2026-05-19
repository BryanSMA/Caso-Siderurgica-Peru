import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

// ─── INTERFACES ────────────────────────────────────────────────────────────────

export interface Venta {
  id: string;
  cliente: string;
  ruc: string;
  producto: string;
  cantidad: string;
  total: number;
  vendedor: string;
  estado: 'Aprobado' | 'Pendiente' | 'En revisión' | 'Rechazado';
  fecha: string;
}

export interface Producto {
  codigo: string;
  nombre: string;
  descripcion: string;
  categoria: string;
  stock: number;
  minimo: number;
  ubicacion: string;
  valorUnit: number;
}

export interface Despacho {
  guia: string;
  cliente: string;
  direccion: string;
  producto: string;
  peso: string;
  transportista: string;
  estado: 'Entregado' | 'Enviado' | 'Pendiente';
}

export interface OrdenCompra {
  id: string;
  proveedor: string;
  origen: string;
  producto: string;
  cantidad: string;
  total: number;
  fechaEntrega: string;
  estado: 'Aprobada' | 'Pendiente' | 'En tránsito';
}

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

export interface Empleado {
  id: string;
  iniciales: string;
  color: string;
  nombre: string;
  cargo: string;
  area: string;
  horaEntrada: string;
  tardanza: string;
  asistencia: 'Presente' | 'Tardanza' | 'Ausente';
  observacion: string;
}

export interface Planilla {
  iniciales: string;
  color: string;
  nombre: string;
  cargo: string;
  salarioBase: number;
  descuentos: number;
  bonos: number;
  estado: 'Pagado' | 'Pendiente';
}

// ─── COMPONENT ─────────────────────────────────────────────────────────────────

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss'
})
export class DashboardComponent implements OnInit {

  activeView = 'dashboard';
  usuarioActual: any = null;
  rolActual: string | null = null;

  permisosPorRol: Record<string, string[]> = {
    ADMIN: [
      'dashboard',
      'ventas',
      'despacho',
      'inventario',
      'abastecimiento',
      'proveedores',
      'rrhh',
      'planillas',
      'reportes',
      'mantenimiento'
    ],

    VENTAS: [
      'dashboard',
      'ventas',
      'reportes'
    ],

    ALMACEN: [
      'dashboard',
      'despacho',
      'inventario',
      'abastecimiento',
      'proveedores'
    ],

    RRHH: [
      'dashboard',
      'rrhh',
      'planillas'
    ],

    CONSULTA: [
      'dashboard',
      'reportes'
    ]
  };

  // ── Modal State ──
  showModal = false;
  modalMode: 'crear' | 'editar' | 'ver' | 'confirmar' | 'boleta' = 'crear';
  modalTipo = '';
  modalTitle = '';
  deleteConfirm = false;
  deleteTarget: any = null;
  deleteTargetTipo = '';
  toastMsg = '';
  toastType: 'success' | 'error' | 'info' = 'success';
  toastVisible = false;

  // ── Búsqueda y Filtros ──
  ventaSearch = '';
  ventaFiltroEstado = '';
  ventaFiltroPeriodo = '';

  inventarioSearch = '';
  inventarioFiltroCategoria = '';
  inventarioFiltroEstado = '';

  despachoSearch = '';
  despachoFiltroEstado = '';

  abastSearch = '';
  abastFiltroEstado = '';

  provSearch = '';
  provFiltroEstado = '';

  rrhhFiltroArea = '';

  // ── Form Models ──
  ventaForm: Partial<Venta> = {};
  productoForm: Partial<Producto> = {};
  despachoForm: Partial<Despacho> = {};
  ordenForm: Partial<OrdenCompra> = {};
  proveedorForm: Partial<Proveedor> = {};
  empleadoForm: Partial<Empleado> = {};

  boletaEmpleado: Planilla | null = null;

  // ── Datos: VENTAS ──
  ventas: Venta[] = [
    { id: '#PED-2847', cliente: 'Constructora Lima S.A.', ruc: '20412345678', producto: 'Acero estructural A36', cantidad: '12 TM', total: 48200, vendedor: 'J. Ramírez', estado: 'Aprobado', fecha: 'Hoy, 09:41' },
    { id: '#PED-2846', cliente: 'Minera Andina Corp.', ruc: '20512345679', producto: 'Barras corrugadas 1"', cantidad: '5 TM', total: 22750, vendedor: 'M. Torres', estado: 'Pendiente', fecha: 'Hoy, 08:15' },
    { id: '#PED-2845', cliente: 'Infraestructura Sur SAC', ruc: '20312345670', producto: 'Perfiles H 8x8', cantidad: '20 TM', total: 91400, vendedor: 'C. Mendoza', estado: 'Aprobado', fecha: 'Hoy, 07:30' },
    { id: '#PED-2844', cliente: 'Grupo Constructor Norte', ruc: '20612345671', producto: 'Planchas 6mm', cantidad: '8 TM', total: 15800, vendedor: 'J. Ramírez', estado: 'En revisión', fecha: 'Ayer, 18:20' },
    { id: '#PED-2843', cliente: 'Desarrollos Urbanos Perú', ruc: '20712345672', producto: 'Alambre galvanizado #16', cantidad: '3 TM', total: 8300, vendedor: 'M. Torres', estado: 'Rechazado', fecha: 'Ayer, 16:45' },
  ];

  // ── Datos: INVENTARIO ──
  productos: Producto[] = [
    { codigo: 'ACE-001', nombre: 'Acero estructural A36 6m', descripcion: 'Vigas de alta resistencia', categoria: 'Acero Estructural', stock: 142, minimo: 20, ubicacion: 'Nave A-3', valorUnit: 4200 },
    { codigo: 'BAR-012', nombre: 'Barra corrugada 3/4" x 9m', descripcion: 'Alta ductilidad fy=420', categoria: 'Barras Corrugadas', stock: 8, minimo: 15, ubicacion: 'Nave B-1', valorUnit: 3800 },
    { codigo: 'PER-008', nombre: 'Perfil H 8x8 12m', descripcion: 'ASTM A572 Gr50', categoria: 'Perfiles Laminados', stock: 22, minimo: 20, ubicacion: 'Nave A-1', valorUnit: 5100 },
    { codigo: 'ALM-003', nombre: 'Alambre galvanizado #16', descripcion: 'Rollo 30kg', categoria: 'Alambres', stock: 0, minimo: 5, ubicacion: 'Nave D-4', valorUnit: 2900 },
  ];

  // ── Datos: DESPACHO ──
  despachos: Despacho[] = [
    { guia: '#GUI-1842', cliente: 'Constructora Lima S.A.', direccion: 'Av. Javier Prado 4200', producto: 'Acero A36', peso: '12 TM', transportista: 'Fletes Andes SAC', estado: 'Entregado' },
    { guia: '#GUI-1841', cliente: 'Minera Andina Corp.', direccion: 'Carretera Central Km 45', producto: 'Barras 3/4"', peso: '5 TM', transportista: 'TransMetro Perú', estado: 'Enviado' },
    { guia: '#GUI-1840', cliente: 'Infraestructura Sur SAC', direccion: 'Av. Separadora Industrial', producto: 'Perfiles H', peso: '20 TM', transportista: 'Fletes Andes SAC', estado: 'Pendiente' },
  ];

  // ── Datos: ABASTECIMIENTO ──
  ordenes: OrdenCompra[] = [
    { id: '#OC-0421', proveedor: 'SIDERPERU S.A.', origen: 'Lima, Perú', producto: 'Acero A36 — Lote 50 TM', cantidad: '50 TM', total: 210000, fechaEntrega: '28 Jul 2025', estado: 'Aprobada' },
    { id: '#OC-0420', proveedor: 'Aceros Arequipa', origen: 'Arequipa, Perú', producto: 'Barras corrugadas 3/4"', cantidad: '30 TM', total: 114000, fechaEntrega: '02 Ago 2025', estado: 'Pendiente' },
    { id: '#OC-0419', proveedor: 'MetalPro Export', origen: 'Bogotá, Colombia', producto: 'Perfiles H 8x8 importados', cantidad: '80 TM', total: 408000, fechaEntrega: '15 Ago 2025', estado: 'En tránsito' },
  ];

  // ── Datos: PROVEEDORES ──
  proveedores: Proveedor[] = [
    { nombre: 'SIDERPERU S.A.', origen: 'Lima, Perú', ruc: '20123456789', contacto: 'Ing. Carlos Flores', telefono: '+51 1 611-4000', categoria: 'Acero primario', calificacion: 4.8, estado: 'Activo' },
    { nombre: 'Aceros Arequipa', origen: 'Arequipa, Perú', ruc: '20234567890', contacto: 'Lic. Rosa Quispe', telefono: '+51 54 381-000', categoria: 'Barras y perfiles', calificacion: 4.5, estado: 'Activo' },
    { nombre: 'MetalPro Export', origen: 'Bogotá, Colombia', ruc: 'NIT-9001234', contacto: 'Mr. Andrés Vargas', telefono: '+57 1 300-1234', categoria: 'Perfiles importados', calificacion: 3.9, estado: 'Activo' },
  ];

  // ── Datos: RRHH ──
  empleados: Empleado[] = [
    { id: 'EMP-0041', iniciales: 'JR', color: '#1A365D', nombre: 'Juan Ramírez', cargo: 'Ing. Producción', area: 'Planta', horaEntrada: '08:02', tardanza: '—', asistencia: 'Presente', observacion: '—' },
    { id: 'EMP-0055', iniciales: 'MT', color: '#38A169', nombre: 'María Torres', cargo: 'Vendedora Sr.', area: 'Comercial', horaEntrada: '08:18', tardanza: '18 min', asistencia: 'Tardanza', observacion: 'Tráfico' },
    { id: 'EMP-0062', iniciales: 'CM', color: '#DD6B20', nombre: 'Carlos Mendoza', cargo: 'Jefe Logística', area: 'Logística', horaEntrada: '07:55', tardanza: '—', asistencia: 'Presente', observacion: '—' },
    { id: 'EMP-0078', iniciales: 'AP', color: '#E53E3E', nombre: 'Ana Paredes', cargo: 'Contadora', area: 'Finanzas', horaEntrada: '—', tardanza: '—', asistencia: 'Ausente', observacion: 'Licencia médica' },
  ];

  // ── Datos: PLANILLAS ──
  planillas: Planilla[] = [
    { iniciales: 'JR', color: '#1A365D', nombre: 'Juan Ramírez', cargo: 'Ing. Producción', salarioBase: 6500, descuentos: 715, bonos: 500, estado: 'Pagado' },
    { iniciales: 'MT', color: '#38A169', nombre: 'María Torres', cargo: 'Vendedora Sr.', salarioBase: 4200, descuentos: 462, bonos: 1200, estado: 'Pagado' },
    { iniciales: 'CM', color: '#DD6B20', nombre: 'Carlos Mendoza', cargo: 'Jefe Logística', salarioBase: 7800, descuentos: 858, bonos: 300, estado: 'Pendiente' },
  ];
  // ── Datos: MANTENIMIENTO ──
  usuariosSistema = [
    { id: 2, username: 'admin', rol: 'ADMIN', estado: 'Activo' },
    { id: 3, username: 'ventas1', rol: 'VENTAS', estado: 'Activo' },
    { id: 4, username: 'almacen1', rol: 'ALMACEN', estado: 'Activo' },
    { id: 5, username: 'rrhh1', rol: 'RRHH', estado: 'Activo' },
    { id: 6, username: 'consulta1', rol: 'CONSULTA', estado: 'Activo' },
  ];

  constructor(
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.usuarioActual = this.authService.getUser();
    this.rolActual = this.authService.getRol();
  }

  puedeVer(view: string): boolean{
    if(!this.rolActual){
      return false;
    }
    return this.permisosPorRol[this.rolActual]?.includes(view) ?? false;
  }
  puedeVerAlguno(views: string[]): boolean{
    return views.some(view => this.puedeVer(view));
  }

  // ─── NAVEGACIÓN ────────────────────────────────────────────────────────────

  showView(view: string) {
    if(this.puedeVer(view)){
      this.activeView = view;
      this.closeModal();
    }
  }

  getCurrentTitle(): string {
    const titles: Record<string, string> = {
      dashboard: 'Dashboard', ventas: 'Gestión de Ventas', despacho: 'Gestión de Despacho',
      inventario: 'Gestión de Inventario', abastecimiento: 'Gestión de Abastecimiento',
      proveedores: 'Gestión de Proveedores', rrhh: 'Gestión de Recursos Humanos',
      planillas: 'Gestión de Planillas', reportes: 'Gestión de Reportes',
      mantenimiento: 'Mantenimiento del Sistema',
    };
    return titles[this.activeView] || '';
  }

  getCurrentSub(): string {
    const subs: Record<string, string> = {
      dashboard: 'Resumen ejecutivo del sistema', ventas: 'Control de pedidos y transacciones comerciales',
      despacho: 'Seguimiento de envíos y entregas', inventario: 'Control de stock y almacén',
      abastecimiento: 'Órdenes de compra y proveedores', proveedores: 'Directorio de proveedores estratégicos',
      rrhh: 'Control de asistencia y personal', planillas: 'Gestión salarial — Julio 2025',
      reportes: 'Indicadores clave del negocio',
      mantenimiento:'Administración de usuarios, roles y configuración',
    };
    return subs[this.activeView] || '';
  }

  logout() {
    this.authService.logout();
  }

  // ─── TOAST ─────────────────────────────────────────────────────────────────

  showToast(msg: string, type: 'success' | 'error' | 'info' = 'success') {
    this.toastMsg = msg;
    this.toastType = type;
    this.toastVisible = true;
    setTimeout(() => this.toastVisible = false, 3000);
  }

  // ─── MODAL ─────────────────────────────────────────────────────────────────

  openModal(tipo: string, mode: 'crear' | 'editar' | 'ver', data?: any) {
    this.modalTipo = tipo;
    this.modalMode = mode;
    this.showModal = true;

    const titles: Record<string, Record<string, string>> = {
      venta: { crear: 'Nueva Venta', editar: 'Editar Venta', ver: 'Detalle de Venta' },
      producto: { crear: 'Nuevo Producto', editar: 'Editar Producto', ver: 'Detalle de Producto' },
      despacho: { crear: 'Nuevo Despacho', editar: 'Editar Despacho', ver: 'Detalle de Despacho' },
      orden: { crear: 'Nueva Orden de Compra', editar: 'Editar Orden', ver: 'Detalle de Orden' },
      proveedor: { crear: 'Nuevo Proveedor', editar: 'Editar Proveedor', ver: 'Detalle de Proveedor' },
      empleado: { crear: 'Nuevo Empleado', editar: 'Editar Empleado', ver: 'Detalle de Empleado' },
    };
    this.modalTitle = titles[tipo]?.[mode] || '';

    if (tipo === 'venta') this.ventaForm = data ? { ...data } : { estado: 'Pendiente' };
    if (tipo === 'producto') this.productoForm = data ? { ...data } : {};
    if (tipo === 'despacho') this.despachoForm = data ? { ...data } : { estado: 'Pendiente' };
    if (tipo === 'orden') this.ordenForm = data ? { ...data } : { estado: 'Pendiente' };
    if (tipo === 'proveedor') this.proveedorForm = data ? { ...data } : { estado: 'Activo', calificacion: 4.0 };
    if (tipo === 'empleado') this.empleadoForm = data ? { ...data } : { asistencia: 'Presente' };
  }

  closeModal() {
    this.showModal = false;
    this.deleteConfirm = false;
    this.deleteTarget = null;
  }

  // ─── GUARDAR ───────────────────────────────────────────────────────────────

  guardar() {
    if (this.modalTipo === 'venta') this.guardarVenta();
    else if (this.modalTipo === 'producto') this.guardarProducto();
    else if (this.modalTipo === 'despacho') this.guardarDespacho();
    else if (this.modalTipo === 'orden') this.guardarOrden();
    else if (this.modalTipo === 'proveedor') this.guardarProveedor();
    else if (this.modalTipo === 'empleado') this.guardarEmpleado();
  }

  guardarVenta() {
    if (!this.ventaForm.cliente || !this.ventaForm.producto) {
      this.showToast('Complete los campos requeridos', 'error'); return;
    }
    if (this.modalMode === 'crear') {
      const nueva: Venta = {
        id: `#PED-${2848 + this.ventas.length}`,
        cliente: this.ventaForm.cliente!, ruc: this.ventaForm.ruc || '—',
        producto: this.ventaForm.producto!, cantidad: this.ventaForm.cantidad || '1 TM',
        total: this.ventaForm.total || 0, vendedor: this.ventaForm.vendedor || 'Sin asignar',
        estado: this.ventaForm.estado as any || 'Pendiente',
        fecha: 'Ahora',
      };
      this.ventas.unshift(nueva);
      this.showToast('Venta creada correctamente');
    } else {
      const idx = this.ventas.findIndex(v => v.id === this.ventaForm.id);
      if (idx !== -1) this.ventas[idx] = { ...this.ventas[idx], ...this.ventaForm } as Venta;
      this.showToast('Venta actualizada');
    }
    this.closeModal();
  }

  guardarProducto() {
    if (!this.productoForm.nombre || !this.productoForm.codigo) {
      this.showToast('Complete los campos requeridos', 'error'); return;
    }
    if (this.modalMode === 'crear') {
      this.productos.push({ ...this.productoForm } as Producto);
      this.showToast('Producto agregado al inventario');
    } else {
      const idx = this.productos.findIndex(p => p.codigo === this.productoForm.codigo);
      if (idx !== -1) this.productos[idx] = { ...this.productos[idx], ...this.productoForm } as Producto;
      this.showToast('Producto actualizado');
    }
    this.closeModal();
  }

  guardarDespacho() {
    if (!this.despachoForm.cliente || !this.despachoForm.producto) {
      this.showToast('Complete los campos requeridos', 'error'); return;
    }
    if (this.modalMode === 'crear') {
      const nuevo: Despacho = {
        guia: `#GUI-${1843 + this.despachos.length}`,
        cliente: this.despachoForm.cliente!, direccion: this.despachoForm.direccion || '—',
        producto: this.despachoForm.producto!, peso: this.despachoForm.peso || '—',
        transportista: this.despachoForm.transportista || '—', estado: 'Pendiente',
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

  guardarOrden() {
    if (!this.ordenForm.proveedor || !this.ordenForm.producto) {
      this.showToast('Complete los campos requeridos', 'error'); return;
    }
    if (this.modalMode === 'crear') {
      const nueva: OrdenCompra = {
        id: `#OC-0${422 + this.ordenes.length}`,
        proveedor: this.ordenForm.proveedor!, origen: this.ordenForm.origen || '—',
        producto: this.ordenForm.producto!, cantidad: this.ordenForm.cantidad || '—',
        total: this.ordenForm.total || 0, fechaEntrega: this.ordenForm.fechaEntrega || '—',
        estado: 'Pendiente',
      };
      this.ordenes.unshift(nueva);
      this.showToast('Orden de compra creada');
    } else {
      const idx = this.ordenes.findIndex(o => o.id === this.ordenForm.id);
      if (idx !== -1) this.ordenes[idx] = { ...this.ordenes[idx], ...this.ordenForm } as OrdenCompra;
      this.showToast('Orden actualizada');
    }
    this.closeModal();
  }

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

  guardarEmpleado() {
    if (!this.empleadoForm.nombre) {
      this.showToast('Complete los campos requeridos', 'error'); return;
    }
    if (this.modalMode === 'crear') {
      const colores = ['#1A365D','#38A169','#DD6B20','#E53E3E','#805AD5'];
      const nuevo: Empleado = {
        id: `EMP-0${100 + this.empleados.length}`,
        iniciales: this.empleadoForm.nombre!.split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase(),
        color: colores[this.empleados.length % colores.length],
        nombre: this.empleadoForm.nombre!, cargo: this.empleadoForm.cargo || '—',
        area: this.empleadoForm.area || '—', horaEntrada: '—', tardanza: '—',
        asistencia: 'Presente', observacion: '—',
      };
      this.empleados.push(nuevo);
      this.showToast('Empleado registrado');
    } else {
      const idx = this.empleados.findIndex(e => e.id === this.empleadoForm.id);
      if (idx !== -1) this.empleados[idx] = { ...this.empleados[idx], ...this.empleadoForm } as Empleado;
      this.showToast('Empleado actualizado');
    }
    this.closeModal();
  }

  // ─── CAMBIAR ESTADO ────────────────────────────────────────────────────────

  cambiarEstadoVenta(venta: Venta, estado: Venta['estado']) {
    venta.estado = estado;
    this.showToast(`Venta ${venta.id} → ${estado}`);
  }

  cambiarEstadoDespacho(d: Despacho, estado: Despacho['estado']) {
    d.estado = estado;
    this.showToast(`Guía ${d.guia} → ${estado}`);
  }

  cambiarEstadoOrden(o: OrdenCompra, estado: OrdenCompra['estado']) {
    o.estado = estado;
    this.showToast(`Orden ${o.id} → ${estado}`);
  }

  cambiarAsistencia(emp: Empleado, asistencia: Empleado['asistencia']) {
    emp.asistencia = asistencia;
    this.showToast(`${emp.nombre} → ${asistencia}`);
  }

  procesarPago(p: Planilla) {
    p.estado = 'Pagado';
    this.showToast(`Pago procesado para ${p.nombre}`);
  }

  confirmarEntrega(d: Despacho) {
    d.estado = 'Entregado';
    this.showToast(`Entrega confirmada: ${d.guia}`);
  }

  verBoleta(p: Planilla) {
    this.boletaEmpleado = p;
    this.modalTipo = 'boleta';
    this.modalTitle = `Boleta de Pago — ${p.nombre}`;
    this.showModal = true;
  }

  // ─── ELIMINAR ──────────────────────────────────────────────────────────────

  pedirEliminar(tipo: string, item: any) {
    this.deleteConfirm = true;
    this.deleteTarget = item;
    this.deleteTargetTipo = tipo;
    this.modalTipo = 'eliminar';
    this.modalTitle = 'Confirmar Eliminación';
    this.showModal = true;
  }

  confirmarEliminar() {
    if (this.deleteTargetTipo === 'venta') {
      this.ventas = this.ventas.filter(v => v !== this.deleteTarget);
      this.showToast('Venta eliminada');
    } else if (this.deleteTargetTipo === 'producto') {
      this.productos = this.productos.filter(p => p !== this.deleteTarget);
      this.showToast('Producto eliminado');
    } else if (this.deleteTargetTipo === 'despacho') {
      this.despachos = this.despachos.filter(d => d !== this.deleteTarget);
      this.showToast('Despacho eliminado');
    } else if (this.deleteTargetTipo === 'orden') {
      this.ordenes = this.ordenes.filter(o => o !== this.deleteTarget);
      this.showToast('Orden eliminada');
    } else if (this.deleteTargetTipo === 'proveedor') {
      this.proveedores = this.proveedores.filter(p => p !== this.deleteTarget);
      this.showToast('Proveedor eliminado');
    } else if (this.deleteTargetTipo === 'empleado') {
      this.empleados = this.empleados.filter(e => e !== this.deleteTarget);
      this.showToast('Empleado eliminado');
    }
    this.closeModal();
  }

  // ─── FILTROS ───────────────────────────────────────────────────────────────

  get ventasFiltradas(): Venta[] {
    return this.ventas.filter(v => {
      const matchSearch = !this.ventaSearch ||
        v.cliente.toLowerCase().includes(this.ventaSearch.toLowerCase()) ||
        v.id.toLowerCase().includes(this.ventaSearch.toLowerCase());
      const matchEstado = !this.ventaFiltroEstado || v.estado === this.ventaFiltroEstado;
      return matchSearch && matchEstado;
    });
  }

  get productosFiltrados(): Producto[] {
    return this.productos.filter(p => {
      const matchSearch = !this.inventarioSearch ||
        p.nombre.toLowerCase().includes(this.inventarioSearch.toLowerCase()) ||
        p.codigo.toLowerCase().includes(this.inventarioSearch.toLowerCase());
      const matchCat = !this.inventarioFiltroCategoria || p.categoria === this.inventarioFiltroCategoria;
      const matchEstado = !this.inventarioFiltroEstado || this.getEstadoProducto(p) === this.inventarioFiltroEstado;
      return matchSearch && matchCat && matchEstado;
    });
  }

  get despachosFiltrados(): Despacho[] {
    return this.despachos.filter(d => {
      const matchSearch = !this.despachoSearch ||
        d.cliente.toLowerCase().includes(this.despachoSearch.toLowerCase()) ||
        d.guia.toLowerCase().includes(this.despachoSearch.toLowerCase());
      const matchEstado = !this.despachoFiltroEstado || d.estado === this.despachoFiltroEstado;
      return matchSearch && matchEstado;
    });
  }

  get ordenesFiltradas(): OrdenCompra[] {
    return this.ordenes.filter(o => {
      const matchSearch = !this.abastSearch ||
        o.proveedor.toLowerCase().includes(this.abastSearch.toLowerCase()) ||
        o.id.toLowerCase().includes(this.abastSearch.toLowerCase());
      const matchEstado = !this.abastFiltroEstado || o.estado === this.abastFiltroEstado;
      return matchSearch && matchEstado;
    });
  }

  get proveedoresFiltrados(): Proveedor[] {
    return this.proveedores.filter(p => {
      const matchSearch = !this.provSearch ||
        p.nombre.toLowerCase().includes(this.provSearch.toLowerCase()) ||
        p.ruc.toLowerCase().includes(this.provSearch.toLowerCase());
      const matchEstado = !this.provFiltroEstado || p.estado === this.provFiltroEstado;
      return matchSearch && matchEstado;
    });
  }

  get empleadosFiltrados(): Empleado[] {
    return this.empleados.filter(e => {
      return !this.rrhhFiltroArea || e.area === this.rrhhFiltroArea;
    });
  }

  // ─── HELPERS ───────────────────────────────────────────────────────────────

  getEstadoProducto(p: Producto): string {
    if (p.stock === 0) return 'Sin stock';
    if (p.stock < p.minimo) return 'Bajo stock';
    return 'Normal';
  }

  getStockPct(p: Producto): number {
    const max = p.minimo * 8;
    return Math.min(100, Math.round((p.stock / max) * 100));
  }

  getStockColor(p: Producto): string {
    const pct = this.getStockPct(p);
    if (pct === 0) return '#E53E3E';
    if (pct < 20) return '#E53E3E';
    if (pct < 40) return '#DD6B20';
    return '#38A169';
  }

  getBadgeClass(estado: string): string {
    const map: Record<string, string> = {
      'Aprobado': 'badge-green', 'Pagado': 'badge-green', 'Entregado': 'badge-green',
      'Activo': 'badge-green', 'Presente': 'badge-green', 'Normal': 'badge-green', 'Aprobada': 'badge-green',
      'Pendiente': 'badge-orange', 'Tardanza': 'badge-yellow', 'En revisión': 'badge-yellow', 'Bajo': 'badge-yellow',
      'Rechazado': 'badge-red', 'Ausente': 'badge-red', 'Sin stock': 'badge-red', 'Bajo stock': 'badge-red',
      'Enviado': 'badge-blue', 'En tránsito': 'badge-blue', 'Inactivo': 'badge-red',
    };
    return map[estado] || 'badge-yellow';
  }

  getTotalNeto(p: Planilla): number {
    return p.salarioBase - p.descuentos + p.bonos;
  }

  formatMoney(n: number): string {
    return 'S/ ' + n.toLocaleString('es-PE');
  }

  getVentasTotales(): number {
    return this.ventas.reduce((s, v) => s + v.total, 0);
  }

  getVentasPendientes(): number {
    return this.ventas.filter(v => v.estado === 'Pendiente').length;
  }

  getVentasCompletadas(): number {
    return this.ventas.filter(v => v.estado === 'Aprobado').length;
  }

  areasUnicas(): string[] {
    return [...new Set(this.empleados.map(e => e.area))];
  }


// ── Notificaciones ──
showNotif = false;
notificaciones = [
  { icono: '📦', titulo: 'Stock crítico', msg: 'Alambre galvanizado #16 sin stock', tiempo: 'Hace 5 min', leida: false },
  { icono: '🚚', titulo: 'Despacho pendiente', msg: 'Guía #GUI-1840 sin confirmar entrega', tiempo: 'Hace 20 min', leida: false },
  { icono: '💰', titulo: 'Nueva venta', msg: 'Pedido #PED-2847 aprobado por S/ 48,200', tiempo: 'Hace 1 hora', leida: true },
  { icono: '⚠️', titulo: 'Orden pendiente', msg: 'OC-0420 requiere aprobación', tiempo: 'Hace 2 horas', leida: true },
  { icono: '👤', titulo: 'Empleado ausente', msg: 'Ana Paredes registró licencia médica', tiempo: 'Hace 3 horas', leida: true },
];

get notifNoLeidas(): number {
  return this.notificaciones.filter(n => !n.leida).length;
}

toggleNotif() {
  this.showNotif = !this.showNotif;
}

marcarLeida(n: any) {
  n.leida = true;
}

marcarTodasLeidas() {
  this.notificaciones.forEach(n => n.leida = true);
}

cerrarNotif() {
  this.showNotif = false;
}







}