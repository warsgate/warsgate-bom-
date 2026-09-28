import React, { useState, useMemo } from 'react';
import { 
  Building2, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  ChevronRight, 
  Filter, 
  Search, 
  Printer, 
  ExternalLink, 
  Cpu, 
  Table as TableIcon, 
  Wrench, 
  ArrowRight, 
  Sparkles,
  Layers,
  TrendingUp,
  BarChart3,
  Flame,
  ShieldCheck,
  ChevronDown
} from 'lucide-react';
import { BomPartItem, MachineWorkflowStage, MasterPlanTaskItem, ModuleItem, ProjectItem } from '../types/bom';
import { formatCurrency } from '../utils/costCalculator';

interface MultiProjectTimelineViewProps {
  projects: ProjectItem[];
  allParts: BomPartItem[];
  allModules: ModuleItem[];
  allMasterTasks: MasterPlanTaskItem[];
  activeProjectId: string;
  onSelectProject: (projectId: string, targetTab?: string) => void;
  onOpenProjectModal?: (project?: ProjectItem) => void;
}

const STAGE_COLORS: Record<string, { bg: string; text: string; border: string; dot: string }> = {
  '1. Design (DS,EE,PG)': { bg: 'bg-blue-100 dark:bg-blue-950/60', text: 'text-blue-800 dark:text-blue-300', border: 'border-blue-300 dark:border-blue-800', dot: 'bg-blue-500' },
  '2. BOM Part List': { bg: 'bg-indigo-100 dark:bg-indigo-950/60', text: 'text-indigo-800 dark:text-indigo-300', border: 'border-indigo-300 dark:border-indigo-800', dot: 'bg-indigo-500' },
  '3. Procurement (STD,FEB)': { bg: 'bg-amber-100 dark:bg-amber-950/60', text: 'text-amber-800 dark:text-amber-300', border: 'border-amber-300 dark:border-amber-800', dot: 'bg-amber-500' },
  '4. Assembly': { bg: 'bg-sky-100 dark:bg-sky-950/60', text: 'text-sky-800 dark:text-sky-300', border: 'border-sky-300 dark:border-sky-800', dot: 'bg-sky-500' },
  '5. Testing': { bg: 'bg-purple-100 dark:bg-purple-950/60', text: 'text-purple-800 dark:text-purple-300', border: 'border-purple-300 dark:border-purple-800', dot: 'bg-purple-500' },
  '6. BuyOff': { bg: 'bg-emerald-100 dark:bg-emerald-950/60', text: 'text-emerald-800 dark:text-emerald-300', border: 'border-emerald-300 dark:border-emerald-800', dot: 'bg-emerald-500' },
  '7. Packing': { bg: 'bg-teal-100 dark:bg-teal-950/60', text: 'text-teal-800 dark:text-teal-300', border: 'border-teal-300 dark:border-teal-800', dot: 'bg-teal-500' },
  '8. Install & Service': { bg: 'bg-rose-100 dark:bg-rose-950/60', text: 'text-rose-800 dark:text-rose-300', border: 'border-rose-300 dark:border-rose-800', dot: 'bg-rose-500' },
  '9. Others': { bg: 'bg-slate-100 dark:bg-slate-800', text: 'text-slate-700 dark:text-slate-300', border: 'border-slate-300 dark:border-slate-700', dot: 'bg-slate-500' },
};

