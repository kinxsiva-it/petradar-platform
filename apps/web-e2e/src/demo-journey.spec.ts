import { expect, test, type APIRequestContext, type Browser, type Page } from '@playwright/test';

import {
  adminBaseUrl,
  apiLogin,
  assertApiHealthy,
  cleanupE2eTestData,
  createE2eRunMarker,
  decodeBrowserLostPetResponse,
  decodeBrowserSightingResponse,
  demoUsers,
  expectPageDoesNotExposePrivateValues,
  listLostPetMatches,
  listPendingMatches,
  loginViaUi,
  type E2eCreatedEntityIds,
  type LostPetResponse,
  type MatchResponse,
  type SightingResponse,
  uniqueSuffix,
  webBaseUrl,
  verifySighting,
} from './e2e-helpers';

test.describe('PetRadar demo journey', () => {
  test.describe.configure({ timeout: 120_000 });

  let testData: { createdIds: E2eCreatedEntityIds; marker: string } | undefined;

  test.afterEach(async () => {
    if (testData) {
      const completedTestData = testData;
      testData = undefined;
      await cleanupE2eTestData(completedTestData.marker, completedTestData.createdIds);
    }
  });

  test('auth and creation forms reject empty submissions instead of using mock defaults', async ({
    browser,
    page,
    request,
  }) => {
    await assertApiHealthy(request);

    await page.goto('/register');
    await page.getByRole('button', { name: /^create account$/i }).click();
    await expect(page.getByText(/enter your name/i)).toBeVisible();

    await page.goto('/login');
    await page.getByRole('button', { name: /^log in$/i }).click();
    await expect(page.getByText(/enter your email/i)).toBeVisible();

    await loginViaUi(page, demoUsers.reporter);
    await page.goto('/report-animal');
    await advanceWizard(page, 5);
    await page.getByRole('button', { name: /^submit report$/i }).click();
    await expect(page.getByText(/choose the closest animal type/i)).toBeVisible();

    const ownerPage = await newLoggedInPage(browser, demoUsers.owner);
    await ownerPage.goto('/lost-pets/new');
    await advanceWizard(ownerPage, 5);
    await ownerPage.getByRole('button', { name: /^review & submit$/i }).click();
    await expect(ownerPage.getByText(/enter the pet name/i)).toBeVisible();
    await ownerPage.close();
  });

  test('runs the report-to-match-review demo journey with public-safe data', async ({
    browser,
    request,
  }) => {
    testData = { createdIds: {}, marker: createE2eRunMarker() };
    await assertApiHealthy(request);

    const suffix = uniqueSuffix(testData.marker);
    const location = {
      latitude: '13.8123',
      longitude: '100.6123',
    };
    const sightingDescription = `${testData.marker} orange tabby with red collar near the demo park`;
    const lostPetName = `${testData.marker} Match Cat`;
    const privateContact = `private-owner-contact-${suffix}@example.invalid`;

    const adminSession = await apiLogin(request, demoUsers.admin);
    const ownerSession = await apiLogin(request, demoUsers.owner);

    const reporterPage = await newLoggedInPage(browser, demoUsers.reporter);
    const sighting = await createSightingThroughUi(reporterPage, {
      color: 'Orange',
      description: sightingDescription,
      latitude: location.latitude,
      longitude: location.longitude,
      pattern: 'Tabby',
      seenDate: '2026-07-10',
      seenTime: '10:45',
    });
    testData.createdIds.sightingId = sighting.id;

    await verifySighting(request, adminSession.accessToken, sighting.id);

    const publicSightingPage = await newPage(browser);
    await publicSightingPage.goto(`/sightings/${sighting.id}`);
    await expect(publicSightingPage.getByText(sightingDescription)).toBeVisible();
    await expectPageDoesNotExposePrivateValues(publicSightingPage, [
      location.latitude,
      location.longitude,
      demoUsers.reporter.email,
    ]);
    await publicSightingPage.close();

    const ownerPage = await newLoggedInPage(browser, demoUsers.owner);
    const lostPet = await createLostPetThroughUi(ownerPage, {
      contactDetail: privateContact,
      description: `${testData.marker} Friendly orange tabby lost near the demo park.`,
      latitude: location.latitude,
      longitude: location.longitude,
      name: lostPetName,
    });
    testData.createdIds.lostPetId = lostPet.id;

    const match = await waitForAutoMatch(
      request,
      ownerSession.accessToken,
      lostPet.id,
      sighting.id,
    );
    testData.createdIds.matchResultId = match.id;

    await ownerPage.goto('/matches');
    await expect(
      ownerPage.getByRole('heading', { level: 1, name: /possible matches/i }),
    ).toBeVisible();
    await expect(ownerPage.getByText(/approximate public locations only/i)).toBeVisible();

    await ownerPage.goto(`/my/lost-pets/${lostPet.id}/matches`);
    await expect(
      ownerPage.getByRole('heading', {
        level: 1,
        name: new RegExp(`Possible Matches for ${escapeRegExp(lostPet.name)}`),
      }),
    ).toBeVisible();
    await expect(ownerPage.getByText(/rule-based matching uses attributes/i)).toBeVisible();
    await expect(ownerPage.locator(`a[href="/matches/${match.id}"]`)).toBeVisible();

    await ownerPage.goto(`/matches/${match.id}`);
    await expect(
      ownerPage.getByRole('heading', { level: 1, name: new RegExp(escapeRegExp(lostPet.name)) }),
    ).toBeVisible();
    await expect(ownerPage.getByText(/exact last-seen location hidden/i)).toBeVisible();
    await expectPageDoesNotExposePrivateValues(ownerPage, [
      location.latitude,
      location.longitude,
      privateContact,
    ]);

    const anonymousLostPetPage = await newPage(browser);
    await anonymousLostPetPage.goto(`/lost-pets/${lostPet.id}`);
    await expect(
      anonymousLostPetPage.getByRole('heading', { level: 1, name: lostPet.name }),
    ).toBeVisible();
    await expect(anonymousLostPetPage.getByText(/contact details are private/i)).toBeVisible();
    await expectPageDoesNotExposePrivateValues(anonymousLostPetPage, [
      location.latitude,
      location.longitude,
      privateContact,
      demoUsers.owner.email,
    ]);
    await anonymousLostPetPage.close();

    const adminMatches = await listPendingMatches(request, adminSession.accessToken);
    expect(
      adminMatches.items.some((item) => item.id === match.id),
      'admin pending match API should include the auto-generated match',
    ).toBe(true);

    const adminPage = await newLoggedInPage(browser, demoUsers.admin, adminBaseUrl);
    await adminPage.goto(`${adminBaseUrl}/match-review`);
    await expect(adminPage.getByRole('heading', { name: /^match review$/i })).toBeVisible();
    const adminMatchLink = adminPage.locator(`a[href="/match-review/${match.id}"]`);
    await expect(adminMatchLink).toBeVisible();
    await adminMatchLink.click();
    await expect(
      adminPage.getByRole('heading', { level: 1, name: new RegExp(escapeRegExp(lostPet.name)) }),
    ).toBeVisible();
    await expect(
      adminPage.getByText(/exact last-seen coordinates are not returned/i),
    ).toBeVisible();

    await adminPage.goto(`${adminBaseUrl}/rescue-cases`);
    await expect(adminPage.getByRole('heading', { name: /rescue case board/i })).toBeVisible();

    await reporterPage.close();
    await ownerPage.close();
    await adminPage.close();
  });
});

