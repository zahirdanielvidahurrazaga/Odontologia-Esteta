-- ============================================================
-- SCHEMA: Odontología Esteta PWA
-- Run this in Supabase SQL Editor (supabase.com → SQL Editor)
-- ============================================================

-- 1. PACIENTES
CREATE TABLE IF NOT EXISTS pacientes (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre text NOT NULL,
  apodo text,
  edad integer,
  telefono text,
  email text,
  direccion text,
  ocupacion text,
  sucursal_id text DEFAULT 'alto_flujo' CHECK (sucursal_id IN ('alto_flujo', 'regular')),
  created_at timestamptz DEFAULT now()
);

-- 2. HISTORIAS CLÍNICAS
CREATE TABLE IF NOT EXISTS historias_clinicas (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  paciente_id uuid REFERENCES pacientes(id) ON DELETE CASCADE NOT NULL,
  signos_vitales jsonb DEFAULT '{}',
  cuestionario_medico jsonb DEFAULT '{}',
  historia_dental jsonb DEFAULT '{}',
  alergias text DEFAULT 'Ninguna',
  observaciones text,
  created_at timestamptz DEFAULT now()
);

-- 3. CONSENTIMIENTOS
CREATE TABLE IF NOT EXISTS consentimientos (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  paciente_id uuid REFERENCES pacientes(id) ON DELETE CASCADE NOT NULL,
  doctor_nombre text,
  tratamiento text,
  riesgos text,
  firma_url text,
  created_at timestamptz DEFAULT now()
);

-- 4. ODONTOGRAMAS
CREATE TABLE IF NOT EXISTS odontogramas (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  paciente_id uuid REFERENCES pacientes(id) ON DELETE CASCADE NOT NULL,
  teeth_data jsonb DEFAULT '{}' NOT NULL,
  doctor_nombre text,
  notas text,
  created_at timestamptz DEFAULT now()
);

-- 5. CATÁLOGO DE TRATAMIENTOS
CREATE TABLE IF NOT EXISTS catalogo_tratamientos (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  codigo text UNIQUE NOT NULL,
  nombre text NOT NULL,
  precio numeric(10,2) NOT NULL DEFAULT 0,
  categoria text DEFAULT 'general',
  activo boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- 6. PRESUPUESTOS
CREATE TABLE IF NOT EXISTS presupuestos (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  paciente_id uuid REFERENCES pacientes(id) ON DELETE CASCADE NOT NULL,
  odontograma_id uuid REFERENCES odontogramas(id) ON DELETE SET NULL,
  doctor_nombre text,
  subtotal numeric(10,2) DEFAULT 0,
  descuento_pct numeric(5,2) DEFAULT 0,
  total numeric(10,2) DEFAULT 0,
  notas text,
  firma_url text,
  estado text DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'aceptado', 'en_proceso', 'pagado', 'cancelado')),
  created_at timestamptz DEFAULT now()
);

-- 7. ITEMS DE PRESUPUESTO
CREATE TABLE IF NOT EXISTS items_presupuesto (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  presupuesto_id uuid REFERENCES presupuestos(id) ON DELETE CASCADE NOT NULL,
  pieza text,
  descripcion text NOT NULL,
  precio_unitario numeric(10,2) NOT NULL DEFAULT 0,
  cantidad integer DEFAULT 1,
  subtotal numeric(10,2) GENERATED ALWAYS AS (precio_unitario * cantidad) STORED
);

-- 8. CITAS
CREATE TABLE IF NOT EXISTS citas (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  paciente_id uuid REFERENCES pacientes(id) ON DELETE CASCADE NOT NULL,
  doctor_nombre text,
  sucursal_id text DEFAULT 'alto_flujo',
  tratamiento text,
  fecha date NOT NULL,
  hora time NOT NULL,
  duracion_min integer DEFAULT 60,
  estado text DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'completada', 'cancelada')),
  color text DEFAULT '#0EA5E9',
  created_at timestamptz DEFAULT now()
);

