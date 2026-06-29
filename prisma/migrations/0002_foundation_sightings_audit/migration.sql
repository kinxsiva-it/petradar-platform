CREATE TYPE "VolunteerVerificationState" AS ENUM (
  'NOT_APPLICABLE',
  'PENDING',
  'VERIFIED',
  'REJECTED'
);

CREATE TYPE "AnimalSpecies" AS ENUM (
  'CAT',
  'DOG',
  'OTHER'
);

CREATE TYPE "AnimalCondition" AS ENUM (
  'NORMAL_STRAY',
  'INJURED',
  'NEEDS_RESCUE',
  'NEWBORN_LITTER',
  'POSSIBLE_LOST_PET',
  'SICK',
  'PREGNANT',
  'AGGRESSIVE',
  'UNKNOWN'
);

CREATE TYPE "CollarStatus" AS ENUM (
  'NO_COLLAR',
  'RED_COLLAR_WITH_BELL',
  'BLUE_COLLAR',
  'UNKNOWN',
  'OTHER'
);

CREATE TYPE "UrgencyLevel" AS ENUM (
  'LOW',
  'MEDIUM',
  'HIGH',
  'EMERGENCY'
);

CREATE TYPE "SightingLifecycleStatus" AS ENUM (
  'SIGHTING',
  'POSSIBLE_MATCH',
  'NEEDS_RESCUE',
  'REUNITED',
  'CLOSED'
);

CREATE TYPE "VerificationStatus" AS ENUM (
  'PENDING',
  'VERIFIED',
  'COMMUNITY_VERIFIED',
  'NEEDS_REVIEW',
  'REJECTED',
  'DUPLICATE'
);

CREATE TYPE "PhotoStorageProvider" AS ENUM (
  'EXTERNAL_URL',
  'SUPABASE',
  'LOCAL_PLACEHOLDER'
);

ALTER TABLE "users"
  ADD COLUMN "phone" TEXT,
  ADD COLUMN "volunteer_verification" "VolunteerVerificationState" NOT NULL DEFAULT 'NOT_APPLICABLE';

CREATE TABLE "animal_sightings" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "reporter_id" UUID REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  "species" "AnimalSpecies" NOT NULL,
  "animal_count" INTEGER NOT NULL DEFAULT 1,
  "color" TEXT,
  "pattern" TEXT,
  "collar_status" "CollarStatus" NOT NULL DEFAULT 'UNKNOWN',
  "condition" "AnimalCondition" NOT NULL DEFAULT 'UNKNOWN',
  "description" TEXT,
  "seen_at" TIMESTAMPTZ(6) NOT NULL,
  "urgency" "UrgencyLevel" NOT NULL DEFAULT 'LOW',
  "lifecycle_status" "SightingLifecycleStatus" NOT NULL DEFAULT 'SIGHTING',
  "verification_status" "VerificationStatus" NOT NULL DEFAULT 'PENDING',
  "exact_location" geography(Point, 4326) NOT NULL,
  "public_location" geography(Point, 4326) NOT NULL,
  "public_radius_meters" INTEGER NOT NULL,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "animal_sightings_animal_count_positive" CHECK ("animal_count" > 0),
  CONSTRAINT "animal_sightings_public_radius_positive" CHECK ("public_radius_meters" > 0)
);

CREATE TABLE "sighting_photos" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "sighting_id" UUID NOT NULL REFERENCES "animal_sightings"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  "storage_provider" "PhotoStorageProvider" NOT NULL DEFAULT 'EXTERNAL_URL',
  "storage_key" TEXT,
  "url" TEXT NOT NULL,
  "mime_type" TEXT,
  "file_size_bytes" INTEGER,
  "sort_order" INTEGER NOT NULL DEFAULT 0,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "sighting_photos_file_size_nonnegative" CHECK ("file_size_bytes" IS NULL OR "file_size_bytes" >= 0),
  CONSTRAINT "sighting_photos_sort_order_nonnegative" CHECK ("sort_order" >= 0)
);

CREATE TABLE "audit_logs" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "actor_id" UUID REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  "action" TEXT NOT NULL,
  "entity_type" TEXT NOT NULL,
  "entity_id" TEXT NOT NULL,
  "metadata" JSONB,
  "request_id" TEXT,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX "users_email_normalized_unique_idx" ON "users"(LOWER("email"));
CREATE INDEX "users_volunteer_verification_idx" ON "users"("volunteer_verification");

CREATE INDEX "animal_sightings_reporter_id_idx" ON "animal_sightings"("reporter_id");
CREATE INDEX "animal_sightings_species_idx" ON "animal_sightings"("species");
CREATE INDEX "animal_sightings_lifecycle_status_idx" ON "animal_sightings"("lifecycle_status");
CREATE INDEX "animal_sightings_verification_status_idx" ON "animal_sightings"("verification_status");
CREATE INDEX "animal_sightings_urgency_idx" ON "animal_sightings"("urgency");
CREATE INDEX "animal_sightings_seen_at_idx" ON "animal_sightings"("seen_at");
CREATE INDEX "animal_sightings_created_at_idx" ON "animal_sightings"("created_at");
CREATE INDEX "animal_sightings_exact_location_gist_idx" ON "animal_sightings" USING GIST ("exact_location");
CREATE INDEX "animal_sightings_public_location_gist_idx" ON "animal_sightings" USING GIST ("public_location");

CREATE INDEX "sighting_photos_sighting_id_sort_order_idx" ON "sighting_photos"("sighting_id", "sort_order");

CREATE INDEX "audit_logs_actor_id_idx" ON "audit_logs"("actor_id");
CREATE INDEX "audit_logs_entity_type_entity_id_idx" ON "audit_logs"("entity_type", "entity_id");
CREATE INDEX "audit_logs_action_idx" ON "audit_logs"("action");
CREATE INDEX "audit_logs_created_at_idx" ON "audit_logs"("created_at");
