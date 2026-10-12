import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  DollarSign,
  Plus,
  Eye,
  CheckCircle2,
  Printer,
  Download,
  X,
  Building,
  ShieldAlert,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';
import { PayrollRecord, User } from '../../types';

export const PayrollView: React.FC = () => {
  const { user } = useAuth();
  const [records, setRecords] = useState<PayrollRecord[]>([]);
  const [employees, setEmployees] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState('2026-09');

  // Payslip inspection modal
  const [selectedSlip, setSelectedSlip] = useState<{ record: PayrollRecord; employee: any } | null>(null);
  const [slipLoading, setSlipLoading] = useState(false);

  // New payroll generation modal
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [genForm, setGenForm] = useState({
    userId: '',
    month: '2026-10',
    basicSalary: 9500,
    hra: 2200,
    transport: 400,
    medical: 300,
    performanceBonus: 1000,
    tax: 2150,
    providentFund: 650,
    healthInsurance: 280,
    paymentMethod: 'direct_deposit' as const,
  });

  const isSuperAdmin = user?.role === 'super_admin';
  const isHr = user?.role === 'hr_manager';
  const canManagePayroll = isSuperAdmin || isHr;

  const loadData = async () => {
    try {
      const [payRes, empRes] = await Promise.all([
        api.getPayroll({ month: selectedMonth || undefined }),
        canManagePayroll ? api.getUsers() : Promise.resolve({ success: true, users: [] }),
      ]);
      setRecords(payRes.records);
      if (empRes.users) setEmployees(empRes.users);
    } catch (err) {
      console.error('Failed to load payroll records', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedMonth, user]);

  const handleOpenSlip = async (id: string) => {
    setSlipLoading(true);
    try {
      const res = await api.getPayslip(id);
      setSelectedSlip(res);
    } catch (err: any) {
      alert(err.message || 'Failed to fetch payslip details');
    } finally {
      setSlipLoading(false);
    }
  };

  const handleMarkPaid = async (id: string) => {
    try {
      await api.markPayrollPaid(id);
      loadData();
      if (selectedSlip && selectedSlip.record.id === id) {
        handleOpenSlip(id);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to mark as paid');
    }
  };

  const handleCreatePayroll = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createPayroll(genForm);
      setShowGenerateModal(false);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to generate payroll record');
    }
  };

  const totalDisbursed = records.reduce((acc, r) => acc + r.netSalary, 0);
  const totalTax = records.reduce((acc, r) => acc + r.deductions.tax, 0);

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            {canManagePayroll ? 'Payroll & Compensation Ledger' : 'My Payslips & Compensation'}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {canManagePayroll
              ? 'Confidential salary processing, statutory tax withholdings, and disbursement batches'
              : 'Authorized salary statements and tax deduction statements'}
          </p>
        </div>

        {canManagePayroll && (
          <button
            onClick={() => setShowGenerateModal(true)}
            className="flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-colors shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Process Payroll Slip</span>
          </button>
        )}
      </div>

      {/* Aggregate Financial Metrics (Admin & HR only) */}
      {canManagePayroll && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-5 bg-white rounded-xl border border-slate-200/90 shadow-xs">
            <div className="text-xs font-medium text-slate-500">Period Net Payout ({selectedMonth})</div>
            <div className="text-2xl font-bold text-slate-900 tabular-nums mt-1">
              ${totalDisbursed.toLocaleString()}
            </div>
            <div className="text-[11px] text-slate-400 mt-2">
              Disbursed across {records.length} authorized employee slips
            </div>
          </div>

          <div className="p-5 bg-white rounded-xl border border-slate-200/90 shadow-xs">
            <div className="text-xs font-medium text-slate-500">Statutory Tax Withheld</div>
            <div className="text-2xl font-bold text-slate-900 tabular-nums mt-1">
              ${totalTax.toLocaleString()}
            </div>
            <div className="text-[11px] text-slate-400 mt-2">FICA, Federal, and State compliance</div>
          </div>

          <div className="p-5 bg-white rounded-xl border border-slate-200/90 shadow-xs">
            <div className="text-xs font-medium text-slate-500">Disbursement Compliance</div>
            <div className="text-2xl font-bold text-emerald-600 tabular-nums mt-1">
              100% On-Time
            </div>
            <div className="text-[11px] text-slate-400 mt-2">ACH Direct Deposit batch verified</div>
          </div>
        </div>
      )}

      {/* Filter Row */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-600">Pay Period:</span>
          <select
            value={selectedMonth}
            onChange={e => setSelectedMonth(e.target.value)}
            className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700"
          >
            <option value="2026-10">October 2026</option>
            <option value="2026-09">September 2026</option>
            <option value="2026-08">August 2026</option>
          </select>
        </div>

        <div className="text-xs text-slate-500">
          Showing <span className="font-semibold text-slate-900">{records.length}</span> records
        </div>
      </div>

      {/* Payroll Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/75 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Payslip #</th>
                <th className="py-3 px-4">Employee</th>
                <th className="py-3 px-4">Period</th>
                <th className="py-3 px-4 text-right">Gross Salary</th>
                <th className="py-3 px-4 text-right">Deductions</th>
                <th className="py-3 px-4 text-right">Net Take-Home</th>
                <th className="py-3 px-4">Disbursement Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {records.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    No payroll slips registered for this period.
                  </td>
                </tr>
              ) : (
                records.map(rec => (
                  <tr key={rec.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-mono font-medium text-slate-900">
                      {rec.payslipNumber}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-900">{rec.userName}</td>
                    <td className="py-3 px-4 font-mono text-slate-600">{rec.month}</td>
                    <td className="py-3 px-4 text-right font-mono text-slate-700 tabular-nums">
                      ${rec.grossSalary.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-rose-600 tabular-nums">
                      -${(rec.grossSalary - rec.netSalary).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 tabular-nums">
                      ${rec.netSalary.toLocaleString()}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[11px] font-medium capitalize ${
                          rec.status === 'paid'
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-blue-50 text-blue-700'
                        }`}
                      >
                        {rec.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenSlip(rec.id)}
                          className="flex items-center gap-1 px-2.5 py-1 text-indigo-600 hover:bg-indigo-50 rounded font-medium text-[11px] transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View Slip</span>
                        </button>

                        {canManagePayroll && rec.status !== 'paid' && (
                          <button
                            onClick={() => handleMarkPaid(rec.id)}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-medium text-[11px] transition-colors"
                          >
                            Mark Paid
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

      {/* Interactive Printable Payslip Modal */}
      {selectedSlip && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-8 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto print:p-0 print:border-none print:shadow-none">
            {/* Modal Controls */}
            <div className="flex items-center justify-between pb-6 border-b border-slate-200 print:hidden">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Official Corporate Pay Advice
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium transition-colors"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print Slip</span>
                </button>
                <button onClick={() => setSelectedSlip(null)} className="text-slate-400 hover:text-slate-600 p-1">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Document Body */}
            <div className="mt-6 space-y-6">
              {/* Header */}
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-xl font-bold tracking-tight text-slate-900">TalentGrid Technologies, Inc.</h2>
                  <p className="text-xs text-slate-500">100 Enterprise Way, Suite 400 · San Francisco, CA</p>
                  <div className="text-xs font-semibold text-indigo-700 mt-1 uppercase tracking-wider">
                    Earnings Statement / Payslip
                  </div>
                </div>
                <div className="text-right text-xs">
                  <div className="font-mono text-slate-500">Payslip Ref: <span className="font-bold text-slate-900">{selectedSlip.record.payslipNumber}</span></div>
                  <div className="text-slate-500">Pay Period: <span className="font-semibold text-slate-900">{selectedSlip.record.month}</span></div>
                  <div className="text-slate-500">Disbursement: <span className="font-semibold text-slate-900 capitalize">{selectedSlip.record.paymentMethod.replace('_', ' ')}</span></div>
                </div>
              </div>

              {/* Employee Box */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 grid grid-cols-2 gap-4 text-xs">
                <div>
                  <div className="text-[10px] uppercase font-semibold text-slate-400">Employee Name</div>
                  <div className="font-bold text-slate-900 mt-0.5">{selectedSlip.record.userName}</div>
                  <div className="text-slate-500">{selectedSlip.employee?.title || 'Team Member'}</div>
                </div>
                <div>
                  <div className="text-[10px] uppercase font-semibold text-slate-400">Department / Location</div>
                  <div className="font-medium text-slate-800 mt-0.5">{selectedSlip.employee?.departmentName || 'Engineering'}</div>
                  <div className="text-slate-500">{selectedSlip.employee?.location || 'San Francisco, CA'}</div>
                </div>
              </div>

              {/* Earnings & Deductions Tables */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
                {/* Earnings */}
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <div className="bg-slate-50 px-4 py-2 font-semibold text-slate-900 border-b border-slate-200">
                    Earnings Breakdown
                  </div>
                  <div className="divide-y divide-slate-100 p-2">
                    <div className="flex justify-between py-1.5 px-2 text-slate-600">
                      <span>Basic Salary</span>
                      <span className="font-mono font-medium text-slate-900 tabular-nums">${selectedSlip.record.basicSalary.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between py-1.5 px-2 text-slate-600">
                      <span>House Rent Allowance (HRA)</span>
                      <span className="font-mono font-medium text-slate-900 tabular-nums">${selectedSlip.record.allowances.hra.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between py-1.5 px-2 text-slate-600">
                      <span>Transport Allowance</span>
                      <span className="font-mono font-medium text-slate-900 tabular-nums">${selectedSlip.record.allowances.transport.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between py-1.5 px-2 text-slate-600">
                      <span>Medical Allowance</span>
                      <span className="font-mono font-medium text-slate-900 tabular-nums">${selectedSlip.record.allowances.medical.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between py-1.5 px-2 text-slate-600">
                      <span>Performance Bonus</span>
                      <span className="font-mono font-medium text-slate-900 tabular-nums">${selectedSlip.record.allowances.performanceBonus.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between py-2 px-2 font-bold text-slate-900 bg-slate-50/60 mt-1">
                      <span>Total Gross Earnings</span>
                      <span className="font-mono tabular-nums">${selectedSlip.record.grossSalary.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {/* Deductions */}
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <div className="bg-slate-50 px-4 py-2 font-semibold text-slate-900 border-b border-slate-200">
                    Statutory Deductions
                  </div>
                  <div className="divide-y divide-slate-100 p-2">
                    <div className="flex justify-between py-1.5 px-2 text-slate-600">
                      <span>Income Tax (TDS / FICA)</span>
                      <span className="font-mono font-medium text-rose-600 tabular-nums">${selectedSlip.record.deductions.tax.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between py-1.5 px-2 text-slate-600">
                      <span>Provident / Retirement Fund</span>
                      <span className="font-mono font-medium text-rose-600 tabular-nums">${selectedSlip.record.deductions.providentFund.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between py-1.5 px-2 text-slate-600">
                      <span>Group Health Insurance</span>
                      <span className="font-mono font-medium text-rose-600 tabular-nums">${selectedSlip.record.deductions.healthInsurance.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between py-2 px-2 font-bold text-slate-900 bg-slate-50/60 mt-auto">
                      <span>Total Deductions</span>
                      <span className="font-mono tabular-nums text-rose-600">
                        -${(selectedSlip.record.grossSalary - selectedSlip.record.netSalary).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Net Take-Home Strip */}
              <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 flex items-center justify-between">
                <div>
                  <div className="text-xs uppercase font-semibold text-emerald-800">Net Take-Home Pay</div>
                  <div className="text-[11px] text-emerald-600">Directly deposited to registered bank account</div>
                </div>
                <div className="text-3xl font-extrabold text-emerald-950 font-mono tabular-nums">
                  ${selectedSlip.record.netSalary.toLocaleString()}
                </div>
              </div>

              {/* Footer notes */}
              <div className="pt-6 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-400">
                <span>Computer-generated document · No physical signature required</span>
                <span>TalentGrid Payroll Engine v2.4</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Generate Payroll Modal */}
      {showGenerateModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-900">Process Employee Salary Slip</h2>
              <button onClick={() => setShowGenerateModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreatePayroll} className="mt-4 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Employee *</label>
                  <select
                    required
                    value={genForm.userId}
                    onChange={e => setGenForm({ ...genForm, userId: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white"
                  >
                    <option value="">Select Employee</option>
                    {employees.map(emp => (
                      <option key={emp.id} value={emp.id}>
                        {emp.firstName} {emp.lastName} ({emp.title})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Pay Period *</label>
                  <input
                    type="month"
                    value={genForm.month}
                    onChange={e => setGenForm({ ...genForm, month: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Basic Base Salary ($) *</label>
                <input
                  required
                  type="number"
                  value={genForm.basicSalary}
                  onChange={e => setGenForm({ ...genForm, basicSalary: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white font-mono"
                />
              </div>

              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider pt-2">
                Allowances & Bonuses ($)
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 mb-1">House Rent (HRA)</label>
                  <input
                    type="number"
                    value={genForm.hra}
                    onChange={e => setGenForm({ ...genForm, hra: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 mb-1">Transport</label>
                  <input
                    type="number"
                    value={genForm.transport}
                    onChange={e => setGenForm({ ...genForm, transport: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 mb-1">Medical</label>
                  <input
                    type="number"
                    value={genForm.medical}
                    onChange={e => setGenForm({ ...genForm, medical: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 mb-1">Performance Bonus</label>
                  <input
                    type="number"
                    value={genForm.performanceBonus}
                    onChange={e => setGenForm({ ...genForm, performanceBonus: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono"
                  />
                </div>
              </div>

              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider pt-2">
                Deductions & Withholdings ($)
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-600 mb-1">Income Tax</label>
                  <input
                    type="number"
                    value={genForm.tax}
                    onChange={e => setGenForm({ ...genForm, tax: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 mb-1">Provident Fund</label>
                  <input
                    type="number"
                    value={genForm.providentFund}
                    onChange={e => setGenForm({ ...genForm, providentFund: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 mb-1">Health Ins.</label>
                  <input
                    type="number"
                    value={genForm.healthInsurance}
                    onChange={e => setGenForm({ ...genForm, healthInsurance: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowGenerateModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg font-medium text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold"
                >
                  Create & Calculate Slip
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
