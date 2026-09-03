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
  Clock
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

  const getModuleCode = (modId: string) => {
    const mod = modules.find(m => m.id === modId);
    return mod ? mod.code : 'UNASSIGNED';
  };

  return (
    <div className="space-y-3">
      
      {/* Compact Controls & Filter Bar */}
      <div className="print:hidden p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-2 text-xs">
        
        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Module Filter */}
          <div className="flex items-center space-x-1">
            <span className="font-bold text-slate-700 dark:text-slate-300">Module:</span>
            <select
              value={selectedModuleFilter}
              onChange={(e) => setSelectedModuleFilter(e.target.value)}
              className="bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg px-2 py-1 text-xs font-bold text-slate-900 dark:text-white focus:outline-none"
            >
              <option value="ALL">ทุก Module ({parts.length})</option>
              {modules.map(m => (
                <option key={m.id} value={m.id}>{m.code} - {m.name}</option>
              ))}
            </select>
          </div>

          {/* Category MC/EE */}
          <div className="flex items-center space-x-1">
            <span className="font-bold text-slate-700 dark:text-slate-300">ประเภท:</span>
            <select
              value={selectedCategoryFilter}
              onChange={(e) => setSelectedCategoryFilter(e.target.value)}
              className="bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg px-2 py-1 text-xs font-bold text-slate-900 dark:text-white focus:outline-none"
            >
              <option value="ALL">MC + EE ทั้งหมด</option>
              <option value="MC">MC (Mechanical)</option>
              <option value="EE">EE (Electrical)</option>
            </select>
          </div>

          {/* Standard vs Feb */}
          <div className="flex items-center space-x-1">
            <select
              value={selectedPartTypeFilter}
              onChange={(e) => setSelectedPartTypeFilter(e.target.value)}
              className="bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg px-2 py-1 text-xs font-bold text-slate-900 dark:text-white focus:outline-none"
            >
              <option value="ALL">Standard & Feb ทั้งหมด</option>
              <option value="Standard Part">Standard Part</option>
              <option value="Feb Part">Feb Part</option>
            </select>
          </div>
        </div>

        {/* Search & Actions */}
        <div className="flex items-center space-x-2 w-full md:w-auto justify-end">
          <div className="relative w-48">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ค้นหา..."
              className="w-full pl-7 pr-2 py-1 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-red-500 font-bold"
            />
            <Search className="w-3 h-3 text-slate-400 absolute left-2 top-2" />
          </div>

          <button
            onClick={() => window.print()}
            className="px-3 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-black transition-all shadow-sm flex items-center whitespace-nowrap print:hidden"
            title="พิมพ์เพื่อขอราคา (ซ่อนราคาและแถบจัดการ)"
          >
            <Printer className="w-3.5 h-3.5 mr-1" />
            <span className="hidden sm:inline">พิมพ์ขอราคา</span>
          </button>
          <button
            onClick={onAddPart}
            className="px-3 py-1 bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-800 text-white rounded-lg text-xs font-black transition-all shadow-sm flex items-center whitespace-nowrap print:hidden"
          >
            <Plus className="w-3.5 h-3.5 mr-1" />
            + Part
          </button>
        </div>

      </div>

      {/* Main Scrollable Data Table Container */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm">
        <div className="max-h-[calc(100vh-280px)] overflow-y-auto overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="sticky top-0 z-10 bg-slate-50 dark:bg-slate-900/80 border-b-2 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-black">
              <tr className="divide-x divide-slate-200 dark:divide-slate-700">
                <th onClick={() => handleSort('itemNo')} className="px-3 py-3 cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-900">
                  <div className="flex items-center space-x-1">
                    <span>ITEM #</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th className="px-3 py-3">DWG. NO.</th>
                <th onClick={() => handleSort('partName')} className="px-3 py-3 cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-900">
                  <div className="flex items-center space-x-1">
                    <span>PART NAME & TYPE SPEC</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th className="px-3 py-3">MODULE</th>
                <th className="px-3 py-3 text-center">CAT</th>
                <th className="px-3 py-3 text-center">PART TYPE</th>
                <th className="px-3 py-3 text-right">Q'TY</th>
                <th className="px-3 py-3 text-right print:hidden">UNIT PRICE</th>
                <th onClick={() => handleSort('totalAmount')} className="px-3 py-3 text-right cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-900 print:hidden">
                  <div className="flex items-center justify-end space-x-1">
                    <span>TOTAL (฿)</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400 print:hidden" />
                  </div>
                </th>
                <th className="px-3 py-3 print:hidden">SUPPLIER</th>
                <th className="px-3 py-3 text-center print:hidden">LINK</th>
                <th className="px-3 py-3 font-mono whitespace-nowrap print:hidden">PO NUMBER</th>
                <th className="px-3 py-3 whitespace-nowrap min-w-[130px] bg-blue-50/70 dark:bg-blue-950/30 text-blue-900 dark:text-blue-200 print:hidden">
                  <div className="flex items-center space-x-1">
                    <Calendar className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                    <span>วันสั่งสินค้า</span>
                  </div>
                </th>
                <th className="px-3 py-3 whitespace-nowrap min-w-[160px] bg-indigo-50/70 dark:bg-indigo-950/30 text-indigo-900 dark:text-indigo-200 print:hidden">
                  <div className="flex items-center space-x-1">
                    <Truck className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                    <span>กำหนดส่งสินค้าเข้า</span>
                  </div>
                </th>
                <th className="px-3 py-3 text-center print:hidden">STATUS</th>
                <th className="px-3 py-3 text-center print:hidden">ACTION</th>
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
                      <td className="px-3 py-3 font-mono font-bold text-slate-500">{part.itemNo}</td>
                      <td className="px-3 py-3 font-mono font-bold text-slate-700 dark:text-slate-300 text-[11px]">
                        {part.dwgNo || '-'}
                      </td>
                      <td className="px-3 py-3">
                        <div className="font-extrabold text-slate-900 dark:text-white">{part.partName}</div>
                        <div className="text-[10px] font-mono text-slate-500">{part.typeSpec || '-'}</div>
                      </td>
                      <td className="px-3 py-3">
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
                      <td className="px-3 py-3 font-mono font-bold text-slate-800 dark:text-slate-200 whitespace-nowrap print:hidden">
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