export const MultiProjectTimelineView: React.FC<MultiProjectTimelineViewProps> = ({
  projects,
  allParts,
  allModules,
  allMasterTasks,
  activeProjectId,
  onSelectProject,
  onOpenProjectModal,
}) => {
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'Active' | 'Completed' | 'On Hold'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [horizonMonths, setHorizonMonths] = useState<number>(6); // 3, 6, 12 months

  const today = useMemo(() => new Date(), []);
  const todayIso = useMemo(() => today.toISOString().split('T')[0], [today]);

  // Generate continuous month columns for the timeline
  const timelineMonths = useMemo(() => {
    const list: { key: string; label: string; year: number; month: number; startIso: string; endIso: string }[] = [];
    const baseDate = new Date(today.getFullYear(), today.getMonth() - 1, 1); // start 1 month in the past
    
    for (let i = 0; i < horizonMonths + 2; i++) {
      const d = new Date(baseDate.getFullYear(), baseDate.getMonth() + i, 1);
      const year = d.getFullYear();
      const month = d.getMonth();
      const lastDay = new Date(year, month + 1, 0).getDate();
      
      const monthNames = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
      const thaiYear = (year + 543) % 100;
      
      const mStr = String(month + 1).padStart(2, '0');
      list.push({
        key: `${year}-${mStr}`,
        label: `${monthNames[month]} '${thaiYear}`,
        year,
        month,
        startIso: `${year}-${mStr}-01`,
        endIso: `${year}-${mStr}-${String(lastDay).padStart(2, '0')}`
      });
    }
    return list;
  }, [today, horizonMonths]);

  const globalStartIso = timelineMonths[0].startIso;
  const globalEndIso = timelineMonths[timelineMonths.length - 1].endIso;
  const globalTotalDays = useMemo(() => {
    const s = new Date(globalStartIso).getTime();
    const e = new Date(globalEndIso).getTime();
    return Math.max(1, Math.ceil((e - s) / (1000 * 60 * 60 * 24)));
  }, [globalStartIso, globalEndIso]);

  // Filtered projects
  const filteredProjects = useMemo(() => {
    return projects.filter(p => {
      if (statusFilter !== 'ALL' && p.status !== statusFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchCode = p.code.toLowerCase().includes(q);
        const matchName = p.name.toLowerCase().includes(q);
        const matchCustomer = (p.customer || '').toLowerCase().includes(q);
        if (!matchCode && !matchName && !matchCustomer) return false;
      }
      return true;
    }).sort((a, b) => {
      // Sort Active projects first, then by delivery date
      if (a.status === 'Active' && b.status !== 'Active') return -1;
      if (b.status === 'Active' && a.status !== 'Active') return 1;
      const dateA = a.targetDeliveryDate || '9999-99-99';
      const dateB = b.targetDeliveryDate || '9999-99-99';
      return dateA.localeCompare(dateB);
    });
  }, [projects, statusFilter, searchQuery]);

  // Compute stats for each project (Progress %, BOM cost, parts count)
  const projectStatsMap = useMemo(() => {
    const map = new Map<string, {
      progressPct: number;
      totalParts: number;
      receivedParts: number;
      bomCost: number;
      completedTasks: number;
      totalTasks: number;
      effectiveStartIso: string;
      effectiveEndIso: string;
      isOverdue: boolean;
      daysRemaining: number;
    }>();

    projects.forEach(p => {
      const pTasks = allMasterTasks.filter(t => t.projectId === p.id);
      const pParts = allParts.filter(pt => pt.projectId === p.id);
      
      const totalParts = pParts.length;
      const receivedParts = pParts.filter(pt => pt.status === 'Received' || pt.status === 'In Assembly' || pt.status === 'Completed').length;
      const bomCost = pParts.reduce((sum, pt) => sum + (pt.totalAmount || (pt.qty * pt.unitPrice)), 0);

      const totalTasks = pTasks.length;
      const completedTasks = pTasks.filter(t => t.status === 'Completed' || (t.progressPct || 0) === 100).length;

      let progressPct = 0;
      if (totalTasks > 0) {
        progressPct = pTasks.reduce((sum, t) => sum + (t.progressPct || 0), 0) / totalTasks;
      } else if (totalParts > 0) {
        progressPct = (receivedParts / totalParts) * 100;
      }

      // Determine date range for gantt bar
      const taskDates = pTasks.flatMap(t => [t.planStartDate, t.planEndDate]).filter(Boolean) as string[];
      let startIso = p.startDate || p.poDate || (taskDates.length > 0 ? taskDates.sort()[0] : p.createdAt?.split('T')[0]) || todayIso;
      let endIso = p.targetDeliveryDate || (taskDates.length > 0 ? taskDates.sort()[taskDates.length - 1] : '') || '';

      if (!endIso) {
        // Default to start date + 60 days if no delivery date specified
        const d = new Date(startIso);
        d.setDate(d.getDate() + 60);
        endIso = d.toISOString().split('T')[0];
      }

      const isOverdue = p.status === 'Active' && endIso < todayIso;
      const diffTime = new Date(endIso).getTime() - new Date(todayIso).getTime();
      const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      map.set(p.id, {
        progressPct: Math.round(progressPct),
        totalParts,
        receivedParts,
        bomCost,
        completedTasks,
        totalTasks,
        effectiveStartIso: startIso,
        effectiveEndIso: endIso,
        isOverdue,
        daysRemaining
      });
    });

    return map;
  }, [projects, allMasterTasks, allParts, todayIso]);

  // Overall Factory KPI Metrics
  const factoryMetrics = useMemo(() => {
    const activeProjects = projects.filter(p => p.status === 'Active');
    const inAssemblyOrTesting = activeProjects.filter(p => {
      const stage = p.currentStage || '';
      return stage.includes('Assembly') || stage.includes('Testing') || stage.includes('BuyOff');
    });

    const dueIn30Days = activeProjects.filter(p => {
      const stats = projectStatsMap.get(p.id);
      return stats && stats.daysRemaining >= 0 && stats.daysRemaining <= 30;
    });

    const totalFactoryWip = Array.from(projectStatsMap.values()).reduce((sum, s) => sum + s.bomCost, 0);

    return {
      totalActive: activeProjects.length,
      inAssemblyOrTestingCount: inAssemblyOrTesting.length,
      dueIn30DaysCount: dueIn30Days.length,
      totalFactoryWip
    };
  }, [projects, projectStatsMap]);

  // Calculate timeline position percentages (0 - 100%)
  const getTimelineBarStyles = (startIso: string, endIso: string) => {
    const globalStart = new Date(globalStartIso).getTime();
    const globalEnd = new Date(globalEndIso).getTime();
    const totalMs = globalEnd - globalStart;

    const startMs = new Date(startIso).getTime();
    const endMs = new Date(endIso).getTime();

    const leftPct = Math.max(0, Math.min(100, ((startMs - globalStart) / totalMs) * 100));
    const rightPct = Math.max(0, Math.min(100, ((endMs - globalStart) / totalMs) * 100));
    const widthPct = Math.max(2, rightPct - leftPct);

    return {
      left: `${leftPct}%`,
      width: `${widthPct}%`
    };
  };

  const getTodayMarkerStyle = () => {
    const globalStart = new Date(globalStartIso).getTime();
    const globalEnd = new Date(globalEndIso).getTime();
    const todayMs = new Date(todayIso).getTime();
    const leftPct = Math.max(0, Math.min(100, ((todayMs - globalStart) / (globalEnd - globalStart)) * 100));
    return { left: `${leftPct}%` };
  };

  return (
    <div className="space-y-4">

      {/* ─── Header & Controls ─── */}
      <div className="p-4 sm:p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <div className="p-3 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-700 text-white shadow-lg shadow-indigo-600/20">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">
                ภาพรวมทุกโปรเจ็คในโรงงาน (Factory Master Plan Timeline)
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-blue-100 text-blue-800 dark:bg-blue-950/70 dark:text-blue-300 border border-blue-300 dark:border-blue-800">
                {filteredProjects.length} โครงการ
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              ติดตามภาพรวมตารางการผลิต, ลำดับงานไลน์ประกอบเครื่องจักร (Assembly Bays), และวันส่งมอบงานทุกโปรเจ็คพร้อมกัน
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 print:hidden">
          {/* Time Horizon Selector */}
          <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setHorizonMonths(3)}
              className={`px-2.5 py-1 rounded-lg transition-all ${horizonMonths === 3 ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm font-black' : 'text-slate-600 dark:text-slate-400'}`}
            >
              3 เดือน
            </button>
            <button
              onClick={() => setHorizonMonths(6)}
              className={`px-2.5 py-1 rounded-lg transition-all ${horizonMonths === 6 ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm font-black' : 'text-slate-600 dark:text-slate-400'}`}
            >
              6 เดือน
            </button>
            <button
              onClick={() => setHorizonMonths(12)}
              className={`px-2.5 py-1 rounded-lg transition-all ${horizonMonths === 12 ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm font-black' : 'text-slate-600 dark:text-slate-400'}`}
            >
              1 ปี
            </button>
          </div>

          <button
            onClick={() => window.print()}
            className="flex items-center space-x-1.5 px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700 transition-all"
            title="พิมพ์ตารางงานขนาด A3 (Print Executive Timeline)"
          >
            <Printer className="w-3.5 h-3.5 text-slate-500" />
            <span>พิมพ์ A3</span>
          </button>
        </div>
      </div>

      {/* ─── Factory Capacity & Health KPI Cards ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
        
        {/* KPI 1: Active Projects */}
        <div className="p-3.5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              เครื่องในสายการผลิต (Active WIP)
            </span>
            <div className="text-xl font-black text-blue-600 dark:text-blue-400 mt-0.5">
              {factoryMetrics.totalActive} <span className="text-xs font-bold text-slate-500">โครงการ</span>
            </div>
            <span className="text-[10px] text-slate-400">จากทั้งหมด {projects.length} โครงการในระบบ</span>
          </div>
          <div className="p-3 rounded-2xl bg-blue-50 dark:bg-blue-950/50 text-blue-600">
            <Cpu className="w-6 h-6" />
          </div>
        </div>

        {/* KPI 2: Floor Load / Assembly Bay Concurrency */}
        <div className="p-3.5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <div className="flex items-center space-x-1.5">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                กำลังประกอบ & Test ในโรงงาน
              </span>
              {factoryMetrics.inAssemblyOrTestingCount >= 3 && (
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping"></span>
              )}
            </div>
            <div className="text-xl font-black text-amber-600 dark:text-amber-400 mt-0.5">
              {factoryMetrics.inAssemblyOrTestingCount} <span className="text-xs font-bold text-slate-500">เครื่องพร้อมกัน</span>
            </div>
            <span className="text-[10px] text-slate-400">
              {factoryMetrics.inAssemblyOrTestingCount >= 4 ? '⚠️ พื้นที่โรงงานใกล้เต็มความจุ (High Bay Load)' : 'ระดับโหลดพื้นที่ประกอบปกติ'}
            </span>
          </div>
          <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/50 text-amber-600">
            <Wrench className="w-6 h-6" />
          </div>
        </div>

        {/* KPI 3: Due in 30 Days */}
        <div className="p-3.5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              ส่งมอบภายใน 30 วัน
            </span>
            <div className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
              {factoryMetrics.dueIn30DaysCount} <span className="text-xs font-bold text-slate-500">เครื่อง</span>
            </div>
            <span className="text-[10px] text-slate-400">เตรียมตรวจรับ BuyOff & ทดสอบครั้งสุดท้าย</span>
          </div>
          <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        {/* KPI 4: Total Factory WIP Cost */}
        <div className="p-3.5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              มูลค่าอะไหล่ & งานกลึงรวม
            </span>
            <div className="text-xl font-black font-mono text-slate-900 dark:text-white mt-0.5">
              {formatCurrency(factoryMetrics.totalFactoryWip)}
            </div>
            <span className="text-[10px] text-slate-400">ยอดรวมชิ้นส่วน BOM ทุกโครงการ</span>
          </div>
          <div className="p-3 rounded-2xl bg-purple-50 dark:bg-purple-950/50 text-purple-600">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>

      </div>

      {/* ─── Search & Filters Bar ─── */}
      <div className="p-3 px-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs print:hidden">
        
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center space-x-1 text-slate-400 font-bold uppercase text-[11px] mr-1">
            <Filter className="w-3.5 h-3.5" />
            <span>สถานะ:</span>
          </div>

          <div className="flex items-center p-0.5 bg-slate-100 dark:bg-slate-800 rounded-xl">
            <button
              onClick={() => setStatusFilter('ALL')}
              className={`px-3 py-1 rounded-lg font-bold transition-all ${statusFilter === 'ALL' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm font-black' : 'text-slate-600 dark:text-slate-400'}`}
            >
              ทั้งหมด ({projects.length})
            </button>
            <button
              onClick={() => setStatusFilter('Active')}
              className={`px-3 py-1 rounded-lg font-bold transition-all ${statusFilter === 'Active' ? 'bg-blue-600 text-white shadow-sm font-black' : 'text-slate-600 dark:text-slate-400'}`}
            >
              กำลังผลิต ({projects.filter(p => p.status === 'Active').length})
            </button>
            <button
              onClick={() => setStatusFilter('On Hold')}
              className={`px-3 py-1 rounded-lg font-bold transition-all ${statusFilter === 'On Hold' ? 'bg-amber-600 text-white shadow-sm font-black' : 'text-slate-600 dark:text-slate-400'}`}
            >
              พักงาน ({projects.filter(p => p.status === 'On Hold').length})
            </button>
            <button
              onClick={() => setStatusFilter('Completed')}
              className={`px-3 py-1 rounded-lg font-bold transition-all ${statusFilter === 'Completed' ? 'bg-emerald-600 text-white shadow-sm font-black' : 'text-slate-600 dark:text-slate-400'}`}
            >
              ส่งมอบแล้ว ({projects.filter(p => p.status === 'Completed').length})
            </button>
          </div>
        </div>

        {/* Search Input */}
        <div className="relative min-w-[220px] sm:w-72">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="ค้นหาชื่อโปรเจ็ค / รหัส / ลูกค้า..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30"
          />
        </div>

      </div>

      {/* ─── Multi-Project Gantt Matrix ─── */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        
        {/* Table Title Bar */}
        <div className="p-3 px-4 bg-slate-50/80 dark:bg-slate-950/70 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs font-black text-slate-900 dark:text-white">
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-pulse"></span>
            <span>ตารางเวลาและกำลังการผลิตทุกโครงการ (Cross-Project Production Horizon)</span>
          </div>
          <div className="flex items-center space-x-3 text-[11px] font-bold text-slate-500">
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span> วันนี้ (Today: {todayIso})
            </span>
            <span className="hidden sm:inline">•</span>
            <span className="hidden sm:inline text-slate-400">คลิกที่แถบโครงการเพื่อสลับดูโปรเจ็คนั้นทันที</span>
          </div>
        </div>

        {/* Scrollable Timeline Table */}
        <div className="overflow-x-auto min-w-full">
          <div className="min-w-[1000px]">

            {/* Matrix Header Row: Project Info Column (320px) + Timeline Months */}
            <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-100/70 dark:bg-slate-950/80 text-[11px] font-black text-slate-600 dark:text-slate-300">
              
              <div className="w-80 shrink-0 p-3 border-r border-slate-200 dark:border-slate-800">
                ข้อมูลโครงการ (Machine / Project Details)
              </div>

              {/* Month Columns */}
              <div className="flex-1 flex divide-x divide-slate-200 dark:divide-slate-800">
                {timelineMonths.map(m => (
                  <div 
                    key={m.key} 
                    className={`flex-1 p-3 text-center truncate ${
                      m.key === todayIso.substring(0, 7)
                        ? 'bg-blue-50/60 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 font-black'
                        : ''
                    }`}
                  >
                    {m.label}
                  </div>
                ))}
              </div>

            </div>

            {/* Projects Rows */}
            <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {filteredProjects.length === 0 ? (
                <div className="p-12 text-center text-slate-400 text-xs">
                  ไม่พบโครงการตามตัวกรองนี้
                </div>
              ) : (
                filteredProjects.map((p, pIndex) => {
                  const stats = projectStatsMap.get(p.id) || {
                    progressPct: 0,
                    totalParts: 0,
                    receivedParts: 0,
                    bomCost: 0,
                    completedTasks: 0,
                    totalTasks: 0,
                    effectiveStartIso: todayIso,
                    effectiveEndIso: todayIso,
                    isOverdue: false,
                    daysRemaining: 0
                  };

                  const stageStyle = STAGE_COLORS[p.currentStage || ''] || STAGE_COLORS['9. Others'];
                  const barStyle = getTimelineBarStyles(stats.effectiveStartIso, stats.effectiveEndIso);
                  const isCurrentActive = p.id === activeProjectId;

                  return (
                    <div 
                      key={p.id}
                      className={`flex group transition-colors ${
                        isCurrentActive 
                          ? 'bg-blue-50/40 dark:bg-blue-950/20' 
                          : 'hover:bg-slate-50/70 dark:hover:bg-slate-800/40'
                      }`}
                    >
                      {/* Left: Project Card Info (320px) */}
                      <div className="w-80 shrink-0 p-3 border-r border-slate-200 dark:border-slate-800 flex flex-col justify-between space-y-2">
                        <div>
                          <div className="flex items-center justify-between gap-1 mb-1">
                            <button
                              onClick={() => onSelectProject(p.id, 'master-plan')}
                              className="font-mono font-black text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 truncate"
                              title="คลิกเพื่อเปิด Master Plan โครงการนี้"
                            >
                              <span>[{p.code}]</span>
                              <span className="text-slate-900 dark:text-white truncate font-bold">{p.name}</span>
                            </button>
                            
                            {/* Current Active Indicator */}
                            {isCurrentActive && (
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-black bg-blue-600 text-white shrink-0">
                                ใช้งานอยู่
                              </span>
                            )}
                          </div>

                          <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                            <span className="truncate">ลูกค้า: <strong className="text-slate-700 dark:text-slate-300">{p.customer}</strong></span>
                            <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
                              {formatCurrency(stats.bomCost)}
                            </span>
                          </div>
                        </div>

                        {/* Progress Bar & Stage Badge */}
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-[10px]">
                            <span className={`px-2 py-0.5 rounded-full font-black border truncate max-w-[170px] ${stageStyle.bg} ${stageStyle.text} ${stageStyle.border}`}>
                              {p.currentStage || '2. BOM Part List'}
                            </span>
                            <span className="font-mono font-black text-slate-700 dark:text-slate-300">
                              {stats.progressPct}%
                            </span>
                          </div>

                          <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                            <div 
                              className={`h-full transition-all ${
                                stats.isOverdue ? 'bg-rose-500' : stats.progressPct === 100 ? 'bg-emerald-500' : 'bg-blue-600'
                              }`} 
                              style={{ width: `${stats.progressPct}%` }}
                            />
                          </div>

                          <div className="flex items-center justify-between text-[10px] text-slate-400 pt-0.5">
                            <span>กำหนดส่ง: <strong>{p.targetDeliveryDate || 'ยังไม่ระบุ'}</strong></span>
                            {stats.isOverdue ? (
                              <span className="font-black text-rose-500">เลยกำหนด</span>
                            ) : stats.daysRemaining <= 30 && stats.daysRemaining >= 0 ? (
                              <span className="font-bold text-amber-600">อีก {stats.daysRemaining} วัน</span>
                            ) : (
                              <span>อีก {stats.daysRemaining} วัน</span>
                            )}
                          </div>
                        </div>

                        {/* Quick Jump Buttons */}
                        <div className="flex items-center space-x-1.5 pt-1 border-t border-slate-100 dark:border-slate-800/60 text-[10px]">
                          <button
                            onClick={() => onSelectProject(p.id, 'master-plan')}
                            className="flex-1 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-blue-600 hover:text-white rounded-lg font-bold text-slate-700 dark:text-slate-300 transition-colors text-center"
                          >
                            📅 Master Plan
                          </button>
                          <button
                            onClick={() => onSelectProject(p.id, 'bom')}
                            className="flex-1 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-red-600 hover:text-white rounded-lg font-bold text-slate-700 dark:text-slate-300 transition-colors text-center"
                          >
                            📋 รายการ BOM
                          </button>
                          {onOpenProjectModal && (
                            <button
                              onClick={() => onOpenProjectModal(p)}
                              className="px-2 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg font-bold text-slate-500 transition-colors"
                              title="แก้ไขข้อมูลโครงการ"
                            >
                              แก้ไข
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Right: Gantt Bar Timeline Area */}
                      <div className="flex-1 relative flex items-center px-2 py-4">
                        
                        {/* Month Background Grid Lines */}
                        <div className="absolute inset-0 flex divide-x divide-slate-100 dark:divide-slate-800/60 pointer-events-none">
                          {timelineMonths.map(m => (
                            <div key={m.key} className="flex-1 h-full" />
                          ))}
                        </div>

                        {/* Today Red Line Indicator */}
                        <div 
                          className="absolute top-0 bottom-0 w-0.5 bg-rose-500 z-10 pointer-events-none"
                          style={getTodayMarkerStyle()}
                        >
                          <div className="w-2 h-2 rounded-full bg-rose-500 -ml-[3px] -mt-1 shadow-sm"></div>
                        </div>

                        {/* Interactive Project Gantt Bar */}
                        <div
                          onClick={() => onSelectProject(p.id, 'master-plan')}
                          style={barStyle}
                          className={`relative z-5 rounded-2xl h-12 p-2 flex flex-col justify-between shadow-sm cursor-pointer transition-all hover:scale-[1.01] hover:shadow-md border ${
                            stats.isOverdue
                              ? 'bg-gradient-to-r from-rose-500 to-red-600 text-white border-rose-400'
                              : stats.progressPct === 100
                              ? 'bg-gradient-to-r from-emerald-600 to-teal-700 text-white border-emerald-500'
                              : 'bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white border-indigo-400'
                          }`}
                          title={`[${p.code}] ${p.name}\nกำหนดส่ง: ${p.targetDeliveryDate || '-'}\nคลิกเพื่อเปิดโครงการ`}
                        >
                          <div className="flex items-center justify-between text-[11px] font-black truncate">
                            <span className="truncate drop-shadow-sm">
                              [{p.code}] {p.name}
                            </span>
                            <span className="px-1.5 py-0.2 rounded bg-black/25 text-[10px] font-mono shrink-0 ml-1">
                              {stats.progressPct}%
                            </span>
                          </div>

                          <div className="flex items-center justify-between text-[10px] text-white/90 truncate">
                            <span className="truncate font-medium">
                              {p.currentStage || 'BOM Part List'}
                            </span>
                            <span className="font-mono text-[9px] opacity-80 shrink-0 ml-1">
                              {stats.effectiveStartIso} → {stats.effectiveEndIso}
                            </span>
                          </div>

                          {/* Progress fill bar inside gantt bar */}
                          <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/20 rounded-b-2xl overflow-hidden">
                            <div className="h-full bg-white/70" style={{ width: `${stats.progressPct}%` }}></div>
                          </div>
                        </div>

                      </div>

                    </div>
                  );
                })
              )}
            </div>

          </div>
        </div>

      </div>

    </div>
  );
};