-- 9. PAGOS
CREATE TABLE IF NOT EXISTS pagos (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  paciente_id uuid REFERENCES pacientes(id) ON DELETE CASCADE NOT NULL,
  presupuesto_id uuid REFERENCES presupuestos(id) ON DELETE SET NULL,
  monto numeric(10,2) NOT NULL,
  metodo_pago text DEFAULT 'efectivo' CHECK (metodo_pago IN ('efectivo', 'tarjeta', 'transferencia')),
  sucursal_id text DEFAULT 'alto_flujo',
  recibido_por text,
  created_at timestamptz DEFAULT now()
);

-- ============================================================
-- INDEXES for performance
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_historias_paciente ON historias_clinicas(paciente_id);
CREATE INDEX IF NOT EXISTS idx_odontogramas_paciente ON odontogramas(paciente_id);
CREATE INDEX IF NOT EXISTS idx_presupuestos_paciente ON presupuestos(paciente_id);
CREATE INDEX IF NOT EXISTS idx_citas_fecha ON citas(fecha);
CREATE INDEX IF NOT EXISTS idx_citas_paciente ON citas(paciente_id);
CREATE INDEX IF NOT EXISTS idx_pagos_paciente ON pagos(paciente_id);
CREATE INDEX IF NOT EXISTS idx_pagos_presupuesto ON pagos(presupuesto_id);
CREATE INDEX IF NOT EXISTS idx_items_presupuesto ON items_presupuesto(presupuesto_id);

-- ============================================================
-- RLS (Row Level Security) — Permissive for now, tighten later
-- ============================================================
ALTER TABLE pacientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE historias_clinicas ENABLE ROW LEVEL SECURITY;
ALTER TABLE consentimientos ENABLE ROW LEVEL SECURITY;
ALTER TABLE odontogramas ENABLE ROW LEVEL SECURITY;
ALTER TABLE catalogo_tratamientos ENABLE ROW LEVEL SECURITY;
ALTER TABLE presupuestos ENABLE ROW LEVEL SECURITY;
ALTER TABLE items_presupuesto ENABLE ROW LEVEL SECURITY;
ALTER TABLE citas ENABLE ROW LEVEL SECURITY;
ALTER TABLE pagos ENABLE ROW LEVEL SECURITY;

-- Policies: Allow all operations for authenticated and anon users (MVP)
-- In production, restrict to authenticated users only
DO $$ 
DECLARE
  t text;
BEGIN
  FOR t IN SELECT unnest(ARRAY[
    'pacientes','historias_clinicas','consentimientos','odontogramas',
    'catalogo_tratamientos','presupuestos','items_presupuesto','citas','pagos'
  ]) LOOP
    EXECUTE format('CREATE POLICY "Enable all for anon" ON %I FOR ALL USING (true) WITH CHECK (true)', t);
  END LOOP;
END $$;

-- ============================================================
-- SEED: Catálogo de Tratamientos (precios iniciales)
-- ============================================================
INSERT INTO catalogo_tratamientos (codigo, nombre, precio, categoria) VALUES
  ('extraccion_tx',    'Extracción dental',                1500, 'cirugía'),
  ('corona_tx',        'Corona dental (porcelana)',         6500, 'restaurativa'),
  ('implante_tx',      'Implante dental',                 18000, 'cirugía'),
  ('endodoncia_tx',    'Endodoncia',                       4500, 'endodoncia'),
  ('amalgama_tx',      'Restauración con amalgama',         800, 'restaurativa'),
  ('restauracion_tx',  'Restauración con resina',          1200, 'restaurativa'),
  ('sellante_tx',      'Sellante de fosetas y fisuras',     600, 'preventiva'),
  ('caries',           'Tratamiento de caries',            1200, 'restaurativa'),
  ('limpieza',         'Limpieza dental profunda',          800, 'preventiva'),
  ('blanqueamiento',   'Blanqueamiento dental',            3500, 'estética'),
  ('ortodoncia',       'Ortodoncia (mensualidad)',         2500, 'ortodoncia'),
  ('periodoncia',      'Tratamiento periodontal',          2000, 'periodoncia'),
  ('radiografia',      'Radiografía panorámica',            400, 'diagnóstico'),
  ('valoracion',       'Valoración integral',               500, 'diagnóstico')
ON CONFLICT (codigo) DO NOTHING;
