import React, { useState, useMemo } from 'react';
import { 
  Plus, 
  Search, 
  Edit3, 
  Trash2, 
  ArrowUpDown,
  Printer,
  ExternalLink,
  Calendar,
  Truck,
  AlertTriangle,
  Check,
  Clock,
  QrCode,
  FileCheck2,
  History,
  Camera,
  Filter,
  Layers,
  Wrench,
  Bot,
  Sparkles,
  PackageCheck,
  Share2,
  X
} from 'lucide-react';
import { BomPartItem, ModuleItem, PartStatus } from '../types/bom';
import { formatCurrency } from '../utils/costCalculator';
import { formatShortUrl } from '../utils/urlFormatter';

interface BomTableProps {
  parts: BomPartItem[];
  modules: ModuleItem[];
  onAddPart: () => void;
  onEditPart: (part: BomPartItem) => void;
  onDeletePart: (partId: string) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  onUpdatePartStatus?: (
    partId: string, 
    status: PartStatus, 
    extraData?: { 
      orderDate?: string; 
      receiveDate?: string; 
      poNumber?: string; 
      [key: string]: any; 
    }
  ) => void;
  onOpenQrModal?: (part?: BomPartItem | null) => void;
  onOpenPoRfqModal?: () => void;
  onOpenRevisionModal?: () => void;
  onOpenQrScanner?: () => void;
  onOpenMachiningModal?: () => void;
  onOpenAiAssistantModal?: () => void;
  onOpenAssemblyKitting?: () => void;
  onOpenVendorPortal?: () => void;
}

const getTodayIso = () => new Date().toISOString().split('T')[0];

