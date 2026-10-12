import React, { useState, useEffect } from 'react';
import {
  Bell,
  Plus,
  Pin,
  Trash2,
  X,
  AlertTriangle,
  Info,
  Flame,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';
import { Announcement } from '../../types';

export const AnnouncementsView: React.FC = () => {
  const { user } = useAuth();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const [form, setForm] = useState({
    title: '',
    content: '',
    priority: 'normal' as const,
    targetAudience: 'all' as const,
    isPinned: false,
  });

  const canPublish = ['super_admin', 'hr_manager', 'dept_manager'].includes(user?.role || '');

  const loadData = async () => {
    try {
      const res = await api.getAnnouncements();
      setAnnouncements(res.announcements);
    } catch (err) {
      console.error('Failed to load announcements', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createAnnouncement(form);
      setShowCreateModal(false);
      setForm({
        title: '',
        content: '',
        priority: 'normal',
        targetAudience: 'all',
        isPinned: false,
      });
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to publish announcement');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to remove this announcement?')) return;
    try {
      await api.deleteAnnouncement(id);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to delete announcement');
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">Company Announcements</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Internal corporate communications, town hall briefings, and policy memos
          </p>
        </div>

        {canPublish && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-colors shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Publish Announcement</span>
          </button>
        )}
      </div>

      {/* Announcements Feed */}
      <div className="space-y-4">
        {announcements.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs bg-white rounded-xl border border-slate-200">
            No company announcements found for your profile.
          </div>
        ) : (
          announcements.map(item => (
            <div
              key={item.id}
              className={`p-6 rounded-xl border transition-all ${
                item.isPinned
                  ? 'bg-amber-50/20 border-amber-300 shadow-xs'
                  : 'bg-white border-slate-200 shadow-xs'
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    {item.isPinned && (
                      <span className="flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-100 px-2 py-0.5 rounded">
                        <Pin className="w-3 h-3" /> Pinned
                      </span>
                    )}
                    <span
                      className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded ${
                        item.priority === 'urgent'
                          ? 'bg-rose-100 text-rose-700'
                          : item.priority === 'important'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {item.priority}
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Audience: <strong className="capitalize">{item.targetAudience}</strong>
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900">{item.title}</h3>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-xs text-slate-400 font-mono">
                    {new Date(item.createdAt).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </span>
                  {(user?.role === 'super_admin' || user?.role === 'hr_manager') && (
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-slate-100 rounded transition-colors"
                      title="Delete Announcement"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              <div className="mt-4 text-xs text-slate-700 leading-relaxed whitespace-pre-line">
                {item.content}
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                <span>
                  Published by <strong className="text-slate-700">{item.authorName}</strong> ({item.authorRole})
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create Announcement Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-900">Publish Company Announcement</h2>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-4 space-y-3 text-xs">
              <div>
                <label className="block font-medium text-slate-700 mb-1">Headline / Title *</label>
                <input
                  required
                  type="text"
                  value={form.title}
                  onChange={e => setForm({ ...form, title: e.target.value })}
                  placeholder="e.g. Q4 Town Hall and Milestone Review"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Priority Level</label>
                  <select
                    value={form.priority}
                    onChange={e => setForm({ ...form, priority: e.target.value as any })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg"
                  >
                    <option value="normal">Normal Announcement</option>
                    <option value="important">Important (Action Needed)</option>
                    <option value="urgent">Urgent Alert</option>
                  </select>
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Target Audience</label>
                  <select
                    value={form.targetAudience}
                    onChange={e => setForm({ ...form, targetAudience: e.target.value as any })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg"
                  >
                    <option value="all">Organization Wide (All Staff)</option>
                    <option value="engineering">Engineering Team</option>
                    <option value="leadership">Executive & Management</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="pinCheck"
                  checked={form.isPinned}
                  onChange={e => setForm({ ...form, isPinned: e.target.checked })}
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <label htmlFor="pinCheck" className="text-slate-700 font-medium">
                  Pin to top of workforce feeds
                </label>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Announcement Body *</label>
                <textarea
                  required
                  rows={4}
                  value={form.content}
                  onChange={e => setForm({ ...form, content: e.target.value })}
                  placeholder="Write clear, professional memo content..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg font-medium text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold"
                >
                  Publish Announcement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
