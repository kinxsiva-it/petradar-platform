import { arrayField, enumField, isRecord, nullableNumberField, nullableStringField, numberField, recordField, stringField, stringListField } from '../../lib/api/parse';
import type { AuthenticatedRequest } from '../auth/auth-types';

export type MatchLevel = 'HIGH' | 'MEDIUM' | 'LOW';
export type MatchReviewStatus = 'CONFIRMED' | 'PENDING' | 'REJECTED';
export interface MatchResult {
  distanceMeters: number | null; id: string; level: MatchLevel; lostPet: { id: string; name: string };
  matchedAt: string; reasons: string[]; rejectionReason: string | null; reviewStatus: MatchReviewStatus;
  reviewedAt: string | null; score: number; sighting: { condition: string; id: string; publicRadiusMeters: number; seenAt: string; species: string };
}
export interface MatchPage { items: MatchResult[]; page: number; pageSize: number; total: number; totalPages: number; }
const levels: readonly MatchLevel[] = ['HIGH','MEDIUM','LOW'];
const statuses: readonly MatchReviewStatus[] = ['CONFIRMED','PENDING','REJECTED'];

export async function listMatches(request: AuthenticatedRequest, status?: MatchReviewStatus): Promise<MatchPage> {
  const query = new URLSearchParams({ page: '1', pageSize: '50' }); if (status) query.set('status', status);
  return parseMatchPage(await request<unknown>(`matches?${query.toString()}`));
}
export async function getMatch(request: AuthenticatedRequest, id: string): Promise<MatchResult> { return parseMatch(await request<unknown>(`matches/${encodeURIComponent(id)}`)); }
export async function listMatchesForLostPet(request: AuthenticatedRequest, lostPetId: string): Promise<MatchResult[]> {
  const value = await request<unknown>(`lost-pets/${encodeURIComponent(lostPetId)}/matches`);
  if (!isRecord(value)) throw new Error('The lost-pet matches response was not valid.');
  return arrayField(value, 'items').map(parseMatch);
}
export async function runMatchingForLostPet(request: AuthenticatedRequest, lostPetId: string): Promise<void> {
  await request<unknown>(`lost-pets/${encodeURIComponent(lostPetId)}/run-matching`, { json: {}, method: 'POST' });
}

function parseMatchPage(value: unknown): MatchPage { if (!isRecord(value)) throw new Error('The matches response was not valid.'); return { items: arrayField(value,'items').map(parseMatch), page: numberField(value,'page'), pageSize: numberField(value,'pageSize'), total: numberField(value,'total'), totalPages: numberField(value,'totalPages') }; }
function parseMatch(value: unknown): MatchResult {
  if (!isRecord(value)) throw new Error('A match response was not valid.'); const lostPet = recordField(value,'lostPet'); const sighting = recordField(value,'sighting'); const location = recordField(sighting,'publicLocation');
  return { distanceMeters: nullableNumberField(value,'distanceMeters'), id: stringField(value,'id'), level: enumField(value,'level',levels), lostPet: { id: stringField(lostPet,'id'), name: stringField(lostPet,'name') }, matchedAt: stringField(value,'matchedAt'), reasons: stringListField(value,'reasons'), rejectionReason: nullableStringField(value,'rejectionReason'), reviewStatus: enumField(value,'reviewStatus',statuses), reviewedAt: nullableStringField(value,'reviewedAt'), score: numberField(value,'score'), sighting: { condition: stringField(sighting,'condition'), id: stringField(sighting,'id'), publicRadiusMeters: numberField(location,'radiusMeters'), seenAt: stringField(sighting,'seenAt'), species: stringField(sighting,'species') } };
}
