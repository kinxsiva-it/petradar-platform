# Frontend Architecture Migration Inventory

This document tracks the architecture rescue from the temporary monolithic UI prototype toward feature-first Angular routes.

## Current Monolith

| Item | Value |
| --- | --- |
| Source file | Removed after Batch 6 (`apps/web/src/app/ui-prototype.pages.ts`) |
| Line count at audit | 1601 |
| Line count after Batch 3 extraction | 1270 |
| Line count after Batch 4 extraction | 751 |
| Line count after Batch 5 extraction | 596 |
| Final Batch 6 status | Monolithic prototype file and legacy app-level mock store removed; active routes are feature-owned |
| Reason for exclusion | The file contains unrelated future-batch pages and strict-template errors that block migrated routes |

## Migration Table

| Current page | Current source location | Target feature | Target route | Target page component | Shared components to extract | Mock data dependency | Migration status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Landing | `LandingPage` in `ui-prototype.pages.ts` | `libs/frontend/landing` | `/` | `LandingPageComponent` | `PublicLayoutComponent`, `PrivacyBannerComponent` | `landing.fixture.ts` | Migrated in Batch 2 |
| Login | `AuthPage` in `ui-prototype.pages.ts` | `libs/frontend/auth` | `/login` | `LoginPageComponent` | `PublicLayoutComponent`, shared button/alert/privacy banner | `AuthPreviewState` | Migrated in Batch 2 |
| Registration | `AuthPage` in `ui-prototype.pages.ts` | `libs/frontend/auth` | `/register` | `RegisterPageComponent` | `PublicLayoutComponent`, shared button/alert/privacy banner | `AuthPreviewState` | Migrated in Batch 2 |
| Public map | Extracted from `ui-prototype.pages.ts` | `libs/frontend/map` | `/map` | `CommunityMapPageComponent` | `MapCanvasComponent`, `MapFilterPanelComponent`, `MapLegendComponent`, `MapResultsListComponent`, `SightingDetailDrawerComponent` | `PublicDiscoveryDataSource` | Migrated in Batch 3 |
| Sighting detail | Extracted from `ui-prototype.pages.ts` | `libs/frontend/sightings` | `/sightings/:id` | `SightingDetailPageComponent` | `SightingPhotoGalleryComponent`, `SightingMetadataComponent`, `RelatedSightingsComponent`, `PrivacyBannerComponent` | `PublicDiscoveryDataSource` | Migrated in Batch 3 |
| Lost pet list | Extracted from `ui-prototype.pages.ts` | `libs/frontend/lost-pets` | `/lost-pets` | `LostPetListPageComponent` | `LostPetFilterBarComponent`, `LostPetCardComponent`, shared state panels | `PublicDiscoveryDataSource` | Migrated in Batch 3 |
| Lost pet detail | Extracted from `ui-prototype.pages.ts` | `libs/frontend/lost-pets` | `/lost-pets/:id` | `LostPetDetailPageComponent` | `LostPetPhotoGalleryComponent`, `PossibleMatchSummaryComponent`, `PrivacyBannerComponent` | `PublicDiscoveryDataSource` | Migrated in Batch 3 |
| Report animal wizard | Extracted from `ui-prototype.pages.ts` | `libs/frontend/report-animal` | `/report-animal` | `ReportAnimalPageComponent` | `ReportStepperComponent`, `ReportSuccessComponent` | `UserWorkspaceDataSource` | Migrated in Batch 4 |
| My reports | Extracted from `ui-prototype.pages.ts` | `libs/frontend/sightings` | `/my/reports` | `MyReportsPageComponent` | `MyReportCardComponent`, `ReportEditDrawerComponent` | `UserWorkspaceDataSource` | Migrated in Batch 4 |
| Create lost pet | Extracted from `ui-prototype.pages.ts` | `libs/frontend/lost-pets` | `/lost-pets/new` | `CreateLostPetPageComponent` | wizard UI, upload previews, privacy panel | `UserWorkspaceDataSource` | Migrated in Batch 4 |
| My lost pets | Extracted from `ui-prototype.pages.ts` | `libs/frontend/lost-pets` | `/my/lost-pets` | `MyLostPetsPageComponent` | `MyLostPetCardComponent`, confirmation modal | `UserWorkspaceDataSource` | Migrated in Batch 4 |
| Possible matches | Extracted from `ui-prototype.pages.ts` | `libs/frontend/lost-pets` | `/my/lost-pets/:id/matches` | `PossibleMatchesPageComponent` | `PossibleMatchCardComponent` | `UserWorkspaceDataSource` | Migrated in Batch 4 |
| Match detail | Extracted from `ui-prototype.pages.ts` | `libs/frontend/matching` | `/matches/:id` | `MatchDetailPageComponent` | `MatchScoreRingComponent`, comparison panels | `UserWorkspaceDataSource` | Migrated in Batch 4 |
| Notifications | Extracted from `ui-prototype.pages.ts` | `libs/frontend/notifications` | `/notifications` | `NotificationsPageComponent` | `NotificationItemComponent`, filter tabs | `UserWorkspaceDataSource` | Migrated in Batch 4 |
| Profile | Extracted from `ui-prototype.pages.ts` | `libs/frontend/account` | `/profile` | `ProfilePageComponent` | profile summary and edit form | `UserWorkspaceDataSource` | Migrated in Batch 4 |
| Settings | Extracted from `ui-prototype.pages.ts` | `libs/frontend/account` | `/settings` | `SettingsPageComponent` | settings panels and toggles | `UserWorkspaceDataSource` | Migrated in Batch 4 |
| Community guidelines | Extracted from `ui-prototype.pages.ts` | `libs/frontend/account` | `/community-guidelines` | `CommunityGuidelinesPageComponent` | guideline cards, privacy banner, emergency alert | static typed page data | Migrated in Batch 4 |
| Volunteer dashboard | Extracted from `ui-prototype.pages.ts` | `libs/frontend/volunteer` | `/volunteer` | `VolunteerDashboardPageComponent` | `VolunteerLayoutComponent`, `VolunteerStatCardComponent`, `VolunteerAvailabilityCardComponent`, `AssignedCaseListComponent` | `RescueWorkflowDataSource` | Migrated in Batch 5 |
| Rescue board | Extracted from `ui-prototype.pages.ts` | `libs/frontend/rescue-cases` | `/volunteer/rescue-cases` | `RescueCaseListPageComponent` | `RescueCaseCardComponent`, rescue severity/status badges | `RescueWorkflowDataSource` | Migrated in Batch 5 |
| Rescue detail | Extracted from `ui-prototype.pages.ts` | `libs/frontend/rescue-cases` | `/volunteer/rescue-cases/:id` | `RescueCaseDetailPageComponent` | `RescueStatusStepperComponent`, `RescueCaseTimelineComponent`, `InternalNoteListComponent`, `RescuePhotoUpdateComponent` | `RescueWorkflowDataSource` | Migrated in Batch 5 |
| Volunteer profile | Extracted from `ui-prototype.pages.ts` | `libs/frontend/volunteer` | `/volunteer/profile` | `VolunteerProfilePageComponent` | `VolunteerAvailabilityCardComponent`, `VolunteerStatCardComponent` | `RescueWorkflowDataSource` | Migrated in Batch 5 |
| Admin verification | Extracted from `ui-prototype.pages.ts` | `libs/frontend/admin` | `/admin/verification`, `/admin/verification/:id` | `VerificationQueuePageComponent`, `VerificationDetailPageComponent` | `AdminLayoutComponent`, `VerificationFilterBarComponent`, `VerificationTableComponent`, `ReportReviewPanelComponent`, `ReportVerificationActionsComponent` | `AdminWorkspaceDataSource` | Migrated in Batch 6 |
| Admin duplicates | Extracted from `ui-prototype.pages.ts` | `libs/frontend/admin` | `/admin/duplicates/:id` | `DuplicateReviewPageComponent` | `DuplicateComparisonComponent` | `AdminWorkspaceDataSource` | Migrated in Batch 6 |
| Admin rescue management | New feature route using Batch 5 rescue state | `libs/frontend/admin`, `libs/frontend/rescue-cases` | `/admin/rescue-cases`, `/admin/rescue-cases/:id` | `AdminRescueBoardPageComponent`, `AdminRescueDetailPageComponent` | `VolunteerAssignmentPanelComponent`, rescue timeline/status/card components | `RescueWorkflowDataSource`, `AdminWorkspaceDataSource` | Migrated in Batch 6 |
| Admin privacy/users | New feature route | `libs/frontend/admin` | `/admin/privacy`, `/admin/users`, `/admin/users/:id` | `PrivacyControlPageComponent`, `AdminUsersPageComponent`, `AdminUserDetailPageComponent` | `AdminUserTableComponent`, `RoleEditorComponent`, `AccountStatusControlComponent`, `AdminActivityListComponent` | `AdminWorkspaceDataSource` | Migrated in Batch 6 |
| Admin analytics/heatmap/reports | New feature route | `libs/frontend/analytics` | `/admin/analytics`, `/admin/heatmap`, `/admin/reports` | `AnalyticsDashboardPageComponent`, `CommunityHeatmapPageComponent`, `ExecutiveReportsPageComponent` | `AnalyticsSummaryGridComponent`, `TrendChartComponent`, `DistributionChartComponent`, `HeatmapMapComponent`, `HeatmapInsightDrawerComponent` | `AdminWorkspaceDataSource` | Migrated in Batch 6 |

