# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: demo-journey.spec.ts >> PetRadar demo journey >> runs the report-to-match-review demo journey with public-safe data
- Location: apps\web-e2e\src\demo-journey.spec.ts:67:7

# Error details

```
Error: API http://localhost:3000/api/v1/auth/login returned 500

expect(received).toBe(expected) // Object.is equality

Expected: true
Received: false
```

```
PrismaClientInitializationError: Can't reach database server at `ep-small-mud-aot3cjzd-pooler.c-2.ap-southeast-1.aws.neon.tech:5432`

Please make sure your database server is running at `ep-small-mud-aot3cjzd-pooler.c-2.ap-southeast-1.aws.neon.tech:5432`.
```

# Test source

```ts
  112 |   adminToken: string,
  113 |   payload: {
  114 |     collarStatus?: string;
  115 |     color: string;
  116 |     condition?: string;
  117 |     count: number;
  118 |     description: string;
  119 |     latitude: number;
  120 |     longitude: number;
  121 |     pattern: string;
  122 |     seenAt: string;
  123 |     species: string;
  124 |     urgency?: string;
  125 |   },
  126 | ): Promise<SightingResponse> {
  127 |   const created = await apiPost(request, '/sightings', {
  128 |     data: payload,
  129 |     token: reporterToken,
  130 |     decode: decodeSightingResponse,
  131 |   });
  132 |   await verifySighting(request, adminToken, created.id);
  133 |   return created;
  134 | }
  135 | 
  136 | export async function listLostPetMatches(
  137 |   request: APIRequestContext,
  138 |   ownerToken: string,
  139 |   lostPetId: string,
  140 | ): Promise<MatchResponse[]> {
  141 |   const response = await apiGet(request, `/lost-pets/${encodeURIComponent(lostPetId)}/matches`, {
  142 |     token: ownerToken,
  143 |     decode: decodeLostPetMatchesResponse,
  144 |   });
  145 |   return response.items;
  146 | }
  147 | 
  148 | export async function listPendingMatches(
  149 |   request: APIRequestContext,
  150 |   adminToken: string,
  151 | ): Promise<PaginatedResponse<MatchResponse>> {
  152 |   return apiGet(request, '/matches?status=PENDING&pageSize=50', {
  153 |     token: adminToken,
  154 |     decode: decodePaginatedMatchesResponse,
  155 |   });
  156 | }
  157 | 
  158 | export async function loginViaUi(
  159 |   page: Page,
  160 |   credentials: { email: string; password: string },
  161 |   options: { baseUrl?: string; expectedHeading?: RegExp | string } = {},
  162 | ): Promise<void> {
  163 |   await page.goto(`${options.baseUrl ?? webBaseUrl}/login`);
  164 |   await page.getByLabel('Email address').fill(credentials.email);
  165 |   await page.getByLabel('Password').fill(credentials.password);
  166 |   await page.getByRole('button', { name: /^log in$/i }).click();
  167 |   if (options.expectedHeading) {
  168 |     await expect(page.getByRole('heading', { name: options.expectedHeading })).toBeVisible();
  169 |   } else {
  170 |     await expect(page).not.toHaveURL(/\/login(?:\?|$)/);
  171 |   }
  172 | }
  173 | 
  174 | export function uniqueSuffix(testTitle: string): string {
  175 |   const cleaned = testTitle
  176 |     .toLowerCase()
  177 |     .replace(/[^a-z0-9]+/g, '-')
  178 |     .replace(/^-|-$/g, '');
  179 |   return `${cleaned.slice(0, 24)}-${Date.now().toString(36)}`;
  180 | }
  181 | 
  182 | export function createE2eRunMarker(): string {
  183 |   const runId = `e2e-${String(Date.now())}-${randomUUID().slice(0, 8)}`;
  184 |   return `[E2E-DEMO-JOURNEY:${runId}]`;
  185 | }
  186 | 
  187 | export async function cleanupE2eTestData(
  188 |   marker: string,
  189 |   createdIds: Readonly<E2eCreatedEntityIds>,
  190 |   prismaClient?: PrismaClient,
  191 | ): Promise<E2eCleanupResult> {
  192 |   assertSafeE2eMarker(marker);
  193 | 
  194 |   if (process.env['PETRADAR_E2E_KEEP_DATA'] === '1') {
  195 |     console.info(`[PetRadar E2E cleanup] skipped for ${marker} (PETRADAR_E2E_KEEP_DATA=1)`);
  196 |     return {
  197 |       deleted: { auditLogs: 0, lostPets: 0, matchResults: 0, sightings: 0 },
  198 |       skipped: true,
  199 |       verified: false,
  200 |     };
  201 |   }
  202 | 
  203 |   if (process.env['NODE_ENV']?.trim().toLowerCase() === 'production') {
  204 |     throw new Error('PetRadar E2E cleanup is disabled when NODE_ENV=production.');
  205 |   }
  206 |   if (!process.env['DATABASE_URL']) {
  207 |     throw new Error('PetRadar E2E cleanup requires DATABASE_URL from the E2E environment.');
  208 |   }
  209 | 
  210 |   const prisma = prismaClient ?? new PrismaClient();
  211 |   try {
> 212 |     const result = await prisma.$transaction(async (client) => {
      |                    ^ PrismaClientInitializationError: Can't reach database server at `ep-small-mud-aot3cjzd-pooler.c-2.ap-southeast-1.aws.neon.tech:5432`
  213 |       const markedSightings = await client.animalSighting.findMany({
  214 |         where: { description: { startsWith: marker } },
  215 |         select: { id: true },
  216 |       });
  217 |       const markedLostPets = await client.lostPet.findMany({
  218 |         where: {
  219 |           OR: [{ name: { startsWith: marker } }, { description: { startsWith: marker } }],
  220 |         },
  221 |         select: { id: true },
  222 |       });
  223 | 
  224 |       const trackedSighting = createdIds.sightingId
  225 |         ? await client.animalSighting.findUnique({
  226 |             where: { id: createdIds.sightingId },
  227 |             select: { description: true },
  228 |           })
  229 |         : null;
  230 |       if (trackedSighting && !trackedSighting.description?.startsWith(marker)) {
  231 |         throw new Error(
  232 |           'Refusing E2E cleanup because the tracked sighting is not owned by this run.',
  233 |         );
  234 |       }
  235 | 
  236 |       const trackedLostPet = createdIds.lostPetId
  237 |         ? await client.lostPet.findUnique({
  238 |             where: { id: createdIds.lostPetId },
  239 |             select: { description: true, name: true },
  240 |           })
  241 |         : null;
  242 |       if (
  243 |         trackedLostPet &&
  244 |         !trackedLostPet.name.startsWith(marker) &&
  245 |         !trackedLostPet.description?.startsWith(marker)
  246 |       ) {
  247 |         throw new Error(
  248 |           'Refusing E2E cleanup because the tracked lost pet is not owned by this run.',
  249 |         );
  250 |       }
  251 | 
  252 |       const sightingIds = markedSightings.map(({ id }) => id);
  253 |       const lostPetIds = markedLostPets.map(({ id }) => id);
  254 |       const markedMatches =
  255 |         sightingIds.length > 0 && lostPetIds.length > 0
  256 |           ? await client.matchResult.findMany({
  257 |               where: {
  258 |                 lostPetId: { in: lostPetIds },
  259 |                 sightingId: { in: sightingIds },
  260 |               },
  261 |               select: { id: true },
  262 |             })
  263 |           : [];
  264 | 
  265 |       const trackedMatch = createdIds.matchResultId
  266 |         ? await client.matchResult.findUnique({
  267 |             where: { id: createdIds.matchResultId },
  268 |             select: { lostPetId: true, sightingId: true },
  269 |           })
  270 |         : null;
  271 |       if (
  272 |         trackedMatch &&
  273 |         (!lostPetIds.includes(trackedMatch.lostPetId) ||
  274 |           !sightingIds.includes(trackedMatch.sightingId))
  275 |       ) {
  276 |         throw new Error(
  277 |           'Refusing E2E cleanup because the tracked match result is not owned by this run.',
  278 |         );
  279 |       }
  280 |       const matchResultIds = markedMatches.map(({ id }) => id);
  281 |       const entityIds = [...sightingIds, ...lostPetIds, ...matchResultIds];
  282 | 
  283 |       const deletedMatches = await client.matchResult.deleteMany({
  284 |         where: { id: { in: matchResultIds } },
  285 |       });
  286 |       const deletedLostPets = await client.lostPet.deleteMany({
  287 |         where: { id: { in: lostPetIds } },
  288 |       });
  289 |       const deletedSightings = await client.animalSighting.deleteMany({
  290 |         where: { id: { in: sightingIds } },
  291 |       });
  292 |       const deletedAuditLogs = await client.auditLog.deleteMany({
  293 |         where: { entityId: { in: entityIds } },
  294 |       });
  295 | 
  296 |       const [remainingSightings, remainingLostPets, remainingMatches] = await Promise.all([
  297 |         client.animalSighting.count({ where: { id: { in: sightingIds } } }),
  298 |         client.lostPet.count({ where: { id: { in: lostPetIds } } }),
  299 |         client.matchResult.count({ where: { id: { in: matchResultIds } } }),
  300 |       ]);
  301 |       if (remainingSightings + remainingLostPets + remainingMatches !== 0) {
  302 |         throw new Error(`PetRadar E2E cleanup verification failed for ${marker}.`);
  303 |       }
  304 | 
  305 |       return {
  306 |         deleted: {
  307 |           auditLogs: deletedAuditLogs.count,
  308 |           lostPets: deletedLostPets.count,
  309 |           matchResults: deletedMatches.count,
  310 |           sightings: deletedSightings.count,
  311 |         },
  312 |         skipped: false,
```