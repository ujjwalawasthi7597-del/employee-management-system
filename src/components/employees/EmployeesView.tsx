import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  Plus,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Building2,
  Shield,
  Edit2,
  Trash2,
  X,
  CheckCircle2,
  AlertCircle,
  Eye,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';
import { User, Department, UserRole } from '../../types';

export const EmployeesView: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [employees, setEmployees] = useState<User[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedDept, setSelectedDept] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [viewEmployeeId, setViewEmployeeId] = useState<string | null>(null);
  const [employeeDetails, setEmployeeDetails] = useState<any>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [editEmployee, setEditEmployee] = useState<User | null>(null);

  // New employee form state
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: 'Password@123',
    role: 'employee' as UserRole,
    title: '',
    departmentId: '',
    phone: '',
    location: 'HQ',
    reportsToId: '',
  });

  const isSuperAdmin = currentUser?.role === 'super_admin';
  const isHr = currentUser?.role === 'hr_manager';
  const canManageEmployees = isSuperAdmin || isHr;

  const loadData = async () => {
    try {
      const [usersRes, deptsRes] = await Promise.all([
        api.getUsers({
          search: search || undefined,
          departmentId: selectedDept || undefined,
          status: selectedStatus || undefined,
        }),
        api.getDepartments(),
      ]);
      setEmployees(usersRes.users);
      setDepartments(deptsRes.departments);
    } catch (err) {
      console.error('Failed to load employees', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [search, selectedDept, selectedStatus, currentUser]);

  const handleOpenDetails = async (empId: string) => {
    setViewEmployeeId(empId);
    setDetailsLoading(true);
    try {
      const res = await api.getUser(empId);
      setEmployeeDetails(res);
    } catch (err: any) {
      alert(err.message || 'Failed to fetch details');
      setViewEmployeeId(null);
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleCreateEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createUser(formData);
      setShowAddModal(false);
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        password: 'Password@123',
        role: 'employee',
        title: '',
        departmentId: '',
        phone: '',
        location: 'HQ',
        reportsToId: '',
      });
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to create employee');
    }
  };

  const handleUpdateEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editEmployee) return;
    try {
      await api.updateUser(editEmployee.id, editEmployee);
      setEditEmployee(null);
      loadData();
      if (viewEmployeeId === editEmployee.id) {
        handleOpenDetails(editEmployee.id);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to update employee');
    }
  };

  const handleDeactivate = async (empId: string, name: string) => {
    if (!confirm(`Are you sure you want to deactivate ${name}?`)) return;
    try {
      await api.deactivateUser(empId);
      loadData();
      if (viewEmployeeId === empId) setViewEmployeeId(null);
    } catch (err: any) {
      alert(err.message || 'Failed to deactivate employee');
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">Employee Directory</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage organization members, assignments, and roles ({employees.length} displayed)
          </p>
        </div>

        {canManageEmployees && (
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-colors shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Employee</span>
          </button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by name, email, or role..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-indigo-500 focus:bg-white text-slate-900 placeholder:text-slate-400"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <select
            value={selectedDept}
            onChange={e => setSelectedDept(e.target.value)}
            className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
          >
            <option value="">All Departments</option>
            {departments.map(d => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>

          <select
            value={selectedStatus}
            onChange={e => setSelectedStatus(e.target.value)}
            className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
          >
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      {/* Employees Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/75 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Employee</th>
                <th className="py-3 px-4">Job Title & Dept</th>
                <th className="py-3 px-4">System Role</th>
                <th className="py-3 px-4">Location</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {employees.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    No employees matching filter criteria.
                  </td>
                </tr>
              ) : (
                employees.map(emp => (
                  <tr key={emp.id} className="hover:bg-slate-50/70 transition-colors">
                    {/* User name & email */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={emp.avatarUrl}
                          alt={emp.firstName}
                          referrerPolicy="no-referrer"
                          className="w-8 h-8 rounded-full object-cover border border-slate-200 shrink-0"
                        />
                        <div className="min-w-0">
                          <button
                            onClick={() => handleOpenDetails(emp.id)}
                            className="font-semibold text-slate-900 hover:text-indigo-600 text-left truncate block"
                          >
                            {emp.firstName} {emp.lastName}
                          </button>
                          <div className="text-[11px] text-slate-400 truncate">{emp.email}</div>
                        </div>
                      </div>
                    </td>

                    {/* Title & Dept */}
                    <td className="py-3 px-4">
                      <div className="font-medium text-slate-900">{emp.title}</div>
                      <div className="text-[11px] text-slate-500">{emp.departmentName}</div>
                    </td>

                    {/* Role */}
                    <td className="py-3 px-4">
                      <span className="font-mono text-[11px] uppercase tracking-wide text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                        {emp.role.replace('_', ' ')}
                      </span>
                    </td>

                    {/* Location */}
                    <td className="py-3 px-4 text-slate-600">
                      <div className="flex items-center gap-1.5 text-xs">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        <span>{emp.location}</span>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium ${
                          emp.status === 'active'
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-rose-50 text-rose-700'
                        }`}
                      >
                        {emp.status}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenDetails(emp.id)}
                          className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded transition-colors"
                          title="View Full Profile"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {(canManageEmployees || currentUser?.id === emp.id) && (
                          <button
                            onClick={() => setEditEmployee({ ...emp })}
                            className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded transition-colors"
                            title="Edit Profile"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                        )}

                        {isSuperAdmin && emp.id !== currentUser?.id && emp.status === 'active' && (
                          <button
                            onClick={() => handleDeactivate(emp.id, `${emp.firstName} ${emp.lastName}`)}
                            className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                            title="Deactivate Employee"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Employee Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-900">Add New Employee Profile</h2>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateEmployee} className="mt-4 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">First Name *</label>
                  <input
                    required
                    type="text"
                    value={formData.firstName}
                    onChange={e => setFormData({ ...formData, firstName: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Last Name *</label>
                  <input
                    required
                    type="text"
                    value={formData.lastName}
                    onChange={e => setFormData({ ...formData, lastName: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Corporate Email *</label>
                <input
                  required
                  type="email"
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  placeholder="name@talentgrid.com"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Job Title / Designation *</label>
                  <input
                    required
                    type="text"
                    value={formData.title}
                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g. Lead Frontend Engineer"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Department *</label>
                  <select
                    required
                    value={formData.departmentId}
                    onChange={e => setFormData({ ...formData, departmentId: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white"
                  >
                    <option value="">Select Department</option>
                    {departments.map(d => (
                      <option key={d.id} value={d.id}>
                        {d.name} ({d.code})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">System Role</label>
                  <select
                    value={formData.role}
                    onChange={e => setFormData({ ...formData, role: e.target.value as UserRole })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white"
                  >
                    <option value="employee">Employee</option>
                    <option value="dept_manager">Department Manager</option>
                    {isSuperAdmin && <option value="hr_manager">HR Manager</option>}
                    {isSuperAdmin && <option value="super_admin">Super Admin</option>}
                  </select>
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Office Location</label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={e => setFormData({ ...formData, location: e.target.value })}
                    placeholder="San Francisco, Austin, Remote"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Contact Phone</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+1 (555) 000-0000"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Initial Password</label>
                  <input
                    type="text"
                    value={formData.password}
                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white font-mono"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg font-medium text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold"
                >
                  Create Employee
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Full Employee Profile Drawer */}
      {viewEmployeeId && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-end p-0 z-50">
          <div className="bg-white w-full max-w-xl h-full shadow-2xl border-l border-slate-200 flex flex-col overflow-y-auto">
            {detailsLoading || !employeeDetails ? (
              <div className="p-8 text-center text-slate-400">Loading profile data...</div>
            ) : (
              <div className="p-6 space-y-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <img
                      src={employeeDetails.user.avatarUrl}
                      alt={employeeDetails.user.firstName}
                      className="w-16 h-16 rounded-full object-cover border border-slate-200 shadow-xs"
                    />
                    <div>
                      <h2 className="text-lg font-bold text-slate-900">
                        {employeeDetails.user.firstName} {employeeDetails.user.lastName}
                      </h2>
                      <p className="text-xs text-slate-500 font-medium">
                        {employeeDetails.user.title} · {employeeDetails.user.departmentName}
                      </p>
                      <div className="mt-1 flex items-center gap-2">
                        <span className="font-mono text-[10px] uppercase tracking-wider text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                          {employeeDetails.user.role.replace('_', ' ')}
                        </span>
                        <span className="text-[11px] text-emerald-600 font-medium">
                          Active since {employeeDetails.user.joinDate}
                        </span>
                      </div>
                    </div>
                  </div>
                  <button onClick={() => setViewEmployeeId(null)} className="text-slate-400 hover:text-slate-600 p-1">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Contact Information */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-2 text-xs">
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2">
                    Contact & Location
                  </div>
                  <div className="flex items-center gap-2 text-slate-700">
                    <Mail className="w-4 h-4 text-slate-400" />
                    <span>{employeeDetails.user.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-700">
                    <Phone className="w-4 h-4 text-slate-400" />
                    <span>{employeeDetails.user.phone || 'Not recorded'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-700">
                    <MapPin className="w-4 h-4 text-slate-400" />
                    <span>{employeeDetails.user.location}</span>
                  </div>
                </div>

                {/* Leave Balances Strip */}
                {employeeDetails.leaveBalance && (
                  <div>
                    <div className="text-xs font-semibold text-slate-900 mb-2">Leave Entitlements</div>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="p-3 bg-indigo-50/60 rounded-xl border border-indigo-100 text-center">
                        <div className="text-[11px] text-indigo-700">Annual Leave</div>
                        <div className="text-base font-bold text-indigo-900 tabular-nums mt-0.5">
                          {employeeDetails.leaveBalance.annual.total - employeeDetails.leaveBalance.annual.used} days left
                        </div>
                        <div className="text-[10px] text-indigo-500">{employeeDetails.leaveBalance.annual.used} used</div>
                      </div>
                      <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-100 text-center">
                        <div className="text-[11px] text-amber-700">Sick Leave</div>
                        <div className="text-base font-bold text-amber-900 tabular-nums mt-0.5">
                          {employeeDetails.leaveBalance.sick.total - employeeDetails.leaveBalance.sick.used} days left
                        </div>
                        <div className="text-[10px] text-amber-500">{employeeDetails.leaveBalance.sick.used} used</div>
                      </div>
                      <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-100 text-center">
                        <div className="text-[11px] text-emerald-700">Casual Leave</div>
                        <div className="text-base font-bold text-emerald-900 tabular-nums mt-0.5">
                          {employeeDetails.leaveBalance.casual.total - employeeDetails.leaveBalance.casual.used} days left
                        </div>
                        <div className="text-[10px] text-emerald-500">{employeeDetails.leaveBalance.casual.used} used</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Assigned Operational Tasks */}
                <div>
                  <div className="text-xs font-semibold text-slate-900 mb-2">Active Tasks</div>
                  {employeeDetails.assignedTasks && employeeDetails.assignedTasks.length > 0 ? (
                    <div className="space-y-2">
                      {employeeDetails.assignedTasks.map((t: any) => (
                        <div key={t.id} className="p-3 bg-white rounded-lg border border-slate-200 text-xs flex justify-between items-center">
                          <span className="font-medium text-slate-800 truncate pr-2">{t.title}</span>
                          <span className="font-mono text-[10px] uppercase px-2 py-0.5 bg-slate-100 rounded text-slate-600">
                            {t.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400">No active tasks assigned.</p>
                  )}
                </div>

                {/* Performance Appraisals */}
                <div>
                  <div className="text-xs font-semibold text-slate-900 mb-2">Recent Appraisals</div>
                  {employeeDetails.recentReviews && employeeDetails.recentReviews.length > 0 ? (
                    <div className="space-y-2">
                      {employeeDetails.recentReviews.map((r: any) => (
                        <div key={r.id} className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs space-y-1">
                          <div className="flex justify-between font-semibold text-slate-900">
                            <span>{r.period} Review</span>
                            <span className="text-indigo-600 tabular-nums">{r.ratingOverall}/5.0</span>
                          </div>
                          <p className="text-slate-600 text-[11px]">{r.achievements}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400">No appraisal history.</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Edit Employee Modal */}
      {editEmployee && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-900">
                Edit {editEmployee.firstName} {editEmployee.lastName}
              </h2>
              <button onClick={() => setEditEmployee(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateEmployee} className="mt-4 space-y-3 text-xs">
              <div>
                <label className="block font-medium text-slate-700 mb-1">Job Title</label>
                <input
                  type="text"
                  disabled={!canManageEmployees}
                  value={editEmployee.title}
                  onChange={e => setEditEmployee({ ...editEmployee, title: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white disabled:opacity-60"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Phone Number</label>
                <input
                  type="text"
                  value={editEmployee.phone || ''}
                  onChange={e => setEditEmployee({ ...editEmployee, phone: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Location</label>
                <input
                  type="text"
                  value={editEmployee.location}
                  onChange={e => setEditEmployee({ ...editEmployee, location: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white"
                />
              </div>

              {canManageEmployees && (
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Department</label>
                  <select
                    value={editEmployee.departmentId}
                    onChange={e => setEditEmployee({ ...editEmployee, departmentId: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white"
                  >
                    {departments.map(d => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {isSuperAdmin && (
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Account Role</label>
                  <select
                    value={editEmployee.role}
                    onChange={e => setEditEmployee({ ...editEmployee, role: e.target.value as UserRole })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white"
                  >
                    <option value="employee">Employee</option>
                    <option value="dept_manager">Department Manager</option>
                    <option value="hr_manager">HR Manager</option>
                    <option value="super_admin">Super Admin</option>
                  </select>
                </div>
              )}

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setEditEmployee(null)}
                  className="px-4 py-2 border border-slate-300 rounded-lg font-medium text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
