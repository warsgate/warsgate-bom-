import React, { useState } from 'react';
import { 
  X, 
  User, 
  Lock, 
  ShieldCheck, 
  UserCheck, 
  ArrowRightLeft, 
  LogOut, 
  Loader2, 
  AlertCircle, 
  CheckCircle2,
  KeyRound
} from 'lucide-react';
import { useAuth, User as AuthUser } from '../contexts/AuthContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

interface SwitchUserModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SwitchUserModal: React.FC<SwitchUserModalProps> = ({ isOpen, onClose }) => {
  const { user, login, logout } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleSwitchUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง');
      }

      login(data.token, data.user);
      setSuccess(`สลับผู้ใช้งานเป็น "${data.user.name || data.user.username}" สำเร็จ!`);
      
      setTimeout(() => {
        setUsername('');
        setPassword('');
        setSuccess('');
        onClose();
      }, 1000);
    } catch (err: any) {
      setError(err.message || 'เกิดข้อผิดพลาดในการสลับผู้ใช้งาน');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    if (confirm('คุณต้องการออกจากระบบหรือไม่?')) {
      logout();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-indigo-600 via-indigo-700 to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-10 h-10 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20">
              <ArrowRightLeft className="w-5 h-5 text-indigo-200" />
            </div>
            <div>
              <h3 className="font-black text-base">สลับผู้ใช้งาน / สลับสิทธิ์</h3>
              <p className="text-xs text-indigo-200">เข้าสู่ระบบด้วยบัญชีอื่น</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Current Active User Banner */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
          <div className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">
            ผู้ใช้งานปัจจุบัน
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-white shadow-sm ${
                user?.role === 'LEVEL_2' ? 'bg-amber-500' : 'bg-indigo-600'
              }`}>
                {user?.role === 'LEVEL_2' ? <ShieldCheck className="w-5 h-5" /> : <UserCheck className="w-5 h-5" />}
              </div>
              <div>
                <div className="font-black text-sm text-slate-900 dark:text-white">
                  {user?.name || user?.username || 'Guest'}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5 font-mono">
                  <span>@{user?.username || '-'}</span>
                  <span>•</span>
                  <span className={`font-bold px-1.5 py-0.2 rounded text-[10px] ${
                    user?.role === 'LEVEL_2' ? 'text-amber-600 dark:text-amber-400 font-black' : 'text-indigo-600 dark:text-indigo-400'
                  }`}>
                    {user?.role === 'LEVEL_2' ? 'Admin (LEVEL_2)' : 'User (LEVEL_1)'}
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/40 text-rose-600 dark:text-rose-400 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors border border-rose-200 dark:border-rose-900/50"
              title="ออกจากระบบ"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Log out</span>
            </button>
          </div>
        </div>

        {/* Switch User Form */}
        <form onSubmit={handleSwitchUser} className="p-5 space-y-4">
          <div className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            <KeyRound className="w-4 h-4 text-indigo-500" />
            <span>กรอกข้อมูลเพื่อสลับเป็นผู้ใช้อื่น:</span>
          </div>

          {error && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-2xl flex items-center space-x-2 text-rose-700 dark:text-rose-300 text-xs">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
              <span className="font-bold">{error}</span>
            </div>
          )}

          {success && (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-2xl flex items-center space-x-2 text-emerald-700 dark:text-emerald-300 text-xs">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              <span className="font-bold">{success}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
              Username
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                required
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="ระบุ Username..."
                className="w-full pl-9 pr-3 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="ระบุ Password..."
                className="w-full pl-9 pr-3 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="pt-2 flex items-center justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black flex items-center space-x-1.5 shadow-lg shadow-indigo-900/20 disabled:opacity-50 transition-all"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>กำลังเข้าสู่ระบบ...</span>
                </>
              ) : (
                <>
                  <ArrowRightLeft className="w-3.5 h-3.5" />
                  <span>สลับผู้ใช้งานทันที</span>
                </>
              )}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
