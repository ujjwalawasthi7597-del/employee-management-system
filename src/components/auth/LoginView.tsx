import React, { useState } from 'react';
import {
  Shield,
  Lock,
  Mail,
  UserCheck,
  Briefcase,
  User,
  ArrowRight,
  KeyRound,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';

export const LoginView: React.FC = () => {
  const { login } = useAuth();
  const [email, setEmail] = useState('admin@talentgrid.com');
  const [password, setPassword] = useState('Admin@123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Forgot password flow
  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [forgotMsg, setForgotMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await login(email, password);
    } catch (err: any) {
      setError(err.message || 'Invalid credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    login(demoEmail, demoPass);
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.forgotPassword(forgotEmail);
      setForgotMsg(`Instructions sent. Demo reset token generated: ${res.demoResetToken || 'VALID'}`);
      if (res.demoResetToken) setResetToken(res.demoResetToken);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.resetPassword(resetToken, newPassword);
      alert('Password updated successfully! Please sign in.');
      setShowForgot(false);
      setForgotMsg(null);
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4 selection:bg-indigo-600 selection:text-white">
      {/* Brand Header */}
      <div className="text-center mb-8">
        <div className="w-12 h-12 rounded-2xl bg-indigo-600 mx-auto flex items-center justify-center font-bold text-white tracking-wider text-xl shadow-lg shadow-indigo-600/30 mb-3">
          TG
        </div>
        <h1 className="text-2xl font-extrabold text-white tracking-tight">TalentGrid Enterprise EMS</h1>
        <p className="text-xs text-slate-400 mt-1">
          High-assurance Workforce Management & Security Platform
        </p>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 max-w-md w-full shadow-2xl">
        {!showForgot ? (
          <>
            <div className="mb-6">
              <h2 className="text-base font-bold text-white">Sign In to TalentGrid</h2>
              <p className="text-xs text-slate-400 mt-0.5">Enter your corporate credentials below</p>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-rose-950/60 border border-rose-800/80 rounded-xl text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1.5">Corporate Email</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                  <input
                    required
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="name@talentgrid.com"
                    className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white placeholder:text-slate-600 focus:outline-hidden focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-slate-300 font-medium">Password</label>
                  <button
                    type="button"
                    onClick={() => setShowForgot(true)}
                    className="text-[11px] text-indigo-400 hover:underline"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                  <input
                    required
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white placeholder:text-slate-600 focus:outline-hidden focus:border-indigo-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-lg shadow-md transition-colors mt-2"
              >
                {loading ? 'Authenticating...' : 'Sign In with SSO / Password'}
              </button>
            </form>

            {/* Quick 1-Click Role Accounts */}
            <div className="mt-8 pt-6 border-t border-slate-800">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-3 text-center">
                1-Click Demo Profiles (All 4 Roles)
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <button
                  onClick={() => handleQuickLogin('admin@talentgrid.com', 'Admin@123')}
                  className="p-2.5 bg-slate-950 hover:bg-slate-800/80 border border-slate-800 rounded-xl text-left transition-colors"
                >
                  <div className="flex items-center gap-1.5 font-bold text-white text-xs">
                    <Shield className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Super Admin</span>
                  </div>
                  <div className="text-[10px] text-slate-400 truncate mt-0.5">Arthur Vance (CEO)</div>
                </button>

                <button
                  onClick={() => handleQuickLogin('hr@talentgrid.com', 'Hr@123')}
                  className="p-2.5 bg-slate-950 hover:bg-slate-800/80 border border-slate-800 rounded-xl text-left transition-colors"
                >
                  <div className="flex items-center gap-1.5 font-bold text-white text-xs">
                    <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                    <span>HR Manager</span>
                  </div>
                  <div className="text-[10px] text-slate-400 truncate mt-0.5">Elena Rostova (VP)</div>
                </button>

                <button
                  onClick={() => handleQuickLogin('manager@talentgrid.com', 'Manager@123')}
                  className="p-2.5 bg-slate-950 hover:bg-slate-800/80 border border-slate-800 rounded-xl text-left transition-colors"
                >
                  <div className="flex items-center gap-1.5 font-bold text-white text-xs">
                    <Briefcase className="w-3.5 h-3.5 text-blue-400" />
                    <span>Dept Manager</span>
                  </div>
                  <div className="text-[10px] text-slate-400 truncate mt-0.5">Marcus Chen (Eng)</div>
                </button>

                <button
                  onClick={() => handleQuickLogin('employee@talentgrid.com', 'Employee@123')}
                  className="p-2.5 bg-slate-950 hover:bg-slate-800/80 border border-slate-800 rounded-xl text-left transition-colors"
                >
                  <div className="flex items-center gap-1.5 font-bold text-white text-xs">
                    <User className="w-3.5 h-3.5 text-purple-400" />
                    <span>Employee</span>
                  </div>
                  <div className="text-[10px] text-slate-400 truncate mt-0.5">Sophia Lin (Staff)</div>
                </button>
              </div>
            </div>
          </>
        ) : (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-base font-bold text-white">Password Recovery</h2>
              <button
                onClick={() => {
                  setShowForgot(false);
                  setForgotMsg(null);
                }}
                className="text-xs text-indigo-400 hover:underline"
              >
                Back to Sign In
              </button>
            </div>

            {forgotMsg && (
              <div className="mb-4 p-3 bg-emerald-950/60 border border-emerald-800 text-emerald-300 text-xs rounded-xl">
                {forgotMsg}
              </div>
            )}

            {!resetToken ? (
              <form onSubmit={handleForgotPassword} className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-300 mb-1">Enter your registered email</label>
                  <input
                    required
                    type="email"
                    value={forgotEmail}
                    onChange={e => setForgotEmail(e.target.value)}
                    placeholder="name@talentgrid.com"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-semibold"
                >
                  Request Single-Use Token
                </button>
              </form>
            ) : (
              <form onSubmit={handleResetPassword} className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-300 mb-1">Reset Token</label>
                  <input
                    required
                    type="text"
                    value={resetToken}
                    onChange={e => setResetToken(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1">New Secure Password</label>
                  <input
                    required
                    type="password"
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    placeholder="At least 8 characters"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-semibold"
                >
                  Confirm Password Reset
                </button>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
