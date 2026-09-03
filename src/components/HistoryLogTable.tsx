import React, { useEffect, useState } from 'react';
import { Clock, User as UserIcon } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const HistoryLogTable: React.FC = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { token, user } = useAuth();

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const res = await fetch(`${API_URL}/audit-logs`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setLogs(data);
        }
      } catch (err) {
        console.error('Failed to fetch logs:', err);
      } finally {
        setIsLoading(false);
      }
    };

    if (user?.role === 'LEVEL_2') {
      fetchLogs();
    } else {
      setIsLoading(false);
    }
  }, [token, user]);

  if (user?.role !== 'LEVEL_2') {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-500">
        <Lock className="w-12 h-12 mb-4 opacity-50" />
        <p className="font-bold">ไม่มีสิทธิ์เข้าถึงหน้านี้ (Admin Only)</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 p-6 overflow-hidden flex flex-col h-full">
      <div className="flex items-center gap-3 mb-6">
        <Clock className="w-6 h-6 text-indigo-500" />
        <h2 className="text-xl font-black text-slate-900 dark:text-white">ประวัติการใช้งาน (Login History)</h2>
      </div>

      <div className="flex-1 overflow-auto rounded-xl border border-slate-200 dark:border-slate-700">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-slate-50 dark:bg-slate-800/50 sticky top-0 z-10 backdrop-blur-sm border-b-2 border-slate-200 dark:border-slate-700">
            <tr className="divide-x divide-slate-200 dark:divide-slate-700">
              <th className="px-4 py-3 text-xs font-bold uppercase tracking-wide text-slate-600 dark:text-slate-300">วัน / เวลา</th>
              <th className="px-4 py-3 text-xs font-bold uppercase tracking-wide text-slate-600 dark:text-slate-300">ผู้ใช้งาน</th>
              <th className="px-4 py-3 text-xs font-bold uppercase tracking-wide text-slate-600 dark:text-slate-300">กิจกรรม</th>
              <th className="px-4 py-3 text-xs font-bold uppercase tracking-wide text-slate-600 dark:text-slate-300 w-full">รายละเอียด</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
            {isLoading ? (
              <tr>
                <td colSpan={4} className="px-4 py-3 text-center text-slate-500 font-bold">
                  กำลังโหลดข้อมูล...
                </td>
              </tr>
            ) : logs.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-3 text-center text-slate-500 font-bold">
                  ยังไม่มีประวัติการใช้งาน
                </td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr key={log.id} className="divide-x divide-slate-100 dark:divide-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="px-4 py-3 font-bold text-slate-700 dark:text-slate-300">
                    {new Date(log.createdAt).toLocaleString('th-TH')}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center">
                        <UserIcon className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                      </div>
                      <div>
                        <div className="font-bold text-slate-900 dark:text-white">{log.user?.name || log.user?.username}</div>
                        <div className="text-xs text-slate-500 font-semibold">{log.user?.role}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-black bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                      {log.action}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-400 font-medium whitespace-normal">
                    {log.details}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// Placeholder for Lock icon if it's missing from imports above
const Lock = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
  </svg>
);
