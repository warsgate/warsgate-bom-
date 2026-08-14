import React, { useState, useEffect } from 'react';
import { X, Save, Calendar } from 'lucide-react';
import { MasterPlanTaskItem } from '../types/bom';

interface DailyNoteModalProps {
  task: MasterPlanTaskItem;
  dateIso: string;
  onClose: () => void;
  onSave: (taskId: string, dateIso: string, note: string) => void;
}

export const DailyNoteModal: React.FC<DailyNoteModalProps> = ({ task, dateIso, onClose, onSave }) => {
  const [note, setNote] = useState('');

  useEffect(() => {
    if (task.dailyNotes && task.dailyNotes[dateIso]) {
      setNote(task.dailyNotes[dateIso]);
    } else {
      setNote('');
    }
  }, [task, dateIso]);

  const handleSave = () => {
    onSave(task.id, dateIso, note);
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 dark:bg-slate-900/80 backdrop-blur-sm p-4"
      onClick={onClose}
      onContextMenu={handleContextMenu}
    >
      <div 
        className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
          <div className="flex items-center">
            <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center mr-3">
              <Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h3 className="font-black text-slate-900 dark:text-white">บันทึกรายวัน (Daily Note)</h3>
              <p className="text-xs text-slate-500 font-medium">วันที่: {dateIso}</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-5">
          <div className="mb-4">
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
              Task
            </label>
            <div className="text-sm font-bold text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 p-2 rounded-lg border border-slate-200 dark:border-slate-700">
              <span className="text-blue-600 dark:text-blue-400 mr-2">[{task.wbs}]</span>
              {task.title}
            </div>
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
              ข้อความบันทึก
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="พิมพ์ข้อความบันทึกสำหรับวันนี้..."
              className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none h-32"
              autoFocus
            />
          </div>
        </div>

        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex justify-end space-x-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors"
          >
            ยกเลิก
          </button>
          <button
            onClick={handleSave}
            className="flex items-center px-4 py-2 text-sm font-black text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all shadow-md hover:shadow-lg"
          >
            <Save className="w-4 h-4 mr-2" />
            บันทึกข้อความ
          </button>
        </div>
      </div>
    </div>
  );
};
