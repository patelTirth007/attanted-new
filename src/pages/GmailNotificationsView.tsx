import React, { useState, useEffect } from 'react';
import { GmailNotification, User } from '../types';
import { notificationService } from '../services/notificationService';
import {
  Mail,
  ExternalLink,
  Trash2,
  Copy,
  Search,
  CheckCircle2,
  Clock,
  ArrowLeft,
  X,
  Send
} from 'lucide-react';

interface GmailNotificationsViewProps {
  userEmail?: string;
  role: 'STUDENT' | 'FACULTY' | 'ADMIN';
  onBack?: () => void;
}

export const GmailNotificationsView: React.FC<GmailNotificationsViewProps> = ({
  userEmail,
  role,
  onBack
}) => {
  const [notifications, setNotifications] = useState<GmailNotification[]>([]);
  const [search, setSearch] = useState('');
  const [selectedNotif, setSelectedNotif] = useState<GmailNotification | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const loadNotifications = () => {
    if (role === 'STUDENT' && userEmail) {
      setNotifications(notificationService.getNotificationsForEmail(userEmail));
    } else {
      setNotifications(notificationService.getAllNotifications());
    }
  };

  useEffect(() => {
    loadNotifications();

    const handleNewNotif = () => loadNotifications();
    window.addEventListener('sca_gmail_notification_dispatched', handleNewNotif);
    return () => window.removeEventListener('sca_gmail_notification_dispatched', handleNewNotif);
  }, [userEmail, role]);

  const handleCopy = (notif: GmailNotification) => {
    navigator.clipboard.writeText(`Subject: ${notif.subject}\n\n${notif.body}`);
    setCopiedId(notif.id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const handleDelete = (id: string) => {
    notificationService.deleteNotification(id);
    loadNotifications();
    if (selectedNotif?.id === id) setSelectedNotif(null);
  };

  const handleClearAll = () => {
    if (window.confirm('Clear all logged Gmail notifications?')) {
      notificationService.clearAllNotifications();
      loadNotifications();
      setSelectedNotif(null);
    }
  };

  const filtered = notifications.filter(n => {
    const s = search.toLowerCase();
    return (
      n.subject.toLowerCase().includes(s) ||
      n.recipientEmail.toLowerCase().includes(s) ||
      n.recipientName.toLowerCase().includes(s) ||
      n.subjectName.toLowerCase().includes(s)
    );
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {onBack && (
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back
        </button>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-lg bg-red-100 text-red-600 flex items-center justify-center">
              <Mail className="w-4 h-4" />
            </div>
            <h2 className="text-2xl font-black text-slate-900">Gmail Attendance Notifications</h2>
          </div>
          <p className="text-xs text-slate-500">
            {role === 'STUDENT'
              ? `Real-time official attendance confirmation messages dispatched to ${userEmail}.`
              : 'Audit log of all official attendance emails sent to students across active subjects.'}
          </p>
        </div>

        {notifications.length > 0 && (
          <button
            onClick={handleClearAll}
            className="px-3.5 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-xl transition self-start sm:self-auto flex items-center gap-1.5"
          >
            <Trash2 className="w-3.5 h-3.5" /> Clear Notification Log
          </button>
        )}
      </div>

      {/* Filter / Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by student, email, or subject..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
        </div>

        <div className="text-xs font-bold text-slate-600 self-start sm:self-auto">
          Total Notifications: <span className="text-blue-700">{notifications.length}</span>
        </div>
      </div>

      {/* Notification List */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
          <div className="w-12 h-12 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto">
            <Mail className="w-6 h-6" />
          </div>
          <h4 className="text-sm font-bold text-slate-800">No Gmail Notifications Found</h4>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Notifications are generated and sent immediately whenever attendance is marked for a subject lecture.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Notifications Feed */}
          <div className="lg:col-span-2 space-y-3">
            {filtered.map((notif) => (
              <div
                key={notif.id}
                onClick={() => setSelectedNotif(notif)}
                className={`p-4 rounded-2xl border transition cursor-pointer ${
                  selectedNotif?.id === notif.id
                    ? 'bg-blue-50/60 border-blue-500 shadow-sm'
                    : 'bg-white border-slate-200 hover:border-slate-300 shadow-sm'
                }`}
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-red-700 bg-red-50 border border-red-200 px-2 py-0.5 rounded">
                      GMAIL CONFIRMATION
                    </span>
                    <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                      {notif.subjectCode}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-medium whitespace-nowrap">
                    {notif.sentTimeStr}
                  </span>
                </div>

                <h4 className="text-xs font-bold text-slate-900 mb-1">{notif.subject}</h4>
                <div className="text-[11px] text-slate-500 flex flex-wrap items-center gap-x-3 gap-y-1">
                  <span>To: <strong className="text-slate-800 font-mono">{notif.recipientEmail}</strong></span>
                  <span>Student: <strong className="text-slate-800">{notif.recipientName}</strong></span>
                  <span>Subject: <strong className="text-slate-800">{notif.subjectName}</strong></span>
                </div>

                <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                    <CheckCircle2 className="w-3 h-3" />
                    Delivered
                  </span>

                  <div className="flex items-center gap-2">
                    <a
                      href={notif.gmailUrl}
                      target="_blank"
                      rel="noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold text-[10px] flex items-center gap-1 transition"
                    >
                      <Mail className="w-3 h-3" /> Open in Gmail <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCopy(notif);
                      }}
                      className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
                      title="Copy text"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(notif.id);
                      }}
                      className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Email Preview Column */}
          <div className="lg:col-span-1">
            {selectedNotif ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4 sticky top-6">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-red-100 text-red-600 flex items-center justify-center">
                      <Mail className="w-3.5 h-3.5" />
                    </div>
                    <h3 className="text-xs font-bold text-slate-900">Email Message Preview</h3>
                  </div>
                  <button
                    onClick={() => setSelectedNotif(null)}
                    className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-1.5 text-xs">
                  <div>
                    <span className="text-slate-400 text-[10px] block">Recipient</span>
                    <span className="font-bold text-slate-800 font-mono text-[11px]">{selectedNotif.recipientEmail}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] block">Subject</span>
                    <span className="font-bold text-slate-900 text-xs">{selectedNotif.subject}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] block">Delivery Timestamp</span>
                    <span className="text-slate-600 text-[11px]">{selectedNotif.sentTimeStr} (Delivered)</span>
                  </div>
                </div>

                <div>
                  <span className="text-slate-400 text-[10px] block mb-1">Body Text</span>
                  <pre className="p-3 bg-slate-900 text-emerald-300 rounded-xl font-mono text-[10px] whitespace-pre-wrap max-h-72 overflow-y-auto leading-relaxed">
                    {selectedNotif.body}
                  </pre>
                </div>

                <div className="flex flex-col gap-2 pt-1">
                  <a
                    href={selectedNotif.gmailUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full py-2 px-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition shadow"
                  >
                    <Mail className="w-3.5 h-3.5" />
                    Open in Gmail Compose
                    <ExternalLink className="w-3 h-3" />
                  </a>
                  <button
                    onClick={() => handleCopy(selectedNotif)}
                    className="w-full py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    {copiedId === selectedNotif.id ? 'Copied to Clipboard!' : 'Copy Email Content'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-slate-50 rounded-2xl border border-dashed border-slate-200 p-8 text-center text-xs text-slate-400">
                Select any notification to preview its full Gmail message body and dispatch links.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
