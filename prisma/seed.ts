import {
  AnimalCondition,
  AnimalSpecies,
  CollarStatus,
  LostPetSex,
  LostPetStatus,
  MatchLevel,
  MatchReviewStatus,
  PhotoStorageProvider,
  Prisma,
  PrismaClient,
  RescueCaseStatus,
  RescueSeverity,
  RescueTimelineEventType,
  SightingLifecycleStatus,
  UrgencyLevel,
  UserRole,
  VerificationStatus,
  VolunteerVerificationState,
} from '@prisma/client';
import argon2 from 'argon2';

import { assertProductionSeedIsDisabled } from '@petradar/backend/shared';

assertProductionSeedIsDisabled(process.env['NODE_ENV']);

const prisma = new PrismaClient();

async function main(): Promise<void> {
  const passwordHash = await argon2.hash('ChangeMe-PetRadar-Dev-Only-2026', {
    type: argon2.argon2id,
  });

  const admin = await prisma.user.upsert({
    where: { email: 'admin@petradar.local' },
    update: {
      displayName: 'Admin Nicha',
      roles: [UserRole.ADMIN],
      volunteerVerification: VolunteerVerificationState.NOT_APPLICABLE,
    },
    create: {
      email: 'admin@petradar.local',
      displayName: 'Admin Nicha',
      passwordHash,
      roles: [UserRole.ADMIN],
      volunteerVerification: VolunteerVerificationState.NOT_APPLICABLE,
    },
  });

  const reporter = await prisma.user.upsert({
    where: { email: 'reporter@petradar.local' },
    update: {
      displayName: 'Reporter Pim',
      roles: [UserRole.REPORTER],
      volunteerVerification: VolunteerVerificationState.NOT_APPLICABLE,
    },
    create: {
      email: 'reporter@petradar.local',
      displayName: 'Reporter Pim',
      passwordHash,
      roles: [UserRole.REPORTER],
      volunteerVerification: VolunteerVerificationState.NOT_APPLICABLE,
    },
  });

  const owner = await prisma.user.upsert({
    where: { email: 'owner@petradar.local' },
    update: {
      displayName: 'Owner Arun',
      roles: [UserRole.PET_OWNER, UserRole.REPORTER],
      volunteerVerification: VolunteerVerificationState.NOT_APPLICABLE,
    },
    create: {
      email: 'owner@petradar.local',
      displayName: 'Owner Arun',
      passwordHash,
      roles: [UserRole.PET_OWNER, UserRole.REPORTER],
      volunteerVerification: VolunteerVerificationState.NOT_APPLICABLE,
    },
  });

  const volunteer = await prisma.user.upsert({
    where: { email: 'volunteer@petradar.local' },
    update: {
      displayName: 'Volunteer Mali',
      roles: [UserRole.VOLUNTEER, UserRole.REPORTER],
      volunteerVerification: VolunteerVerificationState.VERIFIED,
    },
    create: {
      email: 'volunteer@petradar.local',
      displayName: 'Volunteer Mali',
      passwordHash,
      roles: [UserRole.VOLUNTEER, UserRole.REPORTER],
      volunteerVerification: VolunteerVerificationState.VERIFIED,
    },
  });

  await seedDemoFlow({
    adminId: admin.id,
    ownerId: owner.id,
    reporterId: reporter.id,
    volunteerId: volunteer.id,
  });

  console.info('Seeded PetRadar demo flow records.');
}

