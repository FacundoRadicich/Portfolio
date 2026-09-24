-- Tablas del modulo Puntos de Venta (mapa + autovalidacion).
-- Independientes de las tablas existentes del marketplace.
-- Idempotente: se puede correr varias veces.

DO $$ BEGIN
  CREATE TYPE "Canal" AS ENUM ('MINORISTA', 'MAYORISTA', 'AMBOS');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS "Cliente" (
  "id"              TEXT PRIMARY KEY,
  "slug"            TEXT NOT NULL,
  "validationToken" TEXT NOT NULL,
  "razonSocial"     TEXT NOT NULL,
  "cuit"            TEXT,
  "canal"           "Canal" NOT NULL DEFAULT 'MINORISTA',
  "destacado"       BOOLEAN NOT NULL DEFAULT false,
  "whatsapp"        TEXT,
  "phone"           TEXT,
  "email"           TEXT,
  "instagram"       TEXT,
  "facebook"        TEXT,
  "tiendaOnline"    TEXT,
  "web"             TEXT,
  "active"          BOOLEAN NOT NULL DEFAULT true,
  "validatedAt"     TIMESTAMP(3),
  "createdAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX IF NOT EXISTS "Cliente_slug_key" ON "Cliente"("slug");
CREATE UNIQUE INDEX IF NOT EXISTS "Cliente_validationToken_key" ON "Cliente"("validationToken");

CREATE TABLE IF NOT EXISTS "Sucursal" (
  "id"           TEXT PRIMARY KEY,
  "clienteId"    TEXT NOT NULL,
  "nombre"       TEXT NOT NULL,
  "tipo"         TEXT NOT NULL,
  "phone"        TEXT,
  "whatsapp"     TEXT,
  "address"      TEXT,
  "barrio"       TEXT,
  "localidad"    TEXT,
  "provincia"    TEXT,
  "codigoPostal" TEXT,
  "pais"         TEXT NOT NULL DEFAULT 'Argentina',
  "horario"      TEXT,
  "descripcion"  TEXT,
  "tiendaOnline" TEXT,
  "web"          TEXT,
  "instagram"    TEXT,
  "facebook"     TEXT,
  "lat"          DOUBLE PRECISION,
  "lng"          DOUBLE PRECISION,
  "active"       BOOLEAN NOT NULL DEFAULT true,
  "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Sucursal_clienteId_fkey" FOREIGN KEY ("clienteId")
    REFERENCES "Cliente"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "Sucursal_provincia_idx" ON "Sucursal"("provincia");
CREATE INDEX IF NOT EXISTS "Sucursal_clienteId_idx" ON "Sucursal"("clienteId");

CREATE TABLE IF NOT EXISTS "Event" (
  "id"           TEXT PRIMARY KEY,
  "type"         TEXT NOT NULL,
  "sucursalId"   TEXT,
  "query"        TEXT,
  "localidad"    TEXT,
  "resultsCount" INTEGER,
  "anonId"       TEXT,
  "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Event_sucursalId_fkey" FOREIGN KEY ("sucursalId")
    REFERENCES "Sucursal"("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "Event_type_createdAt_idx" ON "Event"("type", "createdAt");
CREATE INDEX IF NOT EXISTS "Event_sucursalId_idx" ON "Event"("sucursalId");

CREATE TABLE IF NOT EXISTS "Resena" (
  "id"         TEXT PRIMARY KEY,
  "sucursalId" TEXT NOT NULL,
  "rating"     INTEGER NOT NULL,
  "consiguio"  BOOLEAN,
  "comentario" TEXT,
  "estado"     TEXT NOT NULL DEFAULT 'PENDIENTE',
  "anonId"     TEXT,
  "createdAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Resena_sucursalId_fkey" FOREIGN KEY ("sucursalId")
    REFERENCES "Sucursal"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "Resena_sucursalId_estado_idx" ON "Resena"("sucursalId", "estado");
