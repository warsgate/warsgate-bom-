import React, { useState, useMemo } from 'react';
import { 
  X, 
  PackageCheck, 
  Layers, 
  Search, 
  Filter, 
  Printer, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  MapPin, 
  Check, 
  ExternalLink,
  ChevronRight,
  Boxes,
  Truck,
  Wrench,
  Sparkles,
  ClipboardList
} from 'lucide-react';
import { BomPartItem, ModuleItem, ProjectItem } from '../types/bom';
import { formatCurrency } from '../utils/costCalculator';

interface AssemblyKittingModalProps {
  isOpen: boolean;
  onClose: () => void;
  project?: ProjectItem;
  modules: ModuleItem[];
  parts: BomPartItem[];
  onUpdatePart?: (partId: string, updatedFields: Partial<BomPartItem>) => void;
}

export const AssemblyKittingModal: React.FC<AssemblyKittingModalProps> = ({
  isOpen,
  onClose,
  project,
  modules,
  parts,
  onUpdatePart,
}) => {
  // Hooks placed unconditionally
  const [selectedModuleId, setSelectedModuleId] = useState<string>('ALL');
  const [filterMode, setFilterMode] = useState<'ALL' | 'READY_TO_PICK' | 'KITTED' | 'SHORTAGE'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isPrintView, setIsPrintView] = useState(false);

  // Helper to check if a part is marked as kitted
  const isPartKitted = (part: BomPartItem): boolean => {
    return (part.remarks || '').includes('[KITTED]') || part.status === 'In Assembly' || part.status === 'Completed';
  };

  // Helper to check if a part is in stock (ready to be picked)
  const isPartInStock = (part: BomPartItem): boolean => {
    return part.status === 'Received' || part.status === 'In Assembly' || part.status === 'Completed';
  };

  // Toggle kitted state
  const handleToggleKitted = (part: BomPartItem) => {
    if (!onUpdatePart) return;

    const currentlyKitted = isPartKitted(part);
    let newRemarks = part.remarks || '';

    if (currentlyKitted) {
      newRemarks = newRemarks.replace(/\[KITTED\]/g, '').trim();
      onUpdatePart(part.id, {
        remarks: newRemarks,
        status: isPartInStock(part) ? 'Received' : 'Ordered'
      });
    } else {
      newRemarks = `[KITTED] ${newRemarks}`.trim();
      onUpdatePart(part.id, {
        remarks: newRemarks,
        status: 'In Assembly'
      });
    }
  };

  // Active module object
  const activeModule = useMemo(() => {
    if (selectedModuleId === 'ALL') return null;
    return modules.find(m => m.id === selectedModuleId) || null;
  }, [modules, selectedModuleId]);

  // Filter parts for current selection
  const moduleParts = useMemo(() => {
    return parts.filter(p => {
      if (selectedModuleId !== 'ALL' && p.moduleId !== selectedModuleId) return false;
      return true;
    });
  }, [parts, selectedModuleId]);

  // Compute readiness stats for each module
  const moduleStatsMap = useMemo(() => {
    const map = new Map<string, { total: number; inStock: number; kitted: number; shortage: number; readinessPct: number }>();
    
    // Overall
    const allTotal = parts.length;
    const allInStock = parts.filter(isPartInStock).length;
    const allKitted = parts.filter(isPartKitted).length;
    const allShortage = parts.filter(p => !isPartInStock(p)).length;
    const allPct = allTotal > 0 ? Math.round((allKitted / allTotal) * 100) : 100;
    map.set('ALL', { total: allTotal, inStock: allInStock, kitted: allKitted, shortage: allShortage, readinessPct: allPct });

    modules.forEach(m => {
      const mParts = parts.filter(p => p.moduleId === m.id);
      const total = mParts.length;
      const inStock = mParts.filter(isPartInStock).length;
      const kitted = mParts.filter(isPartKitted).length;
      const shortage = mParts.filter(p => !isPartInStock(p)).length;
      const readinessPct = total > 0 ? Math.round((kitted / total) * 100) : 100;
      map.set(m.id, { total, inStock, kitted, shortage, readinessPct });
    });

    return map;
  }, [parts, modules]);

  // Filtered parts by search and status pill
  const filteredParts = useMemo(() => {
    return moduleParts.filter(p => {
      const inStock = isPartInStock(p);
      const kitted = isPartKitted(p);

      if (filterMode === 'KITTED' && !kitted) return false;
      if (filterMode === 'READY_TO_PICK' && (!inStock || kitted)) return false;
      if (filterMode === 'SHORTAGE' && inStock) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = p.partName.toLowerCase().includes(q);
        const matchDwg = (p.dwgNo || '').toLowerCase().includes(q);
        const matchLoc = (p.storeLocation || '').toLowerCase().includes(q);
        const matchSpec = (p.typeSpec || '').toLowerCase().includes(q);
        if (!matchName && !matchDwg && !matchLoc && !matchSpec) return false;
      }
      return true;
    });
  }, [moduleParts, filterMode, searchQuery]);

  const currentStats = moduleStatsMap.get(selectedModuleId) || { total: 0, inStock: 0, kitted: 0, shortage: 0, readinessPct: 0 };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-6xl max-h-[95vh] flex flex-col shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        
        {/* ─── Header ─── */}
        <div className="p-4 sm:px-6 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 bg-gradient-to-r from-emerald-600 via-teal-700 to-slate-900 text-white print:hidden">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-2xl bg-white/10 backdrop-blur-md text-white border border-white/20 shadow-md">
              <PackageCheck className="w-6 h-6 text-emerald-200" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-lg font-black tracking-tight">
                  โหมดจัดชุดอะไหล่ประกอบ (Assembly Kitting & Pick List)
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-white/20 text-white border border-white/20">
                  Shopfloor Tablet Mode
                </span>
              </div>
              <p className="text-xs text-emerald-100">
                {project ? `โครงการ: [${project.code}] ${project.name}` : 'จัดเตรียมกล่องอะไหล่และเช็คความพร้อมก่อนเริ่มประกอบเครื่อง'}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsPrintView(!isPrintView)}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                isPrintView 
                  ? 'bg-white text-emerald-900 border-white shadow-sm font-black' 
                  : 'bg-white/10 hover:bg-white/20 text-white border-white/20'
              }`}
            >
              <Printer className="w-3.5 h-3.5" />
              <span>{isPrintView ? 'กลับสู่หน้า Tablet' : 'ใบเบิกอะไหล่ (A4 Print)'}</span>
            </button>

            {isPrintView && (
              <button
                onClick={() => window.print()}
                className="px-3.5 py-1.5 bg-white text-emerald-900 rounded-xl text-xs font-black shadow hover:opacity-90 transition-all flex items-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>พิมพ์เอกสาร</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-white/70 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ─── Module Selector & Readiness KPI Strip ─── */}
        <div className="p-3 sm:px-6 bg-slate-50 dark:bg-slate-950/50 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs print:hidden">
          
          {/* Module Dropdown */}
          <div className="flex items-center space-x-2">
            <span className="font-bold text-slate-500 uppercase text-[11px] flex items-center gap-1">
              <Layers className="w-3.5 h-3.5" />
              <span>เลือก Module:</span>
            </span>
            <select
              value={selectedModuleId}
              onChange={(e) => setSelectedModuleId(e.target.value)}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs font-black text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
            >
              <option value="ALL">รวมทุก Module ({parts.length} รายการ)</option>
              {modules.map(m => {
                const s = moduleStatsMap.get(m.id);
                return (
                  <option key={m.id} value={m.id}>
                    {m.code} - {m.name} ({s?.readinessPct || 0}% พร้อม)
                  </option>
                );
              })}
            </select>
          </div>

          {/* Readiness Badges */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center space-x-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-1.5">
              <span className="text-slate-400 font-bold text-[11px]">ความพร้อมประกอบ:</span>
              <span className={`font-mono font-black text-xs ${
                currentStats.readinessPct === 100 
                  ? 'text-emerald-600 dark:text-emerald-400' 
                  : currentStats.readinessPct >= 70 
                  ? 'text-amber-600 dark:text-amber-400' 
                  : 'text-rose-600 dark:text-rose-400'
              }`}>
                {currentStats.readinessPct}%
              </span>
              <div className="w-16 bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all ${
                    currentStats.readinessPct === 100 ? 'bg-emerald-500' : currentStats.readinessPct >= 70 ? 'bg-amber-500' : 'bg-rose-500'
                  }`}
                  style={{ width: `${currentStats.readinessPct}%` }}
                />
              </div>
            </div>

            <div className="hidden sm:flex items-center space-x-2 text-[11px]">
              <span className="text-slate-500">หยิบแล้ว: <strong className="text-emerald-600">{currentStats.kitted}</strong>/{currentStats.total}</span>
              <span>•</span>
              <span className="text-slate-500">รอหยิบในสโตร์: <strong className="text-blue-600">{currentStats.inStock - currentStats.kitted}</strong></span>
              <span>•</span>
              <span className="text-slate-500">ของยังไม่เข้า: <strong className="text-rose-600">{currentStats.shortage}</strong></span>
            </div>
          </div>

        </div>

        {/* ─── Search & Quick Filter Pills ─── */}
        {!isPrintView && (
          <div className="p-3 px-4 sm:px-6 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs print:hidden">
            
            {/* Filter Pills */}
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                onClick={() => setFilterMode('ALL')}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
                  filterMode === 'ALL'
                    ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-sm font-black'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                }`}
              >
                ทั้งหมด ({moduleParts.length})
              </button>

              <button
                onClick={() => setFilterMode('READY_TO_PICK')}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all flex items-center space-x-1 ${
                  filterMode === 'READY_TO_PICK'
                    ? 'bg-blue-600 text-white shadow-sm font-black'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                }`}
              >
                <span>พร้อมหยิบในสโตร์</span>
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300">
                  {currentStats.inStock - currentStats.kitted}
                </span>
              </button>

              <button
                onClick={() => setFilterMode('KITTED')}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all flex items-center space-x-1 ${
                  filterMode === 'KITTED'
                    ? 'bg-emerald-600 text-white shadow-sm font-black'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                }`}
              >
                <Check className="w-3.5 h-3.5" />
                <span>หยิบใส่กล่องแล้ว ({currentStats.kitted})</span>
              </button>

              <button
                onClick={() => setFilterMode('SHORTAGE')}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all flex items-center space-x-1 ${
                  filterMode === 'SHORTAGE'
                    ? 'bg-rose-600 text-white shadow-sm font-black'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                }`}
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>ของยังไม่เข้า / ขาด ({currentStats.shortage})</span>
              </button>
            </div>

            {/* Search Box */}
            <div className="relative min-w-[200px] sm:w-64">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="ค้นหาชื่อ Part, DWG, จุดเก็บ Rack..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
              />
            </div>

          </div>
        )}

        {/* ─── Main Content: Tablet List vs Printable Sheet ─── */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          
          {/* VIEW 1: TABLET SHOPFLOOR PICKING LIST */}
          {!isPrintView && (
            <div className="space-y-2.5">
              {filteredParts.length === 0 ? (
                <div className="p-12 text-center text-slate-400 text-xs bg-slate-50 dark:bg-slate-950/40 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800">
                  <Boxes className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
                  <div className="font-bold text-slate-600 dark:text-slate-300">ไม่พบรายการตามตัวกรองนี้</div>
                </div>
              ) : (
                filteredParts.map(part => {
                  const inStock = isPartInStock(part);
                  const kitted = isPartKitted(part);

                  return (
                    <div
                      key={part.id}
                      onClick={() => inStock && handleToggleKitted(part)}
                      className={`p-3.5 sm:px-5 rounded-2xl border transition-all flex flex-wrap items-center justify-between gap-3 cursor-pointer select-none ${
                        kitted
                          ? 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800/80 shadow-sm'
                          : inStock
                          ? 'bg-white dark:bg-slate-800/90 border-slate-200 dark:border-slate-700/80 hover:border-blue-400 dark:hover:border-blue-500 shadow-sm'
                          : 'bg-rose-50/40 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/50 opacity-80'
                      }`}
                    >
                      {/* Left: Checkbox & Item Details */}
                      <div className="flex items-center space-x-3.5 min-w-0 flex-1">
                        
                        {/* Big Tablet Checkbox Button */}
                        <button
                          type="button"
                          disabled={!inStock}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (inStock) handleToggleKitted(part);
                          }}
                          className={`w-9 h-9 rounded-2xl flex items-center justify-center transition-all shrink-0 ${
                            kitted
                              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30 scale-105'
                              : inStock
                              ? 'bg-slate-100 dark:bg-slate-700 text-slate-400 hover:bg-emerald-100 hover:text-emerald-700 border border-slate-300 dark:border-slate-600'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-300 dark:text-slate-600 cursor-not-allowed border border-slate-200 dark:border-slate-800'
                          }`}
                          title={!inStock ? "ของยังไม่เข้าสโตร์ ไม่สามารถหยิบได้" : kitted ? "คลิกเพื่อยกเลิกการหยิบ" : "คลิกเพื่อติ๊กหยิบใส่กล่อง"}
                        >
                          <Check className={`w-5 h-5 stroke-[3] ${kitted ? 'opacity-100' : 'opacity-0 hover:opacity-100'}`} />
                        </button>

                        {/* Part Info */}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center space-x-2">
                            <span className="text-[10px] font-black px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-mono">
                              #{part.itemNo}
                            </span>
                            {part.dwgNo && (
                              <span className="text-[11px] font-mono font-black text-indigo-600 dark:text-indigo-400 truncate">
                                {part.dwgNo}
                              </span>
                            )}
                            <span className="text-xs font-black text-slate-900 dark:text-white truncate">
                              {part.partName}
                            </span>
                          </div>

                          {part.typeSpec && (
                            <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono truncate mt-0.5">
                              {part.typeSpec}
                            </div>
                          )}
                        </div>

                      </div>

                      {/* Right: Quantity, Store Location, Status Badge */}
                      <div className="flex items-center space-x-3 shrink-0 text-xs">
                        
                        {/* Store Rack Location (Big Badge for Easy Finding) */}
                        <div className="flex items-center space-x-1 px-2.5 py-1 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-900 dark:text-amber-200 border border-amber-300 dark:border-amber-800 font-mono font-black text-[11px]">
                          <MapPin className="w-3 h-3 text-amber-600" />
                          <span>{part.storeLocation || 'ยังไม่ระบุชั้น'}</span>
                        </div>

                        {/* Qty Badge */}
                        <div className="text-right">
                          <span className="text-[11px] text-slate-400 block font-bold">จำนวน:</span>
                          <span className="font-mono font-black text-sm text-slate-900 dark:text-white">
                            {part.qty} <span className="text-xs font-normal text-slate-500">{part.unit}</span>
                          </span>
                        </div>

                        {/* Status Label */}
                        <div className="w-28 text-right">
                          {kitted ? (
                            <span className="inline-flex items-center px-2 py-1 rounded-xl text-[10px] font-black bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300">
                              <Check className="w-3 h-3 mr-1 text-emerald-600" /> หยิบแล้ว
                            </span>
                          ) : inStock ? (
                            <span className="inline-flex items-center px-2 py-1 rounded-xl text-[10px] font-black bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 border border-blue-300">
                              <Boxes className="w-3 h-3 mr-1 text-blue-600" /> อยู่ในสโตร์
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-1 rounded-xl text-[10px] font-black bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 border border-rose-300">
                              <Clock className="w-3 h-3 mr-1 text-rose-600" /> รอของส่ง
                            </span>
                          )}
                        </div>

                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* VIEW 2: PRINTABLE A4 PICK LIST SHEET */}
          {isPrintView && (
            <div className="max-w-4xl mx-auto bg-white p-8 rounded-2xl border border-slate-300 text-slate-900 space-y-5 text-xs">
              
              {/* Sheet Header */}
              <div className="border-b-2 border-slate-900 pb-3 flex justify-between items-start">
                <div>
                  <h1 className="text-lg font-black tracking-tight">
                    WARSGATE AUTOMATION CO., LTD.
                  </h1>
                  <p className="text-xs font-bold text-slate-600">
                    ใบเบิกและจัดชุดอะไหล่ประกอบ (Assembly Kitting & Pick List)
                  </p>
                </div>
                <div className="text-right space-y-0.5 text-xs">
                  <div><strong>วันที่พิมพ์:</strong> {new Date().toLocaleDateString('th-TH')}</div>
                  <div><strong>รหัสโครงการ:</strong> {project?.code || '-'}</div>
                  <div><strong>ชื่อโครงการ:</strong> {project?.name || '-'}</div>
                </div>
              </div>

              {/* Module Info */}
              <div className="p-3 bg-slate-100 rounded-xl flex justify-between items-center text-xs">
                <div>
                  <span className="font-bold text-slate-600 block">ชุดโมดูลที่จัดเตรียม:</span>
                  <span className="font-black text-sm text-slate-900">
                    {activeModule ? `${activeModule.code} - ${activeModule.name}` : 'ทุกโมดูลในโครงการ'}
                  </span>
                </div>
                <div className="text-right">
                  <span className="font-bold text-slate-600 block">จำนวนรายการ:</span>
                  <span className="font-black text-sm">{filteredParts.length} รายการ</span>
                </div>
              </div>

              {/* Table */}
              <table className="w-full text-left text-xs border border-slate-300">
                <thead className="bg-slate-100 border-b border-slate-300 font-black text-[11px]">
                  <tr>
                    <th className="p-2 border-r border-slate-300 text-center w-12">ลำดับ</th>
                    <th className="p-2 border-r border-slate-300 w-28">จุดเก็บสโตร์</th>
                    <th className="p-2 border-r border-slate-300 w-32">เลขแบบ (DWG)</th>
                    <th className="p-2 border-r border-slate-300">ชื่อชิ้นงาน (Part Name)</th>
                    <th className="p-2 border-r border-slate-300 w-36">สเปค / รุ่น</th>
                    <th className="p-2 border-r border-slate-300 text-center w-16">จำนวน</th>
                    <th className="p-2 text-center w-20">ตรวจนับ [✓]</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredParts.map((part, index) => (
                    <tr key={part.id} className="hover:bg-slate-50">
                      <td className="p-2 border-r border-slate-200 text-center font-bold">{index + 1}</td>
                      <td className="p-2 border-r border-slate-200 font-mono font-bold text-amber-800">{part.storeLocation || '-'}</td>
                      <td className="p-2 border-r border-slate-200 font-mono font-bold">{part.dwgNo || '-'}</td>
                      <td className="p-2 border-r border-slate-200 font-bold">{part.partName}</td>
                      <td className="p-2 border-r border-slate-200 font-mono text-[11px] text-slate-600">{part.typeSpec || '-'}</td>
                      <td className="p-2 border-r border-slate-200 text-center font-black">{part.qty} {part.unit}</td>
                      <td className="p-2 text-center">
                        <span className="inline-block w-4 h-4 border border-slate-400 rounded"></span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Signatures */}
              <div className="grid grid-cols-2 gap-8 pt-8 text-center text-xs">
                <div className="space-y-6">
                  <div className="border-b border-slate-400 pb-1 font-bold">_________________________</div>
                  <div>ผู้จัดชุดอะไหล่ (Warehouse / Store Keeper)</div>
                </div>
                <div className="space-y-6">
                  <div className="border-b border-slate-400 pb-1 font-bold">_________________________</div>
                  <div>หัวหน้าช่างผู้ตรวจรับเข้าประกอบ (Assembly Leader)</div>
                </div>
              </div>

            </div>
          )}

        </div>

        {/* ─── Footer ─── */}
        <div className="p-3 px-6 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex justify-between items-center text-xs print:hidden">
          <div className="text-slate-500 flex items-center space-x-2">
            <span className="font-bold">เคล็ดลับ Tablet:</span>
            <span>แตะที่แถวชิ้นส่วนเพื่อสลับสถานะ "หยิบใส่กล่องแล้ว (Kitted 🟢)"</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 rounded-xl font-bold transition-all"
          >
            ปิดหน้าต่าง
          </button>
        </div>

      </div>
    </div>
  );
};
