CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "postgis";

CREATE TYPE "UserRole" AS ENUM (
  'GUEST',
  'REPORTER',
  'PET_OWNER',
  'VOLUNTEER',
  'ADMIN'
);

CREATE TYPE "AccountStatus" AS ENUM (
  'ACTIVE',
  'SUSPENDED',
  'PENDING_REVIEW'
);

CREATE TABLE "users" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "email" TEXT NOT NULL UNIQUE,
  "displayName" TEXT NOT NULL,
  "password_hash" TEXT NOT NULL,
  "roles" "UserRole"[] NOT NULL DEFAULT ARRAY['REPORTER']::"UserRole"[],
  "status" "AccountStatus" NOT NULL DEFAULT 'ACTIVE',
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "refresh_tokens" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "token_hash" TEXT NOT NULL UNIQUE,
  "user_agent" TEXT,
  "ip_hash" TEXT,
  "expires_at" TIMESTAMPTZ(6) NOT NULL,
  "revoked_at" TIMESTAMPTZ(6),
  "replaced_by_token_id" UUID REFERENCES "refresh_tokens"("id"),
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX "users_status_idx" ON "users"("status");
CREATE INDEX "refresh_tokens_user_id_revoked_at_idx" ON "refresh_tokens"("user_id", "revoked_at");
CREATE INDEX "refresh_tokens_expires_at_idx" ON "refresh_tokens"("expires_at");
