import React, { useState, useMemo } from 'react';
import { 
  X, 
  Wrench, 
  Layers, 
  Clock, 
  CheckCircle2, 
  ChevronRight, 
  ChevronLeft, 
  Search, 
  Filter, 
  Printer, 
  ExternalLink, 
  Eye, 
  FileText, 
  Plus, 
  Building2, 
  Calendar, 
  Tag, 
  AlertTriangle,
  Maximize2,
  Copy,
  Check,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { BomPartItem, ModuleItem, ProjectItem } from '../types/bom';
import { formatCurrency } from '../utils/costCalculator';

export type MachiningStageKey = 
  | 'PENDING_DWG'
  | 'IN_MACHINING'
  | 'SURFACE_FINISH'
  | 'QC_INSPECTION'
  | 'READY_ASSEMBLY';

export interface MachiningStageConfig {
  key: MachiningStageKey;
  stepNum: number;
  title: string;
  subTitle: string;
  badgeColor: string;
  headerBorder: string;
  columnBg: string;
}

export const MACHINING_STAGES: MachiningStageConfig[] = [
  {
    key: 'PENDING_DWG',
    stepNum: 1,
    title: '1. รอส่งแบบ',
    subTitle: 'Pending DWG / Review',
    badgeColor: 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-300 dark:border-amber-800',
    headerBorder: 'border-t-amber-500',
    columnBg: 'bg-amber-50/40 dark:bg-amber-950/10'
  },
  {
    key: 'IN_MACHINING',
    stepNum: 2,
    title: '2. ส่งร้านกลึง/CNC',
    subTitle: 'In Machining / Milling',
    badgeColor: 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border-blue-300 dark:border-blue-800',
    headerBorder: 'border-t-blue-500',
    columnBg: 'bg-blue-50/40 dark:bg-blue-950/10'
  },
  {
    key: 'SURFACE_FINISH',
    stepNum: 3,
    title: '3. ส่งชุบผิว/ทำสี',
    subTitle: 'Anodize / Black Oxide',
    badgeColor: 'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300 border-purple-300 dark:border-purple-800',
    headerBorder: 'border-t-purple-500',
    columnBg: 'bg-purple-50/40 dark:bg-purple-950/10'
  },
  {
    key: 'QC_INSPECTION',
    stepNum: 4,
    title: '4. QC ตรวจขนาด',
    subTitle: 'CMM / Dimension Inspection',
    badgeColor: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-950/60 dark:text-cyan-300 border-cyan-300 dark:border-cyan-800',
    headerBorder: 'border-t-cyan-500',
    columnBg: 'bg-cyan-50/40 dark:bg-cyan-950/10'
  },
  {
    key: 'READY_ASSEMBLY',
    stepNum: 5,
    title: '5. พร้อมประกอบ',
    subTitle: 'Ready for Assembly',
    badgeColor: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800',
    headerBorder: 'border-t-emerald-500',
    columnBg: 'bg-emerald-50/40 dark:bg-emerald-950/10'
  }
];

interface MachiningPipelineModalProps {
  isOpen: boolean;
  onClose: () => void;
  project?: ProjectItem;
  modules: ModuleItem[];
  parts: BomPartItem[];
  onUpdatePart?: (partId: string, updatedFields: Partial<BomPartItem>) => void;
  onEditPart?: (part: BomPartItem) => void;
}

export const MachiningPipelineModal: React.FC<MachiningPipelineModalProps> = ({
  isOpen,
  onClose,
  project,
  modules,
  parts,
  onUpdatePart,
  onEditPart,
}) => {
  // Hooks placed first unconditionally
  const [activeTabMode, setActiveTabMode] = useState<'kanban' | 'work-order'>('kanban');
  const [selectedModuleFilter, setSelectedModuleFilter] = useState<string>('ALL');
  const [selectedVendorFilter, setSelectedVendorFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Drawing Preview Modal State
  const [previewDrawingPart, setPreviewDrawingPart] = useState<BomPartItem | null>(null);
  const [editingDrawingUrl, setEditingDrawingUrl] = useState<string>('');
  const [copiedDwg, setCopiedDwg] = useState<string | null>(null);

  // Filter only Feb Parts (or custom machining items)
  const febParts = useMemo(() => {
    return parts.filter(p => p.partType === 'Feb Part');
  }, [parts]);

  // Extract unique machining shops / suppliers
  const vendorList = useMemo(() => {
    const list = Array.from(new Set(febParts.map(p => p.supplier?.trim()).filter(Boolean))) as string[];
    return list.sort();
  }, [febParts]);

  // Helper to extract stage from part remarks or status
  const getPartMachiningStage = (part: BomPartItem): MachiningStageKey => {
    const remarks = part.remarks || '';
    const match = remarks.match(/\[FAB:([A-Z_]+)\]/);
    if (match && MACHINING_STAGES.some(s => s.key === match[1])) {
      return match[1] as MachiningStageKey;
    }
    // Fallback heuristic based on standard part status
    if (part.status === 'Completed' || part.status === 'In Assembly') return 'READY_ASSEMBLY';
    if (part.status === 'Received') return 'QC_INSPECTION';
    if (part.status === 'Ordered') return 'IN_MACHINING';
    return 'PENDING_DWG';
  };

  // Move part to stage
  const handleMoveStage = (part: BomPartItem, newStage: MachiningStageKey) => {
    if (!onUpdatePart) return;

    // Clean existing [FAB:xxx] tag from remarks
    let cleanRemarks = (part.remarks || '').replace(/\[FAB:[A-Z_]+\]/g, '').trim();
    const updatedRemarks = `[FAB:${newStage}] ${cleanRemarks}`.trim();

    // Map to overall PartStatus
    let newStatus = part.status;
    if (newStage === 'READY_ASSEMBLY') newStatus = 'Completed';
    else if (newStage === 'QC_INSPECTION') newStatus = 'Received';
    else if (newStage === 'IN_MACHINING' || newStage === 'SURFACE_FINISH') newStatus = 'Ordered';
    else if (newStage === 'PENDING_DWG') newStatus = 'Planned';

    onUpdatePart(part.id, {
      remarks: updatedRemarks,
      status: newStatus
    });
  };

  // Filtered parts based on controls
  const filteredParts = useMemo(() => {
    return febParts.filter(p => {
      if (selectedModuleFilter !== 'ALL' && p.moduleId !== selectedModuleFilter) return false;
      if (selectedVendorFilter !== 'ALL' && (p.supplier || '').trim() !== selectedVendorFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = p.partName.toLowerCase().includes(q);
        const matchDwg = (p.dwgNo || '').toLowerCase().includes(q);
        const matchSpec = (p.typeSpec || '').toLowerCase().includes(q);
        const matchSupplier = (p.supplier || '').toLowerCase().includes(q);
        if (!matchName && !matchDwg && !matchSpec && !matchSupplier) return false;
      }
      return true;
    });
  }, [febParts, selectedModuleFilter, selectedVendorFilter, searchQuery]);

  // Group by stage
  const partsByStage = useMemo(() => {
    const map: Record<MachiningStageKey, BomPartItem[]> = {
      PENDING_DWG: [],
      IN_MACHINING: [],
      SURFACE_FINISH: [],
      QC_INSPECTION: [],
      READY_ASSEMBLY: []
    };
    filteredParts.forEach(p => {
      const stage = getPartMachiningStage(p);
      map[stage].push(p);
    });
    return map;
  }, [filteredParts]);

  const totalFebCost = useMemo(() => {
    return filteredParts.reduce((sum, p) => sum + (p.totalAmount || (p.qty * p.unitPrice)), 0);
  }, [filteredParts]);

  const handleCopyDwg = (dwg: string) => {
    if (!dwg) return;
    navigator.clipboard.writeText(dwg);
    setCopiedDwg(dwg);
    setTimeout(() => setCopiedDwg(null), 2000);
  };

  const handleSaveDrawingLink = (part: BomPartItem) => {
    if (!onUpdatePart) return;
    onUpdatePart(part.id, {
      purchaseLink: editingDrawingUrl.trim()
    });
    setPreviewDrawingPart({
      ...part,
      purchaseLink: editingDrawingUrl.trim()
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-7xl max-h-[95vh] flex flex-col shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        
        {/* ─── Header ─── */}
        <div className="p-4 sm:px-6 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 bg-slate-50/80 dark:bg-slate-900/90 print:hidden">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-tr from-amber-500 to-rose-600 text-white shadow-md shadow-amber-500/20">
              <Wrench className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">
                  กระดานติดตามงานสั่งกลึง (Machining Pipeline Kanban)
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-black bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                  Feb Parts ({filteredParts.length})
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {project ? `โครงการ: [${project.code}] ${project.name}` : 'ติดตามขั้นตอนงานสั่งผลิต สั่งกลึง ชุบผิว และ QC'}
                <span className="ml-2 font-mono font-bold text-slate-700 dark:text-slate-300">
                  • มูลค่างานกลึง: {formatCurrency(totalFebCost)}
                </span>
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* View Mode Switcher */}
            <div className="flex items-center p-1 bg-slate-200/70 dark:bg-slate-800 rounded-xl text-xs font-bold">
              <button
                onClick={() => setActiveTabMode('kanban')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  activeTabMode === 'kanban'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm font-black'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                กระดาน Kanban
              </button>
              <button
                onClick={() => setActiveTabMode('work-order')}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg transition-all ${
                  activeTabMode === 'work-order'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm font-black'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>ใบส่งแบบสั่งกลึง</span>
              </button>
            </div>

            {activeTabMode === 'work-order' && (
              <button
                onClick={() => window.print()}
                className="flex items-center space-x-1.5 px-3.5 py-1.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl text-xs font-bold shadow-sm hover:opacity-90 transition-all"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>พิมพ์ใบสั่งงาน</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ─── Filter Bar ─── */}
        <div className="p-3 px-4 sm:px-6 bg-slate-50/50 dark:bg-slate-950/40 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2.5 text-xs print:hidden">
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center space-x-1 text-slate-400 font-bold text-[11px] uppercase mr-1">
              <Filter className="w-3.5 h-3.5" />
              <span>ตัวกรอง:</span>
            </div>

            {/* Module Filter */}
            <div className="flex items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1">
              <Layers className="w-3.5 h-3.5 text-slate-400 mr-1.5" />
              <span className="font-bold text-slate-500 mr-1">Module:</span>
              <select
                value={selectedModuleFilter}
                onChange={(e) => setSelectedModuleFilter(e.target.value)}
                className="bg-transparent font-bold text-slate-900 dark:text-white focus:outline-none cursor-pointer"
              >
                <option value="ALL">ทุก Module ({febParts.length})</option>
                {modules.map(m => (
                  <option key={m.id} value={m.id}>{m.code} - {m.name}</option>
                ))}
              </select>
            </div>

            {/* Vendor / Machining Shop Filter */}
            <div className="flex items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1">
              <Building2 className="w-3.5 h-3.5 text-slate-400 mr-1.5" />
              <span className="font-bold text-slate-500 mr-1">ร้านกลึง:</span>
              <select
                value={selectedVendorFilter}
                onChange={(e) => setSelectedVendorFilter(e.target.value)}
                className="bg-transparent font-bold text-slate-900 dark:text-white focus:outline-none cursor-pointer"
              >
                <option value="ALL">ทุกร้านกลึง ({vendorList.length} ร้าน)</option>
                {vendorList.map(v => (
                  <option key={v} value={v}>{v}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Search Box */}
          <div className="relative min-w-[200px] sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="ค้นหาชื่อ Part / เลขแบบ DWG / สเปค..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/30"
            />
          </div>
        </div>

        {/* ─── Main Content ─── */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          
          {/* TAB 1: KANBAN BOARD */}
          {activeTabMode === 'kanban' && (
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3.5 min-w-[950px] lg:min-w-0 pb-4">
              {MACHINING_STAGES.map((stage, idx) => {
                const stageParts = partsByStage[stage.key] || [];
                const stageCost = stageParts.reduce((sum, p) => sum + (p.totalAmount || (p.qty * p.unitPrice)), 0);

                return (
                  <div 
                    key={stage.key}
                    className={`flex flex-col rounded-2xl border border-slate-200/90 dark:border-slate-800 ${stage.columnBg} shadow-sm overflow-hidden border-t-4 ${stage.headerBorder}`}
                  >
                    {/* Column Header */}
                    <div className="p-3 bg-white/70 dark:bg-slate-900/70 border-b border-slate-200/80 dark:border-slate-800">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-black text-xs text-slate-900 dark:text-white tracking-tight">
                          {stage.title}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black border ${stage.badgeColor}`}>
                          {stageParts.length}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                        <span>{stage.subTitle}</span>
                        <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
                          {formatCurrency(stageCost)}
                        </span>
                      </div>
                    </div>

                    {/* Column Body / Part Cards */}
                    <div className="p-2 space-y-2.5 flex-1 overflow-y-auto max-h-[62vh]">
                      {stageParts.length === 0 ? (
                        <div className="p-6 text-center text-xs text-slate-400 font-medium border-2 border-dashed border-slate-200/80 dark:border-slate-800/80 rounded-xl my-2">
                          ไม่มีชิ้นงานในขั้นตอนนี้
                        </div>
                      ) : (
                        stageParts.map(part => {
                          const partTotalCost = part.totalAmount || (part.qty * part.unitPrice);
                          const hasDrawingLink = !!(part.purchaseLink && part.purchaseLink.trim() !== '');

                          return (
                            <div
                              key={part.id}
                              className="group p-3 rounded-xl bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/80 shadow-sm hover:shadow-md transition-all space-y-2"
                            >
                              {/* Top Row: DWG No & Quick Copy */}
                              <div className="flex items-center justify-between gap-1">
                                <div className="flex items-center space-x-1.5 overflow-hidden">
                                  <span className="px-1.5 py-0.5 rounded text-[10px] font-black bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                                    #{part.itemNo}
                                  </span>
                                  {part.dwgNo ? (
                                    <button
                                      onClick={() => handleCopyDwg(part.dwgNo)}
                                      className="font-mono font-black text-xs text-slate-900 dark:text-white hover:text-amber-600 dark:hover:text-amber-400 truncate flex items-center gap-1"
                                      title="คลิกเพื่อคัดลอก Drawing No."
                                    >
                                      <span>{part.dwgNo}</span>
                                      {copiedDwg === part.dwgNo ? (
                                        <Check className="w-3 h-3 text-emerald-500" />
                                      ) : (
                                        <Copy className="w-2.5 h-2.5 opacity-0 group-hover:opacity-100 transition-opacity text-slate-400" />
                                      )}
                                    </button>
                                  ) : (
                                    <span className="text-[11px] font-bold text-rose-500 flex items-center">
                                      <AlertTriangle className="w-3 h-3 mr-0.5" /> รอเลข DWG
                                    </span>
                                  )}
                                </div>

                                {/* Drawing Viewer Action */}
                                <button
                                  onClick={() => {
                                    setPreviewDrawingPart(part);
                                    setEditingDrawingUrl(part.purchaseLink || '');
                                  }}
                                  className={`p-1 rounded-lg text-xs font-bold transition-colors ${
                                    hasDrawingLink
                                      ? 'text-sky-600 hover:bg-sky-50 dark:hover:bg-sky-950/50'
                                      : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                                  }`}
                                  title={hasDrawingLink ? "เปิดดูแบบ Drawing CAD / Preview" : "แนบลิงก์ Drawing CAD"}
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                </button>
                              </div>

                              {/* Part Name & Spec */}
                              <div>
                                <div className="font-black text-xs text-slate-900 dark:text-white leading-snug">
                                  {part.partName}
                                </div>
                                {part.typeSpec && (
                                  <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                                    {part.typeSpec}
                                  </div>
                                )}
                              </div>

                              {/* Meta Details: Qty, Shop, Cost */}
                              <div className="pt-1 border-t border-slate-100 dark:border-slate-700/60 flex flex-wrap items-center justify-between gap-1 text-[11px]">
                                <span className="font-bold text-slate-700 dark:text-slate-300">
                                  จำนวน: <strong className="text-amber-600 dark:text-amber-400">{part.qty}</strong> {part.unit}
                                </span>
                                <span className="font-mono font-bold text-slate-600 dark:text-slate-400">
                                  {formatCurrency(partTotalCost)}
                                </span>
                              </div>

                              {/* Supplier / Shop badge */}
                              {part.supplier && (
                                <div className="text-[10px] font-bold text-slate-600 dark:text-slate-400 flex items-center bg-slate-50 dark:bg-slate-900/60 px-2 py-1 rounded-lg border border-slate-100 dark:border-slate-800">
                                  <Building2 className="w-2.5 h-2.5 mr-1 text-slate-400" />
                                  <span className="truncate">{part.supplier}</span>
                                </div>
                              )}

                              {/* Stage Navigation Action Buttons */}
                              <div className="pt-1 flex items-center justify-between gap-1">
                                {idx > 0 ? (
                                  <button
                                    onClick={() => handleMoveStage(part, MACHINING_STAGES[idx - 1].key)}
                                    className="flex items-center space-x-0.5 px-2 py-1 rounded-lg text-[10px] font-bold text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                                    title={`ย้อนกลับไป: ${MACHINING_STAGES[idx - 1].title}`}
                                  >
                                    <ChevronLeft className="w-3 h-3" />
                                    <span>ย้อน</span>
                                  </button>
                                ) : <div />}

                                {onEditPart && (
                                  <button
                                    onClick={() => onEditPart(part)}
                                    className="text-[10px] font-bold text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                                  >
                                    แก้ไข
                                  </button>
                                )}

                                {idx < MACHINING_STAGES.length - 1 && (
                                  <button
                                    onClick={() => handleMoveStage(part, MACHINING_STAGES[idx + 1].key)}
                                    className="flex items-center space-x-0.5 px-2 py-1 rounded-lg text-[10px] font-black bg-slate-100 hover:bg-amber-500 hover:text-white dark:bg-slate-700 dark:hover:bg-amber-500 text-slate-700 dark:text-slate-200 transition-all"
                                    title={`เลื่อนไป: ${MACHINING_STAGES[idx + 1].title}`}
                                  >
                                    <span>ถัดไป</span>
                                    <ChevronRight className="w-3 h-3" />
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* TAB 2: PRINTABLE WORK ORDER SHEET (ใบส่งแบบสั่งกลึง) */}
          {activeTabMode === 'work-order' && (
            <div className="max-w-5xl mx-auto bg-white p-6 sm:p-10 rounded-2xl border border-slate-200 shadow-sm text-slate-900 space-y-6">
              
              {/* Document Header */}
              <div className="border-b-2 border-slate-900 pb-4 flex flex-wrap justify-between items-start gap-4">
                <div>
                  <h1 className="text-xl font-black tracking-tight text-slate-900">
                    WARSGATE AUTOMATION CO., LTD.
                  </h1>
                  <p className="text-xs text-slate-600 font-medium">
                    ใบสั่งผลิตชิ้นงานกลึง & ชิ้นส่วนสั่งทำพิเศษ (Machining Work Order)
                  </p>
                </div>
                <div className="text-right text-xs space-y-0.5 font-medium">
                  <div><strong>วันที่สั่งงาน:</strong> {new Date().toLocaleDateString('th-TH')}</div>
                  <div><strong>รหัสโครงการ:</strong> {project?.code || '-'}</div>
                  <div><strong>ชื่อโครงการ:</strong> {project?.name || '-'}</div>
                </div>
              </div>

              {/* Vendor & Delivery Box */}
              <div className="grid grid-cols-2 gap-4 p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                <div>
                  <span className="text-slate-500 font-bold block">ร้านกลึง / ผู้ผลิต (Supplier):</span>
                  <span className="font-black text-sm text-slate-900">
                    {selectedVendorFilter !== 'ALL' ? selectedVendorFilter : 'ทุกร้านกลึงในโครงการ'}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-slate-500 font-bold block">จำนวนรายการสั่งทำ:</span>
                  <span className="font-black text-sm text-slate-900">
                    {filteredParts.length} รายการ (ยอดรวม: {formatCurrency(totalFebCost)})
                  </span>
                </div>
              </div>

              {/* Work Order Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border border-slate-300">
                  <thead className="bg-slate-100 text-slate-900 font-black border-b border-slate-300 text-[11px]">
                    <tr>
                      <th className="p-2 border-r border-slate-300 text-center w-12">ลำดับ</th>
                      <th className="p-2 border-r border-slate-300 w-36">เลขแบบ (DWG No.)</th>
                      <th className="p-2 border-r border-slate-300">ชื่อชิ้นงาน (Part Name)</th>
                      <th className="p-2 border-r border-slate-300 w-44">เกรดวัสดุ / ชุบผิว</th>
                      <th className="p-2 border-r border-slate-300 text-center w-16">จำนวน</th>
                      <th className="p-2 border-r border-slate-300 text-right w-24">ราคา/หน่วย</th>
                      <th className="p-2 border-r border-slate-300 text-center w-28">ขั้นตอนปัจจุบัน</th>
                      <th className="p-2 text-center w-20">ตรวจรับ (QC)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 font-medium">
                    {filteredParts.map((part, index) => {
                      const stageKey = getPartMachiningStage(part);
                      const stageCfg = MACHINING_STAGES.find(s => s.key === stageKey);

                      return (
                        <tr key={part.id} className="hover:bg-slate-50">
                          <td className="p-2 border-r border-slate-200 text-center font-bold">{index + 1}</td>
                          <td className="p-2 border-r border-slate-200 font-mono font-bold text-slate-900">{part.dwgNo || '-'}</td>
                          <td className="p-2 border-r border-slate-200 font-bold">{part.partName}</td>
                          <td className="p-2 border-r border-slate-200 text-slate-600 font-mono text-[11px]">{part.typeSpec || '-'}</td>
                          <td className="p-2 border-r border-slate-200 text-center font-black">{part.qty} {part.unit}</td>
                          <td className="p-2 border-r border-slate-200 text-right font-mono">{formatCurrency(part.unitPrice)}</td>
                          <td className="p-2 border-r border-slate-200 text-center text-[10px] font-bold">
                            {stageCfg?.title || '-'}
                          </td>
                          <td className="p-2 text-center">
                            <span className="inline-block w-4 h-4 border border-slate-400 rounded"></span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Signatures */}
              <div className="grid grid-cols-3 gap-6 pt-10 text-center text-xs">
                <div className="space-y-8">
                  <div className="border-b border-slate-400 pb-1 font-bold">_________________________</div>
                  <div>วิศวกรผู้ส่งแบบ (Mechanical Engineer)</div>
                </div>
                <div className="space-y-8">
                  <div className="border-b border-slate-400 pb-1 font-bold">_________________________</div>
                  <div>ผู้ตรวจสอบขนาด (QC Inspector)</div>
                </div>
                <div className="space-y-8">
                  <div className="border-b border-slate-400 pb-1 font-bold">_________________________</div>
                  <div>ร้านกลึงผู้รับงาน (Machine Shop)</div>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* ─── Footer ─── */}
        <div className="p-3 px-6 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex justify-between items-center text-xs print:hidden">
          <div className="text-slate-500 flex items-center space-x-2">
            <span className="font-bold">เคล็ดลับ:</span>
            <span>กดปุ่ม "ถัดไป / ย้อน" บนการ์ด เพื่อขยับสถานะงานสั่งกลึงเข้าสู่ขั้นตอนถัดไป</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 rounded-xl font-bold transition-all"
          >
            ปิดหน้าต่าง
          </button>
        </div>

      </div>

      {/* ─── Drawing Quick Viewer Sub-Modal ─── */}
      {previewDrawingPart && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[90vh]">
            
            {/* Viewer Header */}
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-900">
              <div>
                <div className="flex items-center space-x-2">
                  <Eye className="w-4 h-4 text-sky-500" />
                  <h3 className="font-black text-sm text-slate-900 dark:text-white">
                    Drawing Viewer: {previewDrawingPart.dwgNo || previewDrawingPart.partName}
                  </h3>
                </div>
                <p className="text-xs text-slate-500">
                  {previewDrawingPart.partName} • {previewDrawingPart.typeSpec || 'ไม่มีข้อมูลสเปค'}
                </p>
              </div>
              <button
                onClick={() => setPreviewDrawingPart(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Viewer Body */}
            <div className="p-6 flex-1 overflow-y-auto space-y-4">
              {previewDrawingPart.purchaseLink && (
                previewDrawingPart.purchaseLink.endsWith('.png') ||
                previewDrawingPart.purchaseLink.endsWith('.jpg') ||
                previewDrawingPart.purchaseLink.endsWith('.jpeg') ||
                previewDrawingPart.purchaseLink.endsWith('.webp') ||
                previewDrawingPart.purchaseLink.endsWith('.svg')
              ) ? (
                <div className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden bg-slate-950 flex items-center justify-center p-4">
                  <img
                    src={previewDrawingPart.purchaseLink}
                    alt={previewDrawingPart.partName}
                    className="max-h-[50vh] object-contain rounded"
                  />
                </div>
              ) : previewDrawingPart.purchaseLink ? (
                <div className="p-6 rounded-xl border border-sky-200 dark:border-sky-900 bg-sky-50/60 dark:bg-sky-950/30 text-center space-y-3">
                  <FileText className="w-12 h-12 mx-auto text-sky-600 dark:text-sky-400" />
                  <div className="font-bold text-sm text-slate-900 dark:text-white">
                    ลิงก์แบบ CAD / PDF ถูกบันทึกไว้ในระบบ
                  </div>
                  <p className="text-xs text-slate-500 font-mono break-all max-w-lg mx-auto">
                    {previewDrawingPart.purchaseLink}
                  </p>
                  <a
                    href={previewDrawingPart.purchaseLink}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center space-x-1.5 px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold shadow-md shadow-sky-600/20"
                  >
                    <span>เปิดแบบในแท็บใหม่</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              ) : (
                <div className="p-8 text-center text-slate-400 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl space-y-2">
                  <Eye className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600" />
                  <div className="font-bold text-xs text-slate-600 dark:text-slate-300">
                    ยังไม่มีการแนบลิงก์ Drawing หรือไฟล์ภาพ CAD
                  </div>
                  <p className="text-[11px] text-slate-400 max-w-md mx-auto">
                    สามารถนำลิงก์จาก Google Drive, OneDrive หรือ Cloudinary มาใส่ในช่องด้านล่างเพื่อเปิดดูแบบได้ทันที
                  </p>
                </div>
              )}

              {/* Attach / Edit Drawing URL */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  แก้ไข/แนบลิงก์ Drawing (CAD / PDF / Image URL):
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    placeholder="https://drive.google.com/... หรือ URL รูปแบบ CAD"
                    value={editingDrawingUrl}
                    onChange={(e) => setEditingDrawingUrl(e.target.value)}
                    className="flex-1 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500/30"
                  />
                  <button
                    onClick={() => handleSaveDrawingLink(previewDrawingPart)}
                    className="px-4 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl text-xs font-black hover:opacity-90 transition-all shrink-0"
                  >
                    บันทึก
                  </button>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
