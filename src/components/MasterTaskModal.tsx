import React, { useState, useEffect } from 'react';
import { X, Calendar, Save, Trash2, CheckCircle2, Clock } from 'lucide-react';
import { MachineWorkflowStage, MasterPlanTaskItem } from '../types/bom';

interface MasterTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (task: Partial<MasterPlanTaskItem>) => void;
  onDelete?: (taskId: string) => void;
  initialTask?: MasterPlanTaskItem | null;
  projectId: string;
  allTasks?: MasterPlanTaskItem[];
}

const STAGE_OPTIONS: MachineWorkflowStage[] = [
  '1. Design (DS,EE,PG)',
  '2. BOM Part List',
  '3. Procurement (STD,FEB)',
  '4. Assembly',
  '5. Testing',
  '6. BuyOff',
  '7. Packing',
  '8. Install & Service',
  '9. Others',
];

export const MasterTaskModal: React.FC<MasterTaskModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onDelete,
  initialTask,
  projectId,
  allTasks = [],
}) => {
  const [wbs, setWbs] = useState('1.0');
  const [stageName, setStageName] = useState<MachineWorkflowStage>('1. Design (DS,EE,PG)');
  const [title, setTitle] = useState('');
  const [responsible, setResponsible] = useState('');
  const [planStartDate, setPlanStartDate] = useState('2026-02-01');
  const [planEndDate, setPlanEndDate] = useState('2026-02-14');
  const [actualStartDate, setActualStartDate] = useState('');
  const [actualEndDate, setActualEndDate] = useState('');
  const [progressPct, setProgressPct] = useState(0);
  const [status, setStatus] = useState<'Pending' | 'In Progress' | 'Completed'>('Pending');
  const [parentId, setParentId] = useState<string | undefined>(undefined);

  // Parent options (only top-level tasks to avoid infinite nesting for now, or just any task except itself)
  const parentOptions = allTasks.filter(t => !initialTask || t.id !== initialTask.id);

  useEffect(() => {
    if (initialTask) {
      setWbs(initialTask.wbs || '1.0');
      setStageName(initialTask.stageName || '1. Design (DS,EE,PG)');
      setTitle(initialTask.title || '');
      setResponsible(initialTask.responsible || '');
      setPlanStartDate(initialTask.planStartDate || '2026-02-01');
      setPlanEndDate(initialTask.planEndDate || '2026-02-14');
      setActualStartDate(initialTask.actualStartDate || '');
      setActualEndDate(initialTask.actualEndDate || '');
      setProgressPct(initialTask.progressPct || 0);
      setStatus(initialTask.status || 'Pending');
      setParentId(initialTask.parentId);
    } else {
      setWbs(`${Date.now() % 10}.0`);
      setStageName('1. Design (DS,EE,PG)');
      setTitle('');
      setResponsible('Jeerawat');
      setPlanStartDate('2026-02-01');
      setPlanEndDate('2026-02-14');
      setActualStartDate('');
      setActualEndDate('');
      setProgressPct(0);
      setStatus('Pending');
      setParentId(undefined);
    }
  }, [initialTask, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...(initialTask ? { id: initialTask.id } : {}),
      projectId,
      wbs,
      stageName,
      title,
      responsible,
      planStartDate,
      planEndDate,
      actualStartDate,
      actualEndDate,
      progressPct: Number(progressPct),
      status,
      parentId: parentId || undefined,
    });
    onClose();
  };

  const handleDelete = () => {
    if (initialTask?.id && onDelete && confirm('คุณแน่ใจหรือไม่ว่าต้องการลบ Task WBS นี้?')) {
      onDelete(initialTask.id);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-sm">
      <div className="glass-panel w-full max-w-lg rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center space-x-2">
            <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {initialTask ? 'แก้ไขแผนงาน WBS Task' : 'เพิ่มแผนงาน WBS Task ใหม่'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">กำหนดช่วงเวลา Plan vs Actual และผู้รับผิดชอบงาน</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto text-xs">
          
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                WBS Code <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={wbs}
                onChange={(e) => setWbs(e.target.value)}
                placeholder="1.0"
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="col-span-2">
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                หมวดขั้นตอน (Stage) <span className="text-rose-500">*</span>
              </label>
              <select
                value={stageName}
                onChange={(e) => setStageName(e.target.value as MachineWorkflowStage)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {STAGE_OPTIONS.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              ชื่อกิจกรรม / ชื่องาน (Task Title) <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. ออกแบบโครงสร้างกลไก & ระบบตู้ไฟ"
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              หมวดหมู่งานหลัก (Parent Task / Main Task)
            </label>
            <select
              value={parentId || ''}
              onChange={(e) => setParentId(e.target.value || undefined)}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">-- ไม่มี (ให้งานนี้เป็น Main Task) --</option>
              {parentOptions.map(p => (
                <option key={p.id} value={p.id}>[{p.wbs}] {p.title}</option>
              ))}
            </select>
            <p className="text-[10px] text-slate-500 mt-1">หากเลือก หมวดหมู่งานหลัก งานนี้จะกลายเป็น Sub Task ที่อยู่ภายใต้งานหลักนั้นๆ</p>
          </div>

          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              ผู้รับผิดชอบ / ทีมงาน (Responsible)
            </label>
            <input
              type="text"
              value={responsible}
              onChange={(e) => setResponsible(e.target.value)}
              placeholder="e.g. Jeerawat & Assembly Team"
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Planned Dates Bar (Blue Section) */}
          <div className="p-3 rounded-xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 space-y-2">
            <span className="font-black text-blue-900 dark:text-blue-300 block">
              1. แผนงานตามเป้าหมาย (Planned Timeline)
            </span>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-blue-800 dark:text-blue-300 mb-1">วันเริ่มตามแผน (Plan Start)</label>
                <input
                  type="date"
                  required
                  value={planStartDate}
                  onChange={(e) => setPlanStartDate(e.target.value)}
                  className="w-full bg-white dark:bg-slate-900 border border-blue-300 dark:border-blue-700 rounded-lg px-2.5 py-1.5 font-mono text-slate-900 dark:text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-blue-800 dark:text-blue-300 mb-1">วันเสร็จตามแผน (Plan End)</label>
                <input
                  type="date"
                  required
                  value={planEndDate}
                  onChange={(e) => setPlanEndDate(e.target.value)}
                  className="w-full bg-white dark:bg-slate-900 border border-blue-300 dark:border-blue-700 rounded-lg px-2.5 py-1.5 font-mono text-slate-900 dark:text-white focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Actual Dates Bar (Green Section) */}
          <div className="p-3 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 space-y-2">
            <span className="font-black text-emerald-900 dark:text-emerald-300 block">
              2. ผลการปฏิบัติงานจริง (Actual Timeline)
            </span>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-emerald-800 dark:text-emerald-300 mb-1">วันเริ่มจริง (Actual Start)</label>
                <input
                  type="date"
                  value={actualStartDate}
                  onChange={(e) => setActualStartDate(e.target.value)}
                  className="w-full bg-white dark:bg-slate-900 border border-emerald-300 dark:border-emerald-700 rounded-lg px-2.5 py-1.5 font-mono text-slate-900 dark:text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-emerald-800 dark:text-emerald-300 mb-1">วันเสร็จจริง (Actual End)</label>
                <input
                  type="date"
                  value={actualEndDate}
                  onChange={(e) => setActualEndDate(e.target.value)}
                  className="w-full bg-white dark:bg-slate-900 border border-emerald-300 dark:border-emerald-700 rounded-lg px-2.5 py-1.5 font-mono text-slate-900 dark:text-white focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Progress & Status */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                ความคืบหน้า ({progressPct}%)
              </label>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={progressPct}
                onChange={(e) => setProgressPct(Number(e.target.value))}
                className="w-full h-2 bg-slate-200 rounded-lg cursor-pointer accent-blue-600"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">สถานะงาน (Status)</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-1.5 font-bold text-slate-900 dark:text-white focus:outline-none"
              >
                <option value="Pending">ยังไม่เริ่ม (Pending)</option>
                <option value="In Progress">อยู่ระหว่างทำ (In Progress)</option>
                <option value="Completed">เสร็จสิ้น (Completed)</option>
              </select>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-slate-800">
            {initialTask?.id && onDelete ? (
              <button
                type="button"
                onClick={handleDelete}
                className="px-3 py-1.5 bg-rose-50 dark:bg-rose-950 hover:bg-rose-100 text-rose-700 dark:text-rose-300 rounded-xl font-bold transition-colors flex items-center"
              >
                <Trash2 className="w-3.5 h-3.5 mr-1" />
                ลบ Task
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
                className="px-5 py-2 rounded-xl font-black text-white bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-500 hover:to-indigo-800 shadow-md shadow-blue-600/20 transition-all flex items-center"
              >
                <Save className="w-4 h-4 mr-1.5" />
                บันทึกแผนงาน Task
              </button>
            </div>
          </div>

        </form>

      </div>
    </div>
  );
};
