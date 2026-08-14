import React, { useState, useMemo } from 'react';
import { 
  Plus, 
  Search, 
  Edit3, 
  Trash2, 
  ArrowUpDown,
  Printer
} from 'lucide-react';
import { BomPartItem, ModuleItem } from '../types/bom';
import { formatCurrency } from '../utils/costCalculator';

interface BomTableProps {
  parts: BomPartItem[];
  modules: ModuleItem[];
  onAddPart: () => void;
  onEditPart: (part: BomPartItem) => void;
  onDeletePart: (partId: string) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
}

export const BomTable: React.FC<BomTableProps> = ({
  parts,
  modules,
  onAddPart,
  onEditPart,
  onDeletePart,
  searchQuery,
  setSearchQuery,
}) => {
  const [selectedModuleFilter, setSelectedModuleFilter] = useState<string>('ALL');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('ALL');
  const [selectedPartTypeFilter, setSelectedPartTypeFilter] = useState<string>('ALL');
  const [sortField, setSortField] = useState<keyof BomPartItem>('itemNo');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

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
        <div className="max-h-[580px] overflow-y-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="sticky top-0 z-10 bg-slate-100 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 font-black">
              <tr>
                <th onClick={() => handleSort('itemNo')} className="p-2.5 cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-900">
                  <div className="flex items-center space-x-1">
                    <span>ITEM #</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th className="p-2.5">DWG. NO.</th>
                <th onClick={() => handleSort('partName')} className="p-2.5 cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-900">
                  <div className="flex items-center space-x-1">
                    <span>PART NAME & TYPE SPEC</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th className="p-2.5">MODULE</th>
                <th className="p-2.5 text-center">CAT</th>
                <th className="p-2.5 text-center">PART TYPE</th>
                <th className="p-2.5 text-right">Q'TY</th>
                <th className="p-2.5 text-right print:hidden">UNIT PRICE</th>
                <th onClick={() => handleSort('totalAmount')} className="p-2.5 text-right cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-900 print:hidden">
                  <div className="flex items-center justify-end space-x-1">
                    <span>TOTAL (฿)</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400 print:hidden" />
                  </div>
                </th>
                <th className="p-2.5 print:hidden">SUPPLIER</th>
                <th className="p-2.5 text-center print:hidden">STATUS</th>
                <th className="p-2.5 text-center print:hidden">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {filteredParts.length === 0 ? (
                <tr>
                  <td colSpan={12} className="p-8 text-center text-slate-400 font-medium">
                    ไม่พบรายการ Part List ตามเงื่อนไขที่เลือก
                  </td>
                </tr>
              ) : (
                filteredParts.map((part) => {
                  const amount = part.totalAmount || (part.qty * part.unitPrice);
                  return (
                    <tr key={part.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/60 transition-colors">
                      <td className="p-2.5 font-mono font-bold text-slate-500">{part.itemNo}</td>
                      <td className="p-2.5 font-mono font-bold text-slate-700 dark:text-slate-300 text-[11px]">
                        {part.dwgNo || '-'}
                      </td>
                      <td className="p-2.5">
                        <div className="font-extrabold text-slate-900 dark:text-white">{part.partName}</div>
                        <div className="text-[10px] font-mono text-slate-500">{part.typeSpec || '-'}</div>
                      </td>
                      <td className="p-2.5">
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700">
                          {getModuleCode(part.moduleId)}
                        </span>
                      </td>
                      <td className="p-2.5 text-center">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-black ${
                          part.category === 'MC' 
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300' 
                            : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                        }`}>
                          {part.category}
                        </span>
                      </td>
                      <td className="p-2.5 text-center">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          part.partType === 'Standard Part'
                            ? 'bg-sky-50 text-sky-800 dark:bg-sky-950 dark:text-sky-300'
                            : 'bg-indigo-50 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300'
                        }`}>
                          {part.partType}
                        </span>
                      </td>
                      <td className="p-2.5 text-right font-mono font-bold text-slate-800 dark:text-slate-200">
                        {part.qty} <span className="text-[10px] text-slate-400 font-normal">{part.unit}</span>
                      </td>
                      <td className="p-2.5 text-right font-mono text-slate-600 dark:text-slate-400 print:hidden">
                        {formatCurrency(part.unitPrice)}
                      </td>
                      <td className="p-2.5 text-right font-mono font-black text-slate-900 dark:text-white print:hidden">
                        {formatCurrency(amount)}
                      </td>
                      <td className="p-2.5 text-slate-800 dark:text-slate-200 font-bold text-[11px] print:hidden">
                        {part.supplier || part.maker || '-'}
                      </td>
                      <td className="p-2.5 text-center print:hidden">
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
                      <td className="p-2.5 text-center print:hidden">
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
        <div className="p-2.5 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center text-xs font-bold text-slate-700 dark:text-slate-300">
          <span>แสดง {filteredParts.length} จากทั้งหมด {parts.length} รายการ</span>
          <span className="font-mono text-slate-900 dark:text-white font-black">
            ราคารวมทั้งสิ้น: {formatCurrency(filteredParts.reduce((acc, p) => acc + (p.totalAmount || (p.qty * p.unitPrice)), 0))}
          </span>
        </div>

      </div>

    </div>
  );
};
