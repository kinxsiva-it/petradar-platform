CREATE TYPE "NotificationType" AS ENUM (
  'SIGHTING_VERIFIED',
  'SIGHTING_REJECTED',
  'MATCH_FOUND',
  'MATCH_CONFIRMED',
  'MATCH_REJECTED',
  'RESCUE_ASSIGNED',
  'RESCUE_STATUS_UPDATED'
);

CREATE TABLE "notifications" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  "type" "NotificationType" NOT NULL,
  "title" VARCHAR(160) NOT NULL,
  "message" VARCHAR(500) NOT NULL,
  "action_url" VARCHAR(500),
  "resource_type" VARCHAR(80),
  "resource_id" UUID,
  "metadata" JSONB,
  "read_at" TIMESTAMPTZ(6),
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "notifications_user_type_resource_unique" UNIQUE
    ("user_id", "type", "resource_type", "resource_id")
);

CREATE INDEX "notifications_user_id_created_at_idx" ON "notifications"("user_id", "created_at");
CREATE INDEX "notifications_user_id_read_at_idx" ON "notifications"("user_id", "read_at");
CREATE INDEX "notifications_user_id_type_idx" ON "notifications"("user_id", "type");
