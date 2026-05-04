import { useState, useEffect, useCallback } from 'react';
import { supabase } from './supabaseClient';
import type { 
  Paciente, HistoriaClinica, Odontograma, Presupuesto, 
  Cita, Pago, CatalogoTratamiento,
  CreatePacienteInput, CreateHistoriaInput, CreateCitaInput, ToothState
} from './database.types';

// ============================================================
// PACIENTES
// ============================================================

export function usePacientes() {
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPacientes = useCallback(async (searchTerm?: string) => {
    setLoading(true);
    let query = supabase.from('pacientes').select('*').order('created_at', { ascending: false });
    if (searchTerm) {
      query = query.ilike('nombre', `%${searchTerm}%`);
    }
    const { data, error } = await query;
    if (!error && data) setPacientes(data);
    setLoading(false);
    return { data, error };
  }, []);

  useEffect(() => { fetchPacientes(); }, [fetchPacientes]);

  return { pacientes, loading, refetch: fetchPacientes };
}

export function usePaciente(id: string | undefined) {
  const [paciente, setPaciente] = useState<Paciente | null>(null);
  const [historia, setHistoria] = useState<HistoriaClinica | null>(null);
  const [presupuestos, setPresupuestos] = useState<Presupuesto[]>([]);
  const [citas, setCitas] = useState<Cita[]>([]);
  const [pagos, setPagos] = useState<Pago[]>([]);
  const [odontograma, setOdontograma] = useState<Odontograma | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    if (!id) return;
    setLoading(true);

    const [pacRes, histRes, presRes, citasRes, pagosRes, odoRes] = await Promise.all([
      supabase.from('pacientes').select('*').eq('id', id).single(),
      supabase.from('historias_clinicas').select('*').eq('paciente_id', id).order('created_at', { ascending: false }).limit(1).maybeSingle(),
      supabase.from('presupuestos').select('*, items_presupuesto(*)').eq('paciente_id', id).order('created_at', { ascending: false }),
      supabase.from('citas').select('*').eq('paciente_id', id).order('fecha', { ascending: false }),
      supabase.from('pagos').select('*').eq('paciente_id', id).order('created_at', { ascending: false }),
      supabase.from('odontogramas').select('*').eq('paciente_id', id).order('created_at', { ascending: false }).limit(1).maybeSingle(),
    ]);

    if (pacRes.data) setPaciente(pacRes.data);
    if (histRes.data) setHistoria(histRes.data);
    if (presRes.data) setPresupuestos(presRes.data);
    if (citasRes.data) setCitas(citasRes.data);
    if (pagosRes.data) setPagos(pagosRes.data);
    if (odoRes.data) setOdontograma(odoRes.data);

    setLoading(false);
  }, [id]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  return { paciente, historia, presupuestos, citas, pagos, odontograma, loading, refetch: fetchAll };
}

export async function createPaciente(input: CreatePacienteInput) {
  const { data, error } = await supabase
    .from('pacientes')
    .insert(input)
    .select()
    .single();
  return { data, error };
}

export async function createHistoriaClinica(input: CreateHistoriaInput) {
  const { data, error } = await supabase
    .from('historias_clinicas')
    .insert(input)
    .select()
    .single();
  return { data, error };
}

export async function createConsentimiento(input: {
  paciente_id: string;
  doctor_nombre?: string;
  tratamiento?: string;
  riesgos?: string;
  firma_url?: string;
}) {
  const { data, error } = await supabase
    .from('consentimientos')
    .insert(input)
    .select()
    .single();
  return { data, error };
}

// ============================================================
// ODONTOGRAMAS
// ============================================================

export function useOdontograma(pacienteId: string | undefined) {
  const [odontograma, setOdontograma] = useState<Odontograma | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!pacienteId) return;
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from('odontogramas')
        .select('*')
        .eq('paciente_id', pacienteId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (data) setOdontograma(data);
      setLoading(false);
    })();
  }, [pacienteId]);

  const saveOdontograma = async (teethData: Record<number, ToothState>, doctorNombre?: string) => {
    if (!pacienteId) return { error: new Error('No paciente ID') };

    if (odontograma) {
      // Update existing
      const { data, error } = await supabase
        .from('odontogramas')
        .update({ teeth_data: teethData, doctor_nombre: doctorNombre })
        .eq('id', odontograma.id)
        .select()
        .single();
      if (data) setOdontograma(data);
      return { data, error };
    } else {
      // Create new
      const { data, error } = await supabase
        .from('odontogramas')
        .insert({ paciente_id: pacienteId, teeth_data: teethData, doctor_nombre: doctorNombre })
        .select()
        .single();
      if (data) setOdontograma(data);
      return { data, error };
    }
  };

  return { odontograma, loading, saveOdontograma };
}

// ============================================================
// CATÁLOGO DE TRATAMIENTOS
// ============================================================

export function useCatalogo() {
  const [catalogo, setCatalogo] = useState<CatalogoTratamiento[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('catalogo_tratamientos')
        .select('*')
        .eq('activo', true)
        .order('nombre');
      if (data) setCatalogo(data);
      setLoading(false);
    })();
  }, []);

  return { catalogo, loading };
}

