-- Traslada el seguimiento de exposición (exhibidor/muestras) de Cliente a Sucursal:
-- cada local puede tener distinta exposición, no aplica parejo a todo el cliente.
-- 'exhibidor' pasa de string único a dos booleanos para soportar "pie y mostrador".
-- Idempotente.

ALTER TABLE "Cliente" DROP COLUMN IF EXISTS "exhibidor";
ALTER TABLE "Cliente" DROP COLUMN IF EXISTS "muestrasPintadas";
ALTER TABLE "Cliente" DROP COLUMN IF EXISTS "muestrarioActualizado";

ALTER TABLE "Sucursal" ADD COLUMN IF NOT EXISTS "exhibidorPie" BOOLEAN;
ALTER TABLE "Sucursal" ADD COLUMN IF NOT EXISTS "exhibidorMostrador" BOOLEAN;
ALTER TABLE "Sucursal" ADD COLUMN IF NOT EXISTS "muestrasPintadas" BOOLEAN;
ALTER TABLE "Sucursal" ADD COLUMN IF NOT EXISTS "muestrarioActualizado" BOOLEAN;
