'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { formatDate } from '../../lib/formatting/display';
import { routes } from '../../lib/routes';
import { safeNotificationUrl, type NotificationItem } from './notifications-api';
import { useNotifications } from './notifications-provider';

export function NotificationBell(){const notifications=useNotifications();const router=useRouter();const[open,setOpen]=useState(false);const[items,setItems]=useState<NotificationItem[]>([]);const[loading,setLoading]=useState(false);const[error,setError]=useState('');const[markingAll,setMarkingAll]=useState(false);
  async function toggle(){const next=!open;setOpen(next);if(next){setLoading(true);setError('');try{setItems(await notifications.load('all',15));await notifications.refreshUnread();}catch{setError('Notifications could not be loaded.');}finally{setLoading(false);}}}
  async function select(item:NotificationItem){try{const updated=item.readAt?item:await notifications.markRead(item.id);setItems((current)=>current.map((candidate)=>candidate.id===updated.id?updated:candidate));setOpen(false);const url=safeNotificationUrl(item.actionUrl);if(url)router.push(url);}catch{setError('The notification could not be opened.');}}
  async function markAll(){setMarkingAll(true);setError('');try{await notifications.markAll();const now=new Date().toISOString();setItems((current)=>current.map((item)=>({...item,readAt:item.readAt??now})));}catch{setError('Notifications could not be marked as read.');}finally{setMarkingAll(false);}}
  return <div className="notification-control"><button className="bell-button" type="button" aria-expanded={open} aria-haspopup="dialog" aria-label={notifications.unreadCount?`Notifications, ${notifications.unreadCount} unread`:'Notifications'} onClick={()=>void toggle()}><span aria-hidden="true">♢</span>{notifications.unreadCount>0?<span className="notification-badge">{notifications.unreadCount>99?'99+':notifications.unreadCount}</span>:null}</button>{open?<section className="notification-dropdown" aria-label="Recent notifications"><header><h2>Notifications</h2><button className="text-action" disabled={notifications.unreadCount===0||markingAll} type="button" onClick={()=>void markAll()}>{markingAll?'Marking…':'Mark all as read'}</button></header><div className="notification-content">{loading?<p>Loading notifications…</p>:error?<div className="feedback feedback-error" role="alert">{error}</div>:items.length===0?<div className="notification-empty"><strong>You're all caught up</strong><span>No notifications to show.</span></div>:items.map((item)=><button className={`notification-item ${item.readAt?'':'unread'}`} key={item.id} type="button" onClick={()=>void select(item)}><span className="unread-indicator"/><span><strong>{item.title}</strong><span>{item.message}</span><time dateTime={item.createdAt}>{formatDate(item.createdAt)}</time></span></button>)}</div><footer><Link href={routes.notifications} onClick={()=>setOpen(false)}>View all notifications</Link></footer></section>:null}</div>;
}
