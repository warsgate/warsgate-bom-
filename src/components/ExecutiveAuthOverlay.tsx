import React, { useState } from 'react';
import { ShieldAlert, Lock, Key, ArrowRight, ShieldCheck, UserCheck } from 'lucide-react';

interface ExecutiveAuthOverlayProps {
  onUnlock: () => void;
  onSwitchToEngineer: () => void;
}

export const ExecutiveAuthOverlay: React.FC<ExecutiveAuthOverlayProps> = ({
  onUnlock,
  onSwitchToEngineer,
}) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    // Default PIN: 1234 or empty unlock
    if (pin === '1234' || pin === '8888' || pin === '') {
      setError('');
      onUnlock();
    } else {
      setError('รหัสผ่าน PIN ไม่ถูกต้อง (ทดลองใช้ 1234)');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center p-6 sm:p-12 my-8 max-w-md mx-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-xl text-center animate-in fade-in zoom-in-95 duration-200">
      
      {/* Lock Icon */}
      <div className="w-16 h-16 rounded-2xl bg-red-100 dark:bg-red-950/60 border border-red-200 dark:border-red-800 flex items-center justify-center text-red-600 dark:text-red-400 mb-4 shadow-inner">
        <Lock className="w-8 h-8" />
      </div>

      <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-300 mb-2">
        <ShieldAlert className="w-3 h-3 mr-1" />
        RESTRICTED EXECUTIVE ACCESS
      </div>

      <h3 className="text-xl font-black text-slate-900 dark:text-white">
        สงวนสิทธิ์เฉพาะผู้บริหาร / เจ้าของ
      </h3>
      <p className="text-xs text-slate-500 dark:text-slate-400 font-bold mt-1 max-w-xs">
        หน้า Dashboard ภาพรวมและการเงินรวม สงวนสิทธิ์การเข้าถึงสำหรับระดับผู้บริหาร หรือเจ้าของโปรเจกต์เท่านั้น
      </p>

      {/* Unlock Form */}
      <form onSubmit={handleVerify} className="w-full mt-6 space-y-3">
        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center justify-center">
            <Key className="w-3.5 h-3.5 mr-1 text-amber-500" />
            กรอกรหัส PIN ผู้บริหาร (ทดลองใช้ 1234)
          </label>
          <input
            type="password"
            maxLength={4}
            value={pin}
            onChange={(e) => {
              setPin(e.target.value);
              setError('');
            }}
            placeholder="• • • •"
            className="w-full text-center tracking-[0.5em] text-lg font-mono font-black py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500"
          />
          {error && <p className="text-[11px] font-bold text-rose-600 mt-1">{error}</p>}
        </div>

        <button
          type="submit"
          className="w-full py-2.5 bg-gradient-to-r from-red-600 via-rose-700 to-rose-900 hover:from-red-500 hover:to-rose-800 text-white rounded-xl text-xs font-black shadow-md transition-all flex items-center justify-center space-x-1.5"
        >
          <ShieldCheck className="w-4 h-4" />
          <span>ปลดล็อกเข้าสู่สิทธิ์ผู้บริหาร</span>
        </button>
      </form>

      {/* One-click Quick Switcher */}
      <div className="w-full pt-4 mt-4 border-t border-slate-100 dark:border-slate-800 space-y-2">
        <button
          type="button"
          onClick={onUnlock}
          className="w-full py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-black transition-all flex items-center justify-center"
        >
          <UserCheck className="w-3.5 h-3.5 mr-1 text-emerald-500" />
          1-Click ยืนยันว่าเป็นผู้บริหาร (Demo Unlock)
        </button>

        <button
          type="button"
          onClick={onSwitchToEngineer}
          className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-white font-bold flex items-center justify-center mx-auto"
        >
          สลับไปหน้าโครงสร้าง Module สำหรับวิศวกร
          <ArrowRight className="w-3 h-3 ml-1" />
        </button>
      </div>

    </div>
  );
};
