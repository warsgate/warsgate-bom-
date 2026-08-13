import React, { useState, useEffect } from 'react';
import { X, CheckCircle2, Calendar, Save, Trash2, Clock, Sparkles } from 'lucide-react';
import { MasterPlanTaskItem } from '../types/bom';

interface ActualCompletionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (taskId: string, data: { actualStartDate: string; actualEndDate: string; progressPct: number; status: 'Pending' | 'In Progress' | 'Completed' }) => void;
  onClear?: (taskId: string) => void;
  task: MasterPlanTaskItem | null;
  clickedDateIso?: string;
}

export const ActualCompletionModal: React.FC<ActualCompletionModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onClear,
  task,
  clickedDateIso,
}) => {
  const [actualStartDate, setActualStartDate] = useState('');
  const [actualEndDate, setActualEndDate] = useState('');
  const [progressPct, setProgressPct] = useState(100);
  const [status, setStatus] = useState<'Pending' | 'In Progress' | 'Completed'>('Completed');

  useEffect(() => {
    if (task) {
      const defaultStart = task.actualStartDate || clickedDateIso || task.planStartDate || new Date().toISOString().split('T')[0];
      const defaultEnd = clickedDateIso || task.actualEndDate || defaultStart;
      setActualStartDate(defaultStart);
      setActualEndDate(defaultEnd);
      setProgressPct(task.progressPct || 100);
      setStatus(task.status === 'Pending' ? 'Completed' : task.status);
    }
  }, [task, clickedDateIso, isOpen]);

  if (!isOpen || !task) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(task.id, {
      actualStartDate,
      actualEndDate,
      progressPct: Number(progressPct),
      status,
    });
    onClose();
  };

  const handleClearActual = () => {
    if (onClear && confirm('คุณต้องการยกเลิกวันเสร็จจริง (Clear Actual Date) ของ Task นี้ใช่หรือไม่?')) {
      onClear(task.id);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-sm">
      <div className="glass-panel w-full max-w-md rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 bg-emerald-50 dark:bg-emerald-950/40 border-b border-emerald-200 dark:border-emerald-800">
          <div className="flex items-center space-x-2">
            <div className="p-2 rounded-lg bg-emerald-200 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-emerald-900 dark:text-emerald-200">
                บันทึกวันเสร็จจริง (Actual Date Update)
              </h3>
              <p className="text-xs text-emerald-700 dark:text-emerald-400 font-bold">
                กำหนดวันทำงานเสร็จจริงของ Task [{task.wbs}]
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Task Info Card */}
        <div className="p-4 bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 text-xs">
          <span className="font-mono text-slate-400 font-bold block">WBS {task.wbs} - {task.stageName}</span>
          <h4 className="text-sm font-black text-slate-900 dark:text-white mt-0.5">{task.title}</h4>
          <div className="flex items-center justify-between mt-2 text-[11px] font-bold text-slate-600 dark:text-slate-400">
            <span>ผู้รับผิดชอบ: <strong className="text-slate-900 dark:text-white">{task.responsible || '-'}</strong></span>
            <span className="text-blue-700 dark:text-blue-400">Plan: {task.planStartDate} ถึง {task.planEndDate}</span>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          
          <div className="p-3 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900 space-y-3">
            <div className="flex items-center space-x-1 font-black text-emerald-900 dark:text-emerald-300">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              <span>ระบุวันเริ่มและวันเสร็จจริง (Actual Dates)</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  วันเริ่มจริง (Actual Start) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={actualStartDate}
                  onChange={(e) => setActualStartDate(e.target.value)}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1.5 font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  วันเสร็จจริง (Actual End) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={actualEndDate}
                  onChange={(e) => setActualEndDate(e.target.value)}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1.5 font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                สถานะงาน (Status)
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-1.5 font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="Completed">เสร็จสมบูรณ์ (Completed)</option>
                <option value="In Progress">อยู่ระหว่างทำ (In Progress)</option>
                <option value="Pending">ยังไม่เริ่ม (Pending)</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                ความคืบหน้า (% Progress)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={progressPct}
                onChange={(e) => setProgressPct(Number(e.target.value))}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-1.5 font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-slate-800">
            {onClear && task.actualStartDate ? (
              <button
                type="button"
                onClick={handleClearActual}
                className="px-3 py-1.5 bg-rose-50 dark:bg-rose-950 hover:bg-rose-100 text-rose-700 dark:text-rose-300 rounded-xl font-bold transition-colors flex items-center"
              >
                <Trash2 className="w-3.5 h-3.5 mr-1" />
                ล้างวันเสร็จ
              </button>
            ) : <div></div>}

            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                ยกเลิก
              </button>

              <button
                type="submit"
                className="px-5 py-2 rounded-xl font-black text-white bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-800 shadow-md shadow-emerald-600/20 transition-all flex items-center"
              >
                <Save className="w-4 h-4 mr-1.5" />
                บันทึกวันเสร็จจริง
              </button>
            </div>
          </div>

        </form>

      </div>
    </div>
  );
};
