import React, { useState, useMemo } from 'react';
import { 
  X, 
  Printer, 
  CheckCircle2, 
  Clock, 
  Wrench, 
  Layers, 
  Sparkles, 
  Calendar, 
  User, 
  Check, 
  ChevronRight, 
  Tag, 
  Cpu, 
  QrCode, 
  FileText,
  Building2,
  FolderKanban,
  ClipboardList
} from 'lucide-react';
import { ProjectItem, ModuleItem, BomPartItem } from '../types/bom';

interface ShopFloorJobTravelerModalProps {
  isOpen: boolean;
  onClose: () => void;
  project?: ProjectItem;
  modules: ModuleItem[];
  parts: BomPartItem[];
  onUpdateModule?: (moduleId: string, data: Partial<ModuleItem>) => void;
}

interface RoutingStage {
  id: string;
  name: string;
  category: string;
  desc: string;
  defaultResponsible: string;
}

const ROUTING_STAGES: RoutingStage[] = [
  { 
    id: 'stage-1', 
    name: '1. งานกลึง & กัดโครงสร้าง (Machining / CNC / Laser)', 
    category: 'FABRICATION',
    desc: 'ตัดแผ่นเหล็ก/อลูมิเนียม มิลลิ่ง เจาะต๊าปเกลียว กลึงเพลา ตามแบบ Drawing',
    defaultResponsible: 'ช่างกลึง / ช่าง CNC'
  },
  { 
    id: 'stage-2', 
    name: '2. ชุบผิว & พ่นสี (Surface Finishing)', 
    category: 'COATING',
    desc: 'ชุบ Black Oxide, อโนไดซ์ (Anodize Clear/Black), ชุบ Nickel/Zinc, หรือทำสี Powder Coat',
    defaultResponsible: 'ซัพพลายเออร์ชุบผิว / แผนกสี'
  },
  { 
    id: 'stage-3', 
    name: '3. ประกอบกลไก (Mechanical Sub-Assembly)', 
    category: 'ASSEMBLY',
    desc: 'ติดตั้ง LM Guide, Ball Screw, สวม Bearing, ตั้งระดับและ Align เพลา/แกนขับ',
    defaultResponsible: 'ช่างประกอบกลไก (MC Lead)'
  },
  { 
    id: 'stage-4', 
    name: '4. ไวริ่งสายไฟ & ลม (Wiring & Pneumatics)', 
    category: 'ELECTRICAL',
    desc: 'ติดตั้งกระบอกลม Solenoid Valve, เดินรางสายไฟ Cable Chain, วายสายไฟ Sensor & Servo',
    defaultResponsible: 'ช่างไฟฟ้า & Automation'
  },
  { 
    id: 'stage-5', 
    name: '5. ทดสอบการเคลื่อนที่ & QC (Inspection & Dry Run)', 
    category: 'TESTING',
    desc: 'วัด Dimension, เช็ค Stroke การเคลื่อนที่, ทดสอบรั่วของลม, เซ็นต์ส่งมอบงาน',
    defaultResponsible: 'วิศวกรประจำโปรเจกต์ & QC'
  },
];

