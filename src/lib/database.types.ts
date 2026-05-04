// TypeScript types matching the Supabase schema

export interface Paciente {
  id: string;
  nombre: string;
  apodo: string | null;
  edad: number | null;
  telefono: string | null;
  email: string | null;
  direccion: string | null;
  ocupacion: string | null;
  sucursal_id: string;
  created_at: string;
}

export interface HistoriaClinica {
  id: string;
  paciente_id: string;
  signos_vitales: {
    ta?: string;
    pulso?: string;
    fr?: string;
    peso?: string;
    talla?: string;
  };
  cuestionario_medico: Record<string, boolean | string>;
  historia_dental: Record<string, any>;
  alergias: string;
  observaciones: string | null;
  created_at: string;
}

export interface Consentimiento {
  id: string;
  paciente_id: string;
  doctor_nombre: string | null;
  tratamiento: string | null;
  riesgos: string | null;
  firma_url: string | null;
  created_at: string;
}

export interface ToothState {
  generalPre: string | null;
  generalLesion: string | null;
  generalTx: string | null;
  surfacesPre: Record<string, string>;
  surfacesLesion: Record<string, string>;
  surfacesTx: Record<string, string>;
}

export interface Odontograma {
  id: string;
  paciente_id: string;
  teeth_data: Record<number, ToothState>;
  doctor_nombre: string | null;
  notas: string | null;
  created_at: string;
}

export interface CatalogoTratamiento {
  id: string;
  codigo: string;
  nombre: string;
  precio: number;
  categoria: string;
  activo: boolean;
  created_at: string;
}

export interface Presupuesto {
  id: string;
  paciente_id: string;
  odontograma_id: string | null;
  doctor_nombre: string | null;
  subtotal: number;
  descuento_pct: number;
  total: number;
  notas: string | null;
  firma_url: string | null;
  estado: 'pendiente' | 'aceptado' | 'en_proceso' | 'pagado' | 'cancelado';
  created_at: string;
  // Joined
  items?: ItemPresupuesto[];
  paciente?: Paciente;
}

export interface ItemPresupuesto {
  id: string;
  presupuesto_id: string;
  pieza: string | null;
  descripcion: string;
  precio_unitario: number;
  cantidad: number;
  subtotal: number;
}

export interface Cita {
  id: string;
  paciente_id: string;
  doctor_nombre: string | null;
  sucursal_id: string;
  tratamiento: string | null;
  fecha: string;
  hora: string;
  duracion_min: number;
  estado: 'pendiente' | 'completada' | 'cancelada';
  color: string;
  created_at: string;
  // Joined
  paciente?: Paciente;
}

export interface Pago {
  id: string;
  paciente_id: string;
  presupuesto_id: string | null;
  monto: number;
  metodo_pago: 'efectivo' | 'tarjeta' | 'transferencia';
  sucursal_id: string;
  recibido_por: string | null;
  created_at: string;
}

// Form input types for creating records
export interface CreatePacienteInput {
  nombre: string;
  apodo?: string;
  edad?: number;
  telefono?: string;
  email?: string;
  direccion?: string;
  ocupacion?: string;
  sucursal_id?: string;
}

export interface CreateHistoriaInput {
  paciente_id: string;
  signos_vitales: Record<string, string>;
  cuestionario_medico: Record<string, boolean | string>;
  historia_dental: Record<string, any>;
  alergias?: string;
  observaciones?: string;
}

export interface CreateCitaInput {
  paciente_id?: string;
  paciente_nombre?: string;
  doctor_nombre: string;
  sucursal_id: string;
  tratamiento: string;
  fecha: string;
  hora: string;
  duracion_min: number;
  color?: string;
}
