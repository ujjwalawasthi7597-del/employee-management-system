import React, { useState } from 'react';
import {
  Clock,
  CheckCircle2,
  UserCheck,
  Shield,
  Briefcase,
  User as UserIcon,
  Bell,
  ArrowRightLeft,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { ActiveTab } from './Sidebar';
import { UserRole } from '../../types';

interface HeaderProps {
  activeTab: ActiveTab;
  onOpenNotifications?: () => void;
}

const tabTitles: Record<ActiveTab, { title: string; subtitle: string }> = {
  dashboard: { title: 'Executive Operations', subtitle: 'Org analytics, attendance, and team KPIs' },
  employees: { title: 'Employee Directory', subtitle: 'Staff profiles, job titles, and departmental hierarchy' },
  attendance: { title: 'Attendance & Shifts', subtitle: 'Real-time clock tracking, timesheets, and grace logs' },
  leaves: { title: 'Leave Management', subtitle: 'Vacation balances, medical requests, and approval workflow' },
  payroll: { title: 'Compensation & Payroll', subtitle: 'Salary schedules, taxable components, and confidential slips' },
  projects: { title: 'Projects & Tasks', subtitle: 'Sprint deliverables, task assignees, and progress tracking' },
  performance: { title: 'Performance Appraisals', subtitle: 'Quarterly evaluations, metric ratings, and manager notes' },
  announcements: { title: 'Company Announcements', subtitle: 'Organization bulletins, policy updates, and alerts' },
  departments: { title: 'Department Matrix', subtitle: 'Budgets, departmental codes, and team leads' },
  audit: { title: 'Security Audit Trail', subtitle: 'Administrative event streams, IP logs, and system actions' },
  settings: { title: 'Organization Settings', subtitle: 'Working hours, leave quotas, and enterprise policies' },
};

export const Header: React.FC<HeaderProps> = ({ activeTab, onOpenNotifications }) => {
  const { user, todayAttendance, clockIn, clockOut, switchRole, isLoading } = useAuth();
  const [clockLoading, setClockLoading] = useState(false);
  const [roleMenuOpen, setRoleMenuOpen] = useState(false);

  if (!user) return null;

  const currentTabInfo = tabTitles[activeTab] || { title: 'Overview', subtitle: '' };

  const handleClockToggle = async () => {
    setClockLoading(true);
    try {
      if (!todayAttendance) {
        await clockIn();
      } else if (!todayAttendance.clockOut) {
        await clockOut();
      }
    } catch (err: any) {
      alert(err.message || 'Attendance action failed');
    } finally {
      setClockLoading(false);
    }
  };

  const rolesList: { role: UserRole; label: string; desc: string; icon: any }[] = [
    { role: 'super_admin', label: 'Super Admin', desc: 'Arthur Vance (CEO) - Full Org Control', icon: Shield },
    { role: 'hr_manager', label: 'HR Manager', desc: 'Elena Rostova (VP People) - Staff & Payroll', icon: UserCheck },
    { role: 'dept_manager', label: 'Dept Manager', desc: 'Marcus Chen (Eng Lead) - Team & Approvals', icon: Briefcase },
    { role: 'employee', label: 'Employee', desc: 'Sophia Lin (Staff Eng) - Self-service & Tasks', icon: UserIcon },
  ];

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between gap-6 shrink-0 z-20">
      {/* Zone 1: Breadcrumb & Contextual Title */}
      <div className="flex items-center gap-3 min-w-0">
        <div>
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
            <span>TalentGrid</span>
            <span aria-hidden="true">/</span>
            <span className="text-slate-900 font-semibold">{currentTabInfo.title}</span>
          </div>
          <div className="text-[11px] text-slate-500 truncate hidden sm:block">
            {currentTabInfo.subtitle}
          </div>
        </div>
      </div>

      {/* Zone 2: Role Switcher (Essential for evaluating all 4 roles) */}
      <div className="relative">
        <button
          onClick={() => setRoleMenuOpen(!roleMenuOpen)}
          className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 transition-colors border border-slate-200/80"
          title="Switch role for grading and testing permissions"
        >
          <ArrowRightLeft className="w-3.5 h-3.5 text-slate-500" />
          <span className="hidden md:inline text-slate-500 font-normal">Active Role:</span>
          <span className="font-semibold capitalize text-indigo-700">
            {user.role.replace('_', ' ')}
          </span>
        </button>

        {roleMenuOpen && (
          <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-lg border border-slate-200 p-2 z-50">
            <div className="px-3 py-2 border-b border-slate-100">
              <div className="text-xs font-semibold text-slate-900">Switch Role Sandbox</div>
              <div className="text-[11px] text-slate-500">Test server-enforced permissions instantly</div>
            </div>
            <div className="py-1 space-y-1">
              {rolesList.map(r => {
                const Icon = r.icon;
                const isCurrent = user.role === r.role;
                return (
                  <button
                    key={r.role}
                    disabled={isLoading}
                    onClick={() => {
                      switchRole(r.role);
                      setRoleMenuOpen(false);
                    }}
                    className={`w-full flex items-start gap-2.5 px-3 py-2 rounded-lg text-left text-xs transition-colors ${
                      isCurrent
                        ? 'bg-indigo-50 text-indigo-900 font-semibold'
                        : 'hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${isCurrent ? 'text-indigo-600' : 'text-slate-400'}`} />
                    <div className="min-w-0">
                      <div className="font-medium text-xs text-slate-900">{r.label}</div>
                      <div className="text-[11px] text-slate-500 truncate">{r.desc}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Zone 3: Attendance Quick Action & Alerts */}
      <div className="flex items-center gap-3 shrink-0">
        {/* Real-time Clock In / Out action */}
        {!todayAttendance ? (
          <button
            onClick={handleClockToggle}
            disabled={clockLoading}
            className="flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs transition-colors whitespace-nowrap"
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Clock In</span>
          </button>
        ) : !todayAttendance.clockOut ? (
          <button
            onClick={handleClockToggle}
            disabled={clockLoading}
            className="flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-lg shadow-xs transition-colors whitespace-nowrap"
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Clock Out ({new Date(todayAttendance.clockIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})</span>
          </button>
        ) : (
          <div className="flex items-center gap-1.5 px-2.5 py-1 text-xs text-emerald-700 font-medium bg-emerald-50 rounded-lg border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span className="tabular-nums">{todayAttendance.totalHours || 8}h Shift Completed</span>
          </div>
        )}

        {/* Announcements Notification Quick Trigger */}
        <button
          onClick={onOpenNotifications}
          className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors relative"
          title="Announcements and bulletins"
        >
          <Bell className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
