import { arrayField, enumField, isRecord, nullableStringField, numberField, stringField } from '../../lib/api/parse';
import type { AuthenticatedRequest } from '../auth/auth-types';

export type NotificationType = 'SIGHTING_VERIFIED' | 'SIGHTING_REJECTED' | 'MATCH_FOUND' | 'MATCH_CONFIRMED' | 'MATCH_REJECTED' | 'RESCUE_ASSIGNED' | 'RESCUE_STATUS_UPDATED';
export interface NotificationItem { actionUrl: string | null; createdAt: string; id: string; message: string; readAt: string | null; title: string; type: NotificationType; }
const types: readonly NotificationType[] = ['SIGHTING_VERIFIED','SIGHTING_REJECTED','MATCH_FOUND','MATCH_CONFIRMED','MATCH_REJECTED','RESCUE_ASSIGNED','RESCUE_STATUS_UPDATED'];

export async function listNotifications(request: AuthenticatedRequest, status: 'all'|'unread', limit: number): Promise<NotificationItem[]> { const value=await request<unknown>(`notifications?status=${status}&limit=${String(limit)}`); if(!isRecord(value))throw new Error('The notifications response was invalid.'); return arrayField(value,'items').map(parseNotification); }
export async function getUnreadCount(request: AuthenticatedRequest): Promise<number> { const value=await request<unknown>('notifications/unread-count'); if(!isRecord(value))throw new Error('The unread response was invalid.'); return numberField(value,'unreadCount'); }
export async function markNotificationRead(request: AuthenticatedRequest,id:string): Promise<NotificationItem> { return parseNotification(await request<unknown>(`notifications/${encodeURIComponent(id)}/read`,{json:{},method:'PATCH'})); }
export async function markAllNotificationsRead(request: AuthenticatedRequest): Promise<number> { const value=await request<unknown>('notifications/read-all',{json:{},method:'PATCH'}); if(!isRecord(value))throw new Error('The mark-all response was invalid.'); return numberField(value,'updatedCount'); }
function parseNotification(value:unknown):NotificationItem { if(!isRecord(value))throw new Error('A notification response was invalid.'); return {actionUrl:nullableStringField(value,'actionUrl'),createdAt:stringField(value,'createdAt'),id:stringField(value,'id'),message:stringField(value,'message'),readAt:nullableStringField(value,'readAt'),title:stringField(value,'title'),type:enumField(value,'type',types)}; }
export function safeNotificationUrl(value:string|null):string|null { return value && value.startsWith('/') && !value.startsWith('//') && !value.includes('\\') ? value : null; }
