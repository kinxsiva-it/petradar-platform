# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: demo-journey.spec.ts >> PetRadar demo journey >> auth and creation forms reject empty submissions instead of using mock defaults
- Location: apps\web-e2e\src\demo-journey.spec.ts:38:7

# Error details

```
Error: expect(page).not.toHaveURL(expected) failed

Expected pattern: not /\/login(?:\?|$)/
Received string: "http://localhost:4200/login"
Timeout: 5000ms

Call log:
  - Expect "not toHaveURL" with timeout 5000ms
    13 × unexpected value "http://localhost:4200/login"

```

```yaml
- link "PetRadar home":
  - /url: /
  - strong: PetRadar
  - text: Reuniting hearts
- navigation "Main navigation":
  - link "Map":
    - /url: /map
  - link "Lost Pets":
    - /url: /lost-pets
- link "Log in":
  - /url: /login
- link "Sign up":
  - /url: /register
- main:
  - link "PetRadar home":
    - /url: /
    - text: PetRadar
  - heading "Welcome back" [level=1]
  - paragraph: Log in to continue helping animals in your community.
  - text: Email address
  - textbox "Email address Use the email address on your PetRadar account.":
    - /placeholder: you@example.com
    - text: reporter@petradar.local
  - text: Use the email address on your PetRadar account. Password
  - textbox "Password Show Passwords are sent only to the authentication API.":
    - /placeholder: Enter your password
    - text: ChangeMe-PetRadar-Dev-Only-2026
  - button "Show"
  - text: Passwords are sent only to the authentication API.
  - checkbox "Remember me" [checked]
  - text: Remember me Password reset is not available in this build.
  - button "Logging in..." [disabled]
  - paragraph:
    - text: Do not have an account?
    - link "Sign up":
      - /url: /register
  - paragraph:
    - strong: Exact location is protected for animal safety.
    - text: Public viewers only see an approximate area.
  - link "Learn more about privacy":
    - /url: /community-guidelines
```

# Test source

```ts
  70  |     lostPets: number;
  71  |     matchResults: number;
  72  |     sightings: number;
  73  |   };
  74  |   skipped: boolean;
  75  |   verified: boolean;
  76  | }
  77  | 
  78  | interface ApiRequestOptions {
  79  |   data?: unknown;
  80  |   token?: string;
  81  | }
  82  | 
  83  | export async function assertApiHealthy(request: APIRequestContext): Promise<void> {
  84  |   const response = await request.get(`${apiBaseUrl}/health`);
  85  |   expect(response.ok(), 'PetRadar API must be healthy for API-backed E2E').toBe(true);
  86  | }
  87  | 
  88  | export async function apiLogin(
  89  |   request: APIRequestContext,
  90  |   credentials: { email: string; password: string },
  91  | ): Promise<AuthSession> {
  92  |   return apiPost(request, '/auth/login', {
  93  |     data: credentials,
  94  |     decode: decodeAuthSession,
  95  |   });
  96  | }
  97  | 
  98  | export async function verifySighting(
  99  |   request: APIRequestContext,
  100 |   adminToken: string,
  101 |   sightingId: string,
  102 | ): Promise<SightingResponse> {
  103 |   return apiPatch(request, `/admin/sightings/${encodeURIComponent(sightingId)}/verify`, {
  104 |     token: adminToken,
  105 |     decode: decodeSightingResponse,
  106 |   });
  107 | }
  108 | 
  109 | export async function createVerifiedSighting(
  110 |   request: APIRequestContext,
  111 |   reporterToken: string,
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
> 170 |     await expect(page).not.toHaveURL(/\/login(?:\?|$)/);
      |                            ^ Error: expect(page).not.toHaveURL(expected) failed
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
  212 |     const result = await prisma.$transaction(async (client) => {
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
```