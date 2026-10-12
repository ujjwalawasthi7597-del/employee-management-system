import React, { useState, useEffect } from 'react';
import {
  FolderKanban,
  CheckCircle2,
  Clock,
  Plus,
  Calendar,
  AlertCircle,
  X,
  User,
  ArrowRight,
  Filter,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';
import { Project, Task, User as UserType } from '../../types';

export const ProjectsView: React.FC = () => {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [employees, setEmployees] = useState<UserType[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');

  // Modals
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);

  const [projectForm, setProjectForm] = useState({
    name: '',
    description: '',
    startDate: new Date().toISOString().split('T')[0],
    dueDate: '',
    priority: 'medium' as const,
  });

  const [taskForm, setTaskForm] = useState({
    projectId: '',
    title: '',
    description: '',
    assigneeId: '',
    priority: 'medium' as const,
    dueDate: '',
  });

  const canManage = ['super_admin', 'hr_manager', 'dept_manager'].includes(user?.role || '');

  const loadData = async () => {
    try {
      const [projRes, taskRes, empRes] = await Promise.all([
        api.getProjects(),
        api.getTasks({
          projectId: selectedProjectId || undefined,
          status: selectedStatus || undefined,
        }),
        api.getUsers(),
      ]);
      setProjects(projRes.projects);
      setTasks(taskRes.tasks);
      setEmployees(empRes.users);
    } catch (err) {
      console.error('Failed to load projects/tasks', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedProjectId, selectedStatus, user]);

  const handleStatusChange = async (taskId: string, newStatus: string) => {
    try {
      await api.updateTaskStatus(taskId, newStatus);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to update task status');
    }
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createProject(projectForm);
      setShowProjectModal(false);
      setProjectForm({
        name: '',
        description: '',
        startDate: new Date().toISOString().split('T')[0],
        dueDate: '',
        priority: 'medium',
      });
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to create project');
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createTask(taskForm);
      setShowTaskModal(false);
      setTaskForm({
        projectId: '',
        title: '',
        description: '',
        assigneeId: '',
        priority: 'medium',
        dueDate: '',
      });
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to create task');
    }
  };

  const statusColumns: { id: Task['status']; title: string; color: string }[] = [
    { id: 'todo', title: 'To Do', color: 'bg-slate-100 text-slate-800' },
    { id: 'in_progress', title: 'In Progress', color: 'bg-blue-50 text-blue-800' },
    { id: 'in_review', title: 'In Review', color: 'bg-amber-50 text-amber-800' },
    { id: 'completed', title: 'Completed', color: 'bg-emerald-50 text-emerald-800' },
  ];

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">Projects & Tasks</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Operational deliverables, assignee ownership, and milestone status boards
          </p>
        </div>

        {canManage && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowProjectModal(true)}
              className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 transition-colors shadow-xs"
            >
              New Project
            </button>
            <button
              onClick={() => setShowTaskModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-colors shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Add Task</span>
            </button>
          </div>
        )}
      </div>

      {/* Projects Overview Row */}
      <div>
        <h2 className="text-sm font-semibold text-slate-900 mb-3">Active Department Projects</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {projects.map(proj => (
            <div
              key={proj.id}
              className={`p-5 rounded-xl border transition-all ${
                selectedProjectId === proj.id
                  ? 'bg-indigo-50/40 border-indigo-400 ring-1 ring-indigo-400'
                  : 'bg-white border-slate-200/90 hover:border-slate-300 shadow-xs'
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="font-mono text-[10px] uppercase tracking-wider text-slate-500">
                    {proj.departmentName}
                  </span>
                  <h3 className="font-bold text-sm text-slate-900 mt-0.5">{proj.name}</h3>
                </div>
                <span
                  className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded ${
                    proj.priority === 'critical'
                      ? 'bg-rose-100 text-rose-700'
                      : proj.priority === 'high'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {proj.priority}
                </span>
              </div>

              <p className="text-xs text-slate-600 mt-2 line-clamp-2">{proj.description}</p>

              <div className="mt-4 pt-3 border-t border-slate-100">
                <div className="flex justify-between text-[11px] text-slate-500 mb-1">
                  <span>Sprint Progress</span>
                  <span className="font-bold text-slate-900 tabular-nums">{proj.progress}%</span>
                </div>
                <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-indigo-600 h-full rounded-full transition-all duration-300"
                    style={{ width: `${proj.progress}%` }}
                  />
                </div>
              </div>

              <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500">
                <span>Lead: {proj.leadName}</span>
                <button
                  onClick={() => setSelectedProjectId(selectedProjectId === proj.id ? '' : proj.id)}
                  className="text-indigo-600 font-semibold hover:underline"
                >
                  {selectedProjectId === proj.id ? 'Clear Filter' : 'Filter Tasks'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Task Kanban Columns */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-slate-900">Task Board</h2>
          {selectedProjectId && (
            <span className="text-xs text-slate-500">
              Filtered to project tasks ·{' '}
              <button onClick={() => setSelectedProjectId('')} className="text-indigo-600 hover:underline">
                Show all
              </button>
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {statusColumns.map(col => {
            const colTasks = tasks.filter(t => t.status === col.id);

            return (
              <div key={col.id} className="bg-slate-100/70 rounded-xl p-4 border border-slate-200/80 flex flex-col">
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200">
                  <span className="text-xs font-bold text-slate-800">{col.title}</span>
                  <span className="text-[11px] font-mono text-slate-500 bg-white px-2 py-0.5 rounded-md border border-slate-200 tabular-nums">
                    {colTasks.length}
                  </span>
                </div>

                <div className="space-y-3 flex-1 overflow-y-auto max-h-[600px]">
                  {colTasks.length === 0 ? (
                    <div className="py-8 text-center text-slate-400 text-xs">No tasks in this lane</div>
                  ) : (
                    colTasks.map(t => {
                      const isMyTask = t.assigneeId === user?.id;

                      return (
                        <div
                          key={t.id}
                          className="p-3.5 bg-white rounded-lg border border-slate-200 shadow-xs space-y-2.5 text-xs hover:border-slate-300 transition-colors"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <span className="text-[10px] font-mono uppercase text-slate-400 truncate max-w-[120px]">
                              {t.projectName}
                            </span>
                            <span
                              className={`text-[9px] font-semibold uppercase px-1.5 py-0.2 rounded ${
                                t.priority === 'high'
                                  ? 'bg-rose-50 text-rose-700'
                                  : t.priority === 'medium'
                                  ? 'bg-amber-50 text-amber-700'
                                  : 'bg-slate-100 text-slate-600'
                              }`}
                            >
                              {t.priority}
                            </span>
                          </div>

                          <h4 className="font-semibold text-slate-900 leading-snug">{t.title}</h4>
                          {t.description && (
                            <p className="text-[11px] text-slate-500 line-clamp-2">{t.description}</p>
                          )}

                          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                            <div className="flex items-center gap-1.5 text-slate-600 truncate">
                              <img
                                src={t.assigneeAvatar}
                                alt={t.assigneeName}
                                className="w-4 h-4 rounded-full object-cover shrink-0"
                              />
                              <span className="truncate">{t.assigneeName}</span>
                            </div>
                            <span className="text-slate-400 font-mono tabular-nums">{t.dueDate}</span>
                          </div>

                          {/* Quick advance status dropdown for assignee or manager */}
                          {(isMyTask || canManage) && (
                            <div className="pt-1 flex items-center justify-end gap-1">
                              <select
                                value={t.status}
                                onChange={e => handleStatusChange(t.id, e.target.value)}
                                className="text-[10px] px-2 py-1 bg-slate-50 border border-slate-200 rounded text-slate-700"
                              >
                                <option value="todo">To Do</option>
                                <option value="in_progress">In Progress</option>
                                <option value="in_review">In Review</option>
                                <option value="completed">Completed</option>
                              </select>
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* New Project Modal */}
      {showProjectModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-900">Create New Project</h2>
              <button onClick={() => setShowProjectModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateProject} className="mt-4 space-y-3 text-xs">
              <div>
                <label className="block font-medium text-slate-700 mb-1">Project Name *</label>
                <input
                  required
                  type="text"
                  value={projectForm.name}
                  onChange={e => setProjectForm({ ...projectForm, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Objective / Scope *</label>
                <textarea
                  required
                  rows={3}
                  value={projectForm.description}
                  onChange={e => setProjectForm({ ...projectForm, description: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={projectForm.startDate}
                    onChange={e => setProjectForm({ ...projectForm, startDate: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Due Date *</label>
                  <input
                    required
                    type="date"
                    value={projectForm.dueDate}
                    onChange={e => setProjectForm({ ...projectForm, dueDate: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Priority</label>
                <select
                  value={projectForm.priority}
                  onChange={e => setProjectForm({ ...projectForm, priority: e.target.value as any })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowProjectModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg font-medium text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold"
                >
                  Create Project
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* New Task Modal */}
      {showTaskModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-900">Assign New Sprint Task</h2>
              <button onClick={() => setShowTaskModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="mt-4 space-y-3 text-xs">
              <div>
                <label className="block font-medium text-slate-700 mb-1">Target Project *</label>
                <select
                  required
                  value={taskForm.projectId}
                  onChange={e => setTaskForm({ ...taskForm, projectId: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white"
                >
                  <option value="">Select Project</option>
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Task Title *</label>
                <input
                  required
                  type="text"
                  value={taskForm.title}
                  onChange={e => setTaskForm({ ...taskForm, title: e.target.value })}
                  placeholder="e.g. Conduct load test on redis caching tier"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Description / Requirements</label>
                <textarea
                  rows={2}
                  value={taskForm.description}
                  onChange={e => setTaskForm({ ...taskForm, description: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Assignee *</label>
                  <select
                    required
                    value={taskForm.assigneeId}
                    onChange={e => setTaskForm({ ...taskForm, assigneeId: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white"
                  >
                    <option value="">Select Assignee</option>
                    {employees.map(emp => (
                      <option key={emp.id} value={emp.id}>
                        {emp.firstName} {emp.lastName}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Due Date *</label>
                  <input
                    required
                    type="date"
                    value={taskForm.dueDate}
                    onChange={e => setTaskForm({ ...taskForm, dueDate: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Priority</label>
                <select
                  value={taskForm.priority}
                  onChange={e => setTaskForm({ ...taskForm, priority: e.target.value as any })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowTaskModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg font-medium text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold"
                >
                  Assign Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