async function seedDemoFlow(input: {
  adminId: string;
  ownerId: string;
  reporterId: string;
  volunteerId: string;
}): Promise<void> {
  const pendingSightingId = '10000000-0000-4000-8000-000000000101';
  const matchSightingId = '10000000-0000-4000-8000-000000000102';
  const rescueSightingId = '10000000-0000-4000-8000-000000000103';
  const lostPetId = '20000000-0000-4000-8000-000000000201';
  const matchId = '30000000-0000-4000-8000-000000000301';
  const rescueCaseId = '40000000-0000-4000-8000-000000000401';
  const now = new Date('2026-07-06T08:00:00.000Z');

  await upsertSighting({
    animalCount: 1,
    collarStatus: CollarStatus.UNKNOWN,
    color: 'Black and white',
    condition: AnimalCondition.INJURED,
    description: 'Fresh demo report waiting for Admin verification.',
    exactLatitude: 13.7563,
    exactLongitude: 100.5018,
    id: pendingSightingId,
    lifecycleStatus: SightingLifecycleStatus.SIGHTING,
    pattern: 'Tuxedo',
    publicLatitude: 13.754,
    publicLongitude: 100.504,
    reporterId: input.reporterId,
    seenAt: new Date('2026-07-06T07:15:00.000Z'),
    species: AnimalSpecies.CAT,
    urgency: UrgencyLevel.HIGH,
    verificationStatus: VerificationStatus.PENDING,
  });

  await upsertSighting({
    animalCount: 1,
    collarStatus: CollarStatus.BLUE_COLLAR,
    color: 'Orange',
    condition: AnimalCondition.POSSIBLE_LOST_PET,
    description: 'Verified demo sighting that should line up with Milo the lost cat.',
    exactLatitude: 13.759,
    exactLongitude: 100.504,
    id: matchSightingId,
    lifecycleStatus: SightingLifecycleStatus.SIGHTING,
    pattern: 'Striped',
    publicLatitude: 13.757,
    publicLongitude: 100.506,
    reporterId: input.reporterId,
    seenAt: new Date('2026-07-05T17:00:00.000Z'),
    species: AnimalSpecies.CAT,
    urgency: UrgencyLevel.MEDIUM,
    verificationStatus: VerificationStatus.VERIFIED,
  });

  await upsertSighting({
    animalCount: 1,
    collarStatus: CollarStatus.NO_COLLAR,
    color: 'Brown',
    condition: AnimalCondition.NEEDS_RESCUE,
    description: 'Verified demo rescue case for volunteer coordination.',
    exactLatitude: 13.762,
    exactLongitude: 100.499,
    id: rescueSightingId,
    lifecycleStatus: SightingLifecycleStatus.NEEDS_RESCUE,
    pattern: 'Solid',
    publicLatitude: 13.76,
    publicLongitude: 100.501,
    reporterId: input.reporterId,
    seenAt: new Date('2026-07-05T15:30:00.000Z'),
    species: AnimalSpecies.DOG,
    urgency: UrgencyLevel.HIGH,
    verificationStatus: VerificationStatus.VERIFIED,
  });

  await upsertSightingPhoto({
    id: '11000000-0000-4000-8000-000000000111',
    sightingId: pendingSightingId,
    sortOrder: 0,
    url: 'https://images.unsplash.com/photo-1573865526739-10659fec78a5?auto=format&fit=crop&w=900&q=80',
  });
  await upsertSightingPhoto({
    id: '11000000-0000-4000-8000-000000000112',
    sightingId: matchSightingId,
    sortOrder: 0,
    url: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&w=900&q=80',
  });
  await upsertSightingPhoto({
    id: '11000000-0000-4000-8000-000000000113',
    sightingId: rescueSightingId,
    sortOrder: 0,
    url: 'https://images.unsplash.com/photo-1530281700549-e82e7bf110d6?auto=format&fit=crop&w=900&q=80',
  });

  await prisma.$executeRaw(Prisma.sql`
    INSERT INTO "lost_pets" (
      "id",
      "owner_id",
      "name",
      "species",
      "breed",
      "sex",
      "age",
      "color",
      "pattern",
      "collar_description",
      "microchipped",
      "description",
      "photo_urls",
      "exact_last_seen_location",
      "public_last_seen_location",
      "public_radius_meters",
      "last_seen_at",
      "contact_method",
      "reward_cents",
      "status"
    )
    VALUES (
      CAST(${lostPetId} AS uuid),
      CAST(${input.ownerId} AS uuid),
      ${'Milo'},
      CAST(${AnimalSpecies.CAT} AS "AnimalSpecies"),
      ${'Domestic shorthair'},
      CAST(${LostPetSex.MALE} AS "LostPetSex"),
      ${'3 years'},
      ${'Orange'},
      ${'Striped'},
      ${'Blue collar'},
      ${true},
      ${'Friendly orange tabby used for the PetRadar demo match flow.'},
      ${textArraySql([
        'https://images.unsplash.com/photo-1574158622682-e40e69881006?auto=format&fit=crop&w=900&q=80',
      ])},
      ${locationSql(13.7586, 100.5037)},
      ${locationSql(13.756, 100.506)},
      ${300},
      ${new Date('2026-07-05T12:00:00.000Z')},
      ${'Message through PetRadar demo owner account.'},
      ${250000},
      CAST(${LostPetStatus.POSSIBLE_MATCH} AS "LostPetStatus")
    )
    ON CONFLICT ("id") DO UPDATE SET
      "owner_id" = EXCLUDED."owner_id",
      "name" = EXCLUDED."name",
      "species" = EXCLUDED."species",
      "breed" = EXCLUDED."breed",
      "sex" = EXCLUDED."sex",
      "age" = EXCLUDED."age",
      "color" = EXCLUDED."color",
      "pattern" = EXCLUDED."pattern",
      "collar_description" = EXCLUDED."collar_description",
      "microchipped" = EXCLUDED."microchipped",
      "description" = EXCLUDED."description",
      "photo_urls" = EXCLUDED."photo_urls",
      "exact_last_seen_location" = EXCLUDED."exact_last_seen_location",
      "public_last_seen_location" = EXCLUDED."public_last_seen_location",
      "public_radius_meters" = EXCLUDED."public_radius_meters",
      "last_seen_at" = EXCLUDED."last_seen_at",
      "contact_method" = EXCLUDED."contact_method",
      "reward_cents" = EXCLUDED."reward_cents",
      "status" = EXCLUDED."status",
      "updated_at" = CURRENT_TIMESTAMP
  `);

  await prisma.$executeRaw(Prisma.sql`
    INSERT INTO "match_results" (
      "id",
      "lost_pet_id",
      "sighting_id",
      "score",
      "level",
      "review_status",
      "reasons",
      "distance_meters",
      "matched_at"
    )
    VALUES (
      CAST(${matchId} AS uuid),
      CAST(${lostPetId} AS uuid),
      CAST(${matchSightingId} AS uuid),
      ${85},
      CAST(${MatchLevel.HIGH} AS "MatchLevel"),
      CAST(${MatchReviewStatus.PENDING} AS "MatchReviewStatus"),
      CAST(${JSON.stringify(['Species match', 'Color match', 'Collar match', 'Within 1 kilometer'])} AS jsonb),
      ${420},
      ${now}
    )
    ON CONFLICT ("id") DO UPDATE SET
      "lost_pet_id" = EXCLUDED."lost_pet_id",
      "sighting_id" = EXCLUDED."sighting_id",
      "score" = EXCLUDED."score",
      "level" = EXCLUDED."level",
      "review_status" = EXCLUDED."review_status",
      "reasons" = EXCLUDED."reasons",
      "distance_meters" = EXCLUDED."distance_meters",
      "matched_at" = EXCLUDED."matched_at",
      "reviewer_id" = NULL,
      "reviewed_at" = NULL,
      "rejection_reason" = NULL,
      "updated_at" = CURRENT_TIMESTAMP
  `);

  await prisma.$executeRaw(Prisma.sql`
    INSERT INTO "rescue_cases" (
      "id",
      "case_number",
      "sighting_id",
      "severity",
      "status",
      "summary",
      "assigned_volunteer_id",
      "created_by_id"
    )
    VALUES (
      CAST(${rescueCaseId} AS uuid),
      ${'RES-DEMO-001'},
      CAST(${rescueSightingId} AS uuid),
      CAST(${RescueSeverity.HIGH} AS "RescueSeverity"),
      CAST(${RescueCaseStatus.ASSIGNED} AS "RescueCaseStatus"),
      ${'Demo rescue case assigned to a verified volunteer.'},
      CAST(${input.volunteerId} AS uuid),
      CAST(${input.adminId} AS uuid)
    )
    ON CONFLICT ("id") DO UPDATE SET
      "case_number" = EXCLUDED."case_number",
      "sighting_id" = EXCLUDED."sighting_id",
      "severity" = EXCLUDED."severity",
      "status" = EXCLUDED."status",
      "summary" = EXCLUDED."summary",
      "assigned_volunteer_id" = EXCLUDED."assigned_volunteer_id",
      "created_by_id" = EXCLUDED."created_by_id",
      "closed_at" = NULL,
      "updated_at" = CURRENT_TIMESTAMP
  `);

  await upsertRescueTimelineEvent({
    actorId: input.adminId,
    eventType: RescueTimelineEventType.CREATED,
    id: '50000000-0000-4000-8000-000000000501',
    newStatus: RescueCaseStatus.ASSIGNED,
    note: 'Demo rescue case created and assigned.',
    previousStatus: null,
    rescueCaseId,
  });

  await prisma.$executeRaw(Prisma.sql`
    INSERT INTO "rescue_internal_notes" (
      "id",
      "rescue_case_id",
      "author_id",
      "body"
    )
    VALUES (
      CAST(${'60000000-0000-4000-8000-000000000601'} AS uuid),
      CAST(${rescueCaseId} AS uuid),
      CAST(${input.adminId} AS uuid),
      ${'Demo note: volunteer should coordinate pickup and update the case status.'}
    )
    ON CONFLICT ("id") DO UPDATE SET
      "rescue_case_id" = EXCLUDED."rescue_case_id",
      "author_id" = EXCLUDED."author_id",
      "body" = EXCLUDED."body"
  `);
}