async function newLoggedInPage(
  browser: Browser,
  credentials: { email: string; password: string },
  baseUrl?: string,
): Promise<Page> {
  const page = await newPage(browser, baseUrl);
  await loginViaUi(page, credentials, { baseUrl });
  return page;
}

async function newPage(browser: Browser, baseUrl = webBaseUrl): Promise<Page> {
  const context = await browser.newContext({ baseURL: baseUrl });
  return context.newPage();
}

async function createSightingThroughUi(
  page: Page,
  values: {
    color: string;
    description: string;
    latitude: string;
    longitude: string;
    pattern: string;
    seenDate: string;
    seenTime: string;
  },
): Promise<SightingResponse> {
  await page.goto('/report-animal');
  await page.getByRole('button', { name: /cat domestic cat/i }).click();
  await page.getByRole('spinbutton', { name: /animal count/i }).fill('1');
  await page.getByRole('button', { name: /^continue$/i }).click();
  await page.getByRole('button', { name: /possible lost pet/i }).click();
  await page.getByRole('button', { name: /^continue$/i }).click();
  await page.getByRole('textbox', { exact: true, name: 'Color' }).fill(values.color);
  await page.getByRole('textbox', { exact: true, name: 'Pattern' }).fill(values.pattern);
  await page.getByRole('combobox', { name: /collar status/i }).selectOption({
    label: 'Red collar with bell',
  });
  await page.getByRole('combobox', { name: /urgency/i }).selectOption({ label: 'Medium' });
  await page.getByRole('textbox', { name: /seen date/i }).fill(values.seenDate);
  await page.getByRole('textbox', { name: /seen time/i }).fill(values.seenTime);
  await page.locator('textarea').fill(values.description);
  await page.getByRole('button', { name: /^continue$/i }).click();
  await page.getByRole('button', { name: /^continue$/i }).click();
  await page.getByRole('spinbutton', { name: /latitude submitted to api/i }).fill(values.latitude);
  await page
    .getByRole('spinbutton', { name: /longitude submitted to api/i })
    .fill(values.longitude);
  await page.getByRole('button', { name: /^continue$/i }).click();

  const responsePromise = page.waitForResponse(
    (response) =>
      response.url().includes('/api/v1/sightings') &&
      response.request().method() === 'POST' &&
      response.status() === 201,
  );
  await page.getByRole('button', { name: /^submit report$/i }).click();
  const response = await responsePromise;
  const sighting = decodeBrowserSightingResponse(await response.json());
  await expect(page.getByRole('heading', { name: /my reports/i })).toBeVisible();
  return sighting;
}

