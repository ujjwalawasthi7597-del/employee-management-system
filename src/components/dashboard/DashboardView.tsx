import React, { useEffect, useState } from 'react';
import {
  Users,
  Clock,
  CalendarCheck,
  DollarSign,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  FolderKanban,
  Building,
  ArrowRight,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';
import { DashboardStats, Announcement } from '../../types';
import { ActiveTab } from '../layout/Sidebar';

interface DashboardViewProps {
  setActiveTab: (tab: ActiveTab) => void;
}

const DEPT_COLORS = ['#4f46e5', '#06b6d4', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6'];

export const DashboardView: React.FC<DashboardViewProps> = ({ setActiveTab }) => {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const [dashRes, ancRes] = await Promise.all([
          api.getDashboardAnalytics(),
          api.getAnnouncements(),
        ]);
        setStats(dashRes.stats);
        setAnnouncements(ancRes.announcements.slice(0, 3));
      } catch (err) {
        console.error('Failed to load dashboard data', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, [user]);

  if (loading || !stats) {
    return (
      <div className="p-8 space-y-4">
        <div className="h-8 w-48 bg-slate-200 animate-pulse rounded" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-28 bg-slate-100 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  const isSuperAdmin = user?.role === 'super_admin';
  const isHr = user?.role === 'hr_manager';
  const isManager = user?.role === 'dept_manager';

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Welcome Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Welcome back, {user?.firstName}
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            {user?.title} · {user?.departmentName}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveTab('attendance')}
            className="px-4 py-2 text-xs font-semibold rounded-lg bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 transition-colors shadow-xs"
          >
            Log Timesheet
          </button>
          <button
            onClick={() => setActiveTab('leaves')}
            className="px-4 py-2 text-xs font-semibold rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-colors shadow-xs"
          >
            Apply for Leave
          </button>
        </div>
      </div>

      {/* Metric Stat Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total / Dept Headcount */}
        <div className="p-5 bg-white rounded-xl border border-slate-200/90 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>{isManager ? 'Department Staff' : 'Active Employees'}</span>
            <Users className="w-4 h-4 text-slate-400" />
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-slate-900 tabular-nums">
              {stats.totalEmployees}
            </div>
            <div className="text-[11px] text-emerald-600 mt-1 font-medium flex items-center gap-1">
              <TrendingUp className="w-3 h-3" /> 100% verified active status
            </div>
          </div>
        </div>

        {/* Present Today */}
        <div className="p-5 bg-white rounded-xl border border-slate-200/90 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Today's Attendance</span>
            <Clock className="w-4 h-4 text-slate-400" />
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-slate-900 tabular-nums">
              {stats.todayAttendance.present + stats.todayAttendance.late}
              <span className="text-xs font-normal text-slate-400 ml-1">logged</span>
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              <span className="text-emerald-600 font-medium">{stats.todayAttendance.present} on time</span> ·{' '}
              <span className="text-amber-600 font-medium">{stats.todayAttendance.late} grace/late</span>
            </div>
          </div>
        </div>

        {/* Pending Leaves */}
        <div className="p-5 bg-white rounded-xl border border-slate-200/90 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Pending Approvals</span>
            <CalendarCheck className="w-4 h-4 text-slate-400" />
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-slate-900 tabular-nums">
              {stats.pendingLeaves}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              {stats.pendingLeaves > 0 ? (
                <button
                  onClick={() => setActiveTab('leaves')}
                  className="text-indigo-600 hover:underline font-medium"
                >
                  Action required &rarr;
                </button>
              ) : (
                'All requests up to date'
              )}
            </div>
          </div>
        </div>

        {/* Compensation or Tasks */}
        {isSuperAdmin || isHr ? (
          <div className="p-5 bg-white rounded-xl border border-slate-200/90 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
              <span>Payroll Disbursed (Sep)</span>
              <DollarSign className="w-4 h-4 text-slate-400" />
            </div>
            <div className="mt-3">
              <div className="text-2xl font-bold text-slate-900 tabular-nums">
                ${stats.payrollSummary ? stats.payrollSummary.totalNetDisbursed.toLocaleString() : '0'}
              </div>
              <div className="text-[11px] text-slate-500 mt-1">
                {stats.payrollSummary?.processedCount || 0} payslips processed
              </div>
            </div>
          </div>
        ) : (
          <div className="p-5 bg-white rounded-xl border border-slate-200/90 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
              <span>Sprint Deliverables</span>
              <FolderKanban className="w-4 h-4 text-slate-400" />
            </div>
            <div className="mt-3">
              <div className="text-2xl font-bold text-slate-900 tabular-nums">
                {stats.tasks.completed}/{stats.tasks.todo + stats.tasks.in_progress + stats.tasks.in_review + stats.tasks.completed}
              </div>
              <div className="text-[11px] text-emerald-600 font-medium mt-1">
                {stats.tasks.completed} tasks completed
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Visual Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Attendance Trend Chart */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">Attendance Patterns (Past 7 Days)</h2>
              <p className="text-xs text-slate-500">Daily present vs. grace period check-ins</p>
            </div>
            <span className="text-xs font-medium text-slate-400 tabular-nums">Real-time sync</span>
          </div>

          <div className="h-64 mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.past7DaysAttendance}>
                <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    borderColor: '#334155',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="present" fill="#4f46e5" radius={[4, 4, 0, 0]} name="On Time" />
                <Bar dataKey="late" fill="#f59e0b" radius={[4, 4, 0, 0]} name="Late / Grace" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Department Headcount Breakdown */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs flex flex-col">
          <div className="pb-4 border-b border-slate-100">
            <h2 className="text-sm font-semibold text-slate-900">Department Headcount</h2>
            <p className="text-xs text-slate-500">Workforce distribution by business unit</p>
          </div>

          <div className="h-44 my-auto">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats.departmentBreakdown}
                  dataKey="headcount"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={36}
                  outerRadius={65}
                  paddingAngle={3}
                >
                  {stats.departmentBreakdown.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={DEPT_COLORS[index % DEPT_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-1.5 mt-2 text-xs">
            {stats.departmentBreakdown.slice(0, 4).map((d, i) => (
              <div key={d.code} className="flex items-center justify-between text-slate-600">
                <div className="flex items-center gap-2 truncate">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: DEPT_COLORS[i % DEPT_COLORS.length] }}
                  />
                  <span className="truncate">{d.name}</span>
                </div>
                <span className="font-semibold text-slate-900 tabular-nums">{d.headcount}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Task & Communication Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tasks Status Snapshot */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">Task Pipeline</h2>
              <p className="text-xs text-slate-500">Active status progression</p>
            </div>
            <button
              onClick={() => setActiveTab('projects')}
              className="text-xs text-indigo-600 font-semibold hover:underline flex items-center gap-1"
            >
              Open Board <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="grid grid-cols-4 gap-3 mt-4 text-center">
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
              <div className="text-xs text-slate-500">To Do</div>
              <div className="text-lg font-bold text-slate-800 tabular-nums mt-1">{stats.tasks.todo}</div>
            </div>
            <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
              <div className="text-xs text-blue-700">In Progress</div>
              <div className="text-lg font-bold text-blue-900 tabular-nums mt-1">{stats.tasks.in_progress}</div>
            </div>
            <div className="p-3 bg-amber-50 rounded-lg border border-amber-100">
              <div className="text-xs text-amber-700">In Review</div>
              <div className="text-lg font-bold text-amber-900 tabular-nums mt-1">{stats.tasks.in_review}</div>
            </div>
            <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-100">
              <div className="text-xs text-emerald-700">Completed</div>
              <div className="text-lg font-bold text-emerald-900 tabular-nums mt-1">{stats.tasks.completed}</div>
            </div>
          </div>
        </div>

        {/* Company Announcements Bulletin */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">Company Announcements</h2>
              <p className="text-xs text-slate-500">Latest official bulletins & notices</p>
            </div>
            <button
              onClick={() => setActiveTab('announcements')}
              className="text-xs text-indigo-600 font-semibold hover:underline flex items-center gap-1"
            >
              View All <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="mt-4 space-y-3">
            {announcements.length === 0 ? (
              <p className="text-xs text-slate-400">No current announcements.</p>
            ) : (
              announcements.map(a => (
                <div key={a.id} className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-900 truncate pr-2">{a.title}</span>
                    <span className="text-[11px] text-slate-500 shrink-0">
                      {new Date(a.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1 line-clamp-2">{a.content}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