async function upsertSighting(input: {
  animalCount: number;
  collarStatus: CollarStatus;
  color: string;
  condition: AnimalCondition;
  description: string;
  exactLatitude: number;
  exactLongitude: number;
  id: string;
  lifecycleStatus: SightingLifecycleStatus;
  pattern: string;
  publicLatitude: number;
  publicLongitude: number;
  reporterId: string;
  seenAt: Date;
  species: AnimalSpecies;
  urgency: UrgencyLevel;
  verificationStatus: VerificationStatus;
}): Promise<void> {
  await prisma.$executeRaw(Prisma.sql`
    INSERT INTO "animal_sightings" (
      "id",
      "reporter_id",
      "species",
      "animal_count",
      "color",
      "pattern",
      "collar_status",
      "condition",
      "description",
      "seen_at",
      "urgency",
      "lifecycle_status",
      "verification_status",
      "exact_location",
      "public_location",
      "public_radius_meters"
    )
    VALUES (
      CAST(${input.id} AS uuid),
      CAST(${input.reporterId} AS uuid),
      CAST(${input.species} AS "AnimalSpecies"),
      ${input.animalCount},
      ${input.color},
      ${input.pattern},
      CAST(${input.collarStatus} AS "CollarStatus"),
      CAST(${input.condition} AS "AnimalCondition"),
      ${input.description},
      ${input.seenAt},
      CAST(${input.urgency} AS "UrgencyLevel"),
      CAST(${input.lifecycleStatus} AS "SightingLifecycleStatus"),
      CAST(${input.verificationStatus} AS "VerificationStatus"),
      ${locationSql(input.exactLatitude, input.exactLongitude)},
      ${locationSql(input.publicLatitude, input.publicLongitude)},
      ${300}
    )
    ON CONFLICT ("id") DO UPDATE SET
      "reporter_id" = EXCLUDED."reporter_id",
      "species" = EXCLUDED."species",
      "animal_count" = EXCLUDED."animal_count",
      "color" = EXCLUDED."color",
      "pattern" = EXCLUDED."pattern",
      "collar_status" = EXCLUDED."collar_status",
      "condition" = EXCLUDED."condition",
      "description" = EXCLUDED."description",
      "seen_at" = EXCLUDED."seen_at",
      "urgency" = EXCLUDED."urgency",
      "lifecycle_status" = EXCLUDED."lifecycle_status",
      "verification_status" = EXCLUDED."verification_status",
      "exact_location" = EXCLUDED."exact_location",
      "public_location" = EXCLUDED."public_location",
      "public_radius_meters" = EXCLUDED."public_radius_meters",
      "duplicate_of_sighting_id" = NULL,
      "updated_at" = CURRENT_TIMESTAMP
  `);
}