export const BomTable: React.FC<BomTableProps> = ({
  parts,
  modules,
  onAddPart,
  onEditPart,
  onDeletePart,
  searchQuery,
  setSearchQuery,
  onUpdatePartStatus,
  onOpenQrModal,
  onOpenPoRfqModal,
  onOpenRevisionModal,
  onOpenQrScanner,
  onOpenMachiningModal,
  onOpenAiAssistantModal,
  onOpenAssemblyKitting,
  onOpenVendorPortal,
}) => {
  const [selectedModuleFilter, setSelectedModuleFilter] = useState<string>('ALL');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('ALL');
  const [selectedPartTypeFilter, setSelectedPartTypeFilter] = useState<string>('ALL');
  const [sortField, setSortField] = useState<keyof BomPartItem>('itemNo');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const getDeliveryBadge = (receiveDateStr?: string, status?: PartStatus) => {
    if (!receiveDateStr) return null;
    if (status === 'Received' || status === 'Completed' || status === 'In Assembly') {
      return (
        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
          <Check className="w-2.5 h-2.5 mr-0.5" /> รับเข้าแล้ว
        </span>
      );
    }
    const today = getTodayIso();
    if (receiveDateStr < today) {
      const diffTime = Math.abs(new Date(today).getTime() - new Date(receiveDateStr).getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return (
        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-black bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-800">
          <AlertTriangle className="w-2.5 h-2.5 mr-0.5 text-rose-600" /> เลยกำหนด {diffDays} วัน
        </span>
      );
    } else if (receiveDateStr === today) {
      return (
        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-black bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-300 border border-amber-300 dark:border-amber-800 animate-pulse">
          <Truck className="w-2.5 h-2.5 mr-0.5 text-amber-700" /> ส่งวันนี้
        </span>
      );
    } else {
      const diffTime = Math.abs(new Date(receiveDateStr).getTime() - new Date(today).getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return (
        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-sky-100 dark:bg-sky-950/60 text-sky-800 dark:text-sky-300 border border-sky-300 dark:border-sky-800">
          <Clock className="w-2.5 h-2.5 mr-0.5" /> อีก {diffDays} วัน
        </span>
      );
    }
  };

  // Filtered Parts logic
  const filteredParts = useMemo(() => {
    return parts.filter(part => {
      if (selectedModuleFilter !== 'ALL' && part.moduleId !== selectedModuleFilter) return false;
      if (selectedCategoryFilter !== 'ALL' && part.category !== selectedCategoryFilter) return false;
      if (selectedPartTypeFilter !== 'ALL' && part.partType !== selectedPartTypeFilter) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = part.partName.toLowerCase().includes(q);
        const matchesDwg = part.dwgNo.toLowerCase().includes(q);
        const matchesSpec = part.typeSpec.toLowerCase().includes(q);
        const matchesSupplier = (part.supplier || '').toLowerCase().includes(q);
        const matchesMaker = (part.maker || '').toLowerCase().includes(q);
        if (!matchesName && !matchesDwg && !matchesSpec && !matchesSupplier && !matchesMaker) {
          return false;
        }
      }
      return true;
    }).sort((a, b) => {
      let aVal = a[sortField] || '';
      let bVal = b[sortField] || '';
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
      }
      return sortDirection === 'asc' 
        ? String(aVal).localeCompare(String(bVal)) 
        : String(bVal).localeCompare(String(aVal));
    });
  }, [parts, selectedModuleFilter, selectedCategoryFilter, selectedPartTypeFilter, searchQuery, sortField, sortDirection]);

  const handleSort = (field: keyof BomPartItem) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getModuleCode = (modId?: string) => {
    if (!modId) return '-';
    const mod = modules.find(m => m.id === modId);
    return mod ? mod.code : '-';
  };

  return (
    <div className="space-y-3">
      
      {/* Modern 2-Tier Controls & Filter Bar */}
      <div className="print:hidden rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
        
        {/* Tier 1: Title, KPI & Main Actions */}
        <div className="p-3 sm:px-4 flex flex-wrap items-center justify-between gap-2.5">
          
          {/* Left: View title & Live Stats */}
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-pulse"></span>
              <span className="font-black text-sm text-slate-900 dark:text-white tracking-tight">
                รายการชิ้นส่วน BOM
              </span>
            </div>
            <div className="h-4 w-px bg-slate-200 dark:bg-slate-700 hidden sm:block"></div>
            <div className="hidden sm:flex items-center space-x-2 text-xs text-slate-500 dark:text-slate-400">
              <span className="font-bold text-slate-800 dark:text-slate-200">{filteredParts.length}</span>
              <span>จาก {parts.length} รายการ</span>
              <span>•</span>
              <span className="font-black font-mono text-emerald-600 dark:text-emerald-400">
                {formatCurrency(filteredParts.reduce((acc, p) => acc + (p.totalAmount || (p.qty * p.unitPrice)), 0))}
              </span>
            </div>
          </div>

          {/* Right: Grouped Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            
            {/* Smart Tools Segmented Pill */}
            <div className="flex items-center p-0.5 bg-slate-100 dark:bg-slate-800/90 rounded-xl border border-slate-200/80 dark:border-slate-700/80">
              {onOpenQrModal && (
                <button
                  onClick={() => onOpenQrModal(null)}
                  className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-700 hover:text-red-600 dark:hover:text-red-400 transition-all shadow-none hover:shadow-sm"
                  title="พิมพ์สติกเกอร์ QR Code ติดชิ้นส่วน (A4 Sheet)"
                >
                  <QrCode className="w-3.5 h-3.5 text-red-600 dark:text-red-400" />
                  <span>ป้าย QR Code</span>
                </button>
              )}

              {onOpenPoRfqModal && (
                <button
                  onClick={onOpenPoRfqModal}
                  className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-700 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all shadow-none hover:shadow-sm"
                  title="ออกใบสั่งซื้อ (PO) และใบขอราคา (RFQ) รวมตามผู้ขาย"
                >
                  <FileCheck2 className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                  <span>ออกใบ PO / RFQ</span>
                </button>
              )}

              {onOpenRevisionModal && (
                <button
                  onClick={onOpenRevisionModal}
                  className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-700 hover:text-purple-600 dark:hover:text-purple-400 transition-all shadow-none hover:shadow-sm"
                  title="ประวัติเวอร์ชัน BOM, Visual Diff & Rollback"
                >
                  <History className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                  <span>Rev. BOM</span>
                </button>
              )}

              {onOpenMachiningModal && (
                <button
                  onClick={onOpenMachiningModal}
                  className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-700 hover:text-amber-600 dark:hover:text-amber-400 transition-all shadow-none hover:shadow-sm"
                  title="กระดานติดตามงานสั่งกลึง (Machining Kanban), Drawing Viewer & Work Order"
                >
                  <Wrench className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                  <span>งานสั่งกลึง</span>
                </button>
              )}

              {onOpenAiAssistantModal && (
                <button
                  onClick={onOpenAiAssistantModal}
                  className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-black text-indigo-700 dark:text-indigo-300 hover:bg-white dark:hover:bg-slate-700 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all shadow-none hover:shadow-sm group relative"
                  title="ผู้ช่วย AI ตรวจสอบ BOM, ตรวจของคู่ตัว, แจ้งเตือนระยะเวลานำส่ง และแนะนำลดต้นทุน"
                >
                  <Bot className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 animate-pulse" />
                  <span>AI ตรวจ BOM</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping absolute -top-0.5 -right-0.5"></span>
                </button>
              )}

              {onOpenAssemblyKitting && (
                <button
                  onClick={onOpenAssemblyKitting}
                  className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-700 hover:text-emerald-600 dark:hover:text-emerald-400 transition-all shadow-none hover:shadow-sm"
                  title="โหมดจัดชุดอะไหล่ประกอบ (Assembly Kitting & Pick List) บน Tablet"
                >
                  <PackageCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>จัดชุดประกอบ</span>
                </button>
              )}

              {onOpenVendorPortal && (
                <button
                  onClick={onOpenVendorPortal}
                  className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-700 hover:text-blue-600 dark:hover:text-blue-400 transition-all shadow-none hover:shadow-sm"
                  title="พอร์ทัลร้านกลึง: ส่ง Magic Link ให้ร้านกลึงเปิดดูแบบและอัปเดตราคา/สถานะเอง"
                >
                  <Share2 className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                  <span>พอร์ทัลร้านกลึง</span>
                </button>
              )}
            </div>

            {/* Utility Actions */}
            <button
              onClick={() => window.print()}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition-all border border-slate-200/80 dark:border-slate-700 shadow-sm print:hidden"
              title="พิมพ์เพื่อขอราคา (ซ่อนราคาและแถบจัดการ)"
            >
              <Printer className="w-3.5 h-3.5 text-slate-500" />
              <span className="hidden sm:inline">พิมพ์ขอราคา</span>
            </button>

            <button
              onClick={onAddPart}
              className="flex items-center space-x-1.5 px-3.5 py-1.5 bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-800 text-white rounded-xl text-xs font-black shadow-md shadow-red-600/20 hover:scale-[1.02] active:scale-[0.98] transition-all print:hidden"
            >
              <Plus className="w-4 h-4" />
              <span>+ เพิ่ม Part</span>
            </button>
          </div>

        </div>

        {/* Tier 2: Smart Filter Pills & Global Search */}
        <div className="p-2.5 sm:px-4 bg-slate-50/70 dark:bg-slate-950/40 flex flex-wrap items-center justify-between gap-2.5 text-xs">
          
          {/* Left: Filter Pills */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center space-x-1 text-slate-400 font-bold text-[11px] uppercase tracking-wider mr-1">
              <Filter className="w-3.5 h-3.5" />
              <span>กรอง:</span>
            </div>

            {/* Module Filter Pill */}
            <div className="flex items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 rounded-xl px-2.5 py-1 shadow-sm">
              <Layers className="w-3.5 h-3.5 text-slate-400 mr-1.5 shrink-0" />
              <span className="font-bold text-slate-500 dark:text-slate-400 mr-1">Module:</span>
              <select
                value={selectedModuleFilter}
                onChange={(e) => setSelectedModuleFilter(e.target.value)}
                className="bg-transparent font-bold text-slate-900 dark:text-white focus:outline-none cursor-pointer text-xs"
              >
                <option value="ALL">ทุก Module ({parts.length})</option>
                {modules.map(m => (
                  <option key={m.id} value={m.id}>{m.code} - {m.name}</option>
                ))}
              </select>
            </div>

            {/* Category Filter Pill */}
            <div className="flex items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 rounded-xl px-2.5 py-1 shadow-sm">
              <span className="font-bold text-slate-500 dark:text-slate-400 mr-1">ประเภท:</span>
              <select
                value={selectedCategoryFilter}
                onChange={(e) => setSelectedCategoryFilter(e.target.value)}
                className="bg-transparent font-bold text-slate-900 dark:text-white focus:outline-none cursor-pointer text-xs"
              >
                <option value="ALL">MC + EE ทั้งหมด</option>
                <option value="MC">MC (Mechanical)</option>
                <option value="EE">EE (Electrical)</option>
              </select>
            </div>

            {/* Part Type Filter Pill */}
            <div className="flex items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 rounded-xl px-2.5 py-1 shadow-sm">
              <select
                value={selectedPartTypeFilter}
                onChange={(e) => setSelectedPartTypeFilter(e.target.value)}
                className="bg-transparent font-bold text-slate-900 dark:text-white focus:outline-none cursor-pointer text-xs"
              >
                <option value="ALL">Standard & Feb ทั้งหมด</option>
                <option value="Standard Part">Standard Part</option>
                <option value="Feb Part">Feb Part</option>
              </select>
            </div>

            {/* Reset Filter Button */}
            {(selectedModuleFilter !== 'ALL' || selectedCategoryFilter !== 'ALL' || selectedPartTypeFilter !== 'ALL') && (
              <button
                onClick={() => {
                  setSelectedModuleFilter('ALL');
                  setSelectedCategoryFilter('ALL');
                  setSelectedPartTypeFilter('ALL');
                }}
                className="text-[11px] font-bold text-red-600 hover:text-red-700 dark:text-red-400 underline ml-1 cursor-pointer"
              >
                ล้างตัวกรอง
              </button>
            )}
          </div>

          {/* Right: Search Input */}
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ค้นหาชื่อ Part, DWG, สเปก..."
              className="w-full pl-8 pr-7 py-1 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 font-bold transition-all shadow-sm"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

        </div>

      </div>

      {/* Main Scrollable Data Table Container */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm">
        <div className="max-h-[calc(100vh-280px)] overflow-y-auto overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="sticky top-0 z-10 bg-slate-50 dark:bg-slate-900/80 border-b-2 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-black">
              <tr className="divide-x divide-slate-200 dark:divide-slate-700">
                <th onClick={() => handleSort('itemNo')} className="px-3 py-3 w-16 text-center whitespace-nowrap cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-900">
                  <div className="flex items-center justify-center space-x-1">
                    <span>ITEM #</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th className="px-3 py-3 whitespace-nowrap min-w-[130px]">DWG. NO.</th>
                <th onClick={() => handleSort('partName')} className="px-3 py-3 min-w-[220px] cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-900">
                  <div className="flex items-center space-x-1">
                    <span>PART NAME & TYPE SPEC</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th className="px-3 py-3 text-center whitespace-nowrap min-w-[100px]">MODULE</th>
                <th className="px-3 py-3 text-center whitespace-nowrap w-16">CAT</th>
                <th className="px-3 py-3 text-center whitespace-nowrap min-w-[110px]">PART TYPE</th>
                <th className="px-3 py-3 text-right whitespace-nowrap min-w-[80px]">Q'TY</th>
                <th className="px-3 py-3 text-right whitespace-nowrap min-w-[110px] print:hidden">UNIT PRICE</th>
                <th onClick={() => handleSort('totalAmount')} className="px-3 py-3 text-right whitespace-nowrap min-w-[120px] cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-900 print:hidden">
                  <div className="flex items-center justify-end space-x-1">
                    <span>TOTAL (฿)</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400 print:hidden" />
                  </div>
                </th>
                <th className="px-3 py-3 whitespace-nowrap min-w-[130px] print:hidden">SUPPLIER</th>
                <th className="px-3 py-3 text-center whitespace-nowrap w-20 print:hidden">LINK</th>
                <th className="px-3 py-3 text-center font-mono whitespace-nowrap min-w-[120px] print:hidden">PO NUMBER</th>
                <th className="px-3 py-3 whitespace-nowrap min-w-[145px] bg-blue-50/70 dark:bg-blue-950/30 text-blue-900 dark:text-blue-200 print:hidden">
                  <div className="flex items-center space-x-1">
                    <Calendar className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                    <span>วันสั่งสินค้า</span>
                  </div>
                </th>
                <th className="px-3 py-3 whitespace-nowrap min-w-[170px] bg-indigo-50/70 dark:bg-indigo-950/30 text-indigo-900 dark:text-indigo-200 print:hidden">
                  <div className="flex items-center space-x-1">
                    <Truck className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                    <span>กำหนดส่งสินค้าเข้า</span>
                  </div>
                </th>
                <th className="px-3 py-3 text-center whitespace-nowrap min-w-[100px] print:hidden">STATUS</th>
                <th className="px-3 py-3 text-center whitespace-nowrap w-20 print:hidden">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredParts.length === 0 ? (
                <tr>
                  <td colSpan={16} className="p-8 text-center text-slate-400 font-medium">
                    ไม่พบรายการ Part List ตามเงื่อนไขที่เลือก
                  </td>
                </tr>
              ) : (
                filteredParts.map((part) => {
                  const amount = part.totalAmount || (part.qty * part.unitPrice);
                  return (
                    <tr key={part.id} className="divide-x divide-slate-100 dark:divide-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="px-3 py-3 font-mono font-bold text-slate-500 text-center whitespace-nowrap">{part.itemNo}</td>
                      <td className="px-3 py-3 font-mono font-bold text-slate-700 dark:text-slate-300 text-[11px] whitespace-nowrap">
                        {part.dwgNo || '-'}
                      </td>
                      <td className="px-3 py-3">
                        <div className="font-extrabold text-slate-900 dark:text-white">{part.partName}</div>
                        <div className="text-[10px] font-mono text-slate-500">{part.typeSpec || '-'}</div>
                      </td>
                      <td className="px-3 py-3 text-center">
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700">
                          {getModuleCode(part.moduleId)}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-center">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-black ${
                          part.category === 'MC' 
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300' 
                            : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                        }`}>
                          {part.category}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-center">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          part.partType === 'Standard Part'
                            ? 'bg-sky-50 text-sky-800 dark:bg-sky-950 dark:text-sky-300'
                            : 'bg-indigo-50 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300'
                        }`}>
                          {part.partType}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-right font-mono font-bold text-slate-800 dark:text-slate-200">
                        {part.qty} <span className="text-[10px] text-slate-400 font-normal">{part.unit}</span>
                      </td>
                      <td className="px-3 py-3 text-right font-mono text-slate-600 dark:text-slate-400 print:hidden">
                        {formatCurrency(part.unitPrice)}
                      </td>
                      <td className="px-3 py-3 text-right font-mono font-black text-slate-900 dark:text-white print:hidden">
                        {formatCurrency(amount)}
                      </td>
                      <td className="px-3 py-3 text-slate-800 dark:text-slate-200 font-bold text-[11px] print:hidden">
                        <div className="flex items-center">
                          {part.supplier || part.maker || '-'}
                        </div>
                      </td>
                      <td className="px-3 py-3 text-center print:hidden">
                        {part.purchaseLink ? (
                          <a
                            href={part.purchaseLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center text-[10px] font-bold text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 px-2 py-1 rounded-lg transition-colors border border-blue-200 dark:border-blue-800"
                            title="เปิดลิงก์สั่งซื้อ"
                          >
                            <span className="truncate max-w-[80px]">{formatShortUrl(part.purchaseLink)}</span>
                          </a>
                        ) : (
                          <span className="text-slate-300 dark:text-slate-600">-</span>
                        )}
                      </td>

                      {/* PO Number */}
                      <td className="px-3 py-3 font-mono font-bold text-slate-800 dark:text-slate-200 whitespace-nowrap text-center print:hidden">
                        {part.poNumber ? (
                          <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700">
                            {part.poNumber}
                          </span>
                        ) : (
                          <span className="text-slate-400 italic text-[11px]">-</span>
                        )}
                      </td>

                      {/* วันสั่งสินค้า (Order Date) */}
                      <td className="px-3 py-3 bg-blue-50/20 dark:bg-blue-950/10 whitespace-nowrap print:hidden">
                        <div className="flex items-center space-x-1.5">
                          <Calendar className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                          <input
                            type="date"
                            value={part.orderDate ? String(part.orderDate).split('T')[0] : ''}
                            onChange={(e) => onUpdatePartStatus && onUpdatePartStatus(part.id, part.status, { orderDate: e.target.value })}
                            className="w-32 px-1.5 py-0.5 text-xs font-mono font-bold rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                            title="เลือกวันสั่งสินค้า"
                          />
                        </div>
                      </td>

                      {/* กำหนดส่งสินค้าเข้า (Receive / Expected Delivery Date) */}
                      <td className="px-3 py-3 bg-indigo-50/20 dark:bg-indigo-950/10 whitespace-nowrap print:hidden">
                        <div className="flex flex-col space-y-1">
                          <div className="flex items-center space-x-1.5">
                            <Truck className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                            <input
                              type="date"
                              value={part.receiveDate ? String(part.receiveDate).split('T')[0] : ''}
                              onChange={(e) => onUpdatePartStatus && onUpdatePartStatus(part.id, part.status, { receiveDate: e.target.value })}
                              className="w-32 px-1.5 py-0.5 text-xs font-mono font-bold rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                              title="เลือกกำหนดส่งสินค้าเข้า"
                            />
                          </div>
                          {getDeliveryBadge(part.receiveDate, part.status)}
                        </div>
                      </td>

                      <td className="px-3 py-3 text-center print:hidden">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          part.status === 'Received' || part.status === 'Completed' || part.status === 'In Assembly'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            : part.status === 'Ordered'
                            ? 'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300'
                            : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                        }`}>
                          {part.status}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-center print:hidden">
                        <div className="flex items-center justify-center space-x-1">
                          {onOpenQrModal && (
                            <button
                              onClick={() => onOpenQrModal(part)}
                              className="p-1 text-slate-500 hover:text-red-600 bg-slate-100 dark:bg-slate-800 rounded transition-colors"
                              title="ดูและพิมพ์ป้ายสติกเกอร์ QR Tag ชิ้นส่วนนี้"
                            >
                              <QrCode className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button
                            onClick={() => onEditPart(part)}
                            className="p-1 text-slate-500 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-800 rounded transition-colors"
                            title="แก้ไข"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onDeletePart(part.id)}
                            className="p-1 text-slate-500 hover:text-rose-600 bg-slate-100 dark:bg-slate-800 rounded transition-colors"
                            title="ลบ"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer Count Summary Bar */}
        <div className="px-3 py-3 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center text-xs font-bold text-slate-700 dark:text-slate-300">
          <span>แสดง {filteredParts.length} จากทั้งหมด {parts.length} รายการ</span>
          <span className="font-mono text-slate-900 dark:text-white font-black">
            ราคารวมทั้งสิ้น: {formatCurrency(filteredParts.reduce((acc, p) => acc + (p.totalAmount || (p.qty * p.unitPrice)), 0))}
          </span>
        </div>

      </div>

    </div>
  );
};
