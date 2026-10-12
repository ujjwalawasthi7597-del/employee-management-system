import React from 'react';
import {
  LayoutDashboard,
  Users,
  Clock,
  CalendarDays,
  CreditCard,
  FolderKanban,
  Award,
  Bell,
  ShieldAlert,
  Building2,
  Settings,
  LogOut,
  ChevronRight,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export type ActiveTab =
  | 'dashboard'
  | 'employees'
  | 'attendance'
  | 'leaves'
  | 'payroll'
  | 'projects'
  | 'performance'
  | 'announcements'
  | 'departments'
  | 'audit'
  | 'settings';

interface SidebarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  const { user, logout } = useAuth();
  if (!user) return null;

  const role = user.role;

  const isSuperAdmin = role === 'super_admin';
  const isHr = role === 'hr_manager';
  const isManager = role === 'dept_manager';

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, section: 'Overview' },
    { id: 'employees', label: isManager ? 'Team Directory' : 'Employees', icon: Users, section: 'Workforce' },
    { id: 'attendance', label: 'Attendance', icon: Clock, section: 'Workforce' },
    { id: 'leaves', label: 'Leave Requests', icon: CalendarDays, section: 'Workforce' },
    {
      id: 'payroll',
      label: isSuperAdmin || isHr ? 'Payroll & Slips' : 'My Payslips',
      icon: CreditCard,
      section: 'Compensation',
    },
    { id: 'projects', label: 'Projects & Tasks', icon: FolderKanban, section: 'Operations' },
    { id: 'performance', label: 'Performance', icon: Award, section: 'Operations' },
    { id: 'announcements', label: 'Announcements', icon: Bell, section: 'Communication' },
    ...(isSuperAdmin
      ? [
          { id: 'departments', label: 'Departments', icon: Building2, section: 'Organization' },
          { id: 'audit', label: 'Audit Trail', icon: ShieldAlert, section: 'Security' },
          { id: 'settings', label: 'Org Settings', icon: Settings, section: 'Security' },
        ]
      : []),
  ];

  // Group by sections
  const sections = Array.from(new Set(navItems.map(item => item.section)));

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col shrink-0 border-r border-slate-800 select-none">
      {/* Brand Header */}
      <div className="h-16 px-6 flex items-center justify-between border-b border-slate-800/80">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center font-bold text-white tracking-wider text-sm shadow-inner">
            TG
          </div>
          <div>
            <div className="text-sm font-bold tracking-tight text-white flex items-center gap-1.5">
              TalentGrid
              <span className="text-[10px] font-semibold tracking-wider uppercase px-1.5 py-0.2 bg-indigo-950 text-indigo-400 border border-indigo-800/60 rounded">
                EMS
              </span>
            </div>
            <div className="text-[11px] text-slate-400 font-normal">Enterprise Workforce</div>
          </div>
        </div>
      </div>

      {/* Nav List */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        {sections.map(sectionName => {
          const sectionItems = navItems.filter(item => item.section === sectionName);
          return (
            <div key={sectionName}>
              <div className="px-3 mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-300">
                {sectionName}
              </div>
              <div className="space-y-0.5">
                {sectionItems.map(item => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setActiveTab(item.id as ActiveTab)}
                      className={`w-full flex items-center justify-between px-3 py-2 text-xs font-medium rounded-lg transition-colors text-left ${
                        isActive
                          ? 'bg-indigo-600 text-white font-semibold shadow-xs'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                        <span className="truncate">{item.label}</span>
                      </div>
                      {isActive && <ChevronRight className="w-3.5 h-3.5 text-indigo-200" />}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* User Footer Profile */}
      <div className="p-3 border-t border-slate-800/80 bg-slate-900/60">
        <div className="p-2 rounded-lg bg-slate-800/40 border border-slate-800 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <img
              src={user.avatarUrl}
              alt={user.firstName}
              referrerPolicy="no-referrer"
              className="w-8 h-8 rounded-full object-cover shrink-0 border border-slate-700"
            />
            <div className="min-w-0">
              <div className="text-xs font-semibold text-slate-200 truncate">
                {user.firstName} {user.lastName}
              </div>
              <div className="text-[11px] text-slate-400 truncate capitalize font-mono">
                {user.role.replace('_', ' ')}
              </div>
            </div>
          </div>
          <button
            onClick={logout}
            title="Log out"
            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};
