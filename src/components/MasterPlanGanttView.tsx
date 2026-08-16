import React, { useState, useMemo, useEffect } from 'react';
import { 
  Calendar, 
  User, 
  Printer, 
  Plus, 
  Edit3, 
  Trash2, 
  Sparkles,
  Clock,
  CheckCircle2,
  MousePointer
} from 'lucide-react';
import { BomPartItem, MasterPlanTaskItem, ModuleItem, ProjectItem } from '../types/bom';
import { formatCurrency } from '../utils/costCalculator';
import { DailyNoteModal } from './DailyNoteModal';

interface MasterPlanGanttViewProps {
  project?: ProjectItem;
  modules: ModuleItem[];
  parts: BomPartItem[];
  masterTasks: MasterPlanTaskItem[];
  onOpenAddTask: () => void;
  onOpenEditTask: (task: MasterPlanTaskItem) => void;
  onDeleteTask: (taskId: string) => void;
  onInsertTask?: (baseTask: MasterPlanTaskItem, mode: 'below' | 'sub') => void;
  onUpdateTaskDates?: (taskId: string, dates: { planStartDate?: string; planEndDate?: string; actualStartDate?: string; actualEndDate?: string; actualDates?: string[]; status?: 'Pending' | 'In Progress' | 'Completed' }) => void;
  onOpenActualCompletionPopup?: (task: MasterPlanTaskItem, clickedDateIso: string) => void;
  onToggleCellActualDate?: (task: MasterPlanTaskItem, dateIso: string) => void;
  onUpdateCellRange?: (task: MasterPlanTaskItem, isoDates: string[], isAdding: boolean) => void;
  onSaveDailyNote?: (taskId: string, dateIso: string, note: string) => void;
}

// Helper to get global start and end dates
export const getProjectDateRange = (tasks: MasterPlanTaskItem[]) => {
  let minDate = new Date();
  let maxDate = new Date();
  
  if (tasks.length > 0) {
    const allDates = tasks.flatMap(t => [
      t.planStartDate, t.planEndDate, 
      t.actualStartDate, t.actualEndDate, 
      ...(t.actualDates || [])
    ]).filter(Boolean) as string[];
    
    if (allDates.length > 0) {
      allDates.sort();
      minDate = new Date(allDates[0]);
      maxDate = new Date(allDates[allDates.length - 1]);
    }
  }
  
  // Start at 1st of the min month
  const start = new Date(minDate.getFullYear(), minDate.getMonth(), 1);
  // End at last day of max month + 1 month padding
  const end = new Date(maxDate.getFullYear(), maxDate.getMonth() + 2, 0);
  
  const diffDays = Math.max(60, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
  const diffWeeks = Math.max(12, Math.ceil(diffDays / 7));
  
  return { start, diffDays, diffWeeks };
};

const THAI_MONTHS_FULL = ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'];
const THAI_MONTHS_SHORT = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
const THAI_DAYS = ['อา.', 'จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.'];

// Generate continuous daily columns dynamically
const generateDailyColumns = (startDate: Date, daysCount: number) => {
  const cols = [];
  const start = new Date(startDate);

  for (let i = 0; i < daysCount; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);

    const year = d.getFullYear();
    const monthIndex = d.getMonth();
    const monthStr = `${THAI_MONTHS_SHORT[monthIndex]} ${year}`;
    const dateNum = d.getDate();
    const dayOfWeek = THAI_DAYS[d.getDay()];
    const dateIso = d.toISOString().split('T')[0];

    cols.push({
      dateIso,
      dateNum,
      dayOfWeek,
      monthStr,
      isWeekend: d.getDay() === 0 || d.getDay() === 6,
    });
  }
  return cols;
};

// Generate continuous weekly columns dynamically
const generateWeeklyColumns = (startDate: Date, weeksCount: number) => {
  const cols = [];
  const start = new Date(startDate);

  for (let i = 0; i < weeksCount; i++) {
    const wStart = new Date(start);
    wStart.setDate(start.getDate() + (i * 7));
    const wEnd = new Date(wStart);
    wEnd.setDate(wStart.getDate() + 6);

    const monthStr = `${THAI_MONTHS_SHORT[wStart.getMonth()]} ${wStart.getFullYear()}`;
    const startDay = String(wStart.getDate()).padStart(2, '0');
    const startM = String(wStart.getMonth() + 1).padStart(2, '0');
    const endDay = String(wEnd.getDate()).padStart(2, '0');
    const endM = String(wEnd.getMonth() + 1).padStart(2, '0');

    cols.push({
      weekNum: i + 1,
      label: `${startDay}/${startM} - ${endDay}/${endM}`,
      monthStr,
      startIso: wStart.toISOString().split('T')[0],
      endIso: wEnd.toISOString().split('T')[0],
    });
  }
  return cols;
};

