-- Campos nuevos de Cliente: aprobación de altas nuevas + encuesta interna OMC.
-- Idempotente (ADD COLUMN IF NOT EXISTS).

ALTER TABLE "Cliente" ADD COLUMN IF NOT EXISTS "aprobado" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "Cliente" ADD COLUMN IF NOT EXISTS "exhibidor" TEXT;
ALTER TABLE "Cliente" ADD COLUMN IF NOT EXISTS "muestrasPintadas" BOOLEAN;
ALTER TABLE "Cliente" ADD COLUMN IF NOT EXISTS "muestrarioActualizado" BOOLEAN;
ALTER TABLE "Cliente" ADD COLUMN IF NOT EXISTS "talleres" TEXT[] NOT NULL DEFAULT '{}';
