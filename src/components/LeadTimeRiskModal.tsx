import React, { useState, useMemo } from 'react';
import { 
  X, 
  AlertTriangle, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  Layers, 
  Truck, 
  ArrowRight, 
  ShieldAlert, 
  Filter, 
  Edit3, 
  Search,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  Sparkles
} from 'lucide-react';
import { BomPartItem, MasterPlanTaskItem, ModuleItem, ProjectItem } from '../types/bom';
import { formatCurrency } from '../utils/costCalculator';

interface LeadTimeRiskModalProps {
  isOpen: boolean;
  onClose: () => void;
  project?: ProjectItem;
  modules: ModuleItem[];
  parts: BomPartItem[];
  masterTasks: MasterPlanTaskItem[];
  onEditPart?: (part: BomPartItem) => void;
}

interface RiskAnalysisItem {
  part: BomPartItem;
  module?: ModuleItem;
  assemblyStartDate?: string;
  expectedArrivalDate: string;
  leadTimeDays: number;
  daysDiff: number; // positive = buffer, negative = delay
  riskLevel: 'CRITICAL' | 'WARNING' | 'SAFE' | 'RECEIVED';
  riskReason: string;
}

const getTodayIso = () => new Date().toISOString().split('T')[0];

const addDaysToDate = (dateStr: string, days: number): string => {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return getTodayIso();
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
};

const getDiffDays = (date1: string, date2: string): number => {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  if (isNaN(d1.getTime()) || !isNaN(d2.getTime())) {
    const diffTime = d2.getTime() - d1.getTime();
    return Math.round(diffTime / (1000 * 60 * 60 * 24));
  }
  return 0;
};