async function createLostPetThroughUi(
  page: Page,
  values: {
    contactDetail: string;
    description: string;
    latitude: string;
    longitude: string;
    name: string;
  },
): Promise<LostPetResponse> {
  await page.goto('/lost-pets/new');
  await page.getByRole('textbox', { name: /pet name/i }).fill(values.name);
  await page.getByRole('combobox', { name: /species/i }).selectOption({ label: 'Cat' });
  await page.getByRole('textbox', { name: /breed \/ type/i }).fill('Domestic shorthair');
  await page.getByRole('combobox', { name: /sex/i }).selectOption({ label: 'Unknown' });
  await page.getByRole('textbox', { name: /age/i }).fill('Adult');
  await page.getByRole('button', { name: /^continue$/i }).click();
  await page.getByRole('textbox', { name: /primary color/i }).fill('Orange');
  await page.getByRole('textbox', { name: /pattern/i }).fill('Tabby');
  await page.getByRole('textbox', { name: /collar description/i }).fill('Red collar');
  await page.locator('textarea').fill(values.description);
  await page.getByRole('button', { name: /^continue$/i }).click();
  await page.getByRole('button', { name: /^continue$/i }).click();
  await page.getByRole('spinbutton', { name: /private latitude/i }).fill(values.latitude);
  await page.getByRole('spinbutton', { name: /private longitude/i }).fill(values.longitude);
  await page.getByLabel('Last seen').fill('2026-07-10T10:45');
  await page.getByRole('button', { name: /^continue$/i }).click();
  await page.getByRole('textbox', { name: /contact detail/i }).fill(values.contactDetail);
  await page.getByRole('button', { name: /^continue$/i }).click();

  const responsePromise = page.waitForResponse(
    (response) =>
      response.url().includes('/api/v1/lost-pets') &&
      response.request().method() === 'POST' &&
      response.status() === 201,
  );
  await page.getByRole('button', { name: /^review & submit$/i }).click();
  const response = await responsePromise;
  const lostPet = decodeBrowserLostPetResponse(await response.json());
  await expect(page).toHaveURL(new RegExp(`/lost-pets/${escapeRegExp(lostPet.id)}$`));
  await expect(page.getByRole('heading', { level: 1, name: lostPet.name })).toBeVisible();
  return lostPet;
}

async function waitForAutoMatch(
  request: APIRequestContext,
  ownerToken: string,
  lostPetId: string,
  sightingId: string,
): Promise<MatchResponse> {
  let latestMatch: MatchResponse | undefined;
  await expect
    .poll(
      async () => {
        const matches = await listLostPetMatches(request, ownerToken, lostPetId);
        latestMatch = matches.find((item) => item.sighting.id === sightingId);
        return latestMatch?.id ?? null;
      },
      { intervals: [500, 1000, 2000], timeout: 20_000 },
    )
    .not.toBeNull();

  if (!latestMatch) {
    throw new Error('Expected automatic matching to create a match result.');
  }
  return latestMatch;
}

async function advanceWizard(page: Page, steps: number): Promise<void> {
  for (let index = 0; index < steps; index += 1) {
    await page.getByRole('button', { name: /^continue$/i }).click();
  }
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
