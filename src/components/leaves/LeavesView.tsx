import React, { useState, useEffect } from 'react';
import {
  CalendarDays,
  Plus,
  CheckCircle,
  XCircle,
  Clock,
  Ban,
  X,
  AlertCircle,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';
import { LeaveRequest, LeaveBalance } from '../../types';

export const LeavesView: React.FC = () => {
  const { user, leaveBalance: authLeaveBalance, refreshMe } = useAuth();
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [balance, setBalance] = useState<LeaveBalance | null>(authLeaveBalance);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('');

  // Apply Modal
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [applyForm, setApplyForm] = useState({
    leaveType: 'annual' as const,
    startDate: '',
    endDate: '',
    totalDays: 1,
    reason: '',
  });

  // Rejection modal
  const [rejectLeaveId, setRejectLeaveId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  const isManagerOrAdmin = ['super_admin', 'hr_manager', 'dept_manager'].includes(user?.role || '');

  const loadData = async () => {
    try {
      const [leavesRes, balRes] = await Promise.all([
        api.getLeaves({ status: filterStatus || undefined }),
        api.getLeaveBalance(),
      ]);
      setLeaves(leavesRes.leaves);
      setBalance(balRes.balance);
    } catch (err) {
      console.error('Failed to load leaves', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [filterStatus, user]);

  const handleApplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.applyLeave(applyForm);
      setShowApplyModal(false);
      setApplyForm({
        leaveType: 'annual',
        startDate: '',
        endDate: '',
        totalDays: 1,
        reason: '',
      });
      loadData();
      refreshMe();
    } catch (err: any) {
      alert(err.message || 'Failed to apply for leave');
    }
  };

  const handleReview = async (leaveId: string, status: 'approved' | 'rejected', reason?: string) => {
    try {
      await api.reviewLeave(leaveId, status, reason);
      loadData();
      refreshMe();
      setRejectLeaveId(null);
      setRejectionReason('');
    } catch (err: any) {
      alert(err.message || 'Failed to review leave');
    }
  };

  const handleCancel = async (leaveId: string) => {
    if (!confirm('Are you sure you want to cancel this pending leave request?')) return;
    try {
      await api.cancelLeave(leaveId);
      loadData();
      refreshMe();
    } catch (err: any) {
      alert(err.message || 'Failed to cancel leave request');
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">Leave Management</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Paid time-off entitlements, sick absence records, and managerial approval queues
          </p>
        </div>

        <button
          onClick={() => setShowApplyModal(true)}
          className="flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-colors shadow-xs"
        >
          <Plus className="w-4 h-4" />
          <span>Apply for Leave</span>
        </button>
      </div>

      {/* Leave Balance Entitlements */}
      {balance && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-5 bg-white rounded-xl border border-slate-200/90 shadow-xs flex flex-col justify-between">
            <div className="text-xs font-medium text-slate-500">Annual Vacation Quota</div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-900 tabular-nums">
                {balance.annual.total - balance.annual.used}
              </span>
              <span className="text-xs text-slate-500">days available</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-2">
              {balance.annual.used} days taken of {balance.annual.total} total
            </div>
          </div>

          <div className="p-5 bg-white rounded-xl border border-slate-200/90 shadow-xs flex flex-col justify-between">
            <div className="text-xs font-medium text-slate-500">Sick & Medical Leave</div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-900 tabular-nums">
                {balance.sick.total - balance.sick.used}
              </span>
              <span className="text-xs text-slate-500">days available</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-2">
              {balance.sick.used} days taken of {balance.sick.total} total
            </div>
          </div>

          <div className="p-5 bg-white rounded-xl border border-slate-200/90 shadow-xs flex flex-col justify-between">
            <div className="text-xs font-medium text-slate-500">Casual Personal Leave</div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-900 tabular-nums">
                {balance.casual.total - balance.casual.used}
              </span>
              <span className="text-xs text-slate-500">days available</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-2">
              {balance.casual.used} days taken of {balance.casual.total} total
            </div>
          </div>
        </div>
      )}

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-600">Filter:</span>
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700"
          >
            <option value="">All Statuses</option>
            <option value="pending">Pending Approval</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        <div className="text-xs text-slate-500">
          Showing <span className="font-semibold text-slate-900">{leaves.length}</span> requests
        </div>
      </div>

      {/* Requests Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/75 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Applicant</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Period</th>
                <th className="py-3 px-4">Days</th>
                <th className="py-3 px-4">Reason</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {leaves.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    No leave requests on record.
                  </td>
                </tr>
              ) : (
                leaves.map(req => {
                  const isMine = req.userId === user?.id;
                  const canReview = isManagerOrAdmin && !isMine && req.status === 'pending';

                  return (
                    <tr key={req.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900">{req.userName}</div>
                        <div className="text-[11px] text-slate-400">{req.departmentName}</div>
                      </td>
                      <td className="py-3 px-4 capitalize font-medium text-slate-800">
                        {req.leaveType}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-600 text-[11px]">
                        {req.startDate} <span className="text-slate-400">to</span> {req.endDate}
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900 tabular-nums">
                        {req.totalDays} {req.totalDays === 1 ? 'day' : 'days'}
                      </td>
                      <td className="py-3 px-4 text-slate-600 max-w-xs truncate" title={req.reason}>
                        {req.reason}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[11px] font-medium capitalize ${
                            req.status === 'approved'
                              ? 'bg-emerald-50 text-emerald-700'
                              : req.status === 'pending'
                              ? 'bg-amber-50 text-amber-700'
                              : req.status === 'rejected'
                              ? 'bg-rose-50 text-rose-700'
                              : 'bg-slate-100 text-slate-500'
                          }`}
                        >
                          {req.status}
                        </span>
                        {req.reviewedByName && (
                          <div className="text-[10px] text-slate-400 mt-0.5">by {req.reviewedByName}</div>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {canReview && (
                            <>
                              <button
                                onClick={() => handleReview(req.id, 'approved')}
                                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-medium text-[11px] transition-colors"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => setRejectLeaveId(req.id)}
                                className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded font-medium text-[11px] transition-colors border border-rose-200"
                              >
                                Reject
                              </button>
                            </>
                          )}

                          {isMine && req.status === 'pending' && (
                            <button
                              onClick={() => handleCancel(req.id)}
                              className="px-2.5 py-1 text-slate-600 hover:text-rose-600 hover:bg-slate-100 rounded text-[11px] font-medium transition-colors"
                            >
                              Cancel Request
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Apply Leave Modal */}
      {showApplyModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-900">Submit Leave Application</h2>
              <button onClick={() => setShowApplyModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleApplySubmit} className="mt-4 space-y-3 text-xs">
              <div>
                <label className="block font-medium text-slate-700 mb-1">Leave Category *</label>
                <select
                  value={applyForm.leaveType}
                  onChange={e => setApplyForm({ ...applyForm, leaveType: e.target.value as any })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white"
                >
                  <option value="annual">Annual Paid Vacation</option>
                  <option value="sick">Sick / Medical Absence</option>
                  <option value="casual">Casual Emergency Leave</option>
                  <option value="maternity">Maternity Leave</option>
                  <option value="paternity">Paternity Leave</option>
                  <option value="unpaid">Unpaid Leave</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Start Date *</label>
                  <input
                    required
                    type="date"
                    value={applyForm.startDate}
                    onChange={e => setApplyForm({ ...applyForm, startDate: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">End Date *</label>
                  <input
                    required
                    type="date"
                    value={applyForm.endDate}
                    onChange={e => setApplyForm({ ...applyForm, endDate: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Total Business Days *</label>
                <input
                  required
                  min={1}
                  type="number"
                  value={applyForm.totalDays}
                  onChange={e => setApplyForm({ ...applyForm, totalDays: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Application Reason *</label>
                <textarea
                  required
                  rows={3}
                  value={applyForm.reason}
                  onChange={e => setApplyForm({ ...applyForm, reason: e.target.value })}
                  placeholder="Detail the circumstances and delegation handover..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowApplyModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg font-medium text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold"
                >
                  Submit Application
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reject Reason Modal */}
      {rejectLeaveId && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl border border-slate-200">
            <h3 className="text-sm font-bold text-slate-900">Specify Rejection Reason</h3>
            <p className="text-xs text-slate-500 mt-1">This explanation will be shared with the employee.</p>
            <textarea
              rows={3}
              value={rejectionReason}
              onChange={e => setRejectionReason(e.target.value)}
              placeholder="e.g. Critical release sprint deadline conflict..."
              className="w-full mt-3 px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg"
            />
            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => setRejectLeaveId(null)}
                className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded"
              >
                Cancel
              </button>
              <button
                onClick={() => handleReview(rejectLeaveId, 'rejected', rejectionReason)}
                className="px-3 py-1.5 text-xs bg-rose-600 hover:bg-rose-700 text-white rounded font-medium"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
