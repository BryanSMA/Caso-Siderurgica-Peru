import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

/**
 * Validators personalizados compartidos
 * Ruta: src/app/core/validators/custom-validators.ts
 * Uso: import { CustomValidators } from '@core/validators/custom-validators';
 */
export class CustomValidators {

  // ─── Regex centralizados ────────────────────────────────────────────────────
  static readonly REGEX = {
    ruc:        /^[0-9]{11}$/,
    telefono:   /^[0-9]{9}$/,
    password:   /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,20}$/,
    hora:       /^([01]\d|2[0-3]):[0-5]\d$/,
  };

  // ─── noSameDigits ────────────────────────────────────────────────────────────
  /** Rechaza valores donde todos los dígitos son iguales (ej. "11111111111") */
  static noSameDigits(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = control.value?.toString().trim() ?? '';
      if (!value) return null;
      const allSame = value.split('').every((c: string) => c === value[0]);
      return allSame ? { sameDigits: true } : null;
    };
  }

  // ─── telefono ───────────────────────────────────────────────────────────────
  /** Valida exactamente 9 dígitos numéricos */
  static telefono(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = control.value?.toString().trim() ?? '';
      if (!value) return null;
      return CustomValidators.REGEX.telefono.test(value) ? null : { telefonoInvalido: true };
    };
  }

  // ─── ruc ────────────────────────────────────────────────────────────────────
  /** Valida exactamente 11 dígitos numéricos */
  static ruc(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = control.value?.toString().trim() ?? '';
      if (!value) return null;
      return CustomValidators.REGEX.ruc.test(value) ? null : { rucInvalido: true };
    };
  }

  // ─── horaValida ─────────────────────────────────────────────────────────────
  /** Valida formato HH:MM en rango 00:00–23:59 */
  static horaValida(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = control.value?.toString().trim() ?? '';
      if (!value) return null;
      return CustomValidators.REGEX.hora.test(value) ? null : { horaInvalida: true };
    };
  }

  // ─── soloNumerosInput ───────────────────────────────────────────────────────
  /**
   * Helper para eventos (input) en campos numéricos: limpia caracteres no numéricos
   * y actualiza el control.
   * Uso en template: (input)="CustomValidators.soloNumerosInput($event, form.get('ruc'))"
   */
  static soloNumerosInput(event: Event, control: AbstractControl | null): void {
    const input = event.target as HTMLInputElement;
    input.value = input.value.replace(/[^0-9]/g, '');
    control?.setValue(input.value, { emitEvent: true });
  }

  // ─── getErrorMessage ────────────────────────────────────────────────────────
  /**
   * Devuelve el mensaje de error en español para un control dado.
   * @param control  — el AbstractControl a inspeccionar
   * @param label    — nombre legible del campo (ej. "RUC", "Teléfono")
   * @param fieldKey — clave opcional para mensajes específicos por campo
   */
  static getErrorMessage(
    control: AbstractControl | null,
    label: string = 'Campo',
    fieldKey?: string
  ): string {
    if (!control || !control.errors) return '';
    const e = control.errors;

    // ── Errores de Angular built-in ──────────────────────────────────────────
    if (e['required'])
      return `${label} es obligatorio.`;

    if (e['minlength'])
      return `${label} debe tener al menos ${e['minlength'].requiredLength} caracteres.`;

    if (e['maxlength'])
      return `${label} no puede superar ${e['maxlength'].requiredLength} caracteres.`;

    if (e['min']) {
      const minVal = e['min'].min;
      if (minVal === 1)   return `${label} debe ser al menos 1.`;
      if (minVal === 0.01) return `${label} debe ser mayor a 0.`;
      return `${label} debe ser al menos ${minVal}.`;
    }

    if (e['max']) {
      return `${label} no puede superar ${e['max'].max}.`;
    }



    // ── Errores de pattern — mensajes específicos por campo ──────────────────
    if (e['pattern']) {
      if (fieldKey === 'ruc' || label.toLowerCase() === 'ruc')
        return `El RUC debe tener exactamente 11 dígitos numéricos.`;
      if (fieldKey === 'telefono' || label.toLowerCase() === 'teléfono')
        return `El teléfono debe tener exactamente 9 dígitos.`;
      if (fieldKey === 'password' || label.toLowerCase() === 'contraseña')
        return `La contraseña debe tener 8–20 caracteres, incluyendo mayúscula, minúscula, número y símbolo (@$!%*?&).`;
      return `${label} tiene un formato inválido.`;
    }

    // ── Errores de validators personalizados ─────────────────────────────────
    if (e['sameDigits'])
      return `${label} no puede tener todos los dígitos iguales.`;


    if (e['rucInvalido'])
      return `El RUC debe tener exactamente 11 dígitos numéricos.`;

    if (e['telefonoInvalido'])
      return `El teléfono debe tener exactamente 9 dígitos.`;

    if (e['horaInvalida'])
      return `Ingrese una hora válida en formato HH:MM (ej. 08:30).`;

    return 'Valor inválido.';
  }

  // ─── showError ──────────────────────────────────────────────────────────────
  /**
   * ¿Debe mostrarse el error?
   * Retorna true si el control es inválido y fue tocado, modificado, o se hizo markAllAsTouched.
   */
  static showError(control: AbstractControl | null): boolean {
    return !!control && control.invalid && (control.touched || control.dirty);
  }
}