export const MasterPlanGanttView: React.FC<MasterPlanGanttViewProps> = ({
  project,
  modules,
  parts,
  masterTasks,
  onOpenAddTask,
  onOpenEditTask,
  onDeleteTask,
  onInsertTask,
  onUpdateTaskDates,
  onOpenActualCompletionPopup,
  onToggleCellActualDate,
  onUpdateCellRange,
  onSaveDailyNote,
}) => {
  const [selectedModuleFilter, setSelectedModuleFilter] = useState<string>('ALL');
  const [timelineMode, setTimelineMode] = useState<'days' | 'weeks'>('days'); // 'days' | 'weeks'

  // Drag State for painting/erasing Actual dates
  const [dragTask, setDragTask] = useState<MasterPlanTaskItem | null>(null);
  const [dragStartIso, setDragStartIso] = useState<string | null>(null);
  const [dragHoverIso, setDragHoverIso] = useState<string | null>(null);
  const [isErasing, setIsErasing] = useState<boolean>(false);

  // Daily Note Modal State
  const [activeNoteModal, setActiveNoteModal] = useState<{task: MasterPlanTaskItem, dateIso: string} | null>(null);

  // Calculate dynamic date range based on actual project tasks
  const dateRange = useMemo(() => getProjectDateRange(masterTasks), [masterTasks]);

  const dailyColumns = useMemo(() => generateDailyColumns(dateRange.start, dateRange.diffDays), [dateRange]);
  const weeklyColumns = useMemo(() => generateWeeklyColumns(dateRange.start, dateRange.diffWeeks), [dateRange]);

  // Filter parts based on module
  const filteredParts = useMemo(() => {
    if (selectedModuleFilter === 'ALL') return parts;
    return parts.filter(p => p.moduleId === selectedModuleFilter);
  }, [parts, selectedModuleFilter]);

  // Organize tasks into hierarchy (Main Task -> Sub Tasks) and flatten for table rendering
  const orderedTasks = useMemo(() => {
    const mainTasks = masterTasks.filter(t => !t.parentId);
    const subTasksMap = new Map<string, MasterPlanTaskItem[]>();
    
    masterTasks.filter(t => t.parentId).forEach(subTask => {
      if (!subTasksMap.has(subTask.parentId!)) {
        subTasksMap.set(subTask.parentId!, []);
      }
      subTasksMap.get(subTask.parentId!)!.push(subTask);
    });

    const result: (MasterPlanTaskItem & { isSubTask?: boolean; activeSubTasksCount?: number })[] = [];
    
    mainTasks.forEach(mainTask => {
      const children = subTasksMap.get(mainTask.id) || [];
      const activeSubTasksCount = children.filter(child => (child.actualDates && child.actualDates.length > 0) || child.actualStartDate).length;
      
      result.push({ ...mainTask, activeSubTasksCount });
      children.forEach(child => {
        result.push({ ...child, isSubTask: true });
      });
    });

    const handledIds = new Set(result.map(t => t.id));
    masterTasks.forEach(t => {
      if (!handledIds.has(t.id)) {
        result.push({ ...t, isSubTask: true });
      }
    });

    return result;
  }, [masterTasks]);

  // Calculate stage cost from parts
  const stageCostMap = useMemo(() => {
    const map: Record<string, number> = {};
    filteredParts.forEach(p => {
      const stage = p.workflowStage || '2. BOM Part List';
      map[stage] = (map[stage] || 0) + (p.totalAmount || (p.qty * p.unitPrice));
    });
    return map;
  }, [filteredParts]);

  // Overall completion percentage
  const totalTasks = masterTasks.length;
  const completedTasks = masterTasks.filter(t => t.status === 'Completed').length;
  const overallProgressPct = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  const handlePrint = () => {
    window.print();
  };

  // Group daily columns by Month for top header span
  const dailyMonthGroups = useMemo(() => {
    const groups: { monthStr: string; count: number }[] = [];
    dailyColumns.forEach(col => {
      const lastGroup = groups[groups.length - 1];
      if (lastGroup && lastGroup.monthStr === col.monthStr) {
        lastGroup.count += 1;
      } else {
        groups.push({ monthStr: col.monthStr, count: 1 });
      }
    });
    return groups;
  }, [dailyColumns]);

  // Group weekly columns by Month for top header span
  const weeklyMonthGroups = useMemo(() => {
    const groups: { monthStr: string; count: number }[] = [];
    weeklyColumns.forEach(col => {
      const lastGroup = groups[groups.length - 1];
      if (lastGroup && lastGroup.monthStr === col.monthStr) {
        lastGroup.count += 1;
      } else {
        groups.push({ monthStr: col.monthStr, count: 1 });
      }
    });
    return groups;
  }, [weeklyColumns]);

  // Check if a date falls within range
  const isDateInRange = (targetIso: string, startIso?: string, endIso?: string) => {
    if (!startIso) return false;
    const end = endIso || startIso;
    return targetIso >= startIso && targetIso <= end;
  };

  const isRangeOverlapping = (startIso?: string, endIso?: string, colStartIso?: string, colEndIso?: string) => {
    if (!startIso || !colStartIso || !colEndIso) return false;
    const end = endIso || startIso;
    return startIso <= colEndIso && end >= colStartIso;
  };

  // Discrete cell Actual status check
  const checkIsCellActual = (task: MasterPlanTaskItem, dateIso: string, isWeekly = false, weekStart?: string, weekEnd?: string) => {
    if (task.actualDates && task.actualDates.length > 0) {
      if (!isWeekly) {
        return task.actualDates.includes(dateIso);
      } else {
        return task.actualDates.some(d => d >= (weekStart || '') && d <= (weekEnd || ''));
      }
    }
    // Fallback to traditional start/end date range
    if (!isWeekly) {
      return isDateInRange(dateIso, task.actualStartDate, task.actualEndDate);
    } else {
      return isRangeOverlapping(task.actualStartDate, task.actualEndDate, weekStart, weekEnd);
    }
  };

  // Global Mouse Up for Dragging Action
  useEffect(() => {
    const handleGlobalMouseUp = () => {
      if (dragTask && dragStartIso && dragHoverIso && onUpdateCellRange) {
        const start = dragStartIso < dragHoverIso ? dragStartIso : dragHoverIso;
        const end = dragStartIso < dragHoverIso ? dragHoverIso : dragStartIso;

        const affectedDates: string[] = [];
        if (timelineMode === 'days') {
          dailyColumns.forEach(c => {
            if (c.dateIso >= start && c.dateIso <= end) {
              affectedDates.push(c.dateIso);
            }
          });
        } else {
          weeklyColumns.forEach(c => {
            if (c.startIso >= start && c.startIso <= end) {
              affectedDates.push(c.startIso);
            }
          });
        }

        if (affectedDates.length > 0) {
          onUpdateCellRange(dragTask, affectedDates, !isErasing);
        }
      }
      
      setDragTask(null);
      setDragStartIso(null);
      setDragHoverIso(null);
      setIsErasing(false);
    };

    window.addEventListener('mouseup', handleGlobalMouseUp);
    return () => window.removeEventListener('mouseup', handleGlobalMouseUp);
  }, [dragTask, dragStartIso, dragHoverIso, isErasing, timelineMode, dailyColumns, weeklyColumns, onUpdateCellRange]);

  const handleCellMouseDown = (task: MasterPlanTaskItem, colIso: string, isWeekly: boolean, weekStart?: string, weekEnd?: string) => {
    if (!(task as any).isSubTask) return; // Prevent interaction on Main Tasks

    const currentlyActual = checkIsCellActual(task, colIso, isWeekly, weekStart, weekEnd);
    setDragTask(task);
    setDragStartIso(colIso);
    setDragHoverIso(colIso);
    setIsErasing(currentlyActual); // If it's already actual, we are erasing!
  };

  const handleCellMouseEnter = (task: MasterPlanTaskItem, colIso: string) => {
    if (dragTask && dragTask.id === task.id) {
      setDragHoverIso(colIso);
    }
  };

  const isCellInDragRange = (taskId: string, colIso: string) => {
    if (!dragTask || dragTask.id !== taskId || !dragStartIso || !dragHoverIso) return false;
    const minIso = dragStartIso < dragHoverIso ? dragStartIso : dragHoverIso;
    const maxIso = dragStartIso < dragHoverIso ? dragHoverIso : dragStartIso;
    return colIso >= minIso && colIso <= maxIso;
  };

  // Double-Click Cell Handler: Toggle cell independently or open popup
  const handleCellDoubleClick = (task: MasterPlanTaskItem, colIso: string) => {
    if (!(task as any).isSubTask) return; // Prevent interaction on Main Tasks

    if (onToggleCellActualDate) {
      onToggleCellActualDate(task, colIso);
    } else if (onOpenActualCompletionPopup) {
      onOpenActualCompletionPopup(task, colIso);
    }
  };

  const handleCellContextMenu = (e: React.MouseEvent, task: MasterPlanTaskItem, colIso: string) => {
    e.preventDefault();
    setActiveNoteModal({ task, dateIso: colIso });
  };

  return (
    <div className="space-y-4 select-none">
      
      {/* Top Controls & Header */}
      <div className="p-4 rounded-xl border border-blue-200 dark:border-blue-900/40 bg-white dark:bg-slate-900 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
        <div>
          <div className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-black bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 mb-1">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Drag & Drop / Double-Click Actual Date Update
          </div>
          <h2 className="text-lg font-black text-slate-900 dark:text-white">
            Master Plan แผนงานหลักสร้างเครื่องจักร [{project?.code || 'PRJ'}] {project?.name}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-bold mt-0.5">
            <b>Double-Click</b> ที่ Cell เพื่อกำหนด/ลบ วันเสร็จจริง (Actual 🟢) ได้อย่างอิสระ
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          
          {/* Fixed Plan Indicator */}
          <div className="px-2.5 py-1 rounded-xl bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 text-[11px] font-black text-blue-800 dark:text-blue-300 flex items-center">
            <span className="w-2 h-2 rounded-full bg-indigo-600 mr-1"></span>
            <span className="w-2 h-2 rounded-full bg-sky-500 mr-1.5"></span>
            Plan Fixed (หลัก/ย่อย 🔵)
          </div>

          {/* Timeline Period Mode Toggle Switcher */}
          <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 print:hidden">
            <button
              onClick={() => setTimelineMode('days')}
              className={`px-3 py-1 rounded-lg text-xs font-black flex items-center space-x-1 transition-all ${
                timelineMode === 'days'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>รายวัน</span>
            </button>
            <button
              onClick={() => setTimelineMode('weeks')}
              className={`px-3 py-1 rounded-lg text-xs font-black flex items-center space-x-1 transition-all ${
                timelineMode === 'weeks'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>รายสัปดาห์</span>
            </button>
          </div>

          <button
            onClick={onOpenAddTask}
            className="px-3.5 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-500 hover:to-indigo-800 text-white rounded-xl text-xs font-black shadow-md transition-all flex items-center whitespace-nowrap print:hidden"
          >
            <Plus className="w-4 h-4 mr-1" />
            + เพิ่ม Task WBS
          </button>

          <button
            onClick={handlePrint}
            className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black shadow-md transition-all flex items-center print:hidden"
            title="พิมพ์หรือบันทึก PDF ขนาดกระดาษ A3 แนวนอน (A3 Landscape)"
          >
            <Printer className="w-4 h-4 mr-1.5 text-blue-400" />
            พิมพ์ A3 (PDF)
          </button>
        </div>
      </div>

      {/* KPI Cards & Legend Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
        <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-[10px] text-slate-500 font-bold block uppercase">โครงการ (Project)</span>
          <span className="font-black text-slate-900 dark:text-white">{project?.code} - {project?.name}</span>
          <span className="text-[10px] text-slate-400 block font-bold">ลูกค้า: {project?.customer}</span>
        </div>

        <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-[10px] text-slate-500 font-bold block uppercase">ความคืบหน้ารวม (Progress)</span>
          <span className="font-black text-emerald-700 dark:text-emerald-400 text-sm">
            {overallProgressPct.toFixed(1)}% ({completedTasks}/{totalTasks} Tasks)
          </span>
          <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden mt-1">
            <div className="bg-emerald-600 h-full transition-all" style={{ width: `${overallProgressPct}%` }}></div>
          </div>
        </div>

        {/* Legend */}
        <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-center space-y-1.5">
          <span className="text-[10px] text-slate-500 font-bold uppercase block">สัญลักษณ์การใช้งาน:</span>
          <div className="flex items-center space-x-3 text-[11px] font-bold">
            <div className="flex items-center space-x-1" title="Double-Click เพื่อสลับสถานะ">
              <span className="w-3 h-2 rounded bg-emerald-500"></span>
              <span className="text-emerald-900 dark:text-emerald-300">Actual (Double-Click)</span>
            </div>
            <div className="flex items-center space-x-1" title="คลิกขวา เพื่อจดบันทึก">
              <span>📝</span>
              <span className="text-slate-600 dark:text-slate-400">Daily Note (Right-Click)</span>
            </div>
          </div>
        </div>

        <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-[10px] text-slate-500 font-bold block uppercase">กรอง Module สังกัด</span>
          <select
            value={selectedModuleFilter}
            onChange={(e) => setSelectedModuleFilter(e.target.value)}
            className="w-full mt-0.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg p-1 text-xs font-black text-slate-900 dark:text-white focus:outline-none"
          >
            <option value="ALL">ทุก Module ({parts.length} Parts)</option>
            {modules.map(m => (
              <option key={m.id} value={m.id}>{m.code} - {m.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Split Table & Double-Click Interactive Gantt Chart */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm">
        
        {/* Table Header Bar */}
        <div className="p-3 bg-slate-100 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center text-xs font-black text-slate-900 dark:text-white">
          <div className="flex items-center space-x-2">
            <MousePointer className="w-4 h-4 text-emerald-600 animate-pulse" />
            <span>
              Interactive Actual Update ({timelineMode === 'days' ? 'รายวัน 60 วัน' : 'รายสัปดาห์ 12 สัปดาห์'})
            </span>
          </div>
          <span className="font-mono text-[11px] text-slate-500 print:hidden">
            💡 <b>คลิกลากเมาส์ (Drag)</b> หรือ <b>Double-Click</b> เพื่อเปิด/ปิด วันเสร็จจริง (Actual 🟢) ได้อิสระ
          </span>
        </div>

        {/* Outer Horizontal Scroll Container for Timeline Grid */}
        <div className="overflow-x-auto max-w-full">
          <table className="text-left border-collapse text-xs whitespace-nowrap min-w-full">
            
            {/* Table Header Rows */}
            <thead className="bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-black border-b border-slate-200 dark:border-slate-800 sticky top-0 z-20">
              
              {/* Row 1: Month Headers */}
              <tr>
                <th rowSpan={2} className="p-2 border-r border-slate-200 dark:border-slate-800 text-center w-10 sticky left-0 z-30 bg-slate-100 dark:bg-slate-900">
                  WBS
                </th>
                <th rowSpan={2} className="p-2 border-r border-slate-200 dark:border-slate-800 min-w-[200px] sticky left-10 z-30 bg-slate-100 dark:bg-slate-900">
                  STAGE / TASK NAME
                </th>
                <th rowSpan={2} className="p-2 border-r border-slate-200 dark:border-slate-800 min-w-[120px]">
                  RESPONSIBLE
                </th>
                <th rowSpan={2} className="p-2 border-r border-slate-200 dark:border-slate-800 min-w-[140px]">
                  PLAN vs ACTUAL DATES
                </th>
                <th rowSpan={2} className="p-2 border-r border-slate-200 dark:border-slate-800 text-right w-20">
                  COST (฿)
                </th>
                <th rowSpan={2} className="p-2 border-r border-slate-200 dark:border-slate-800 text-center w-16">
                  STATUS
                </th>
                <th rowSpan={2} className="p-2 border-r border-slate-200 dark:border-slate-800 text-center w-14 print:hidden">
                  ACTION
                </th>

                {/* Timeline Month Span Headers */}
                {timelineMode === 'days' ? (
                  dailyMonthGroups.map((g, idx) => (
                    <th 
                      key={idx} 
                      colSpan={g.count} 
                      className="p-1 border-r border-slate-200 dark:border-slate-800 text-center bg-blue-100/70 dark:bg-slate-900 text-blue-900 dark:text-blue-300 font-mono text-[10px]"
                    >
                      {g.monthStr}
                    </th>
                  ))
                ) : (
                  weeklyMonthGroups.map((g, idx) => (
                    <th 
                      key={idx} 
                      colSpan={g.count} 
                      className="p-1 border-r border-slate-200 dark:border-slate-800 text-center bg-blue-100/70 dark:bg-slate-900 text-blue-900 dark:text-blue-300 font-mono text-[10px]"
                    >
                      {g.monthStr}
                    </th>
                  ))
                )}
              </tr>

              {/* Row 2: Sub Header (Days/Dates) */}
              <tr>
                {timelineMode === 'days' ? (
                  dailyColumns.map((col, idx) => (
                    <th 
                      key={idx} 
                      className={`p-1 border-r border-slate-200 dark:border-slate-800 text-center font-mono text-[9px] w-9 min-w-[36px] ${
                        col.isWeekend ? 'bg-amber-100/60 dark:bg-amber-950/40 text-amber-900' : 'bg-slate-50 dark:bg-slate-950'
                      }`}
                    >
                      <div>{col.dateNum}</div>
                      <div className="text-[8px] text-slate-400 font-normal">{col.dayOfWeek}</div>
                    </th>
                  ))
                ) : (
                  weeklyColumns.map((col, idx) => (
                    <th 
                      key={idx} 
                      className="p-1 border-r border-slate-200 dark:border-slate-800 text-center font-mono text-[9px] w-20 min-w-[80px] bg-slate-50 dark:bg-slate-950"
                    >
                      <div>W{col.weekNum}</div>
                      <div className="text-[8px] text-slate-500 font-normal">{col.label}</div>
                    </th>
                  ))
                )}
              </tr>

            </thead>

            {/* Task Rows */}
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {orderedTasks.length === 0 ? (
                <tr>
                  <td colSpan={timelineMode === 'days' ? 67 : 19} className="p-8 text-center text-slate-400 font-medium">
                    ยังไม่มีรายการ WBS Task ในโปรเจกต์นี้ (กดปุ่ม "+ เพิ่ม Task WBS" ด้านบนเพื่อเริ่มวางแผน)
                  </td>
                </tr>
              ) : (
                orderedTasks.map((task) => {
                  const cost = stageCostMap[task.stageName] || 0;
                  const actualCount = task.actualDates?.length || (task.actualStartDate ? 1 : 0);
                  const isSub = (task as any).isSubTask;

                  return (
                    <tr key={task.id} className={`hover:bg-slate-50 dark:hover:bg-slate-900/60 transition-colors ${isSub ? 'bg-slate-50/50 dark:bg-slate-900/30' : ''}`}>
                      
                      {/* Sticky WBS Code */}
                      <td className="p-2 border-r border-slate-200 dark:border-slate-800 text-center font-mono font-bold text-slate-500 sticky left-0 z-10 bg-white dark:bg-slate-900">
                        {isSub ? <span className="text-slate-300 dark:text-slate-600 pl-2">↳ {task.wbs}</span> : task.wbs}
                      </td>

                      {/* Sticky Task Title */}
                      <td className="p-2 border-r border-slate-200 dark:border-slate-800 sticky left-10 z-10 bg-white dark:bg-slate-900">
                        <div className={`flex flex-col ${isSub ? 'pl-4 border-l-2 border-slate-200 dark:border-slate-700 ml-1' : ''}`}>
                          <div 
                            onClick={() => onOpenEditTask(task)}
                            className={`font-black hover:opacity-80 cursor-pointer max-w-[200px] flex items-center gap-1.5 ${isSub ? 'text-sky-700 dark:text-sky-300' : 'text-indigo-700 dark:text-indigo-300'}`}
                          >
                            <span className="truncate">{task.title}</span>
                            {!isSub && (task as any).activeSubTasksCount > 0 && (
                              <span className="shrink-0 px-1.5 py-0.5 rounded text-[9px] font-black bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                                {(task as any).activeSubTasksCount} Active
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono font-bold truncate">
                            {task.stageName}
                          </div>
                        </div>
                      </td>

                      {/* Responsible */}
                      <td className="p-2 border-r border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-bold text-[11px]">
                        <div className="flex items-center truncate max-w-[120px]">
                          <User className="w-3 h-3 mr-1 text-slate-400 flex-shrink-0" />
                          <span className="truncate">{task.responsible || '-'}</span>
                        </div>
                      </td>

                      {/* Dates: Plan vs Actual */}
                      <td className="p-2 border-r border-slate-200 dark:border-slate-800 text-[10px] font-mono leading-tight">
                        <div className="text-blue-700 dark:text-blue-400 font-bold">
                          P: {task.planStartDate || '-'} ถึง {task.planEndDate || '-'}
                        </div>
                        <div className="text-emerald-700 dark:text-emerald-400 font-bold">
                          A: {actualCount > 0 ? `${actualCount} วันเสร็จจริง` : 'ยังไม่เริ่ม'}
                        </div>
                      </td>

                      {/* Stage Cost */}
                      <td className="p-2 border-r border-slate-200 dark:border-slate-800 text-right font-mono font-black text-slate-900 dark:text-white">
                        {!isSub ? formatCurrency(cost) : '-'}
                      </td>

                      {/* Status */}
                      <td className="p-2 border-r border-slate-200 dark:border-slate-800 text-center">
                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-black ${
                          task.status === 'Completed'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            : task.status === 'In Progress'
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                            : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                        }`}>
                          {task.status}
                        </span>
                      </td>

                      {/* Action (Edit / Delete) */}
                      <td className="p-2 border-r border-slate-200 dark:border-slate-800 text-center print:hidden">
                        <div className="flex flex-wrap items-center justify-center gap-1">
                          {onInsertTask && (
                            <>
                              <button
                                onClick={() => onInsertTask(task, 'below')}
                                className="px-1.5 py-1 text-[9px] font-bold text-slate-500 hover:text-emerald-600 bg-slate-100 dark:bg-slate-800 rounded flex items-center"
                                title="แทรกงานด้านล่าง"
                              >
                                <Plus className="w-2.5 h-2.5 mr-0.5" /> ล่าง
                              </button>
                              {!isSub && (
                                <button
                                  onClick={() => onInsertTask(task, 'sub')}
                                  className="px-1.5 py-1 text-[9px] font-bold text-slate-500 hover:text-blue-600 bg-slate-100 dark:bg-slate-800 rounded flex items-center"
                                  title="เพิ่มงานย่อย"
                                >
                                  <Plus className="w-2.5 h-2.5 mr-0.5" /> ย่อย
                                </button>
                              )}
                            </>
                          )}
                          <button
                            onClick={() => onOpenEditTask(task)}
                            className="p-1 text-slate-500 hover:text-blue-600 bg-slate-100 dark:bg-slate-800 rounded"
                            title="แก้ไข Task"
                          >
                            <Edit3 className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => onDeleteTask(task.id)}
                            className="p-1 text-slate-500 hover:text-rose-600 bg-slate-100 dark:bg-slate-800 rounded"
                            title="ลบ Task"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </td>

                      {/* Timeline Cells with INDEPENDENT CELL DISCRETE TOGGLE AND DRAG */}
                      {timelineMode === 'days' ? (
                        dailyColumns.map((col, idx) => {
                          const inPlan = isDateInRange(col.dateIso, task.planStartDate, task.planEndDate);
                          const inActual = isSub ? checkIsCellActual(task, col.dateIso, false) : false;
                          const inDrag = isSub ? isCellInDragRange(task.id, col.dateIso) : false;

                          return (
                            <td 
                              key={idx} 
                              onMouseDown={() => handleCellMouseDown(task, col.dateIso, false)}
                              onMouseEnter={() => handleCellMouseEnter(task, col.dateIso)}
                              onDoubleClick={() => handleCellDoubleClick(task, col.dateIso)}
                              onContextMenu={(e) => handleCellContextMenu(e, task, col.dateIso)}
                              className={`p-0.5 border-r border-slate-200 dark:border-slate-800 text-center relative h-12 w-9 min-w-[36px] cursor-pointer transition-colors ${
                                inDrag
                                  ? (isErasing ? 'bg-rose-200 dark:bg-rose-900/50' : 'bg-emerald-300 dark:bg-emerald-700')
                                  : inActual 
                                    ? 'bg-emerald-100/60 dark:bg-emerald-950/40' 
                                    : col.isWeekend ? 'bg-amber-50/30 dark:bg-amber-950/20' : 'hover:bg-emerald-50/80 dark:hover:bg-slate-800'
                              }`}
                              title={task.dailyNotes && task.dailyNotes[col.dateIso] ? `Note: ${task.dailyNotes[col.dateIso]}` : `คลิกขวาเพื่อบันทึก Note\nDouble-Click เพื่อสลับ Actual: ${col.dateIso}`}
                            >
                              <div className="flex flex-col h-full justify-center space-y-1 pointer-events-none">
                                <div className="h-2.5 w-full">
                                  {inPlan && (
                                    <div className={`h-full ${isSub ? 'bg-sky-500' : 'bg-indigo-600'} rounded-xs shadow-xs`} title={isSub ? "Sub Plan (Fixed 🔒)" : "Main Plan (Fixed 🔒)"}></div>
                                  )}
                                </div>
                                <div className="h-2.5 w-full">
                                  {inActual && (
                                    <div className={`h-full rounded-xs shadow-xs flex items-center justify-center ${inDrag && isErasing ? 'bg-rose-400' : 'bg-emerald-500'}`} title="Actual (เสร็จแล้ว 🟢)">
                                      {task.dailyNotes && task.dailyNotes[col.dateIso] && <span className="text-[7px]">📝</span>}
                                    </div>
                                  )}
                                  {!inActual && inDrag && !isErasing && (
                                    <div className="h-full bg-emerald-400/80 rounded-xs"></div>
                                  )}
                                  {!inActual && task.dailyNotes && task.dailyNotes[col.dateIso] && (
                                    <div className="absolute top-1 right-0.5 text-[8px] opacity-70">📝</div>
                                  )}
                                </div>
                              </div>
                            </td>
                          );
                        })
                      ) : (
                        weeklyColumns.map((col, idx) => {
                          const inPlan = isRangeOverlapping(task.planStartDate, task.planEndDate, col.startIso, col.endIso);
                          const inActual = isSub ? checkIsCellActual(task, col.startIso, true, col.startIso, col.endIso) : false;
                          const inDrag = isSub ? isCellInDragRange(task.id, col.startIso) : false;

                          return (
                            <td 
                              key={idx} 
                              onDoubleClick={() => handleCellDoubleClick(task, col.startIso)}
                              className={`p-0.5 border-r border-slate-200 dark:border-slate-800 text-center relative h-12 w-20 min-w-[80px] cursor-pointer hover:bg-emerald-50/80 dark:hover:bg-slate-800 transition-colors ${
                                inDrag
                                  ? (isErasing ? 'bg-rose-200 dark:bg-rose-900/50' : 'bg-emerald-300 dark:bg-emerald-700')
                                  : inActual ? 'bg-emerald-100/60 dark:bg-emerald-950/40' : ''
                              }`}
                              title={`Double-Click เพื่อสลับสัปดาห์เสร็จจริง (Actual): W${col.weekNum}`}
                            >
                              <div className="flex flex-col h-full justify-center space-y-1 pointer-events-none">
                                <div className="h-3 w-full">
                                  {inPlan && (
                                    <div className={`h-full ${isSub ? 'bg-sky-500' : 'bg-indigo-600'} rounded-sm shadow-xs`} title={isSub ? "Sub Plan (Fixed 🔒)" : "Main Plan (Fixed 🔒)"}></div>
                                  )}
                                </div>
                                <div className="h-3 w-full">
                                  {inActual && (
                                    <div className={`h-full rounded-sm shadow-xs ${inDrag && isErasing ? 'bg-rose-400' : 'bg-emerald-500'}`} title="Actual (เสร็จแล้ว 🟢)"></div>
                                  )}
                                  {!inActual && inDrag && !isErasing && (
                                    <div className="h-full bg-emerald-400/80 rounded-sm"></div>
                                  )}
                                </div>
                              </div>
                            </td>
                          );
                        })
                      )}

                    </tr>
                  );
                })
              )}
            </tbody>

            {/* Master Plan Summary Footer */}
            <tfoot className="bg-slate-900 text-white font-black text-xs border-t-2 border-slate-800 sticky bottom-0 z-20">
              <tr>
                <td colSpan={4} className="p-3 text-right uppercase tracking-wider sticky left-0 z-30 bg-slate-900">
                  TOTAL MASTER PLAN BUDGET:
                </td>
                <td className="p-3 text-right font-mono font-black text-white bg-slate-800">
                  {formatCurrency(filteredParts.reduce((acc, p) => acc + (p.totalAmount || (p.qty * p.unitPrice)), 0))}
                </td>
                <td colSpan={timelineMode === 'days' ? 62 : 14} className="p-3 text-center">
                  <span className="text-emerald-400 font-mono text-[11px] font-bold">
                    ✓ Cell Double-Click Actual Toggle & Right-Click Notes Enabled
                  </span>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {activeNoteModal && (
        <DailyNoteModal 
          task={activeNoteModal.task} 
          dateIso={activeNoteModal.dateIso} 
          onClose={() => setActiveNoteModal(null)} 
          onSave={(taskId, dateIso, note) => {
            if (onSaveDailyNote) {
              onSaveDailyNote(taskId, dateIso, note);
            }
            setActiveNoteModal(null);
          }} 
        />
      )}
    </div>
  );
};
