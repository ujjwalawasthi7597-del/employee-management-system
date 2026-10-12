import React, { useState, useEffect } from 'react';
import {
  Clock,
  CheckCircle2,
  AlertTriangle,
  Calendar,
  Filter,
  Plus,
  ArrowRight,
  X,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';
import { AttendanceRecord, Department, User } from '../../types';

export const AttendanceView: React.FC = () => {
  const { user, todayAttendance, clockIn, clockOut } = useAuth();
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [employees, setEmployees] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Filters
  const [filterDate, setFilterDate] = useState('');
  const [filterDept, setFilterDept] = useState('');
  const [filterUser, setFilterUser] = useState('');

  // Manual Entry Modal
  const [showManualModal, setShowManualModal] = useState(false);
  const [manualForm, setManualForm] = useState({
    userId: '',
    date: new Date().toISOString().split('T')[0],
    clockIn: '09:00',
    clockOut: '17:30',
    status: 'present',
    notes: 'Regular office attendance',
  });

  // Current real-time clock
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const isPrivileged = user?.role === 'super_admin' || user?.role === 'hr_manager';

  const loadData = async () => {
    try {
      const [attRes, deptRes, empRes] = await Promise.all([
        api.getAttendance({
          date: filterDate || undefined,
          departmentId: filterDept || undefined,
          userId: filterUser || undefined,
        }),
        api.getDepartments(),
        isPrivileged ? api.getUsers() : Promise.resolve({ success: true, users: [] }),
      ]);
      setRecords(attRes.records);
      setDepartments(deptRes.departments);
      if (empRes.users) setEmployees(empRes.users);
    } catch (err) {
      console.error('Failed to load attendance logs', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [filterDate, filterDept, filterUser, user, todayAttendance]);

  const handleClockIn = async () => {
    setActionLoading(true);
    try {
      await clockIn();
      loadData();
    } catch (err: any) {
      alert(err.message || 'Clock in failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleClockOut = async () => {
    setActionLoading(true);
    try {
      await clockOut();
      loadData();
    } catch (err: any) {
      alert(err.message || 'Clock out failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const inIso = `${manualForm.date}T${manualForm.clockIn}:00Z`;
      const outIso = manualForm.clockOut ? `${manualForm.date}T${manualForm.clockOut}:00Z` : undefined;

      await api.recordManualAttendance({
        userId: manualForm.userId,
        date: manualForm.date,
        clockIn: inIso,
        clockOut: outIso,
        status: manualForm.status,
        notes: manualForm.notes,
      });

      setShowManualModal(false);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to record manual attendance');
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">Attendance & Shifts</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Timesheets, daily presence verification, and grace window enforcement
          </p>
        </div>

        {isPrivileged && (
          <button
            onClick={() => setShowManualModal(true)}
            className="flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-colors shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Manual Entry</span>
          </button>
        )}
      </div>

      {/* Real-time Clock In/Out Terminal Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 bg-gradient-to-br from-slate-900 to-indigo-950 text-white rounded-2xl p-6 shadow-sm border border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-indigo-300">
                Workforce Terminal
              </span>
              <span className="text-xs text-slate-400 font-mono">
                {currentTime.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}
              </span>
            </div>

            <div className="mt-4 flex items-baseline gap-2">
              <div className="text-4xl font-bold font-mono tracking-tight tabular-nums text-white">
                {currentTime.toLocaleTimeString()}
              </div>
              <span className="text-xs text-indigo-300 font-normal">PST / Local Time</span>
            </div>

            <p className="text-xs text-slate-300 mt-2 max-w-md">
              Official shift start is 09:00 AM with a 15-minute grace period. Times are cryptographically logged with IP telemetry.
            </p>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-800 flex flex-wrap items-center gap-4">
            {!todayAttendance ? (
              <button
                onClick={handleClockIn}
                disabled={actionLoading}
                className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-semibold text-xs shadow-md transition-colors"
              >
                <Clock className="w-4 h-4" />
                <span>Clock In Now</span>
              </button>
            ) : !todayAttendance.clockOut ? (
              <button
                onClick={handleClockOut}
                disabled={actionLoading}
                className="flex items-center gap-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl font-semibold text-xs shadow-md transition-colors"
              >
                <Clock className="w-4 h-4" />
                <span>Clock Out for Today</span>
              </button>
            ) : (
              <div className="flex items-center gap-2 text-xs text-emerald-400 font-medium">
                <CheckCircle2 className="w-4 h-4" />
                <span>Shift completed today ({todayAttendance.totalHours} hrs worked)</span>
              </div>
            )}

            {todayAttendance && (
              <div className="text-xs text-slate-400 font-mono">
                Clock-in recorded:{' '}
                <span className="text-white font-medium">
                  {new Date(todayAttendance.clockIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Today's Status Breakdown */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-900 pb-2 border-b border-slate-100">
              Today's Verification Status
            </div>

            {todayAttendance ? (
              <div className="mt-4 space-y-3 text-xs">
                <div className="flex justify-between items-center text-slate-600">
                  <span>Shift Status:</span>
                  <span
                    className={`font-semibold capitalize px-2 py-0.5 rounded text-[11px] ${
                      todayAttendance.status === 'present'
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'bg-amber-50 text-amber-700'
                    }`}
                  >
                    {todayAttendance.status}
                  </span>
                </div>
                <div className="flex justify-between items-center text-slate-600">
                  <span>Clock In:</span>
                  <span className="font-mono text-slate-900 font-medium">
                    {new Date(todayAttendance.clockIn).toLocaleTimeString()}
                  </span>
                </div>
                <div className="flex justify-between items-center text-slate-600">
                  <span>Clock Out:</span>
                  <span className="font-mono text-slate-900 font-medium">
                    {todayAttendance.clockOut
                      ? new Date(todayAttendance.clockOut).toLocaleTimeString()
                      : 'In Progress'}
                  </span>
                </div>
                <div className="flex justify-between items-center text-slate-600">
                  <span>Total Duration:</span>
                  <span className="font-mono text-slate-900 font-bold tabular-nums">
                    {todayAttendance.totalHours ? `${todayAttendance.totalHours} hrs` : 'Calculating...'}
                  </span>
                </div>
              </div>
            ) : (
              <div className="mt-6 text-center text-slate-400 text-xs">
                <Clock className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                No punch record registered yet today.
              </div>
            )}
          </div>

          <div className="text-[11px] text-slate-400 border-t border-slate-100 pt-3 mt-4">
            Standard quota: 8.00 hrs / day
          </div>
        </div>
      </div>

      {/* History Filters */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap gap-3 items-center justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <div>
            <label className="text-[10px] font-semibold text-slate-500 uppercase block mb-1">Date</label>
            <input
              type="date"
              value={filterDate}
              onChange={e => setFilterDate(e.target.value)}
              className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700"
            />
          </div>

          {isPrivileged && (
            <>
              <div>
                <label className="text-[10px] font-semibold text-slate-500 uppercase block mb-1">Department</label>
                <select
                  value={filterDept}
                  onChange={e => setFilterDept(e.target.value)}
                  className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700"
                >
                  <option value="">All Departments</option>
                  {departments.map(d => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] font-semibold text-slate-500 uppercase block mb-1">Employee</label>
                <select
                  value={filterUser}
                  onChange={e => setFilterUser(e.target.value)}
                  className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700"
                >
                  <option value="">All Staff</option>
                  {employees.map(e => (
                    <option key={e.id} value={e.id}>
                      {e.firstName} {e.lastName}
                    </option>
                  ))}
                </select>
              </div>
            </>
          )}

          {(filterDate || filterDept || filterUser) && (
            <button
              onClick={() => {
                setFilterDate('');
                setFilterDept('');
                setFilterUser('');
              }}
              className="text-xs text-indigo-600 hover:underline mt-4"
            >
              Reset filters
            </button>
          )}
        </div>

        <div className="text-xs text-slate-500">
          Showing <span className="font-semibold text-slate-900">{records.length}</span> verified entries
        </div>
      </div>

      {/* Timesheet Logs Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/75 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Employee</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Clock In</th>
                <th className="py-3 px-4">Clock Out</th>
                <th className="py-3 px-4">Duration</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {records.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    No attendance records found for this period.
                  </td>
                </tr>
              ) : (
                records.map(rec => (
                  <tr key={rec.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-semibold text-slate-900">{rec.userName}</td>
                    <td className="py-3 px-4 font-mono text-slate-600">{rec.date}</td>
                    <td className="py-3 px-4 font-mono text-slate-700">
                      {new Date(rec.clockIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-700">
                      {rec.clockOut
                        ? new Date(rec.clockOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                        : '—'}
                    </td>
                    <td className="py-3 px-4 font-mono font-medium text-slate-900 tabular-nums">
                      {rec.totalHours ? `${rec.totalHours} hrs` : 'In Progress'}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[11px] font-medium capitalize ${
                          rec.status === 'present'
                            ? 'bg-emerald-50 text-emerald-700'
                            : rec.status === 'late'
                            ? 'bg-amber-50 text-amber-700'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {rec.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-500 text-[11px] max-w-xs truncate">
                      {rec.notes || '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Manual Entry Modal */}
      {showManualModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-900">Record Manual Attendance</h2>
              <button onClick={() => setShowManualModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleManualSubmit} className="mt-4 space-y-3 text-xs">
              <div>
                <label className="block font-medium text-slate-700 mb-1">Employee *</label>
                <select
                  required
                  value={manualForm.userId}
                  onChange={e => setManualForm({ ...manualForm, userId: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white"
                >
                  <option value="">Select Employee</option>
                  {employees.map(e => (
                    <option key={e.id} value={e.id}>
                      {e.firstName} {e.lastName} ({e.departmentName})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Date *</label>
                <input
                  required
                  type="date"
                  value={manualForm.date}
                  onChange={e => setManualForm({ ...manualForm, date: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Clock In (Time)</label>
                  <input
                    required
                    type="time"
                    value={manualForm.clockIn}
                    onChange={e => setManualForm({ ...manualForm, clockIn: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Clock Out (Time)</label>
                  <input
                    type="time"
                    value={manualForm.clockOut}
                    onChange={e => setManualForm({ ...manualForm, clockOut: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Status Classification</label>
                <select
                  value={manualForm.status}
                  onChange={e => setManualForm({ ...manualForm, status: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white"
                >
                  <option value="present">Present (On Time)</option>
                  <option value="late">Late Arrival</option>
                  <option value="half_day">Half Day Shift</option>
                  <option value="on_leave">Approved Leave</option>
                </select>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Adjustment Reason / Notes</label>
                <input
                  type="text"
                  value={manualForm.notes}
                  onChange={e => setManualForm({ ...manualForm, notes: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowManualModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg font-medium text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold"
                >
                  Save Timesheet Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
