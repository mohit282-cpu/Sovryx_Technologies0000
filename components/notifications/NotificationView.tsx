'use client';

import React, { useState } from 'react';
import { Bell, AlertTriangle, CheckCircle2, Megaphone, Zap, Trash2, ShieldAlert } from 'lucide-react';
import { NotificationItem } from '@/types';
import { createItem, updateItem, deleteItem } from '@/lib/services/firestore';

interface NotificationViewProps {
  notifications: NotificationItem[];
  onRefresh: () => void;
}

export default function NotificationView({ notifications, onRefresh }: NotificationViewProps) {
  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastMsg, setBroadcastMsg] = useState('');

  const handleMarkAsRead = async (id: string) => {
    try {
      await updateItem('notifications', id, { read: true });
    } catch (err: any) {
      alert('Error updating notification: ' + err.message);
    }
  };

  const handleBroadcastAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastTitle || !broadcastMsg) return;

    try {
      await createItem<Omit<NotificationItem, 'id'>>('notifications', {
        title: `CEO ANNOUNCEMENT: ${broadcastTitle.toUpperCase()}`,
        message: broadcastMsg,
        type: 'announcement',
        severity: 'info',
        read: false,
        timestamp: 'Just now'
      });

      setBroadcastTitle('');
      setBroadcastMsg('');
      alert('CEO Broadcast Announcement Sent to Company Network!');
    } catch (err: any) {
      alert('Error broadcasting announcement: ' + err.message);
    }
  };

  const handleDeleteNotification = async (id: string) => {
    await deleteItem('notifications', id);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Bell className="w-5 h-5 text-indigo-400" />
            Command Center Notifications & Broadcasts
          </h2>
          <p className="text-xs text-slate-400">System risk alerts, delivery warnings, and CEO company-wide broadcasts</p>
        </div>
      </div>

      {/* CEO Broadcast Form */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-indigo-950/80 via-slate-900 to-slate-900 border border-indigo-500/30 space-y-3">
        <h3 className="text-xs font-bold text-indigo-300 uppercase tracking-wider flex items-center gap-2">
          <Megaphone className="w-4 h-4 text-indigo-400" /> Broadcast CEO Company-Wide Announcement
        </h3>

        <form onSubmit={handleBroadcastAnnouncement} className="space-y-2 text-xs">
          <input
            type="text"
            required
            placeholder="Announcement Header (e.g., Q3 Bonus Target Achieved)..."
            value={broadcastTitle}
            onChange={(e) => setBroadcastTitle(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-indigo-500"
          />
          <textarea
            rows={2}
            required
            placeholder="Detailed message for all personnel..."
            value={broadcastMsg}
            onChange={(e) => setBroadcastMsg(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-indigo-500"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition-all shadow-md shadow-indigo-600/20"
          >
            Broadcast to Company OS
          </button>
        </form>
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        {notifications.map((n) => (
          <div
            key={n.id}
            className={`p-4 rounded-2xl border transition-all flex items-start justify-between gap-4 ${
              n.read
                ? 'bg-slate-900/40 border-slate-800 text-slate-400'
                : 'bg-slate-900 border-slate-800 shadow-md text-white'
            }`}
          >
            <div className="flex items-start gap-3">
              <div className={`p-2 rounded-xl mt-0.5 shrink-0 ${
                n.severity === 'urgent' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' :
                n.type === 'announcement' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' :
                'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
              }`}>
                {n.severity === 'urgent' ? <ShieldAlert className="w-4 h-4" /> : <Zap className="w-4 h-4" />}
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-bold">{n.title}</h4>
                  {!n.read && (
                    <span className="w-2 h-2 rounded-full bg-indigo-500" />
                  )}
                </div>
                <p className="text-xs text-slate-300 mt-0.5">{n.message}</p>
                <span className="text-[10px] text-slate-500 mt-1 block font-mono">{n.timestamp}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {!n.read && (
                <button
                  onClick={() => handleMarkAsRead(n.id)}
                  className="text-xs font-semibold px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg"
                >
                  Mark Read
                </button>
              )}
              <button
                onClick={() => handleDeleteNotification(n.id)}
                className="text-slate-500 hover:text-rose-400"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
