import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Sidebar, ActiveTab } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { LoginView } from './components/auth/LoginView';

import { DashboardView } from './components/dashboard/DashboardView';
import { EmployeesView } from './components/employees/EmployeesView';
import { AttendanceView } from './components/attendance/AttendanceView';
import { LeavesView } from './components/leaves/LeavesView';
import { PayrollView } from './components/payroll/PayrollView';
import { ProjectsView } from './components/projects/ProjectsView';
import { PerformanceView } from './components/performance/PerformanceView';
import { AnnouncementsView } from './components/announcements/AnnouncementsView';
import { DepartmentsView } from './components/departments/DepartmentsView';
import { AuditLogsView } from './components/audit/AuditLogsView';
import { SettingsView } from './components/settings/SettingsView';

const MainLayout: React.FC = () => {
  const { user, isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center font-bold text-white text-lg animate-pulse">
            TG
          </div>
          <div className="text-xs text-slate-400 font-medium tracking-wide">
            Initializing TalentGrid Enterprise EMS...
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginView />;
  }

  return (
    <div className="flex h-screen bg-slate-100 overflow-hidden font-sans text-slate-900">
      {/* 250px Sidebar */}
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Workspace Frame */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <Header activeTab={activeTab} onOpenNotifications={() => setActiveTab('announcements')} />

        {/* View Content Port */}
        <main className="flex-1 overflow-y-auto bg-slate-50">
          {activeTab === 'dashboard' && <DashboardView setActiveTab={setActiveTab} />}
          {activeTab === 'employees' && <EmployeesView />}
          {activeTab === 'attendance' && <AttendanceView />}
          {activeTab === 'leaves' && <LeavesView />}
          {activeTab === 'payroll' && <PayrollView />}
          {activeTab === 'projects' && <ProjectsView />}
          {activeTab === 'performance' && <PerformanceView />}
          {activeTab === 'announcements' && <AnnouncementsView />}
          {activeTab === 'departments' && <DepartmentsView />}
          {activeTab === 'audit' && <AuditLogsView />}
          {activeTab === 'settings' && <SettingsView />}
        </main>
      </div>
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <MainLayout />
    </AuthProvider>
  );
}
