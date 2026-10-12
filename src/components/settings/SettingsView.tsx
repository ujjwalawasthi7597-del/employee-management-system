import React, { useState, useEffect } from 'react';
import {
  Settings,
  Save,
  Building,
  Clock,
  Calendar,
  CheckCircle2,
} from 'lucide-react';
import { api } from '../../lib/api';
import { CompanySettings } from '../../types';

export const SettingsView: React.FC = () => {
  const [settings, setSettings] = useState<CompanySettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await api.getSettings();
        setSettings(res.settings);
      } catch (err) {
        console.error('Failed to load settings', err);
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;
    setSaving(true);
    try {
      await api.updateSettings(settings);
      setSuccessMsg(true);
      setTimeout(() => setSuccessMsg(false), 3000);
    } catch (err: any) {
      alert(err.message || 'Failed to update company settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading || !settings) {
    return <div className="p-8 text-center text-slate-400">Loading settings...</div>;
  }

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">Organization Settings</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Global workforce policies, work shift parameters, and annual leave quotas
          </p>
        </div>

        {successMsg && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-lg text-xs font-semibold border border-emerald-200">
            <CheckCircle2 className="w-4 h-4" />
            <span>Policy changes saved successfully</span>
          </div>
        )}
      </div>

      <form onSubmit={handleSave} className="space-y-6 text-xs">
        {/* Company Identity */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <div className="pb-3 border-b border-slate-100 flex items-center gap-2">
            <Building className="w-4 h-4 text-indigo-600" />
            <h2 className="text-sm font-bold text-slate-900">Corporate Identity</h2>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-medium text-slate-700 mb-1">Company Legal Name</label>
              <input
                type="text"
                value={settings.companyName}
                onChange={e => setSettings({ ...settings, companyName: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white text-slate-900"
              />
            </div>
            <div>
              <label className="block font-medium text-slate-700 mb-1">Operating Currency</label>
              <select
                value={settings.currency}
                onChange={e => setSettings({ ...settings, currency: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white text-slate-900"
              >
                <option value="USD">USD ($ - US Dollar)</option>
                <option value="EUR">EUR (€ - Euro)</option>
                <option value="GBP">GBP (£ - British Pound)</option>
                <option value="SGD">SGD (S$ - Singapore Dollar)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Working Hours & Shift Policies */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <div className="pb-3 border-b border-slate-100 flex items-center gap-2">
            <Clock className="w-4 h-4 text-indigo-600" />
            <h2 className="text-sm font-bold text-slate-900">Working Shift Schedule</h2>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-medium text-slate-700 mb-1">Standard Shift Start Time</label>
              <input
                type="time"
                value={settings.workStartTime}
                onChange={e => setSettings({ ...settings, workStartTime: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white text-slate-900 font-mono"
              />
              <p className="text-[11px] text-slate-400 mt-1">Arrivals past 15 min grace are flagged as Late.</p>
            </div>
            <div>
              <label className="block font-medium text-slate-700 mb-1">Standard Shift End Time</label>
              <input
                type="time"
                value={settings.workEndTime}
                onChange={e => setSettings({ ...settings, workEndTime: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white text-slate-900 font-mono"
              />
            </div>
          </div>
        </div>

        {/* Leave Quotas */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <div className="pb-3 border-b border-slate-100 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-indigo-600" />
            <h2 className="text-sm font-bold text-slate-900">Default Annual Leave Quotas (Days / Year)</h2>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block font-medium text-slate-700 mb-1">Annual Vacation</label>
              <input
                type="number"
                min={0}
                value={settings.annualLeaveQuota}
                onChange={e => setSettings({ ...settings, annualLeaveQuota: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white font-mono"
              />
            </div>
            <div>
              <label className="block font-medium text-slate-700 mb-1">Sick Leave</label>
              <input
                type="number"
                min={0}
                value={settings.sickLeaveQuota}
                onChange={e => setSettings({ ...settings, sickLeaveQuota: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white font-mono"
              />
            </div>
            <div>
              <label className="block font-medium text-slate-700 mb-1">Casual Leave</label>
              <input
                type="number"
                min={0}
                value={settings.casualLeaveQuota}
                onChange={e => setSettings({ ...settings, casualLeaveQuota: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white font-mono"
              />
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold text-xs shadow-md transition-colors"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving...' : 'Save Organization Policies'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