// ============================================================
// PRESUPUESTOS
// ============================================================

export async function createPresupuesto(input: {
  paciente_id: string;
  odontograma_id?: string;
  doctor_nombre?: string;
  subtotal: number;
  descuento_pct: number;
  total: number;
  notas?: string;
  firma_url?: string;
  items: { pieza: string; descripcion: string; precio_unitario: number; cantidad: number }[];
}) {
  const { items, ...presData } = input;
  
  // Create presupuesto
  const { data: pres, error: presError } = await supabase
    .from('presupuestos')
    .insert({ ...presData, estado: 'pendiente' })
    .select()
    .single();

  if (presError || !pres) return { data: null, error: presError };

  // Create items
  const itemsWithId = items.map(item => ({
    ...item,
    presupuesto_id: pres.id,
  }));

  const { error: itemsError } = await supabase
    .from('items_presupuesto')
    .insert(itemsWithId);

  return { data: pres, error: itemsError };
}

// ============================================================
// CITAS
// ============================================================

export function useCitas(weekStart?: string, weekEnd?: string) {
  const [citas, setCitas] = useState<Cita[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCitas = useCallback(async (start?: string, end?: string) => {
    setLoading(true);
    let query = supabase.from('citas').select('*, paciente:pacientes(nombre)').order('fecha').order('hora');
    
    if (start && end) {
      query = query.gte('fecha', start).lte('fecha', end);
    }

    const { data, error } = await query;
    if (!error && data) setCitas(data as any);
    setLoading(false);
    return { data, error };
  }, []);

  useEffect(() => { fetchCitas(weekStart, weekEnd); }, [fetchCitas, weekStart, weekEnd]);

  return { citas, loading, refetch: fetchCitas };
}

export async function createCita(input: CreateCitaInput) {
  const { paciente_nombre, ...citaData } = input;
  const { data, error } = await supabase
    .from('citas')
    .insert({
      ...citaData,
      estado: 'pendiente',
      color: input.color || '#0EA5E9'
    })
    .select()
    .single();
  return { data, error };
}

// ============================================================
// PAGOS
// ============================================================

export async function createPago(input: {
  paciente_id: string;
  presupuesto_id?: string;
  monto: number;
  metodo_pago?: string;
  sucursal_id?: string;
  recibido_por?: string;
}) {
  const { data, error } = await supabase.from('pagos').insert(input).select().single();
  return { data, error };
}

// ============================================================
// DASHBOARD / ANALYTICS
// ============================================================

export function useDashboard() {
  const [stats, setStats] = useState({
    ingresosHoy: 0,
    ingresosMes: 0,
    cuentasPorCobrar: 0,
    pagosRecientes: [] as any[],
    ingresosPorDia: [] as { name: string; AltoFlujo: number; Regular: number }[],
    presupuestosPendientes: 0,
    citasHoy: [] as Cita[],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const today = new Date().toISOString().split('T')[0];
      const monthStart = today.substring(0, 7) + '-01';

      // Pagos de hoy
      const { data: pagosHoy } = await supabase
        .from('pagos')
        .select('monto, sucursal_id')
        .gte('created_at', today + 'T00:00:00')
        .lte('created_at', today + 'T23:59:59');

      // Pagos del mes
      const { data: pagosMes } = await supabase
        .from('pagos')
        .select('monto, sucursal_id, created_at')
        .gte('created_at', monthStart + 'T00:00:00');

      // Presupuestos pendientes (cuentas por cobrar)
      const { data: presPendientes } = await supabase
        .from('presupuestos')
        .select('total')
        .in('estado', ['pendiente', 'aceptado', 'en_proceso']);

      // Pagos recientes con joins
      const { data: pagosRecientes } = await supabase
        .from('pagos')
        .select('*, paciente:pacientes(nombre)')
        .order('created_at', { ascending: false })
        .limit(10);

      // Citas de hoy
      const { data: citasHoy } = await supabase
        .from('citas')
        .select('*, paciente:pacientes(nombre)')
        .eq('fecha', today);

      const ingresosHoy = pagosHoy?.reduce((s, p) => s + Number(p.monto), 0) || 0;
      const ingresosMes = pagosMes?.reduce((s, p) => s + Number(p.monto), 0) || 0;
      const cuentasPorCobrar = presPendientes?.reduce((s, p) => s + Number(p.total), 0) || 0;

      // Group payments by day of week for chart
      const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
      const byDay = days.map(name => ({ name, AltoFlujo: 0, Regular: 0 }));
      pagosMes?.forEach(p => {
        const d = new Date(p.created_at).getDay();
        if (p.sucursal_id === 'alto_flujo') byDay[d].AltoFlujo += Number(p.monto);
        else byDay[d].Regular += Number(p.monto);
      });

      setStats({
        ingresosHoy,
        ingresosMes,
        cuentasPorCobrar,
        pagosRecientes: (pagosRecientes || []) as any,
        ingresosPorDia: byDay.slice(1), // Mon-Sat
        presupuestosPendientes: presPendientes?.length || 0,
        citasHoy: (citasHoy || []) as any,
      });
      setLoading(false);
    })();
  }, []);

  return { stats, loading };
}
