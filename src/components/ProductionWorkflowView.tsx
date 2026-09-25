import React, { useState, useMemo } from 'react';
import { 
  CheckCircle2, 
  Clock, 
  ArrowRight, 
  ArrowLeft,
  Layers, 
  User, 
  Truck, 
  Wrench, 
  Zap, 
  Play,
  ChevronRight,
  PackageCheck,
  Building,
  Settings,
  Plus,
  Search,
  Filter,
  Columns,
  LayoutGrid,
  ExternalLink,
  ChevronDown,
  Tag
} from 'lucide-react';
import { BomPartItem, CategoryType, MachineWorkflowStage, ModuleItem, PartStatus, ProjectItem } from '../types/bom';
import { formatCurrency } from '../utils/costCalculator';

interface ProductionWorkflowViewProps {
  project?: ProjectItem;
  modules: ModuleItem[];
  parts: BomPartItem[];
  onUpdatePartStage: (partId: string, stage: MachineWorkflowStage) => void;
  onEditPart: (part: BomPartItem) => void;
}

export const WORKFLOW_STAGES: { id: MachineWorkflowStage; title: string; stepNum: number; color: string; bgBadge: string }[] = [
  { id: '1. Design (DS,EE,PG)', title: '1. Design (DS,EE,PG)', stepNum: 1, color: 'bg-blue-600', bgBadge: 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300' },
  { id: '2. BOM Part List', title: '2. BOM Part List', stepNum: 2, color: 'bg-indigo-600', bgBadge: 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300' },
  { id: '3. Procurement (STD,FEB)', title: '3. สั่งซื้อของ (STD/FEB)', stepNum: 3, color: 'bg-amber-600', bgBadge: 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300' },
  { id: '4. Assembly', title: '4. ประกอบเครื่อง', stepNum: 4, color: 'bg-sky-600', bgBadge: 'bg-sky-100 dark:bg-sky-900/40 text-sky-700 dark:text-sky-300' },
  { id: '5. Testing', title: '5. ปรับตั้ง & ทดสอบ', stepNum: 5, color: 'bg-purple-600', bgBadge: 'bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300' },
  { id: '6. BuyOff', title: '6. ตรวจรับ (BuyOff)', stepNum: 6, color: 'bg-emerald-600', bgBadge: 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300' },
  { id: '7. Packing', title: '7. แพ็คเกจจิ้ง (Packing)', stepNum: 7, color: 'bg-teal-600', bgBadge: 'bg-teal-100 dark:bg-teal-900/40 text-teal-700 dark:text-teal-300' },
  { id: '8. Install & Service', title: '8. ติดตั้ง & ส่งมอบ', stepNum: 8, color: 'bg-rose-600', bgBadge: 'bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300' },
  { id: '9. Others', title: '9. อื่น ๆ (Others)', stepNum: 9, color: 'bg-slate-600', bgBadge: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300' },
];

const STATUS_CONFIG: Record<PartStatus, { label: string; color: string }> = {
  'Planned': { label: 'วางแผน', color: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-300' },
  'Ordered': { label: 'สั่งซื้อแล้ว', color: 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-300' },
  'Received': { label: 'รับของแล้ว', color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-300' },
  'In Assembly': { label: 'กำลังประกอบ', color: 'bg-sky-100 text-sky-800 dark:bg-sky-950/60 dark:text-sky-300 border-sky-300' },
  'Completed': { label: 'เสร็จสมบูรณ์', color: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300 border-indigo-300' },
};

export const ProductionWorkflowView: React.FC<ProductionWorkflowViewProps> = ({
  project,
  modules,
  parts,
  onUpdatePartStage,
  onEditPart,
}) => {
  const [selectedStageFilter, setSelectedStageFilter] = useState<string>('ALL');
  const [selectedModuleId, setSelectedModuleId] = useState<string>('ALL');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [viewLayout, setViewLayout] = useState<'grid' | 'board'>('grid');

  // Filter parts based on user inputs
  const filteredParts = useMemo(() => {
    return parts.filter(p => {
      // Module filter
      if (selectedModuleId !== 'ALL' && p.moduleId !== selectedModuleId) return false;
      // Category filter
      if (selectedCategory !== 'ALL' && p.category !== selectedCategory) return false;
      // Status filter
      if (selectedStatus !== 'ALL' && p.status !== selectedStatus) return false;
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const nameMatch = p.partName.toLowerCase().includes(q);
        const specMatch = (p.typeSpec || '').toLowerCase().includes(q);
        const makerMatch = (p.maker || '').toLowerCase().includes(q);
        const suppMatch = (p.supplier || '').toLowerCase().includes(q);
        const dwgMatch = (p.dwgNo || '').toLowerCase().includes(q);
        const itemMatch = String(p.itemNo).includes(q);
        if (!nameMatch && !specMatch && !makerMatch && !suppMatch && !dwgMatch && !itemMatch) {
          return false;
        }
      }
      return true;
    });
  }, [parts, selectedModuleId, selectedCategory, selectedStatus, searchQuery]);

  // Calculate statistics per stage
  const stageStats = useMemo(() => {
    const map: Record<string, { count: number; totalCost: number; parts: BomPartItem[] }> = {};
    WORKFLOW_STAGES.forEach(s => {
      map[s.id] = { count: 0, totalCost: 0, parts: [] };
    });

    filteredParts.forEach(p => {
      const stage = p.workflowStage || '2. BOM Part List';
      if (!map[stage]) {
        map[stage] = { count: 0, totalCost: 0, parts: [] };
      }
      map[stage].count += 1;
      map[stage].totalCost += p.totalAmount || (p.qty * p.unitPrice);
      map[stage].parts.push(p);
    });

    return map;
  }, [filteredParts]);

  // Overall totals
  const overallStats = useMemo(() => {
    const totalParts = parts.length;
    const totalCost = parts.reduce((sum, p) => sum + (p.totalAmount || (p.qty * p.unitPrice)), 0);
    const completedParts = parts.filter(p => p.workflowStage === '8. Install & Service' || p.workflowStage === '9. Others' || p.status === 'Completed').length;
    const percentDone = totalParts > 0 ? Math.round((completedParts / totalParts) * 100) : 0;
    return { totalParts, totalCost, completedParts, percentDone };
  }, [parts]);

  // Advance to next stage
  const handleAdvanceStage = (part: BomPartItem) => {
    const currentStage = part.workflowStage || '2. BOM Part List';
    const currentIndex = WORKFLOW_STAGES.findIndex(s => s.id === currentStage);
    if (currentIndex < WORKFLOW_STAGES.length - 1) {
      const nextStage = WORKFLOW_STAGES[currentIndex + 1].id;
      onUpdatePartStage(part.id, nextStage);
    }
  };

  // Move back to previous stage
  const handlePreviousStage = (part: BomPartItem) => {
    const currentStage = part.workflowStage || '2. BOM Part List';
    const currentIndex = WORKFLOW_STAGES.findIndex(s => s.id === currentStage);
    if (currentIndex > 0) {
      const prevStage = WORKFLOW_STAGES[currentIndex - 1].id;
      onUpdatePartStage(part.id, prevStage);
    }
  };

  return (
    <div className="space-y-4">
      
      {/* 1. Header Banner & Machine Building Pipeline Progress */}
      <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
          <div>
            <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-blue-100 dark:bg-blue-500/20 text-blue-800 dark:text-blue-300 mb-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse"></span>
              <span>Machine Building Production Workflow</span>
            </div>
            <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
              <span>แผนงานการผลิตเครื่องจักร 9 ขั้นตอน [{project?.code || 'PRJ'}]</span>
              <span className="text-blue-600 dark:text-blue-400">{project?.name}</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              ผูกข้อมูลชิ้นส่วน Part List เข้ากับลำดับขั้นตอนผลิต ปรับตั้ง และส่งมอบเครื่องจักร พร้อมจัดการกระบวนการแบบเรียลไทม์
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
              <span className="text-slate-500 font-bold mr-1.5">ลูกค้า:</span>
              <span className="font-black text-slate-900 dark:text-white">{project?.customer || '-'}</span>
            </div>

            <div className="px-3 py-1.5 bg-blue-50 dark:bg-blue-950/60 rounded-xl border border-blue-200 dark:border-blue-900 text-xs flex items-center space-x-2">
              <span className="text-blue-700 dark:text-blue-300 font-bold">ความคืบหน้ารวม:</span>
              <span className="font-black font-mono text-blue-900 dark:text-blue-200">{overallStats.percentDone}%</span>
              <span className="text-[10px] text-blue-600 dark:text-blue-400 font-medium">({overallStats.completedParts}/{overallStats.totalParts} ชิ้น)</span>
            </div>

            <div className="flex items-center space-x-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
              <button
                onClick={() => setViewLayout('grid')}
                className={`p-1.5 rounded-lg transition-all ${viewLayout === 'grid' ? 'bg-white dark:bg-slate-700 text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'}`}
                title="มุมมองแบบตาราง 3 คอลัมน์ (Grid View)"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewLayout('board')}
                className={`p-1.5 rounded-lg transition-all ${viewLayout === 'board' ? 'bg-white dark:bg-slate-700 text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'}`}
                title="มุมมองแบบบอร์ดคานบันเต็มหน้าจอ (Kanban Board)"
              >
                <Columns className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* 9-Stage Stepper Sequence Bar */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 overflow-x-auto pb-1">
          <div className="flex items-center min-w-max space-x-1 text-xs">
            <button
              onClick={() => setSelectedStageFilter('ALL')}
              className={`flex items-center space-x-1 px-3 py-1.5 rounded-xl border font-bold text-xs transition-all ${
                selectedStageFilter === 'ALL'
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 border-slate-900 shadow-sm'
                  : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100'
              }`}
            >
              <span>ทั้งหมด</span>
              <span className="ml-1 px-1.5 py-0.2 rounded text-[10px] font-mono font-black bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100">
                {filteredParts.length}
              </span>
            </button>

            <ChevronRight className="w-3.5 h-3.5 text-slate-300 dark:text-slate-700 flex-shrink-0" />

            {WORKFLOW_STAGES.map((s, idx) => {
              const count = stageStats[s.id]?.count || 0;
              const isSelected = selectedStageFilter === s.id;

              return (
                <React.Fragment key={s.id}>
                  <button
                    onClick={() => setSelectedStageFilter(isSelected ? 'ALL' : s.id)}
                    className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-xl border transition-all ${
                      isSelected
                        ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 border-slate-900 shadow-sm scale-105'
                        : count > 0
                        ? 'bg-slate-50 dark:bg-slate-950 border-slate-300 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'
                        : 'bg-slate-50/50 dark:bg-slate-950/50 border-slate-200 dark:border-slate-800/60 text-slate-400'
                    }`}
                  >
                    <span className={`w-4 h-4 rounded-full text-[10px] font-black text-white flex items-center justify-center ${s.color}`}>
                      {s.stepNum}
                    </span>
                    <span className="font-bold text-[11px] whitespace-nowrap">{s.title}</span>
                    <span className={`px-1.5 py-0.2 rounded text-[10px] font-mono font-black ${
                      count > 0 ? 'bg-blue-100 text-blue-900 dark:bg-blue-950 dark:text-blue-200' : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                    }`}>
                      {count}
                    </span>
                  </button>

                  {idx < WORKFLOW_STAGES.length - 1 && (
                    <ChevronRight className="w-3.5 h-3.5 text-slate-300 dark:text-slate-700 flex-shrink-0" />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* 2. Filter & Search Controls */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex flex-wrap items-center gap-2 flex-1">
            {/* Search Input */}
            <div className="relative min-w-[200px] flex-1 max-w-sm">
              <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="ค้นหาชื่อชิ้นส่วน, สเปก, ยี่ห้อ, รหัส..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white placeholder:text-slate-400"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 text-xs font-bold"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Module Filter */}
            <select
              value={selectedModuleId}
              onChange={(e) => setSelectedModuleId(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">โมดูลทั้งหมด ({modules.length})</option>
              {modules.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.code} - {m.name}
                </option>
              ))}
            </select>

            {/* Category Filter */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">หมวดหมู่ทั้งหมด (MC / EE)</option>
              <option value="MC">MC - Mechanical</option>
              <option value="EE">EE - Electrical</option>
            </select>

            {/* Status Filter */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">สถานะจัดซื้อทั้งหมด</option>
              <option value="Planned">Planned (วางแผน)</option>
              <option value="Ordered">Ordered (สั่งซื้อแล้ว)</option>
              <option value="Received">Received (รับของแล้ว)</option>
              <option value="In Assembly">In Assembly (กำลังประกอบ)</option>
              <option value="Completed">Completed (เสร็จสมบูรณ์)</option>
            </select>

            {(selectedModuleId !== 'ALL' || selectedCategory !== 'ALL' || selectedStatus !== 'ALL' || searchQuery) && (
              <button
                onClick={() => {
                  setSelectedModuleId('ALL');
                  setSelectedCategory('ALL');
                  setSelectedStatus('ALL');
                  setSearchQuery('');
                  setSelectedStageFilter('ALL');
                }}
                className="px-2.5 py-1.5 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-300 rounded-xl text-xs font-bold border border-rose-200 dark:border-rose-900/50 hover:bg-rose-100 transition-all"
              >
                ล้างตัวกรอง
              </button>
            )}
          </div>

          <div className="text-xs font-mono font-bold text-slate-500">
            แสดง <span className="font-black text-slate-900 dark:text-white">{filteredParts.length}</span> จากทั้งหมด {parts.length} รายการ
          </div>
        </div>
      </div>

      {/* 3. Main 9-Stage Production Kanban & Stage Grid */}
      <div className={
        viewLayout === 'board'
          ? "flex space-x-4 overflow-x-auto pb-4 pt-1 items-start min-h-[550px]"
          : "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
      }>
        {WORKFLOW_STAGES.filter(s => selectedStageFilter === 'ALL' || selectedStageFilter === s.id).map((stage) => {
          const stageData = stageStats[stage.id] || { count: 0, totalCost: 0, parts: [] };
          const stageParts = stageData.parts;

          return (
            <div
              key={stage.id}
              className={`rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm flex flex-col justify-between transition-all ${
                viewLayout === 'board' ? 'w-[320px] flex-shrink-0 min-h-[500px]' : ''
              }`}
            >
              
              {/* Stage Column Header */}
              <div className="p-3 bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className={`w-5 h-5 rounded-lg text-xs font-black text-white flex items-center justify-center ${stage.color}`}>
                    {stage.stepNum}
                  </span>
                  <h3 className="text-xs font-black text-slate-900 dark:text-white">{stage.title}</h3>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-black bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200">
                  {stageData.count} รายการ
                </span>
              </div>

              {/* Stage Parts Cards Stream */}
              <div className="p-3 space-y-2.5 flex-1 max-h-[540px] overflow-y-auto">
                {stageParts.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 text-xs font-medium border-2 border-dashed border-slate-100 dark:border-slate-800/80 rounded-xl">
                    ไม่มีรายการ Part ในขั้นตอนนี้
                  </div>
                ) : (
                  stageParts.map((part) => {
                    const mod = modules.find(m => m.id === part.moduleId);
                    const statusConf = STATUS_CONFIG[part.status] || STATUS_CONFIG['Planned'];
                    const currentStageIdx = WORKFLOW_STAGES.findIndex(s => s.id === (part.workflowStage || '2. BOM Part List'));

                    return (
                      <div
                        key={part.id}
                        className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 hover:border-blue-400 dark:hover:border-blue-600 shadow-sm hover:shadow-md transition-all space-y-2 group"
                      >
                        {/* Card Header */}
                        <div className="flex justify-between items-start gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center flex-wrap gap-1 mb-1">
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                                #{part.itemNo}
                              </span>
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-blue-50 dark:bg-blue-950 text-blue-800 dark:text-blue-300 truncate max-w-[120px]" title={mod?.name}>
                                {mod?.code || 'MOD'}
                              </span>
                              <span className={`px-1.5 py-0.2 rounded text-[9px] font-black ${
                                part.category === 'MC' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-200' : 'bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-200'
                              }`}>
                                {part.category}
                              </span>
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                                {part.partType === 'Feb Part' ? 'FEB' : 'STD'}
                              </span>
                            </div>

                            <h4 
                              onClick={() => onEditPart(part)}
                              className="text-xs font-black text-slate-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer line-clamp-2 leading-snug"
                              title="คลิกเพื่อแก้ไขข้อมูล Part"
                            >
                              {part.partName}
                            </h4>

                            {part.typeSpec && (
                              <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate mt-0.5 font-mono">
                                Spec: {part.typeSpec}
                              </p>
                            )}
                          </div>

                          <div className="text-right flex-shrink-0">
                            <div className="text-xs font-mono font-black text-slate-900 dark:text-white">
                              {formatCurrency(part.totalAmount || (part.qty * part.unitPrice))}
                            </div>
                            <div className="text-[9px] font-mono text-slate-400">
                              @{formatCurrency(part.unitPrice)}
                            </div>
                          </div>
                        </div>

                        {/* Part Details: Maker, Supplier, Qty & Status */}
                        <div className="flex items-center justify-between text-[10px] text-slate-500 font-medium pt-1 border-t border-slate-100 dark:border-slate-900">
                          <div className="flex items-center space-x-1.5 truncate mr-1">
                            <span className="font-bold text-slate-700 dark:text-slate-300">
                              {part.qty} {part.unit}
                            </span>
                            {part.maker && (
                              <span className="text-[9px] text-slate-400 truncate max-w-[80px]" title={part.maker}>
                                • {part.maker}
                              </span>
                            )}
                          </div>

                          <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold border ${statusConf.color}`}>
                            {statusConf.label}
                          </span>
                        </div>

                        {/* Stage Controls: Previous, Fast Dropdown, Next */}
                        <div className="flex items-center justify-between gap-1.5 pt-1.5 border-t border-slate-100 dark:border-slate-900">
                          <button
                            onClick={() => handlePreviousStage(part)}
                            disabled={currentStageIdx <= 0}
                            className={`p-1 rounded-lg text-[10px] font-bold border transition-all flex items-center ${
                              currentStageIdx > 0
                                ? 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                                : 'opacity-30 cursor-not-allowed bg-slate-50 dark:bg-slate-900 text-slate-400 border-transparent'
                            }`}
                            title="ย้ายกลับขั้นตอนก่อนหน้า"
                          >
                            <ArrowLeft className="w-3 h-3" />
                          </button>

                          {/* Quick Stage Dropdown */}
                          <select
                            value={part.workflowStage || '2. BOM Part List'}
                            onChange={(e) => onUpdatePartStage(part.id, e.target.value as MachineWorkflowStage)}
                            className="flex-1 text-[10px] font-bold py-0.5 px-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500"
                          >
                            {WORKFLOW_STAGES.map((s) => (
                              <option key={s.id} value={s.id}>
                                {s.stepNum}. {s.title.replace(/^\d+\.\s*/, '')}
                              </option>
                            ))}
                          </select>

                          <button
                            onClick={() => handleAdvanceStage(part)}
                            disabled={currentStageIdx >= WORKFLOW_STAGES.length - 1}
                            className={`px-2 py-1 rounded-lg text-[10px] font-black border transition-all flex items-center space-x-0.5 ${
                              currentStageIdx < WORKFLOW_STAGES.length - 1
                                ? 'bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/60 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800'
                                : 'opacity-30 cursor-not-allowed bg-slate-50 dark:bg-slate-900 text-slate-400 border-transparent'
                            }`}
                            title="เลื่อนไปยังขั้นตอนถัดไป"
                          >
                            <span>ถัดไป</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        </div>

                      </div>
                    );
                  })
                )}
              </div>

              {/* Stage Footer Cost Summary */}
              <div className="p-2.5 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center text-xs">
                <span className="text-[10px] font-bold text-slate-500">มูลค่ารวมขั้นตอน:</span>
                <span className="font-mono font-black text-slate-900 dark:text-white">
                  {formatCurrency(stageData.totalCost)}
                </span>
              </div>

            </div>
          );
        })}
      </div>

    </div>
  );
};
