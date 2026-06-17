import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UsuarioService, Usuario } from '../../../core/services/usuario.service';

@Component({
  selector: 'app-mantenimiento',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './mantenimiento.html',
   styles: []
})
export class MantenimientoComponent implements OnInit {

  usuariosSistema: Usuario[] = [];
  loadingUsuarios = false;
  showModal = false;
  modalMode: 'crear' | 'editar' = 'crear';
  usuarioForm: { username: string; password: string; rolId: number } = { username: '', password: '', rolId: 1 };
  guardando = false;
  toastMsg = ''; toastType: 'success' | 'error' | 'info' = 'success'; toastVisible = false;

  constructor(
    private usuarioService: UsuarioService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() { this.cargarUsuarios(); }

  cargarUsuarios() {
    this.loadingUsuarios = true;
    this.usuarioService.listarUsuarios().subscribe({
      next: (data) => { this.usuariosSistema = data; this.loadingUsuarios = false; this.cdr.detectChanges(); },
      error: () => { this.loadingUsuarios = false; this.showToast('Error al cargar usuarios', 'error'); }
    });
  }

  openModalCrear() { this.modalMode = 'crear'; this.usuarioForm = { username: '', password: '', rolId: 1 }; this.showModal = true; }
  openModalEditar(u: Usuario) { this.modalMode = 'editar'; this.usuarioForm = { username: u.username, password: '', rolId: 1 }; this.showModal = true; }
  closeModal() { this.showModal = false; }

  guardarUsuario() {
    if (!this.usuarioForm.username || !this.usuarioForm.password) { this.showToast('Complete usuario y contraseña', 'error'); return; }
    this.guardando = true;
    this.usuarioService.crearUsuario(this.usuarioForm).subscribe({
      next: () => { this.guardando = false; this.closeModal(); this.showToast('✅ Usuario creado exitosamente', 'success'); this.cargarUsuarios(); },
      error: () => { this.guardando = false; this.showToast('Error al crear usuario', 'error'); }
    });
  }

  getBadgeClass(estado: string): string {
    return estado === 'Activo' ? 'badge-green' : 'badge-red';
  }
  showToast(msg: string, type: 'success' | 'error' | 'info' = 'success') { this.toastMsg = msg; this.toastType = type; this.toastVisible = true; setTimeout(() => this.toastVisible = false, 3000); }
}