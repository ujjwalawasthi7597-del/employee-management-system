import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Search,
  Filter,
  Clock,
  Terminal,
  Activity,
} from 'lucide-react';
import { api } from '../../lib/api';
import { AuditLog } from '../../types';

export const AuditLogsView: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedAction, setSelectedAction] = useState('');

  const loadData = async () => {
    try {
      const res = await api.getAuditLogs({
        search: search || undefined,
        action: selectedAction || undefined,
      });
      setLogs(res.logs);
    } catch (err) {
      console.error('Failed to load audit logs', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [search, selectedAction]);

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">Security Audit Trail</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Immutable administrative event stream, authentication attempts, and authorization changes
          </p>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-lg text-xs font-semibold border border-emerald-200">
          <Activity className="w-3.5 h-3.5" />
          <span>SOC2 Compliance Logging Active</span>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search details, actor email, or resource..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:bg-white text-slate-900"
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <select
            value={selectedAction}
            onChange={e => setSelectedAction(e.target.value)}
            className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700"
          >
            <option value="">All Actions</option>
            <option value="LOGIN_SUCCESS">LOGIN_SUCCESS</option>
            <option value="LOGIN_FAILED">LOGIN_FAILED</option>
            <option value="CREATE_USER">CREATE_USER</option>
            <option value="UPDATE_USER">UPDATE_USER</option>
            <option value="DEACTIVATE_USER">DEACTIVATE_USER</option>
            <option value="ATTENDANCE_CLOCK_IN">ATTENDANCE_CLOCK_IN</option>
            <option value="ATTENDANCE_CLOCK_OUT">ATTENDANCE_CLOCK_OUT</option>
            <option value="REVIEW_LEAVE">REVIEW_LEAVE</option>
            <option value="CREATE_PAYROLL">CREATE_PAYROLL</option>
          </select>

          <span className="text-xs text-slate-500">
            <strong className="text-slate-900">{logs.length}</strong> events logged
          </span>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/75 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Timestamp (UTC)</th>
                <th className="py-3 px-4">Actor</th>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Target Resource</th>
                <th className="py-3 px-4">Details</th>
                <th className="py-3 px-4">IP Telemetry</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700 font-mono">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400 font-sans">
                    No audit records matching parameters.
                  </td>
                </tr>
              ) : (
                logs.map(log => {
                  const isFail = log.action.includes('FAILED');
                  const isSecurity = log.action.includes('PASSWORD') || log.action.includes('DEACTIVATE');

                  return (
                    <tr key={log.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4 text-slate-500 text-[11px] whitespace-nowrap">
                        {new Date(log.timestamp).toLocaleString()}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900 font-sans">{log.actorEmail}</div>
                        <div className="text-[10px] text-slate-400 uppercase">{log.actorRole}</div>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold tracking-wider ${
                            isFail
                              ? 'bg-rose-50 text-rose-700'
                              : isSecurity
                              ? 'bg-amber-50 text-amber-800'
                              : 'bg-indigo-50 text-indigo-700'
                          }`}
                        >
                          {log.action}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-600 text-[11px] font-sans">
                        {log.resource}
                      </td>
                      <td className="py-3 px-4 text-slate-700 font-sans text-xs max-w-sm truncate" title={log.details}>
                        {log.details}
                      </td>
                      <td className="py-3 px-4 text-slate-400 text-[11px]">
                        {log.ipAddress}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
