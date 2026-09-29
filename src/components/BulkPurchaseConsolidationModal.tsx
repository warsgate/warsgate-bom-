import React, { useState, useMemo } from 'react';
import { 
  X, 
  Boxes, 
  ShoppingCart, 
  Download, 
  ChevronDown, 
  ChevronRight, 
  Filter, 
  Sparkles, 
  TrendingDown, 
  Building2, 
  Search,
  CheckCircle2,
  FileSpreadsheet,
  Layers,
  ArrowRight
} from 'lucide-react';
import { ProjectItem, ModuleItem, BomPartItem } from '../types/bom';
import { formatCurrency } from '../utils/costCalculator';

interface BulkPurchaseConsolidationModalProps {
  isOpen: boolean;
  onClose: () => void;
  projects: ProjectItem[];
  activeProjectId: string;
  allModules: ModuleItem[];
  allParts: BomPartItem[];
  onOpenPoRfq?: (consolidatedItems: any[]) => void;
}

interface ConsolidatedGroup {
  key: string;
  partName: string;
  typeSpec: string;
  category: string;
  partType: string;
  maker: string;
  supplier: string;
  unit: string;
  unitPrice: number;
  totalQty: number;
  totalAmount: number;
  projectCount: number;
  moduleCount: number;
  sourceItems: {
    part: BomPartItem;
    projectName: string;
    projectCode: string;
    moduleName: string;
    moduleCode: string;
  }[];
}

