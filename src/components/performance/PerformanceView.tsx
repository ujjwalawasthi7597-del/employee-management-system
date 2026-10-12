import React, { useState, useEffect } from 'react';
import {
  Award,
  Star,
  Plus,
  CheckCircle2,
  Calendar,
  X,
  TrendingUp,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';
import { PerformanceReview, User } from '../../types';

export const PerformanceView: React.FC = () => {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<PerformanceReview[]>([]);
  const [employees, setEmployees] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showReviewModal, setShowReviewModal] = useState(false);

  const [form, setForm] = useState({
    employeeId: '',
    period: 'Q3 2026',
    productivity: 5,
    workQuality: 5,
    teamwork: 4,
    leadership: 4,
    punctuality: 5,
    achievements: '',
    improvements: '',
    goalsForNextPeriod: '',
  });

  const canConduct = ['super_admin', 'hr_manager', 'dept_manager'].includes(user?.role || '');

  const loadData = async () => {
    try {
      const [revRes, empRes] = await Promise.all([
        api.getPerformanceReviews(),
        canConduct ? api.getUsers() : Promise.resolve({ success: true, users: [] }),
      ]);
      setReviews(revRes.reviews);
      if (empRes.users) setEmployees(empRes.users);
    } catch (err) {
      console.error('Failed to load performance appraisals', err);
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
      await api.createPerformanceReview(form);
      setShowReviewModal(false);
      setForm({
        employeeId: '',
        period: 'Q3 2026',
        productivity: 5,
        workQuality: 5,
        teamwork: 4,
        leadership: 4,
        punctuality: 5,
        achievements: '',
        improvements: '',
        goalsForNextPeriod: '',
      });
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to submit review');
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">Performance & Appraisals</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Objective KPI tracking, competency ratings, and managerial evaluations
          </p>
        </div>

        {canConduct && (
          <button
            onClick={() => setShowReviewModal(true)}
            className="flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-colors shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Conduct Review</span>
          </button>
        )}
      </div>

      {/* Review Cards List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {reviews.length === 0 ? (
          <div className="col-span-2 py-12 text-center text-slate-400 text-xs">
            No performance appraisals filed yet.
          </div>
        ) : (
          reviews.map(rev => (
            <div key={rev.id} className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
              <div className="flex items-start justify-between pb-3 border-b border-slate-100">
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">{rev.employeeName}</h3>
                  <div className="text-xs text-slate-500 font-medium">
                    {rev.departmentName} · {rev.period} Cycle
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-1 text-amber-500 font-bold text-sm font-mono tabular-nums">
                    <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                    <span>{rev.ratingOverall} / 5.0</span>
                  </div>
                  <div className="text-[10px] text-slate-400">By {rev.reviewerName}</div>
                </div>
              </div>

              {/* Sub-ratings grid */}
              <div className="grid grid-cols-5 gap-2 text-center bg-slate-50 p-2.5 rounded-lg border border-slate-100 text-[11px]">
                <div>
                  <div className="text-slate-400 text-[10px]">Productivity</div>
                  <div className="font-bold text-slate-800 tabular-nums">{rev.ratings.productivity}★</div>
                </div>
                <div>
                  <div className="text-slate-400 text-[10px]">Quality</div>
                  <div className="font-bold text-slate-800 tabular-nums">{rev.ratings.workQuality}★</div>
                </div>
                <div>
                  <div className="text-slate-400 text-[10px]">Teamwork</div>
                  <div className="font-bold text-slate-800 tabular-nums">{rev.ratings.teamwork}★</div>
                </div>
                <div>
                  <div className="text-slate-400 text-[10px]">Leadership</div>
                  <div className="font-bold text-slate-800 tabular-nums">{rev.ratings.leadership}★</div>
                </div>
                <div>
                  <div className="text-slate-400 text-[10px]">Punctuality</div>
                  <div className="font-bold text-slate-800 tabular-nums">{rev.ratings.punctuality}★</div>
                </div>
              </div>

              {/* Written Notes */}
              <div className="space-y-2 text-xs">
                {rev.achievements && (
                  <div>
                    <div className="font-semibold text-slate-900 text-[11px]">Key Accomplishments:</div>
                    <p className="text-slate-600 mt-0.5">{rev.achievements}</p>
                  </div>
                )}
                {rev.improvements && (
                  <div>
                    <div className="font-semibold text-slate-900 text-[11px]">Areas for Growth:</div>
                    <p className="text-slate-600 mt-0.5">{rev.improvements}</p>
                  </div>
                )}
                {rev.goalsForNextPeriod && (
                  <div>
                    <div className="font-semibold text-slate-900 text-[11px]">Next Period Goals:</div>
                    <p className="text-slate-600 mt-0.5">{rev.goalsForNextPeriod}</p>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Conduct Review Modal */}
      {showReviewModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-900">Conduct Performance Appraisal</h2>
              <button onClick={() => setShowReviewModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-4 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Employee *</label>
                  <select
                    required
                    value={form.employeeId}
                    onChange={e => setForm({ ...form, employeeId: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white"
                  >
                    <option value="">Select Employee</option>
                    {employees.map(emp => (
                      <option key={emp.id} value={emp.id}>
                        {emp.firstName} {emp.lastName}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Appraisal Period *</label>
                  <input
                    required
                    type="text"
                    value={form.period}
                    onChange={e => setForm({ ...form, period: e.target.value })}
                    placeholder="Q3 2026 / Annual"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white"
                  />
                </div>
              </div>

              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Competency Ratings (1 - 5 Stars)
              </div>
              <div className="grid grid-cols-5 gap-2">
                <div>
                  <label className="block text-slate-600 text-[10px] mb-1">Productivity</label>
                  <input
                    type="number"
                    min={1}
                    max={5}
                    value={form.productivity}
                    onChange={e => setForm({ ...form, productivity: Number(e.target.value) })}
                    className="w-full px-2 py-1.5 text-center bg-slate-50 border border-slate-200 rounded"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 text-[10px] mb-1">Quality</label>
                  <input
                    type="number"
                    min={1}
                    max={5}
                    value={form.workQuality}
                    onChange={e => setForm({ ...form, workQuality: Number(e.target.value) })}
                    className="w-full px-2 py-1.5 text-center bg-slate-50 border border-slate-200 rounded"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 text-[10px] mb-1">Teamwork</label>
                  <input
                    type="number"
                    min={1}
                    max={5}
                    value={form.teamwork}
                    onChange={e => setForm({ ...form, teamwork: Number(e.target.value) })}
                    className="w-full px-2 py-1.5 text-center bg-slate-50 border border-slate-200 rounded"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 text-[10px] mb-1">Leadership</label>
                  <input
                    type="number"
                    min={1}
                    max={5}
                    value={form.leadership}
                    onChange={e => setForm({ ...form, leadership: Number(e.target.value) })}
                    className="w-full px-2 py-1.5 text-center bg-slate-50 border border-slate-200 rounded"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 text-[10px] mb-1">Punctuality</label>
                  <input
                    type="number"
                    min={1}
                    max={5}
                    value={form.punctuality}
                    onChange={e => setForm({ ...form, punctuality: Number(e.target.value) })}
                    className="w-full px-2 py-1.5 text-center bg-slate-50 border border-slate-200 rounded"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Key Deliverables & Strengths</label>
                <textarea
                  rows={2}
                  value={form.achievements}
                  onChange={e => setForm({ ...form, achievements: e.target.value })}
                  placeholder="Specific achievements and contributions..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Areas for Development</label>
                <textarea
                  rows={2}
                  value={form.improvements}
                  onChange={e => setForm({ ...form, improvements: e.target.value })}
                  placeholder="Skills to hone or operational feedback..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Actionable Objectives for Next Cycle</label>
                <textarea
                  rows={2}
                  value={form.goalsForNextPeriod}
                  onChange={e => setForm({ ...form, goalsForNextPeriod: e.target.value })}
                  placeholder="Concrete milestones agreed upon..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowReviewModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg font-medium text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold"
                >
                  Save Evaluation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