export const LeadTimeRiskModal: React.FC<LeadTimeRiskModalProps> = ({
  isOpen,
  onClose,
  project,
  modules,
  parts,
  masterTasks,
  onEditPart,
}) => {
  const [filterLevel, setFilterLevel] = useState<'ALL' | 'CRITICAL' | 'WARNING' | 'SAFE'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Map each module to its earliest assembly or design task start date
  const moduleAssemblyDateMap = useMemo(() => {
    const map = new Map<string, string>();
    const today = getTodayIso();

    modules.forEach(m => {
      // Find tasks related to this module or general assembly
      const relatedTasks = masterTasks.filter(t => 
        t.title.toLowerCase().includes(m.code.toLowerCase()) || 
        t.title.toLowerCase().includes(m.name.toLowerCase()) ||
        t.stageName === '4. Assembly'
      );

      let earliestPlanDate = '';
      relatedTasks.forEach(t => {
        if (t.planStartDate) {
          if (!earliestPlanDate || t.planStartDate < earliestPlanDate) {
            earliestPlanDate = t.planStartDate;
          }
        }
      });

      // Default to 14 days from today if no schedule task set
      map.set(m.id, earliestPlanDate || addDaysToDate(today, 14));
    });

    return map;
  }, [modules, masterTasks]);

  // Risk evaluation engine
  const riskAnalysisList = useMemo<RiskAnalysisItem[]>(() => {
    const today = getTodayIso();

    return parts.map(part => {
      const module = modules.find(m => m.id === part.moduleId);
      const assemblyStart = part.moduleId 
        ? moduleAssemblyDateMap.get(part.moduleId) || addDaysToDate(today, 14)
        : addDaysToDate(today, 14);

      // Estimate lead time if not set: Feb Part ~ 14 days, Standard ~ 7 days, or from remarks
      let leadDays = 7;
      if (part.partType === 'Feb Part') leadDays = 12;
      const leadMatch = (part.remarks || '').match(/(\d+)\s*(?:วัน|day)/i);
      if (leadMatch) {
        leadDays = parseInt(leadMatch[1], 10);
      }

      // Expected arrival date
      let expectedArrival = part.receiveDate;
      if (!expectedArrival) {
        if (part.orderDate) {
          expectedArrival = addDaysToDate(part.orderDate, leadDays);
        } else {
          // If not ordered yet, expected arrival is today + leadDays
          expectedArrival = addDaysToDate(today, leadDays + 3);
        }
      }

      const daysDiff = getDiffDays(expectedArrival, assemblyStart);

      // Determine Risk Level
      let riskLevel: 'CRITICAL' | 'WARNING' | 'SAFE' | 'RECEIVED' = 'SAFE';
      let riskReason = 'ของจะส่งถึงก่อนวันเริ่มประกอบตามแผน';

      if (part.status === 'Received' || part.status === 'In Assembly' || part.status === 'Completed') {
        riskLevel = 'RECEIVED';
        riskReason = 'ของส่งถึงโรงงาน/อยู่ในสายประกอบแล้ว';
      } else if (daysDiff < 0) {
        riskLevel = 'CRITICAL';
        riskReason = `ของจะมาส่งช้ากว่าวันเริ่มประกอบ ${Math.abs(daysDiff)} วัน เสี่ยงกระทบ Timeline!`;
      } else if (daysDiff <= 3) {
        riskLevel = 'WARNING';
        riskReason = `Buffer เหลือน้อยมาก (${daysDiff} วัน) เสี่ยงดีเลย์หากร้านค้าส่งล่าช้า`;
      }

      return {
        part,
        module,
        assemblyStartDate: assemblyStart,
        expectedArrivalDate: expectedArrival,
        leadTimeDays: leadDays,
        daysDiff,
        riskLevel,
        riskReason
      };
    });
  }, [parts, modules, moduleAssemblyDateMap]);

  // Summary KPIs
  const kpis = useMemo(() => {
    let critical = 0;
    let warning = 0;
    let safe = 0;
    let received = 0;

    riskAnalysisList.forEach(item => {
      if (item.riskLevel === 'CRITICAL') critical++;
      else if (item.riskLevel === 'WARNING') warning++;
      else if (item.riskLevel === 'RECEIVED') received++;
      else safe++;
    });

    return { critical, warning, safe, received };
  }, [riskAnalysisList]);

  // Filtered list
  const filteredList = useMemo(() => {
    let list = riskAnalysisList;
    if (filterLevel !== 'ALL') {
      list = list.filter(item => item.riskLevel === filterLevel);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(item => 
        item.part.partName.toLowerCase().includes(q) ||
        item.part.dwgNo.toLowerCase().includes(q) ||
        (item.part.supplier && item.part.supplier.toLowerCase().includes(q)) ||
        (item.module && item.module.name.toLowerCase().includes(q))
      );
    }
    // Sort critical first
    return list.sort((a, b) => a.daysDiff - b.daysDiff);
  }, [riskAnalysisList, filterLevel, searchQuery]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 w-full max-w-5xl rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-rose-900 via-slate-900 to-slate-900 text-white flex items-center justify-between border-b border-rose-800/40">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-rose-500/20 border border-rose-400/30 flex items-center justify-center text-rose-400 shadow-inner">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-sm font-black tracking-wide">
                  Lead-Time Risk & Critical Path Warning
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-500/30 text-rose-300 border border-rose-400/40">
                  Critical Bottleneck Monitor
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                ระบบคำนวณวันรับอะไหล่ เทียบกับวันเริ่มประกอบใน Master Plan เพื่อดักจับชิ้นส่วนที่เสี่ยงทำให้โครงการดีเลย์
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar space-y-4 bg-slate-50 dark:bg-slate-950">
          
          {/* KPI Risk Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div 
              onClick={() => setFilterLevel(prev => prev === 'CRITICAL' ? 'ALL' : 'CRITICAL')}
              className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                filterLevel === 'CRITICAL'
                  ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-500 ring-2 ring-rose-500/20'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-rose-300'
              }`}
            >
              <div className="flex items-center justify-between text-[11px] font-bold text-rose-600 dark:text-rose-400 uppercase">
                <span>🔴 เสี่ยงวิกฤต (Critical)</span>
                <AlertTriangle className="w-4 h-4 text-rose-500" />
              </div>
              <div className="mt-1 text-2xl font-black text-rose-600 dark:text-rose-400 font-mono">
                {kpis.critical} <span className="text-xs font-bold text-slate-400">รายการ</span>
              </div>
              <div className="text-[10px] text-slate-500 font-bold mt-0.5">ของส่งช้ากว่าวันเริ่มประกอบ</div>
            </div>

            <div 
              onClick={() => setFilterLevel(prev => prev === 'WARNING' ? 'ALL' : 'WARNING')}
              className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                filterLevel === 'WARNING'
                  ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-500 ring-2 ring-amber-500/20'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-amber-300'
              }`}
            >
              <div className="flex items-center justify-between text-[11px] font-bold text-amber-600 dark:text-amber-400 uppercase">
                <span>🟡 เฝ้าระวัง (Buffer น้อย)</span>
                <Clock className="w-4 h-4 text-amber-500" />
              </div>
              <div className="mt-1 text-2xl font-black text-amber-600 dark:text-amber-400 font-mono">
                {kpis.warning} <span className="text-xs font-bold text-slate-400">รายการ</span>
              </div>
              <div className="text-[10px] text-slate-500 font-bold mt-0.5">มีเวลา Buffer ไม่เกิน 3 วัน</div>
            </div>

            <div 
              onClick={() => setFilterLevel(prev => prev === 'SAFE' ? 'ALL' : 'SAFE')}
              className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                filterLevel === 'SAFE'
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 ring-2 ring-emerald-500/20'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-emerald-300'
              }`}
            >
              <div className="flex items-center justify-between text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase">
                <span>🟢 ปลอดภัย (Safe)</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              </div>
              <div className="mt-1 text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
                {kpis.safe} <span className="text-xs font-bold text-slate-400">รายการ</span>
              </div>
              <div className="text-[10px] text-slate-500 font-bold mt-0.5">ทันกำหนดเริ่มประกอบ</div>
            </div>

            <div className="p-3.5 rounded-xl border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 uppercase">
                <span>📦 รับของแล้ว/อยู่ในสาย</span>
                <Truck className="w-4 h-4 text-blue-500" />
              </div>
              <div className="mt-1 text-2xl font-black text-slate-900 dark:text-white font-mono">
                {kpis.received} <span className="text-xs font-bold text-slate-400">รายการ</span>
              </div>
              <div className="text-[10px] text-slate-500 font-bold mt-0.5">พร้อมใช้งานแล้ว</div>
            </div>
          </div>

          {/* Filter & Search Bar */}
          <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-sm">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="ค้นหาชื่อพาร์ท, สเปค, ร้านค้า, Module..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-1.5 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl font-bold focus:ring-2 focus:ring-rose-500/20"
              />
            </div>

            {/* Filter pills */}
            <div className="flex items-center space-x-1 text-xs font-bold w-full sm:w-auto justify-end">
              {(['ALL', 'CRITICAL', 'WARNING', 'SAFE'] as const).map(lvl => (
                <button
                  key={lvl}
                  onClick={() => setFilterLevel(lvl)}
                  className={`px-3 py-1 rounded-lg transition-all ${
                    filterLevel === lvl
                      ? 'bg-rose-600 text-white shadow-sm font-extrabold'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  {lvl === 'ALL' ? 'ทั้งหมด' : lvl === 'CRITICAL' ? '🔴 เสี่ยงวิกฤต' : lvl === 'WARNING' ? '🟡 เฝ้าระวัง' : '🟢 ปลอดภัย'}
                </button>
              ))}
            </div>
          </div>

          {/* Table List */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="overflow-x-auto max-h-[calc(100vh-380px)] overflow-y-auto custom-scrollbar">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="sticky top-0 z-10 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-extrabold text-[11px]">
                  <tr className="divide-x divide-slate-200 dark:divide-slate-800">
                    <th className="px-3 py-2.5 w-10 text-center">#</th>
                    <th className="px-3 py-2.5 min-w-[200px]">ชื่อชิ้นส่วน & DWG</th>
                    <th className="px-3 py-2.5 min-w-[130px]">Module เป้าหมาย</th>
                    <th className="px-3 py-2.5 w-28 text-center">คาดการณ์ของส่งถึง</th>
                    <th className="px-3 py-2.5 w-28 text-center">วันเริ่มประกอบ</th>
                    <th className="px-3 py-2.5 w-28 text-center">Buffer / ดีเลย์</th>
                    <th className="px-3 py-2.5 min-w-[160px]">ระดับความเสี่ยง & ผลกระทบ</th>
                    <th className="px-3 py-2.5 w-20 text-center">แก้ไข</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredList.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-slate-400 font-medium">
                        ไม่พบรายการอะไหล่ตามเงื่อนไขที่เลือก
                      </td>
                    </tr>
                  ) : (
                    filteredList.map((item, idx) => (
                      <tr key={item.part.id} className="divide-x divide-slate-100 dark:divide-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="px-3 py-2.5 text-center font-mono text-slate-400 text-[10px]">{idx + 1}</td>
                        <td className="px-3 py-2.5">
                          <div className="font-extrabold text-slate-900 dark:text-white flex items-center">
                            {item.part.partName}
                            <span className="ml-1.5 px-1 py-0.2 rounded text-[9px] font-mono bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                              {item.part.partType}
                            </span>
                          </div>
                          <div className="text-[10px] font-mono text-slate-500">
                            {item.part.dwgNo || item.part.typeSpec || '-'} | ร้าน: {item.part.supplier || 'ยังไม่ระบุ'}
                          </div>
                        </td>
                        <td className="px-3 py-2.5">
                          {item.module ? (
                            <div className="font-bold text-slate-700 dark:text-slate-300 text-[11px]">
                              {item.module.code} - {item.module.name}
                            </div>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </td>
                        <td className="px-3 py-2.5 text-center font-mono font-bold text-slate-800 dark:text-slate-200">
                          {item.expectedArrivalDate}
                        </td>
                        <td className="px-3 py-2.5 text-center font-mono text-slate-600 dark:text-slate-400">
                          {item.assemblyStartDate}
                        </td>
                        <td className="px-3 py-2.5 text-center">
                          {item.riskLevel === 'RECEIVED' ? (
                            <span className="text-blue-600 font-bold text-[11px]">✓ ส่งถึงแล้ว</span>
                          ) : item.daysDiff < 0 ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-black bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300">
                              ดีเลย์ {Math.abs(item.daysDiff)} วัน
                            </span>
                          ) : item.daysDiff <= 3 ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                              + {item.daysDiff} วัน
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                              + {item.daysDiff} วัน
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-2.5">
                          <div className={`text-[11px] font-bold ${
                            item.riskLevel === 'CRITICAL' ? 'text-rose-600 dark:text-rose-400' :
                            item.riskLevel === 'WARNING' ? 'text-amber-600 dark:text-amber-400' :
                            item.riskLevel === 'RECEIVED' ? 'text-blue-600 dark:text-blue-400' :
                            'text-emerald-600 dark:text-emerald-400'
                          }`}>
                            {item.riskReason}
                          </div>
                        </td>
                        <td className="px-3 py-2.5 text-center">
                          {onEditPart && (
                            <button
                              onClick={() => onEditPart(item.part)}
                              title="แก้ไขวันนัดส่งมอบหรือข้อมูลชิ้นส่วน"
                              className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 rounded-lg transition-colors"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-3.5 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center text-xs">
          <span className="text-slate-500 font-bold">
            ตรวจพบความเสี่ยงวิกฤต: <span className="text-rose-600 font-black">{kpis.critical}</span> ชิ้น จากอะไหล่ทั้งหมด {parts.length} รายการ
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl shadow-md transition-colors"
          >
            ปิดหน้าต่าง
          </button>
        </div>

      </div>
    </div>
  );
};
