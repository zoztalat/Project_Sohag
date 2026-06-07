// src/useNotifications.ts
// Listens to real events and builds a notifications list

import { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';
import { collection, onSnapshot, query, orderBy, limit } from 'firebase/firestore';
import { db } from './firebase';

export interface AppNotification {
  id: string;
  type: 'community' | 'diagnosis' | 'conflict';
  title: string;
  body: string;
  time: Date;
  read: boolean;
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [userId, setUserId]               = useState<string | null>(null);
  const [groupId, setGroupId]             = useState<string>('acne_rosacea');

  // Get current user
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setUserId(user.id);
    });
  }, []);

  // ── 1. New diagnosis in history (Supabase realtime) ───────────────────────
  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel('diagnosis_notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'diagnosis_history',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const record = payload.new as any;
          // New diagnosis notification
          addNotification({
            id: `diag_${Date.now()}`,
            type: 'diagnosis',
            title: '🔬 New Diagnosis Added',
            body: `${record.diagnosis} — ${record.severity} (${record.confidence}% confidence)`,
            time: new Date(),
            read: false,
          });

          // Drug conflict notification
          if (record.conflict_detected) {
            addNotification({
              id: `conflict_${Date.now()}`,
              type: 'conflict',
              title: '⚠️ Drug Interaction Detected',
              body: `Conflict found in your ${record.diagnosis} diagnosis. Check safe alternative.`,
              time: new Date(),
              read: false,
            });
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [userId]);

  // ── 2. New community message (Firebase) ───────────────────────────────────
  useEffect(() => {
    if (!userId) return;

    // Track last message count to detect NEW messages
    let initialized = false;
    let lastMsgIds = new Set<string>();

    const q = query(
      collection(db, 'groups', groupId, 'messages'),
      orderBy('timestamp', 'desc'),
      limit(20)
    );

    const unsub = onSnapshot(q, (snap) => {
      if (!initialized) {
        // Seed existing IDs on first load — don't notify for old messages
        snap.docs.forEach(d => lastMsgIds.add(d.id));
        initialized = true;
        return;
      }

      snap.docs.forEach((d) => {
        if (!lastMsgIds.has(d.id)) {
          const data = d.data();
          // Only notify for messages from OTHER users
          if (data.userId !== userId) {
            addNotification({
              id: `msg_${d.id}`,
              type: 'community',
              title: '💬 New Community Message',
              body: `${data.author}: ${data.text?.slice(0, 60) || '📷 Image'}`,
              time: new Date(),
              read: false,
            });
          }
          lastMsgIds.add(d.id);
        }
      });
    });

    return () => unsub();
  }, [userId, groupId]);

  const addNotification = (n: AppNotification) => {
    setNotifications(prev => [n, ...prev].slice(0, 20)); // max 20
  };

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const markRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const clearAll = () => setNotifications([]);

  const unreadCount = notifications.filter(n => !n.read).length;

  return { notifications, unreadCount, markAllRead, markRead, clearAll, setGroupId };
}
