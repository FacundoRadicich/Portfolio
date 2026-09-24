-- Campo libre para que el comercio comente algo que la validación no preguntó
-- explícitamente. Interno (no se muestra al comprador). Idempotente.

ALTER TABLE "Sucursal" ADD COLUMN IF NOT EXISTS "comentarios" TEXT;
