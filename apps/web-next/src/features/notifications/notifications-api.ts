import { arrayField, enumField, isRecord, nullableStringField, numberField, stringField } from '../../lib/api/parse';
import type { AuthenticatedRequest } from '../auth/auth-types';
import { routes } from '../../lib/routes';

export type NotificationType = 'SIGHTING_VERIFIED' | 'SIGHTING_REJECTED' | 'MATCH_FOUND' | 'MATCH_CONFIRMED' | 'MATCH_REJECTED' | 'RESCUE_ASSIGNED' | 'RESCUE_STATUS_UPDATED';
export interface NotificationItem { actionUrl: string | null; createdAt: string; id: string; message: string; readAt: string | null; title: string; type: NotificationType; }
const types: readonly NotificationType[] = ['SIGHTING_VERIFIED','SIGHTING_REJECTED','MATCH_FOUND','MATCH_CONFIRMED','MATCH_REJECTED','RESCUE_ASSIGNED','RESCUE_STATUS_UPDATED'];

export async function listNotifications(request: AuthenticatedRequest, status: 'all'|'unread', limit: number): Promise<NotificationItem[]> { const value=await request<unknown>(`notifications?status=${status}&limit=${String(limit)}`); if(!isRecord(value))throw new Error('The notifications response was invalid.'); return arrayField(value,'items').map(parseNotification); }
export async function getUnreadCount(request: AuthenticatedRequest): Promise<number> { const value=await request<unknown>('notifications/unread-count'); if(!isRecord(value))throw new Error('The unread response was invalid.'); return numberField(value,'unreadCount'); }
export async function markNotificationRead(request: AuthenticatedRequest,id:string): Promise<NotificationItem> { return parseNotification(await request<unknown>(`notifications/${encodeURIComponent(id)}/read`,{json:{},method:'PATCH'})); }
export async function markAllNotificationsRead(request: AuthenticatedRequest): Promise<number> { const value=await request<unknown>('notifications/read-all',{json:{},method:'PATCH'}); if(!isRecord(value))throw new Error('The mark-all response was invalid.'); return numberField(value,'updatedCount'); }
function parseNotification(value:unknown):NotificationItem { if(!isRecord(value))throw new Error('A notification response was invalid.'); return {actionUrl:nullableStringField(value,'actionUrl'),createdAt:stringField(value,'createdAt'),id:stringField(value,'id'),message:stringField(value,'message'),readAt:nullableStringField(value,'readAt'),title:stringField(value,'title'),type:enumField(value,'type',types)}; }
const supportedNotificationPaths = new Set([
  '/', '/community-guidelines', '/dashboard', '/login', '/lost-pets', '/lost-pets/new',
  '/map', '/matches', '/my/lost-pets', '/my/reports', '/notifications', '/profile',
  '/register', '/report-animal', '/settings', '/sightings',
]);
const supportedNotificationPatterns = [
  /^\/sightings\/[^/]+$/,
  /^\/lost-pets\/[^/]+(?:\/edit)?$/,
  /^\/matches\/[^/]+$/,
  /^\/my\/lost-pets\/[^/]+\/matches$/,
];

export function safeNotificationUrl(value: string | null): string | null {
  if (!value || !value.startsWith('/') || value.startsWith('//') || value.includes('\\') || /[\u0000-\u001f\u007f]/.test(value)) return null;
  try {
    const parsed = new URL(value, 'https://petradar.internal');
    if (parsed.origin !== 'https://petradar.internal') return null;
    const decodedPath = decodeURIComponent(parsed.pathname);
    if (decodedPath !== parsed.pathname || decodedPath.includes('\\') || /[\u0000-\u001f\u007f]/.test(decodedPath)) return null;
    const supported = supportedNotificationPaths.has(parsed.pathname) || supportedNotificationPatterns.some((pattern) => pattern.test(parsed.pathname));
    return supported ? `${parsed.pathname}${parsed.search}${parsed.hash}` : routes.notifications;
  } catch { return null; }
}