## Route Structure

Root app routes now lazy-load:

- `@petradar/frontend/landing` for `/`
- `@petradar/frontend/auth` for `/login` and `/register`
- `@petradar/frontend/map` for `/map`
- `@petradar/frontend/sightings` for `/sightings/:id`
- `@petradar/frontend/lost-pets` for `/lost-pets` and `/lost-pets/:id`
- `@petradar/frontend/report-animal` for `/report-animal`
- `@petradar/frontend/sightings` for `/my/reports`
- `@petradar/frontend/lost-pets` for `/lost-pets/new`, `/my/lost-pets`, and `/my/lost-pets/:id/matches`
- `@petradar/frontend/matching` for `/matches/:id`
- `@petradar/frontend/notifications` for `/notifications`
- `@petradar/frontend/account` for `/profile`, `/settings`, and `/community-guidelines`
- `@petradar/frontend/volunteer` for `/volunteer`, `/volunteer/profile`, and nested rescue routes
- `@petradar/frontend/rescue-cases` for `/volunteer/rescue-cases` and `/volunteer/rescue-cases/:id`
- `@petradar/frontend/admin` for Admin shell, verification, duplicate review, rescue management, privacy, and users
- `@petradar/frontend/analytics` for Admin analytics, heatmap, and executive reports

The old `/showcase` development route and Phase 0 placeholder pages have been removed from active routing.
