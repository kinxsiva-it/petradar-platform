CREATE TYPE "LostPetStatus" AS ENUM (
  'LOST',
  'POSSIBLE_MATCH',
  'REUNITED',
  'CLOSED'
);

CREATE TYPE "LostPetSex" AS ENUM (
  'UNKNOWN',
  'FEMALE',
  'MALE'
);

CREATE TYPE "MatchLevel" AS ENUM (
  'LOW',
  'MEDIUM',
  'HIGH'
);

CREATE TYPE "MatchReviewStatus" AS ENUM (
  'PENDING',
  'CONFIRMED',
  'REJECTED'
);

CREATE TYPE "RescueCaseStatus" AS ENUM (
  'NEW_REPORT',
  'NEEDS_VERIFICATION',
  'NEEDS_RESCUE',
  'ASSIGNED',
  'IN_PROGRESS',
  'RESOLVED',
  'CLOSED'
);

CREATE TYPE "RescueSeverity" AS ENUM (
  'LOW',
  'MEDIUM',
  'HIGH',
  'EMERGENCY'
);

CREATE TYPE "RescueTimelineEventType" AS ENUM (
  'CREATED',
  'STATUS_CHANGED',
  'VOLUNTEER_ASSIGNED',
  'NOTE_ADDED'
);

ALTER TABLE "animal_sightings"
  ADD COLUMN "duplicate_of_sighting_id" UUID REFERENCES "animal_sightings"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "lost_pets" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "owner_id" UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  "name" TEXT NOT NULL,
  "species" "AnimalSpecies" NOT NULL,
  "breed" TEXT,
  "sex" "LostPetSex" NOT NULL DEFAULT 'UNKNOWN',
  "age" TEXT,
  "color" TEXT,
  "pattern" TEXT,
  "collar_description" TEXT,
  "microchipped" BOOLEAN NOT NULL DEFAULT false,
  "description" TEXT,
  "photo_urls" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "exact_last_seen_location" geography(Point, 4326) NOT NULL,
  "public_last_seen_location" geography(Point, 4326) NOT NULL,
  "public_radius_meters" INTEGER NOT NULL,
  "last_seen_at" TIMESTAMPTZ(6) NOT NULL,
  "contact_method" TEXT,
  "reward_cents" INTEGER,
  "status" "LostPetStatus" NOT NULL DEFAULT 'LOST',
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "lost_pets_public_radius_positive" CHECK ("public_radius_meters" > 0),
  CONSTRAINT "lost_pets_reward_cents_nonnegative" CHECK ("reward_cents" IS NULL OR "reward_cents" >= 0)
);

CREATE TABLE "match_results" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "lost_pet_id" UUID NOT NULL REFERENCES "lost_pets"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  "sighting_id" UUID NOT NULL REFERENCES "animal_sightings"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  "score" INTEGER NOT NULL,
  "level" "MatchLevel" NOT NULL,
  "review_status" "MatchReviewStatus" NOT NULL DEFAULT 'PENDING',
  "reasons" JSONB NOT NULL,
  "distance_meters" DOUBLE PRECISION,
  "matched_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "reviewer_id" UUID REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  "reviewed_at" TIMESTAMPTZ(6),
  "rejection_reason" TEXT,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "match_results_score_range" CHECK ("score" >= 0 AND "score" <= 100),
  CONSTRAINT "match_results_distance_nonnegative" CHECK ("distance_meters" IS NULL OR "distance_meters" >= 0),
  CONSTRAINT "match_results_lost_pet_sighting_unique" UNIQUE ("lost_pet_id", "sighting_id")
);

CREATE TABLE "rescue_cases" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "case_number" TEXT NOT NULL UNIQUE,
  "sighting_id" UUID NOT NULL REFERENCES "animal_sightings"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  "severity" "RescueSeverity" NOT NULL,
  "status" "RescueCaseStatus" NOT NULL DEFAULT 'NEW_REPORT',
  "summary" TEXT NOT NULL,
  "assigned_volunteer_id" UUID REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  "created_by_id" UUID REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  "closed_at" TIMESTAMPTZ(6),
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "rescue_case_timeline_events" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "rescue_case_id" UUID NOT NULL REFERENCES "rescue_cases"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  "event_type" "RescueTimelineEventType" NOT NULL,
  "previous_status" "RescueCaseStatus",
  "new_status" "RescueCaseStatus",
  "actor_id" UUID REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  "note" TEXT,
  "metadata" JSONB,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "rescue_internal_notes" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "rescue_case_id" UUID NOT NULL REFERENCES "rescue_cases"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  "author_id" UUID REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  "body" TEXT NOT NULL,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "rescue_internal_notes_body_nonempty" CHECK (char_length(trim("body")) > 0)
);

CREATE INDEX "animal_sightings_duplicate_of_sighting_id_idx" ON "animal_sightings"("duplicate_of_sighting_id");

CREATE INDEX "lost_pets_owner_id_idx" ON "lost_pets"("owner_id");
CREATE INDEX "lost_pets_species_idx" ON "lost_pets"("species");
CREATE INDEX "lost_pets_status_idx" ON "lost_pets"("status");
CREATE INDEX "lost_pets_last_seen_at_idx" ON "lost_pets"("last_seen_at");
CREATE INDEX "lost_pets_created_at_idx" ON "lost_pets"("created_at");
CREATE INDEX "lost_pets_exact_last_seen_location_gist_idx" ON "lost_pets" USING GIST ("exact_last_seen_location");
CREATE INDEX "lost_pets_public_last_seen_location_gist_idx" ON "lost_pets" USING GIST ("public_last_seen_location");

CREATE INDEX "match_results_lost_pet_id_idx" ON "match_results"("lost_pet_id");
CREATE INDEX "match_results_sighting_id_idx" ON "match_results"("sighting_id");
CREATE INDEX "match_results_review_status_idx" ON "match_results"("review_status");
CREATE INDEX "match_results_level_idx" ON "match_results"("level");
CREATE INDEX "match_results_matched_at_idx" ON "match_results"("matched_at");

CREATE INDEX "rescue_cases_status_idx" ON "rescue_cases"("status");
CREATE INDEX "rescue_cases_severity_idx" ON "rescue_cases"("severity");
CREATE INDEX "rescue_cases_sighting_id_idx" ON "rescue_cases"("sighting_id");
CREATE INDEX "rescue_cases_assigned_volunteer_id_idx" ON "rescue_cases"("assigned_volunteer_id");
CREATE INDEX "rescue_cases_created_at_idx" ON "rescue_cases"("created_at");
CREATE UNIQUE INDEX "rescue_cases_active_sighting_id_unique_idx"
  ON "rescue_cases"("sighting_id")
  WHERE "status" NOT IN ('RESOLVED'::"RescueCaseStatus", 'CLOSED'::"RescueCaseStatus");

CREATE INDEX "rescue_case_timeline_events_rescue_case_id_created_at_idx" ON "rescue_case_timeline_events"("rescue_case_id", "created_at");
CREATE INDEX "rescue_case_timeline_events_actor_id_idx" ON "rescue_case_timeline_events"("actor_id");

CREATE INDEX "rescue_internal_notes_rescue_case_id_created_at_idx" ON "rescue_internal_notes"("rescue_case_id", "created_at");
CREATE INDEX "rescue_internal_notes_author_id_idx" ON "rescue_internal_notes"("author_id");
