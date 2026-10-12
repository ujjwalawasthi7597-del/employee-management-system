import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, AttendanceRecord, LeaveBalance, UserRole } from '../types';
import { api, getStoredToken, setStoredToken, removeStoredToken } from '../lib/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  todayAttendance: AttendanceRecord | null;
  leaveBalance: LeaveBalance | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  switchRole: (role: UserRole) => Promise<void>;
  clockIn: () => Promise<void>;
  clockOut: () => Promise<void>;
  refreshMe: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(getStoredToken());
  const [todayAttendance, setTodayAttendance] = useState<AttendanceRecord | null>(null);
  const [leaveBalance, setLeaveBalance] = useState<LeaveBalance | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const refreshMe = async () => {
    try {
      const res = await api.getMe();
      setUser(res.user);
      setTodayAttendance(res.todayAttendance);
      setLeaveBalance(res.leaveBalance);
    } catch (err) {
      console.warn('Session expired or invalid, logging out...', err);
      logout();
    }
  };

  useEffect(() => {
    const initAuth = async () => {
      const stored = getStoredToken();
      if (stored) {
        try {
          await refreshMe();
        } catch {
          // fallback to demo switch
          await autoBootstrapDemo();
        }
      } else {
        // Auto bootstrap with Super Admin for seamless instant preview
        await autoBootstrapDemo();
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const autoBootstrapDemo = async () => {
    try {
      const res = await api.quickSwitchRole('super_admin');
      setStoredToken(res.token);
      setToken(res.token);
      setUser(res.user);
      const meData = await api.getMe();
      setTodayAttendance(meData.todayAttendance);
      setLeaveBalance(meData.leaveBalance);
    } catch (e) {
      console.error('Auto bootstrap failed', e);
    }
  };

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const res = await api.login(email, password);
      setStoredToken(res.token);
      setToken(res.token);
      setUser(res.user);
      const meData = await api.getMe();
      setTodayAttendance(meData.todayAttendance);
      setLeaveBalance(meData.leaveBalance);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    removeStoredToken();
    setToken(null);
    setUser(null);
    setTodayAttendance(null);
    setLeaveBalance(null);
  };

  const switchRole = async (role: UserRole) => {
    setIsLoading(true);
    try {
      const res = await api.quickSwitchRole(role);
      setStoredToken(res.token);
      setToken(res.token);
      setUser(res.user);
      const meData = await api.getMe();
      setTodayAttendance(meData.todayAttendance);
      setLeaveBalance(meData.leaveBalance);
    } catch (err) {
      console.error('Failed to switch role', err);
    } finally {
      setIsLoading(false);
    }
  };

  const clockIn = async () => {
    const res = await api.clockIn();
    setTodayAttendance(res.record);
  };

  const clockOut = async () => {
    const res = await api.clockOut();
    setTodayAttendance(res.record);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        todayAttendance,
        leaveBalance,
        login,
        logout,
        switchRole,
        clockIn,
        clockOut,
        refreshMe,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
