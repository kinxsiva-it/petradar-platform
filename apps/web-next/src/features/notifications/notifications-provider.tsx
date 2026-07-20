'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { useAuth } from '../auth/use-auth';
import { getUnreadCount, listNotifications, markAllNotificationsRead, markNotificationRead, type NotificationItem } from './notifications-api';

interface NotificationsContextValue { unreadCount:number; load(status:'all'|'unread',limit:number):Promise<NotificationItem[]>; markAll():Promise<number>; markRead(id:string):Promise<NotificationItem>; refreshUnread():Promise<void>; }
const NotificationsContext=createContext<NotificationsContextValue|null>(null);

export function NotificationsProvider({children}:{children:ReactNode}) {
  const auth=useAuth(); const [unreadCount,setUnreadCount]=useState(0);
  const refreshUnread=useCallback(async()=>{ if(auth.status!=='authenticated'){setUnreadCount(0);return;} setUnreadCount(await getUnreadCount(auth.authenticatedRequest)); },[auth.authenticatedRequest,auth.status]);
  const load=useCallback((status:'all'|'unread',limit:number)=>listNotifications(auth.authenticatedRequest,status,limit),[auth.authenticatedRequest]);
  const markAll=useCallback(async()=>{const count=await markAllNotificationsRead(auth.authenticatedRequest);setUnreadCount(0);return count;},[auth.authenticatedRequest]);
  const markRead=useCallback(async(id:string)=>{const item=await markNotificationRead(auth.authenticatedRequest,id);await refreshUnread();return item;},[auth.authenticatedRequest,refreshUnread]);
  useEffect(()=>{ if(auth.status==='authenticated'){void refreshUnread().catch(()=>setUnreadCount(0));} else setUnreadCount(0); },[auth.status,refreshUnread]);
  const value=useMemo<NotificationsContextValue>(()=>({unreadCount,load,markAll,markRead,refreshUnread}),[load,markAll,markRead,refreshUnread,unreadCount]);
  return <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>;
}
export function useNotifications(){const context=useContext(NotificationsContext);if(!context)throw new Error('useNotifications must be used inside NotificationsProvider.');return context;}