export const BulkPurchaseConsolidationModal: React.FC<BulkPurchaseConsolidationModalProps> = ({
  isOpen,
  onClose,
  projects,
  activeProjectId,
  allModules,
  allParts,
  onOpenPoRfq,
}) => {
  const [scope, setScope] = useState<'current-project' | 'all-projects'>('current-project');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [supplierFilter, setSupplierFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [expandedKeys, setExpandedKeys] = useState<Record<string, boolean>>({});

  const activeProject = useMemo(() => {
    return projects.find(p => p.id === activeProjectId) || projects[0];
  }, [projects, activeProjectId]);

  // Quick lookup maps
  const projectMap = useMemo(() => new Map(projects.map(p => [p.id, p])), [projects]);
  const moduleMap = useMemo(() => new Map(allModules.map(m => [m.id, m])), [allModules]);

  // Filter parts based on scope
  const scopedParts = useMemo(() => {
    if (scope === 'current-project') {
      return allParts.filter(p => p.projectId === activeProjectId);
    }
    return allParts;
  }, [allParts, scope, activeProjectId]);

  // Group and consolidate duplicate/similar parts
  const consolidatedGroups = useMemo(() => {
    const map = new Map<string, ConsolidatedGroup>();

    scopedParts.forEach(part => {
      // Normalize key: partName + typeSpec + category (or maker)
      const normName = (part.partName || '').trim().toLowerCase();
      const normSpec = (part.typeSpec || '').trim().toLowerCase();
      const normMaker = (part.maker || '').trim().toLowerCase();
      const groupKey = `${normName}:::${normSpec}:::${normMaker || part.category}`;

      const proj = projectMap.get(part.projectId || '');
      const mod = part.moduleId ? moduleMap.get(part.moduleId) : undefined;

      const sourceEntry = {
        part,
        projectName: proj?.name || 'Project',
        projectCode: proj?.code || 'PRJ',
        moduleName: mod?.name || 'สโตร์กลาง / ไม่ระบุโมดูล',
        moduleCode: mod?.code || 'GEN',
      };

      if (!map.has(groupKey)) {
        map.set(groupKey, {
          key: groupKey,
          partName: part.partName,
          typeSpec: part.typeSpec,
          category: part.category,
          partType: part.partType,
          maker: part.maker || '',
          supplier: part.supplier || 'ยังไม่ระบุ',
          unit: part.unit || 'EA',
          unitPrice: part.unitPrice || 0,
          totalQty: Number(part.qty) || 0,
          totalAmount: Number(part.totalAmount) || 0,
          projectCount: 1,
          moduleCount: 1,
          sourceItems: [sourceEntry],
        });
      } else {
        const existing = map.get(groupKey)!;
        existing.totalQty += Number(part.qty) || 0;
        existing.totalAmount += Number(part.totalAmount) || 0;
        if (!existing.unitPrice && part.unitPrice) {
          existing.unitPrice = part.unitPrice;
        }
        existing.sourceItems.push(sourceEntry);

        // Recalculate unique counts
        const uniqueProjs = new Set(existing.sourceItems.map(s => s.projectCode));
        const uniqueMods = new Set(existing.sourceItems.map(s => s.moduleCode));
        existing.projectCount = uniqueProjs.size;
        existing.moduleCount = uniqueMods.size;
      }
    });

    return Array.from(map.values());
  }, [scopedParts, projectMap, moduleMap]);

  // Suppliers list for filter
  const suppliersList = useMemo(() => {
    const set = new Set<string>();
    consolidatedGroups.forEach(g => {
      if (g.supplier && g.supplier !== 'ยังไม่ระบุ') set.add(g.supplier);
    });
    return Array.from(set).sort();
  }, [consolidatedGroups]);

  // Filtered & Sorted groups
  const filteredGroups = useMemo(() => {
    return consolidatedGroups.filter(g => {
      // Category filter
      if (categoryFilter !== 'ALL' && g.category !== categoryFilter) return false;
      // Supplier filter
      if (supplierFilter !== 'ALL' && g.supplier !== supplierFilter) return false;
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = g.partName.toLowerCase().includes(q);
        const matchSpec = g.typeSpec.toLowerCase().includes(q);
        const matchMaker = g.maker.toLowerCase().includes(q);
        const matchSupplier = g.supplier.toLowerCase().includes(q);
        if (!matchName && !matchSpec && !matchMaker && !matchSupplier) return false;
      }
      return true;
    }).sort((a, b) => {
      // Prioritize items that appear across multiple modules/projects (High consolidation potential)
      if (b.sourceItems.length !== a.sourceItems.length) {
        return b.sourceItems.length - a.sourceItems.length;
      }
      return b.totalAmount - a.totalAmount;
    });
  }, [consolidatedGroups, categoryFilter, supplierFilter, searchQuery]);

  // Summary KPI Metrics
  const summaryKpis = useMemo(() => {
    const totalRawParts = scopedParts.length;
    const totalConsolidatedItems = consolidatedGroups.length;
    const multiOccurrenceItems = consolidatedGroups.filter(g => g.sourceItems.length > 1);
    const poLinesSaved = totalRawParts - totalConsolidatedItems;
    const totalConsolidatedCost = consolidatedGroups.reduce((sum, g) => sum + g.totalAmount, 0);

    // Estimated volume discount savings (5% to 8% conservatively on bulk)
    const estimatedVolumeSavings = multiOccurrenceItems.reduce((sum, g) => sum + (g.totalAmount * 0.08), 0);

    return {
      totalRawParts,
      totalConsolidatedItems,
      multiOccurrenceCount: multiOccurrenceItems.length,
      poLinesSaved: Math.max(0, poLinesSaved),
      totalConsolidatedCost,
      estimatedVolumeSavings,
    };
  }, [scopedParts, consolidatedGroups]);

  const toggleExpand = (key: string) => {
    setExpandedKeys(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  // Export consolidated list to CSV
  const handleExportCsv = () => {
    const headers = ['Part Name', 'Type / Spec', 'Category', 'Maker', 'Supplier', 'Consolidated Qty', 'Unit', 'Unit Price', 'Total Amount', 'Source Occurrences'];
    const rows = filteredGroups.map(g => [
      `"${g.partName.replace(/"/g, '""')}"`,
      `"${g.typeSpec.replace(/"/g, '""')}"`,
      g.category,
      `"${g.maker.replace(/"/g, '""')}"`,
      `"${g.supplier.replace(/"/g, '""')}"`,
      g.totalQty,
      g.unit,
      g.unitPrice,
      g.totalAmount,
      g.sourceItems.length
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `warsgate_bulk_consolidated_${scope}_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-900/70">
          <div className="flex items-center space-x-3.5">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-purple-500/25">
              <Boxes className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                ระบบรวมยอดสั่งซื้อข้ามโมดูล (Bulk Purchase Consolidation)
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 font-bold border border-purple-300 dark:border-purple-800">
                  Volume Purchase
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                ตรวจจับพาร์ทที่สเปกตรงกัน รวมจำนวนสั่งซื้อเพื่อต่อรองราคาพิเศษ (Volume Discount) จากซัพพลายเออร์
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleExportCsv}
              className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center space-x-1.5 shadow-sm shadow-emerald-600/20 transition-all hover:scale-[1.02]"
              title="ส่งออกรายการรวมยอดเป็น CSV สำหรับจัดซื้อ"
            >
              <Download className="w-3.5 h-3.5" />
              <span>ส่งออก CSV</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scope & KPI Summary Banner */}
        <div className="p-6 bg-gradient-to-r from-purple-50/60 via-indigo-50/40 to-slate-50/60 dark:from-purple-950/20 dark:via-indigo-950/15 dark:to-slate-900/60 border-b border-slate-200 dark:border-slate-800 space-y-4">
          
          {/* Scope Selector Pills */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center space-x-2 bg-white dark:bg-slate-900 p-1 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <button
                onClick={() => setScope('current-project')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 ${
                  scope === 'current-project'
                    ? 'bg-purple-600 text-white shadow-sm shadow-purple-600/30'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>เฉพาะโปรเจกต์นี้ [{activeProject?.code}]</span>
              </button>

              <button
                onClick={() => setScope('all-projects')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 ${
                  scope === 'all-projects'
                    ? 'bg-purple-600 text-white shadow-sm shadow-purple-600/30'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                <Building2 className="w-3.5 h-3.5" />
                <span>ทั้งโรงงาน ({projects.length} โปรเจกต์)</span>
              </button>
            </div>

            <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5 font-medium">
              <Sparkles className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              <span>ตรวจพบ <strong>{summaryKpis.multiOccurrenceCount} รายการ</strong> ที่ใช้ซ้ำข้ามโมดูล</span>
            </div>
          </div>

          {/* KPI Cards Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
              <span className="text-[10px] font-bold uppercase text-slate-400 block">จำนวนแถวพาร์ทเดิม</span>
              <span className="text-lg font-black text-slate-800 dark:text-slate-100 font-mono">
                {summaryKpis.totalRawParts} แถว
              </span>
            </div>

            <div className="p-3 bg-white dark:bg-slate-900 rounded-2xl border border-purple-200 dark:border-purple-900/60 shadow-sm">
              <span className="text-[10px] font-bold uppercase text-purple-600 dark:text-purple-400 block">รวมเหลือ (Consolidated)</span>
              <span className="text-lg font-black text-purple-700 dark:text-purple-300 font-mono">
                {summaryKpis.totalConsolidatedItems} รายการ
              </span>
            </div>

            <div className="p-3 bg-white dark:bg-slate-900 rounded-2xl border border-emerald-200 dark:border-emerald-900/60 shadow-sm">
              <span className="text-[10px] font-bold uppercase text-emerald-600 dark:text-emerald-400 block">ลดภาระเปิด PO</span>
              <span className="text-lg font-black text-emerald-600 dark:text-emerald-400 font-mono">
                -{summaryKpis.poLinesSaved} รายการ
              </span>
            </div>

            <div className="p-3 bg-white dark:bg-slate-900 rounded-2xl border border-amber-200 dark:border-amber-900/60 shadow-sm">
              <span className="text-[10px] font-bold uppercase text-amber-600 dark:text-amber-400 block flex items-center gap-1">
                <TrendingDown className="w-3 h-3 text-amber-500" />
                ประเมินส่วนลด Volume
              </span>
              <span className="text-lg font-black text-amber-600 dark:text-amber-400 font-mono">
                ~{formatCurrency(summaryKpis.estimatedVolumeSavings)}
              </span>
            </div>
          </div>

        </div>

        {/* Filter Toolbar */}
        <div className="px-6 py-3 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-wrap items-center justify-between gap-3">
          
          <div className="flex items-center space-x-2 flex-1 min-w-[240px]">
            <div className="relative w-full max-w-sm">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ค้นหาชื่อพาร์ท, สเปก, ยี่ห้อ..."
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-purple-500 font-bold"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            </div>

            {/* Category Filter */}
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="py-1.5 px-2.5 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-700 dark:text-slate-300 font-bold focus:outline-none"
            >
              <option value="ALL">หมวดหมู่ทั้งหมด</option>
              <option value="MC">MC (Machining/กลึง)</option>
              <option value="EE">EE (Electrical/ไฟฟ้า)</option>
              <option value="PN">PN (Pneumatics/นิวแมติกส์)</option>
              <option value="STD">Standard (มาตรฐาน)</option>
            </select>

            {/* Supplier Filter */}
            {suppliersList.length > 0 && (
              <select
                value={supplierFilter}
                onChange={(e) => setSupplierFilter(e.target.value)}
                className="py-1.5 px-2.5 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-700 dark:text-slate-300 font-bold focus:outline-none max-w-[150px] truncate"
              >
                <option value="ALL">ซัพพลายเออร์ทั้งหมด</option>
                {suppliersList.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            )}
          </div>

          <div className="text-xs text-slate-500">
            แสดง <strong>{filteredGroups.length}</strong> รายการ
          </div>
        </div>

        {/* Consolidated Items Table / List */}
        <div className="p-6 overflow-y-auto space-y-3 flex-1 custom-scrollbar">
          {filteredGroups.length === 0 ? (
            <div className="p-12 text-center rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 text-slate-400 text-xs">
              ไม่พบรายการชิ้นส่วนที่ตรงกับเงื่อนไขการค้นหา
            </div>
          ) : (
            filteredGroups.map((group) => {
              const isExpanded = !!expandedKeys[group.key];
              const isMulti = group.sourceItems.length > 1;

              return (
                <div
                  key={group.key}
                  className={`rounded-2xl border transition-all overflow-hidden ${
                    isMulti
                      ? 'bg-white dark:bg-slate-900 border-purple-200/80 dark:border-purple-900/60 shadow-sm'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                  }`}
                >
                  {/* Item Summary Row */}
                  <div className="p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    
                    <div className="flex items-start space-x-3 min-w-0">
                      <button
                        onClick={() => toggleExpand(group.key)}
                        className={`p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white transition-transform ${
                          isExpanded ? 'rotate-90 text-purple-600' : ''
                        }`}
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>

                      <div className="min-w-0">
                        <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                          <span className="text-xs font-black text-slate-900 dark:text-white">
                            {group.partName}
                          </span>
                          {group.typeSpec && (
                            <span className="text-[11px] font-mono font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                              {group.typeSpec}
                            </span>
                          )}
                          <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300">
                            {group.category}
                          </span>
                          {isMulti && (
                            <span className="text-[10px] font-mono font-black px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                              <Sparkles className="w-3 h-3" />
                              ใช้ใน {group.moduleCount} โมดูล ({group.sourceItems.length} จุด)
                            </span>
                          )}
                        </div>

                        <div className="text-[11px] text-slate-400 mt-1 flex items-center space-x-2 truncate">
                          <span>ยี่ห้อ: <strong className="text-slate-600 dark:text-slate-300">{group.maker || '-'}</strong></span>
                          <span>•</span>
                          <span>ซัพพลายเออร์: <strong className="text-slate-600 dark:text-slate-300">{group.supplier || 'ยังไม่ระบุ'}</strong></span>
                        </div>
                      </div>
                    </div>

                    {/* Quantity & Total Price */}
                    <div className="flex items-center space-x-4 self-end sm:self-center shrink-0">
                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 uppercase font-bold block">ยอดรวมทั้งสิ้น</span>
                        <span className="text-sm font-black font-mono text-purple-700 dark:text-purple-300">
                          {group.totalQty} {group.unit}
                        </span>
                      </div>

                      <div className="text-right pl-3 border-l border-slate-200 dark:border-slate-800">
                        <span className="text-[10px] text-slate-400 uppercase font-bold block">ราคารวม (Est.)</span>
                        <span className="text-sm font-black font-mono text-slate-900 dark:text-white">
                          {formatCurrency(group.totalAmount)}
                        </span>
                      </div>

                      <button
                        onClick={() => toggleExpand(group.key)}
                        className="px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-bold transition-colors"
                      >
                        {isExpanded ? 'ซ่อน' : 'ดูที่มา'}
                      </button>
                    </div>

                  </div>

                  {/* Expanded Breakdown Table */}
                  {isExpanded && (
                    <div className="p-3 bg-slate-50/80 dark:bg-slate-950/80 border-t border-slate-100 dark:border-slate-800 space-y-2 animate-in fade-in duration-150">
                      <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                        ชิ้นส่วนนี้ถูกเรียกใช้ในโมดูล / โปรเจกต์ต่อไปนี้:
                      </p>

                      <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                        {group.sourceItems.map((src, sIdx) => (
                          <div key={sIdx} className="p-2.5 bg-white dark:bg-slate-900 flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600">
                                [{src.projectCode}]
                              </span>
                              <span className="font-bold text-slate-800 dark:text-slate-200">
                                {src.moduleName} ({src.moduleCode})
                              </span>
                              {src.part.dwgNo && (
                                <span className="font-mono text-[10px] text-blue-500">
                                  DWG: {src.part.dwgNo}
                                </span>
                              )}
                            </div>

                            <div className="flex items-center space-x-3">
                              <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
                                {src.part.qty} {src.part.unit}
                              </span>
                              <span className="font-mono text-slate-500 text-[11px]">
                                {formatCurrency(src.part.totalAmount)}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80 flex items-center justify-between">
          <div className="flex items-center space-x-2 text-xs text-slate-500">
            <Boxes className="w-4 h-4 text-purple-600" />
            <span>Consolidation Engine v1.0 • รวมยอดอัตโนมัติจากฐานข้อมูล BOM สด</span>
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
