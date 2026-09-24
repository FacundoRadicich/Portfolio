-- Oh My Chalk Marketplace — Setup SQL con RLS
-- Pegar en Supabase SQL Editor y ejecutar

-- ── Tipos ─────────────────────────────────────────────────────────────────────

CREATE TYPE "Tier" AS ENUM ('EMBAJADORA', 'INSTRUCTORA', 'COLABORADORA');

-- ── Tablas ────────────────────────────────────────────────────────────────────

CREATE TABLE "Professor" (
  "id"          TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "slug"        TEXT NOT NULL,
  "name"        TEXT NOT NULL,
  "bio"         TEXT NOT NULL,
  "photoUrl"    TEXT NOT NULL,
  "coverUrl"    TEXT,
  "tier"        "Tier" NOT NULL DEFAULT 'COLABORADORA',
  "whatsapp"    TEXT NOT NULL,
  "instagram"   TEXT,
  "facebook"    TEXT,
  "specialties" TEXT[] NOT NULL DEFAULT '{}',
  "province"    TEXT NOT NULL,
  "city"        TEXT NOT NULL,
  "active"      BOOLEAN NOT NULL DEFAULT true,
  "userId"      UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Professor_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Professor_slug_key" ON "Professor"("slug");
CREATE UNIQUE INDEX "Professor_userId_key" ON "Professor"("userId");

CREATE TABLE "Workshop" (
  "id"           TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "slug"         TEXT NOT NULL,
  "title"        TEXT NOT NULL,
  "description"  TEXT NOT NULL,
  "photoUrl"     TEXT NOT NULL,
  "date"         TIMESTAMP(3) NOT NULL,
  "duration"     TEXT NOT NULL,
  "price"        INTEGER,
  "province"     TEXT NOT NULL,
  "city"         TEXT NOT NULL,
  "maxSpots"     INTEGER,
  "whatsappMsg"  TEXT NOT NULL,
  "whatsappNum"  TEXT NOT NULL,
  "active"       BOOLEAN NOT NULL DEFAULT true,
  "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "professorId"  TEXT NOT NULL,
  CONSTRAINT "Workshop_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Workshop_slug_key" ON "Workshop"("slug");

CREATE TABLE "Category" (
  "id"   TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "name" TEXT NOT NULL,
  CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Category_name_key" ON "Category"("name");

CREATE TABLE "CategoriesOnWorkshops" (
  "workshopId"  TEXT NOT NULL,
  "categoryId"  TEXT NOT NULL,
  CONSTRAINT "CategoriesOnWorkshops_pkey" PRIMARY KEY ("workshopId", "categoryId")
);

CREATE TABLE "Subscriber" (
  "id"        TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "name"      TEXT NOT NULL,
  "email"     TEXT NOT NULL,
  "phone"     TEXT NOT NULL,
  "city"      TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Subscriber_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Subscriber_email_key" ON "Subscriber"("email");

-- ── Foreign keys ──────────────────────────────────────────────────────────────

ALTER TABLE "Workshop"
  ADD CONSTRAINT "Workshop_professorId_fkey"
  FOREIGN KEY ("professorId") REFERENCES "Professor"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "CategoriesOnWorkshops"
  ADD CONSTRAINT "CategoriesOnWorkshops_workshopId_fkey"
  FOREIGN KEY ("workshopId") REFERENCES "Workshop"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CategoriesOnWorkshops"
  ADD CONSTRAINT "CategoriesOnWorkshops_categoryId_fkey"
  FOREIGN KEY ("categoryId") REFERENCES "Category"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

-- ── updatedAt automático ──────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW."updatedAt" = CURRENT_TIMESTAMP; RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "Professor_updatedAt"
  BEFORE UPDATE ON "Professor"
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER "Workshop_updatedAt"
  BEFORE UPDATE ON "Workshop"
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ── RLS ───────────────────────────────────────────────────────────────────────

ALTER TABLE "Professor" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Workshop" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Category" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "CategoriesOnWorkshops" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Subscriber" ENABLE ROW LEVEL SECURITY;

-- Professor: lectura pública, escritura solo la propia profesora
CREATE POLICY "professors_public_read" ON "Professor"
  FOR SELECT USING (true);

CREATE POLICY "professors_own_update" ON "Professor"
  FOR UPDATE USING (auth.uid() = "userId");

-- Workshop: lectura pública, escritura solo la profesora dueña
CREATE POLICY "workshops_public_read" ON "Workshop"
  FOR SELECT USING (true);

CREATE POLICY "workshops_own_insert" ON "Workshop"
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM "Professor"
      WHERE "Professor"."id" = "professorId"
      AND "Professor"."userId" = auth.uid()
    )
  );

CREATE POLICY "workshops_own_update" ON "Workshop"
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM "Professor"
      WHERE "Professor"."id" = "professorId"
      AND "Professor"."userId" = auth.uid()
    )
  );

CREATE POLICY "workshops_own_delete" ON "Workshop"
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM "Professor"
      WHERE "Professor"."id" = "professorId"
      AND "Professor"."userId" = auth.uid()
    )
  );

-- Category: lectura pública, sin escritura para usuarias (solo admin vía service role)
CREATE POLICY "categories_public_read" ON "Category"
  FOR SELECT USING (true);

-- CategoriesOnWorkshops: lectura pública, escritura solo para dueña del taller
CREATE POLICY "cat_workshops_public_read" ON "CategoriesOnWorkshops"
  FOR SELECT USING (true);

CREATE POLICY "cat_workshops_own_write" ON "CategoriesOnWorkshops"
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM "Workshop" w
      JOIN "Professor" p ON p."id" = w."professorId"
      WHERE w."id" = "workshopId"
      AND p."userId" = auth.uid()
    )
  );

-- Subscriber: sin acceso para usuarios finales (solo service role / admin)
-- No se crea política pública → solo accesible con service_role key
