'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';

import { formatDate, formatStatus } from '../../lib/formatting/display';
import { safeNotificationUrl, type NotificationItem } from './notifications-api';
import { useNotifications } from './notifications-provider';

export function NotificationsPage() {
  const { load: loadNotifications, markAll: markAllNotifications, markRead: markNotification, refreshUnread } = useNotifications();
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [markingAll, setMarkingAll] = useState(false);

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try { setItems(await loadNotifications(filter, 50)); await refreshUnread(); }
    catch { setError('Notifications could not be loaded. Please try again.'); }
    finally { setLoading(false); }
  }, [filter, loadNotifications, refreshUnread]);

  useEffect(() => { void load(); }, [load]);

  async function markRead(item: NotificationItem) {
    if (item.readAt) return;
    try {
      const updated = await markNotification(item.id);
      setItems((current) => filter === 'unread' ? current.filter((candidate) => candidate.id !== item.id) : current.map((candidate) => candidate.id === item.id ? updated : candidate));
    } catch { setError('The notification could not be marked as read.'); }
  }

  async function markAll() {
    setMarkingAll(true);
    try {
      await markAllNotifications();
      if (filter === 'unread') setItems([]);
      else { const now = new Date().toISOString(); setItems((current) => current.map((item) => ({ ...item, readAt: item.readAt ?? now }))); }
    } catch { setError('Notifications could not be marked as read.'); }
    finally { setMarkingAll(false); }
  }

  return (
    <div className="page-container workspace-page">
      <header className="page-heading"><div><span className="eyebrow">Notification center</span><h1>Notifications</h1><p>Updates about your reports, lost pets, and possible matches.</p></div><button className="primary-action" disabled={!items.some((item) => item.readAt === null) || markingAll} type="button" onClick={() => void markAll()}>{markingAll ? 'Marking...' : 'Mark all as read'}</button></header>
      <div className="tabs"><button className={filter === 'all' ? 'active' : ''} type="button" onClick={() => setFilter('all')}>All</button><button className={filter === 'unread' ? 'active' : ''} type="button" onClick={() => setFilter('unread')}>Unread</button></div>
      {loading ? <section className="loading-state workspace-state"><span className="loading-pulse" /><p>Loading notifications...</p></section> : error ? <section className="empty-state error-state"><span>!</span><h2>Notifications unavailable</h2><p>{error}</p><button className="primary-action" type="button" onClick={() => void load()}>Retry</button></section> : items.length === 0 ? <section className="empty-state"><span aria-hidden="true">OK</span><h2>You're all caught up</h2><p>No notifications to show.</p></section> : <section className="notification-page-list">{items.map((item) => { const action = safeNotificationUrl(item.actionUrl); return <article className={`notification-panel ${item.readAt ? '' : 'unread'}`} key={item.id}><div><span className="eyebrow">{formatStatus(item.type)}</span><h2>{item.title}</h2><p>{item.message}</p><time dateTime={item.createdAt}>{formatDate(item.createdAt)}</time></div><div className="card-actions">{action ? <Link className="secondary-action" href={action} onClick={() => void markRead(item)}>View</Link> : null}{!item.readAt ? <button className="primary-action" type="button" onClick={() => void markRead(item)}>Mark as read</button> : null}</div></article>; })}</section>}
    </div>
  );
}