export const ShopFloorJobTravelerModal: React.FC<ShopFloorJobTravelerModalProps> = ({
  isOpen,
  onClose,
  project,
  modules,
  parts,
  onUpdateModule,
}) => {
  const [selectedModuleId, setSelectedModuleId] = useState<string>(modules[0]?.id || '');
  const [activeTab, setActiveTab] = useState<'interactive' | 'print-preview'>('interactive');

  // Stage progress state for the selected module (stored in memory or synced)
  const [stageProgress, setStageProgress] = useState<Record<string, { completed: boolean; signee: string; date: string }>>({});
  const [kittingChecked, setKittingChecked] = useState<Record<string, boolean>>({});

  const currentModule = useMemo(() => {
    return modules.find(m => m.id === selectedModuleId) || modules[0];
  }, [modules, selectedModuleId]);

  const moduleParts = useMemo(() => {
    if (!currentModule) return [];
    return parts.filter(p => p.moduleId === currentModule.id);
  }, [parts, currentModule]);

  // Group parts by category
  const mcParts = useMemo(() => moduleParts.filter(p => p.category === 'MC' || p.partType?.includes('Machining')), [moduleParts]);
  const standardParts = useMemo(() => moduleParts.filter(p => p.category !== 'MC' && !p.partType?.includes('Machining')), [moduleParts]);

  const handleToggleStage = (stageId: string, stageName: string) => {
    const isCurrentlyDone = !!stageProgress[stageId]?.completed;
    const now = new Date();
    const dateStr = now.toLocaleDateString('th-TH', { year: '2-digit', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

    const newProgress = {
      ...stageProgress,
      [stageId]: {
        completed: !isCurrentlyDone,
        signee: isCurrentlyDone ? '' : (currentModule?.responsibleEngineer || 'ช่างหน้างาน'),
        date: isCurrentlyDone ? '' : dateStr,
      }
    };
    setStageProgress(newProgress);

    // Sync to module stage if completed
    if (!isCurrentlyDone && onUpdateModule && currentModule) {
      onUpdateModule(currentModule.id, {
        currentStage: stageName as any,
      });
    }
  };

  const handleToggleKittingItem = (partId: string) => {
    setKittingChecked(prev => ({
      ...prev,
      [partId]: !prev[partId]
    }));
  };

  const completedStagesCount = useMemo(() => {
    return ROUTING_STAGES.filter(s => stageProgress[s.id]?.completed).length;
  }, [stageProgress]);

  const progressPercent = Math.round((completedStagesCount / ROUTING_STAGES.length) * 100);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200 print:p-0 print:bg-white">
      <div 
        className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 print:shadow-none print:border-none print:max-h-none print:max-w-none print:rounded-none"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ─── Modal Header (Hidden on Print) ─── */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-900/70 print:hidden">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 text-white flex items-center justify-center shadow-lg shadow-orange-500/20">
              <ClipboardList className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                ใบสั่งผลิตและควบคุมขั้นตอน (Shop Floor Job Traveler)
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 font-bold border border-amber-300 dark:border-amber-800">
                  {currentModule?.code || 'WO-TRAVELER'}
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                ใบสั่งงานประจำโมดูล คุมลำดับงานกลึง งานประกอบ ไวริ่งสายไฟ และเช็กลิสต์ช่าง
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* View Switcher Pill */}
            <div className="flex bg-slate-200/80 dark:bg-slate-800 p-0.5 rounded-xl text-xs font-bold mr-2">
              <button
                onClick={() => setActiveTab('interactive')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  activeTab === 'interactive' 
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm' 
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                หน้าจอช่าง (Tablet)
              </button>
              <button
                onClick={() => setActiveTab('print-preview')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  activeTab === 'print-preview' 
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm' 
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                แบบพิมพ์ A4
              </button>
            </div>

            <button
              onClick={() => window.print()}
              className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center space-x-1.5 shadow-sm transition-all"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>พิมพ์ใบงาน (Print)</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ─── Module Selector Strip (Hidden on Print) ─── */}
        <div className="px-6 py-2.5 bg-slate-100/70 dark:bg-slate-950/60 border-b border-slate-200 dark:border-slate-800 flex items-center space-x-2 overflow-x-auto no-scrollbar print:hidden">
          <span className="text-xs font-bold text-slate-500 shrink-0">เลือกโมดูล:</span>
          {modules.map((m) => {
            const isSelected = m.id === currentModule?.id;
            return (
              <button
                key={m.id}
                onClick={() => setSelectedModuleId(m.id)}
                className={`px-3 py-1 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center space-x-1.5 ${
                  isSelected
                    ? 'bg-orange-500 text-white shadow-sm shadow-orange-500/30'
                    : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 border border-slate-200 dark:border-slate-800'
                }`}
              >
                <Layers className="w-3 h-3" />
                <span>[{m.code}] {m.name}</span>
              </button>
            );
          })}
        </div>

        {/* ─── Modal Body ─── */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 custom-scrollbar print:p-0 print:overflow-visible">
          
          {/* ══════════════════════════════════════════════════════ */}
          {/* VIEW 1: INTERACTIVE TABLET CHECK-IN MODE               */}
          {/* ══════════════════════════════════════════════════════ */}
          {activeTab === 'interactive' && (
            <div className="space-y-6 print:hidden">
              
              {/* Module Overview Banner */}
              <div className="p-5 rounded-2xl bg-gradient-to-r from-orange-50 via-amber-50 to-white dark:from-orange-950/20 dark:via-amber-950/10 dark:to-slate-900 border border-orange-200 dark:border-orange-900/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-black font-mono px-2 py-0.5 rounded-lg bg-orange-600 text-white">
                      {project?.code || 'PRJ'} • {currentModule?.code}
                    </span>
                    <span className="text-xs text-slate-500">DWG: {currentModule?.dwgNo || '-'}</span>
                  </div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white mt-1">
                    {currentModule?.name}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    ลูกค้า: <strong className="text-slate-700 dark:text-slate-200">{project?.customer || '-'}</strong> | วิศวกร: <strong className="text-slate-700 dark:text-slate-200">{currentModule?.responsibleEngineer || 'วิศวกรโครงการ'}</strong>
                  </p>
                </div>

                {/* Overall Progress Gauge */}
                <div className="flex items-center space-x-3 bg-white dark:bg-slate-900 p-3 rounded-2xl border border-orange-100 dark:border-orange-900/30 shadow-sm shrink-0">
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 block font-bold uppercase">ความคืบหน้าการผลิต</span>
                    <span className="text-lg font-black text-orange-600 dark:text-orange-400 font-mono">
                      {completedStagesCount} / {ROUTING_STAGES.length} ขั้นตอน
                    </span>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-orange-100 dark:bg-orange-950 flex items-center justify-center font-black text-xs font-mono text-orange-600">
                    {progressPercent}%
                  </div>
                </div>
              </div>

              {/* 5 Production Routing Steps */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Wrench className="w-3.5 h-3.5 text-orange-500" />
                  ลำดับขั้นตอนการผลิตและประกอบ (Production Routing Pipeline)
                </h4>

                <div className="space-y-2.5">
                  {ROUTING_STAGES.map((stage, idx) => {
                    const status = stageProgress[stage.id];
                    const isDone = !!status?.completed;

                    return (
                      <div
                        key={stage.id}
                        className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
                          isDone
                            ? 'bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/60'
                            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-orange-200'
                        }`}
                      >
                        <div className="flex items-start space-x-3.5 min-w-0">
                          <button
                            onClick={() => handleToggleStage(stage.id, stage.name)}
                            className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-transform active:scale-90 ${
                              isDone
                                ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/25'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-400 hover:bg-orange-100 hover:text-orange-600 border border-slate-200 dark:border-slate-700'
                            }`}
                          >
                            {isDone ? <Check className="w-5 h-5 stroke-[3]" /> : <span className="text-xs font-black font-mono">{idx + 1}</span>}
                          </button>

                          <div className="min-w-0">
                            <div className="flex items-center space-x-2">
                              <span className={`text-xs font-bold ${isDone ? 'text-emerald-900 dark:text-emerald-200 line-through' : 'text-slate-900 dark:text-slate-100'}`}>
                                {stage.name}
                              </span>
                              <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 font-bold">
                                {stage.category}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-400 mt-0.5">
                              {stage.desc}
                            </p>
                            {isDone && status?.signee && (
                              <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold mt-1 flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3" />
                                รับรองแล้วโดย: {status.signee} ({status.date})
                              </p>
                            )}
                          </div>
                        </div>

                        <button
                          onClick={() => handleToggleStage(stage.id, stage.name)}
                          className={`px-3 py-1.5 rounded-xl font-bold text-xs shrink-0 transition-all flex items-center space-x-1.5 ${
                            isDone
                              ? 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-rose-100 hover:text-rose-600'
                              : 'bg-orange-600 hover:bg-orange-700 text-white shadow-sm shadow-orange-600/20'
                          }`}
                        >
                          {isDone ? (
                            <span>ยกเลิกสเตจนี้</span>
                          ) : (
                            <>
                              <Check className="w-3.5 h-3.5" />
                              <span>ช่างลงชื่อผ่านสเตจนี้</span>
                            </>
                          )}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Module Parts Checklist */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-blue-500" />
                    รายการพาร์ทและชิ้นงานของโมดูลนี้ ({moduleParts.length} รายการ)
                  </h4>
                  <span className="text-xs text-slate-400">
                    งานกลึง: <strong>{mcParts.length}</strong> | ซื้อมาตรฐาน: <strong>{standardParts.length}</strong>
                  </span>
                </div>

                <div className="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
                  {moduleParts.length === 0 ? (
                    <div className="p-8 text-center text-slate-400 text-xs">
                      ยังไม่มีรายการพาร์ทในโมดูลนี้
                    </div>
                  ) : (
                    moduleParts.map((p) => {
                      const isChecked = !!kittingChecked[p.id];
                      return (
                        <div
                          key={p.id}
                          className={`p-3 transition-colors flex items-center justify-between gap-3 ${
                            isChecked 
                              ? 'bg-emerald-50/40 dark:bg-emerald-950/10' 
                              : 'bg-white dark:bg-slate-900/60 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                          }`}
                        >
                          <div className="flex items-center space-x-3 min-w-0">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => handleToggleKittingItem(p.id)}
                              className="w-4 h-4 rounded text-orange-600 border-slate-300 focus:ring-orange-500 cursor-pointer shrink-0"
                            />
                            <div className="min-w-0">
                              <div className="flex items-center space-x-2">
                                <span className="font-mono text-xs font-bold text-slate-500">#{p.itemNo}</span>
                                <span className={`text-xs font-bold ${isChecked ? 'line-through text-slate-400' : 'text-slate-800 dark:text-slate-200'}`}>
                                  {p.partName}
                                </span>
                                {p.dwgNo && (
                                  <span className="font-mono text-[10px] text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-1.5 py-0.2 rounded border border-blue-200 dark:border-blue-900">
                                    DWG: {p.dwgNo}
                                  </span>
                                )}
                              </div>
                              <p className="text-[10px] text-slate-400 truncate mt-0.5">
                                Spec: {p.typeSpec || '-'} | Maker: {p.maker || '-'} | Location: {p.storeLocation || 'สโตร์กลาง'}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center space-x-3 shrink-0 text-right">
                            <div className="font-mono text-xs font-black text-slate-800 dark:text-slate-200">
                              {p.qty} {p.unit}
                            </div>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              p.category === 'MC' 
                                ? 'bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300' 
                                : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                            }`}>
                              {p.category}
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

            </div>
          )}

          {/* ══════════════════════════════════════════════════════ */}
          {/* VIEW 2: A4 PRINTABLE JOB TRAVELER SHEET               */}
          {/* ══════════════════════════════════════════════════════ */}
          <div className={`${activeTab === 'print-preview' ? 'block' : 'hidden print:block'} print:w-full`}>
            
            {/* ─── A4 PAPER CONTAINER ─── */}
            <div className="bg-white text-slate-900 border border-slate-300 p-8 rounded-2xl shadow-sm space-y-6 print:border-none print:p-0 print:shadow-none print:rounded-none">
              
              {/* Header Box */}
              <div className="border-b-2 border-slate-900 pb-4 flex items-start justify-between">
                <div>
                  <div className="flex items-center space-x-2">
                    <img src="/logo.png" alt="WARSGATE" className="h-7 object-contain" />
                    <span className="text-lg font-black tracking-wide">WARSGATE AUTOMATION CO., LTD.</span>
                  </div>
                  <h1 className="text-xl font-black mt-2 tracking-tight text-slate-900">
                    SHOP FLOOR JOB TRAVELER (ใบสั่งผลิตและควบคุมขั้นตอน)
                  </h1>
                  <p className="text-xs text-slate-600 font-mono">
                    PROJECT CODE: <strong className="text-slate-900">[{project?.code}] {project?.name}</strong>
                  </p>
                </div>

                <div className="text-right">
                  <div className="inline-block p-2 border-2 border-slate-900 rounded-xl text-center">
                    <span className="text-[10px] font-bold block text-slate-500 uppercase">MODULE ROUTING CODE</span>
                    <span className="text-base font-black font-mono">{currentModule?.code}</span>
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono mt-1">
                    พิมพ์เมื่อ: {new Date().toLocaleDateString('th-TH')}
                  </div>
                </div>
              </div>

              {/* Module Metadata Box */}
              <div className="grid grid-cols-3 gap-3 p-3 bg-slate-50 border border-slate-300 rounded-xl text-xs">
                <div>
                  <span className="text-slate-500 block text-[10px]">ชื่อโมดูล (Module Name)</span>
                  <span className="font-bold">{currentModule?.name}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">Drawing No.</span>
                  <span className="font-bold font-mono">{currentModule?.dwgNo || '-'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">ลูกค้า (Customer)</span>
                  <span className="font-bold">{project?.customer || '-'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">วิศวกรผู้รับผิดชอบ</span>
                  <span className="font-bold">{currentModule?.responsibleEngineer || '-'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">กำหนดส่งมอบ (Target Date)</span>
                  <span className="font-bold font-mono">{project?.targetDeliveryDate || '-'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">จำนวนชิ้นส่วนทั้งหมด</span>
                  <span className="font-bold font-mono">{moduleParts.length} รายการ</span>
                </div>
              </div>

              {/* Production Routing Signature Table */}
              <div>
                <h3 className="text-xs font-black uppercase tracking-wider mb-2 border-b border-slate-400 pb-1">
                  1. ตารางลงนามขั้นตอนการผลิต (Production Routing Sign-off)
                </h3>
                <table className="w-full text-xs border-collapse border border-slate-400">
                  <thead>
                    <tr className="bg-slate-100 text-slate-800">
                      <th className="border border-slate-400 p-2 text-center w-12">ลำดับ</th>
                      <th className="border border-slate-400 p-2 text-left">ขั้นตอนงาน (Routing Operation)</th>
                      <th className="border border-slate-400 p-2 text-left w-36">ผู้รับผิดชอบ</th>
                      <th className="border border-slate-400 p-2 text-center w-28">วันที่เสร็จ</th>
                      <th className="border border-slate-400 p-2 text-center w-28">ลายเซ็นช่าง</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ROUTING_STAGES.map((s, idx) => (
                      <tr key={s.id} className="h-10">
                        <td className="border border-slate-400 p-2 text-center font-bold font-mono">{idx + 1}</td>
                        <td className="border border-slate-400 p-2">
                          <span className="font-bold block">{s.name}</span>
                          <span className="text-[10px] text-slate-500">{s.desc}</span>
                        </td>
                        <td className="border border-slate-400 p-2 text-slate-700">{s.defaultResponsible}</td>
                        <td className="border border-slate-400 p-2 text-center font-mono">
                          {stageProgress[s.id]?.date || '___/___/___'}
                        </td>
                        <td className="border border-slate-400 p-2 text-center">
                          {stageProgress[s.id]?.completed ? (
                            <span className="font-bold text-emerald-700 font-mono text-[10px]">PASS: {stageProgress[s.id]?.signee}</span>
                          ) : (
                            <span className="text-slate-300 font-mono">...............</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* BOM Parts Checklist Table */}
              <div>
                <h3 className="text-xs font-black uppercase tracking-wider mb-2 border-b border-slate-400 pb-1 flex justify-between items-center">
                  <span>2. รายการชิ้นส่วนที่ต้องใช้ประกอบ (BOM Part Verification)</span>
                  <span className="text-[10px] font-normal text-slate-500">ติ๊กช่อง [ ✔ ] เมื่อได้รับชิ้นส่วนเข้าชุดประกอบ</span>
                </h3>

                <table className="w-full text-[11px] border-collapse border border-slate-400">
                  <thead>
                    <tr className="bg-slate-100 text-slate-800">
                      <th className="border border-slate-400 p-1.5 text-center w-10">ตรวจ</th>
                      <th className="border border-slate-400 p-1.5 text-center w-10">Item</th>
                      <th className="border border-slate-400 p-1.5 text-left">Drawing No. / รหัสพาร์ท</th>
                      <th className="border border-slate-400 p-1.5 text-left">ชื่อชิ้นส่วน (Part Name)</th>
                      <th className="border border-slate-400 p-1.5 text-left">Spec / รายละเอียด</th>
                      <th className="border border-slate-400 p-1.5 text-center w-16">จำนวน</th>
                      <th className="border border-slate-400 p-1.5 text-left w-24">Location สโตร์</th>
                    </tr>
                  </thead>
                  <tbody>
                    {moduleParts.map((p) => (
                      <tr key={p.id}>
                        <td className="border border-slate-400 p-1.5 text-center">
                          <div className="w-3.5 h-3.5 border border-slate-600 rounded mx-auto"></div>
                        </td>
                        <td className="border border-slate-400 p-1.5 text-center font-mono">{p.itemNo}</td>
                        <td className="border border-slate-400 p-1.5 font-mono font-bold text-slate-800">{p.dwgNo || '-'}</td>
                        <td className="border border-slate-400 p-1.5 font-bold">{p.partName}</td>
                        <td className="border border-slate-400 p-1.5 text-slate-600 text-[10px]">{p.typeSpec || '-'}</td>
                        <td className="border border-slate-400 p-1.5 text-center font-bold font-mono">{p.qty} {p.unit}</td>
                        <td className="border border-slate-400 p-1.5 text-slate-500 text-[10px]">{p.storeLocation || 'สโตร์'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Sign-off Bottom Footer */}
              <div className="pt-6 grid grid-cols-3 gap-6 text-xs text-center">
                <div className="border-t border-slate-400 pt-2">
                  <div className="h-8"></div>
                  <span className="font-bold block">ผู้จ่ายอะไหล่ (Store / Kitting)</span>
                  <span className="text-[10px] text-slate-500">วันที่: ......./......./.......</span>
                </div>
                <div className="border-t border-slate-400 pt-2">
                  <div className="h-8"></div>
                  <span className="font-bold block">หัวหน้าช่างประกอบ (Assembly Lead)</span>
                  <span className="text-[10px] text-slate-500">วันที่: ......./......./.......</span>
                </div>
                <div className="border-t border-slate-400 pt-2">
                  <div className="h-8"></div>
                  <span className="font-bold block">วิศวกรผู้ตรวจรับ (QA / Project Engineer)</span>
                  <span className="text-[10px] text-slate-500">วันที่: ......./......./.......</span>
                </div>
              </div>

            </div>

          </div>

        </div>

        {/* ─── Footer (Hidden on Print) ─── */}
        <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80 flex items-center justify-between print:hidden">
          <div className="flex items-center space-x-2 text-xs text-slate-500">
            <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse"></span>
            <span>Job Traveler v1.0 • พร้อมปริ้นต์ A4 และบันทึกผลงานลงระบบ</span>
          </div>

          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 font-bold text-xs text-slate-700 dark:text-slate-300 transition-colors"
          >
            ปิดหน้าต่าง
          </button>
        </div>

      </div>
    </div>
  );
};