async function upsertSightingPhoto(input: {
  id: string;
  sightingId: string;
  sortOrder: number;
  url: string;
}): Promise<void> {
  await prisma.$executeRaw(Prisma.sql`
    INSERT INTO "sighting_photos" (
      "id",
      "sighting_id",
      "storage_provider",
      "storage_key",
      "url",
      "mime_type",
      "file_size_bytes",
      "sort_order"
    )
    VALUES (
      CAST(${input.id} AS uuid),
      CAST(${input.sightingId} AS uuid),
      CAST(${PhotoStorageProvider.EXTERNAL_URL} AS "PhotoStorageProvider"),
      NULL,
      ${input.url},
      ${'image/jpeg'},
      NULL,
      ${input.sortOrder}
    )
    ON CONFLICT ("id") DO UPDATE SET
      "sighting_id" = EXCLUDED."sighting_id",
      "storage_provider" = EXCLUDED."storage_provider",
      "storage_key" = EXCLUDED."storage_key",
      "url" = EXCLUDED."url",
      "mime_type" = EXCLUDED."mime_type",
      "file_size_bytes" = EXCLUDED."file_size_bytes",
      "sort_order" = EXCLUDED."sort_order"
  `);
}

async function upsertRescueTimelineEvent(input: {
  actorId: string;
  eventType: RescueTimelineEventType;
  id: string;
  newStatus: RescueCaseStatus | null;
  note: string;
  previousStatus: RescueCaseStatus | null;
  rescueCaseId: string;
}): Promise<void> {
  await prisma.$executeRaw(Prisma.sql`
    INSERT INTO "rescue_case_timeline_events" (
      "id",
      "rescue_case_id",
      "event_type",
      "previous_status",
      "new_status",
      "actor_id",
      "note"
    )
    VALUES (
      CAST(${input.id} AS uuid),
      CAST(${input.rescueCaseId} AS uuid),
      CAST(${input.eventType} AS "RescueTimelineEventType"),
      ${input.previousStatus ? Prisma.sql`CAST(${input.previousStatus} AS "RescueCaseStatus")` : Prisma.sql`NULL::"RescueCaseStatus"`},
      ${input.newStatus ? Prisma.sql`CAST(${input.newStatus} AS "RescueCaseStatus")` : Prisma.sql`NULL::"RescueCaseStatus"`},
      CAST(${input.actorId} AS uuid),
      ${input.note}
    )
    ON CONFLICT ("id") DO UPDATE SET
      "rescue_case_id" = EXCLUDED."rescue_case_id",
      "event_type" = EXCLUDED."event_type",
      "previous_status" = EXCLUDED."previous_status",
      "new_status" = EXCLUDED."new_status",
      "actor_id" = EXCLUDED."actor_id",
      "note" = EXCLUDED."note"
  `);
}

function locationSql(latitude: number, longitude: number): Prisma.Sql {
  return Prisma.sql`ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326)::geography`;
}

function textArraySql(values: readonly string[]): Prisma.Sql {
  if (values.length === 0) {
    return Prisma.sql`ARRAY[]::text[]`;
  }
  return Prisma.sql`ARRAY[${Prisma.join(values.map((value) => Prisma.sql`${value}`))}]::text[]`;
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
