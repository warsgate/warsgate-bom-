import React, { useState, useMemo } from 'react';
import { 
  ShoppingCart, 
  PackageCheck, 
  Clock, 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Search,
  Truck,
  Warehouse,
  Check,
  ChevronDown,
  Send,
  BellRing
} from 'lucide-react';
import { BomPartItem, ModuleItem, PartStatus } from '../types/bom';
import { calculateProcurementSummary, formatCurrency } from '../utils/costCalculator';
import { formatShortUrl } from '../utils/urlFormatter';
import { lineApi } from '../api/client';

interface ProcurementViewProps {
  parts: BomPartItem[];
  modules: ModuleItem[];
  onUpdatePartStatus: (partId: string, status: PartStatus, extraData?: { poNumber?: string; storeLocation?: string; receiveDate?: string }) => void;
  onEditPart: (part: BomPartItem) => void;
}

export const ProcurementView: React.FC<ProcurementViewProps> = ({
  parts,
  modules,
  onUpdatePartStatus,
  onEditPart,
}) => {
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('ALL');
  const [selectedSupplierFilter, setSelectedSupplierFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const procurementSummary = useMemo(() => {
    return calculateProcurementSummary(parts);
  }, [parts]);

  const {
    totalTargetCost,
    totalActualCost,
    totalVariance,
    isSavings,
    pendingItemsCount,
    pendingTargetCost,
    orderedItemsCount,
    orderedActualCost,
    receivedItemsCount,
    receivedActualCost,
    supplierSummaries,
  } = procurementSummary;

  const filteredParts = useMemo(() => {
    return parts.filter(part => {
      if (selectedStatusFilter === 'PENDING' && part.status !== 'Planned') return false;
      if (selectedStatusFilter === 'ORDERED' && part.status !== 'Ordered') return false;
      if (selectedStatusFilter === 'RECEIVED' && part.status !== 'Received') return false;
      if (selectedStatusFilter === 'STORE' && part.status !== 'Received' && part.status !== 'Completed' && part.status !== 'In Assembly') return false;

      if (selectedSupplierFilter !== 'ALL' && (part.supplier || '') !== selectedSupplierFilter) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = part.partName.toLowerCase().includes(q);
        const matchesSpec = part.typeSpec.toLowerCase().includes(q);
        const matchesSupplier = (part.supplier || '').toLowerCase().includes(q);
        const matchesPo = (part.poNumber || '').toLowerCase().includes(q);
        const matchesStore = (part.storeLocation || '').toLowerCase().includes(q);
        if (!matchesName && !matchesSpec && !matchesSupplier && !matchesPo && !matchesStore) {
          return false;
        }
      }

      return true;
    });
  }, [parts, selectedStatusFilter, selectedSupplierFilter, searchQuery]);

  const handleQuickReceive = (part: BomPartItem) => {
    const today = new Date().toISOString().split('T')[0];
    const location = prompt('ระบุตำแหน่งจัดเก็บในสโตร์ (Store Location):', part.storeLocation || 'Store Shelf A-1');
    if (location !== null) {
      onUpdatePartStatus(part.id, 'Received', {
        receiveDate: today,
        storeLocation: location,
      });
    }
  };

  const handleQuickOrder = (part: BomPartItem) => {
    const po = prompt('ระบุเลขที่ใบสั่งซื้อ (PO Number):', part.poNumber || `PO-2026-${Math.floor(Math.random() * 899 + 100)}`);
    if (po) {
      onUpdatePartStatus(part.id, 'Ordered', {
        poNumber: po,
      });
    }
  };

  return (
    <div className="space-y-4">
      
      {/* KPI Cards: Target VS Actual Cost & Ordering/Receiving Status */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        
        {/* KPI 1: Cost Target VS Actual PO Cost */}
        <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              Target Cost vs Actual PO
            </span>
            <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-1">
            <div className="text-[11px] text-slate-600 dark:text-slate-400 font-bold">
              ตั้งไว้: <span className="font-black text-slate-900 dark:text-white">{formatCurrency(totalTargetCost)}</span>
            </div>
            <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight mt-0.5">
              จริง: {formatCurrency(totalActualCost)}
            </h3>
            <div className="mt-1 text-[11px]">
              {isSavings ? (
                <span className="text-emerald-700 dark:text-emerald-400 font-extrabold flex items-center">
                  <TrendingDown className="w-3 h-3 mr-0.5" />
                  ประหยัดกว่าเป้า {formatCurrency(totalVariance)}
                </span>
              ) : (
                <span className="text-rose-700 dark:text-rose-400 font-extrabold flex items-center">
                  <TrendingUp className="w-3 h-3 mr-0.5" />
                  เกินงบ {formatCurrency(Math.abs(totalVariance))}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* KPI 2: Still Pending Order */}
        <div className="p-3.5 rounded-xl border border-amber-200 dark:border-amber-950/60 bg-amber-50/50 dark:bg-slate-900/80 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black text-amber-900 dark:text-amber-300 uppercase tracking-wider">
              ยังไม่สั่งซื้อ (Pending PO)
            </span>
            <div className="p-2 rounded-lg bg-amber-200 dark:bg-amber-500/20 text-amber-800 dark:text-amber-400">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-1">
            <h3 className="text-2xl font-black text-amber-900 dark:text-amber-300 tracking-tight">
              {pendingItemsCount} <span className="text-xs font-bold text-slate-600">รายการ</span>
            </h3>
            <p className="text-[11px] text-amber-900 dark:text-amber-300 font-bold mt-0.5">
              มูลค่างบตั้งไว้: {formatCurrency(pendingTargetCost)}
            </p>
          </div>
        </div>

        {/* KPI 3: Ordered / In Transit */}
        <div className="p-3.5 rounded-xl border border-sky-200 dark:border-sky-950/60 bg-sky-50/50 dark:bg-slate-900/80 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black text-sky-900 dark:text-sky-300 uppercase tracking-wider">
              สั่งซื้อแล้ว (In Transit)
            </span>
            <div className="p-2 rounded-lg bg-sky-200 dark:bg-sky-500/20 text-sky-800 dark:text-sky-400">
              <Truck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-1">
            <h3 className="text-2xl font-black text-sky-900 dark:text-sky-300 tracking-tight">
              {orderedItemsCount} <span className="text-xs font-bold text-slate-600">รายการ</span>
            </h3>
            <p className="text-[11px] text-sky-900 dark:text-sky-300 font-bold mt-0.5">
              มูลค่าสั่งซื้อจริง: {formatCurrency(orderedActualCost)}
            </p>
          </div>
        </div>

        {/* KPI 4: Store Received */}
        <div className="p-3.5 rounded-xl border border-emerald-200 dark:border-emerald-950/60 bg-emerald-50/50 dark:bg-slate-900/80 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black text-emerald-900 dark:text-emerald-300 uppercase tracking-wider">
              รับเข้าสโตร์แล้ว (Inventory)
            </span>
            <div className="p-2 rounded-lg bg-emerald-200 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-400">
              <Warehouse className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-1">
            <h3 className="text-2xl font-black text-emerald-900 dark:text-emerald-300 tracking-tight">
              {receivedItemsCount} <span className="text-xs font-bold text-slate-600">รายการ</span>
            </h3>
            <p className="text-[11px] text-emerald-900 dark:text-emerald-300 font-bold mt-0.5">
              มูลค่าในสโตร์: {formatCurrency(receivedActualCost)}
            </p>
          </div>
        </div>

      </div>

      {/* Main Purchasing & Store Table */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm space-y-3">
        
        {/* Table Filters & Header Bar */}
        <div className="p-3 bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-2 text-xs">
          
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="font-black text-slate-700 dark:text-slate-300 mr-1">สถานะ:</span>
            
            <button
              onClick={() => setSelectedStatusFilter('ALL')}
              className={`px-2.5 py-1 rounded-lg text-xs font-black transition-all ${
                selectedStatusFilter === 'ALL'
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700'
              }`}
            >
              ทั้งหมด ({parts.length})
            </button>

            <button
              onClick={() => setSelectedStatusFilter('PENDING')}
              className={`px-2.5 py-1 rounded-lg text-xs font-black transition-all ${
                selectedStatusFilter === 'PENDING'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
              }`}
            >
              ยังไม่สั่งซื้อ ({pendingItemsCount})
            </button>

            <button
              onClick={() => setSelectedStatusFilter('ORDERED')}
              className={`px-2.5 py-1 rounded-lg text-xs font-black transition-all ${
                selectedStatusFilter === 'ORDERED'
                  ? 'bg-sky-600 text-white shadow-sm'
                  : 'bg-sky-50 dark:bg-sky-950/40 text-sky-900 dark:text-sky-300 border border-sky-200 dark:border-sky-800'
              }`}
            >
              สั่งซื้อแล้ว ({orderedItemsCount})
            </button>

            <button
              onClick={() => setSelectedStatusFilter('STORE')}
              className={`px-2.5 py-1 rounded-lg text-xs font-black transition-all ${
                selectedStatusFilter === 'STORE'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
              }`}
            >
              รับเข้าสโตร์แล้ว ({receivedItemsCount + procurementSummary.completedItemsCount})
            </button>
          </div>

          <div className="flex items-center space-x-2 w-full md:w-auto">
            <button
              onClick={async () => {
                if (pendingItemsCount === 0) {
                  alert('ไม่มีรายการที่ค้างสั่งซื้อในระบบขณะนี้');
                  return;
                }
                if (!confirm(`ต้องการส่งสรุปรายการค้างสั่งซื้อ (${pendingItemsCount} รายการ) เข้าแอป LINE หรือไม่?`)) return;
                try {
                  const activeProjId = parts[0]?.projectId;
                  const res = await lineApi.triggerProcurementAlert(activeProjId);
                  if (res.success) {
                    alert('✅ ส่งการ์ดสรุปรายการค้างสั่งซื้อเข้า LINE สำเร็จเรียบร้อยแล้ว!');
                  } else {
                    alert('❌ ไม่สามารถส่งเข้า LINE ได้: ' + (res.error || 'กรุณาตรวจสอบการตั้งค่า LINE Token ในเมนูแจ้งเตือน LINE'));
                  }
                } catch (err: any) {
                  alert('❌ เกิดข้อผิดพลาด: ' + err.message + '\n\n(หากยังไม่ได้ตั้งค่า Token ให้ไปที่เมนู แจ้งเตือน LINE ก่อนครับ)');
                }
              }}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-black text-xs flex items-center space-x-1.5 shadow-sm shrink-0 transition-all"
              title="ส่งสรุปรายการค้างสั่งซื้อเข้า LINE ทันที"
            >
              <Send className="w-3.5 h-3.5" />
              <span>ส่งแจ้งเตือน LINE</span>
            </button>

            <div className="w-full md:w-56 relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ค้นหา PO, Supplier..."
                className="w-full pl-7 pr-2 py-1 text-xs bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-red-500 font-bold"
              />
              <Search className="w-3 h-3 text-slate-400 absolute left-2 top-2" />
            </div>
          </div>
        </div>

        {/* Data Table */}
        <div className="max-h-[calc(100vh-280px)] overflow-y-auto overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="sticky top-0 z-10 bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-black border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="p-2.5">ITEM #</th>
                <th className="p-2.5">PART NAME & TYPE SPEC</th>
                <th className="p-2.5">SUPPLIER</th>
                <th className="p-2.5 text-center">LINK</th>
                <th className="p-2.5 font-mono">PO NUMBER</th>
                <th className="p-2.5 text-right">TARGET COST (฿)</th>
                <th className="p-2.5 text-right">ACTUAL PO COST (฿)</th>
                <th className="p-2.5 text-center">VARIANCE</th>
                <th className="p-2.5">STORE LOCATION</th>
                <th className="p-2.5 text-center">STATUS</th>
                <th className="p-2.5 text-center">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {filteredParts.map(part => {
                const targetAmt = part.targetTotalAmount || (part.qty * (part.targetUnitPrice || part.unitPrice));
                const actualAmt = part.totalAmount || (part.qty * part.unitPrice);
                const diff = targetAmt - actualAmt;
                const isSavingsItem = diff >= 0;

                return (
                  <tr key={part.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/60 transition-colors">
                    <td className="p-2.5 font-mono font-bold text-slate-500">{part.itemNo}</td>
                    <td className="p-2.5">
                      <div className="font-extrabold text-slate-900 dark:text-white">{part.partName}</div>
                      <div className="text-[10px] font-mono text-slate-500">{part.typeSpec || '-'}</div>
                    </td>
                    <td className="p-2.5 font-bold text-slate-800 dark:text-slate-200">
                      <div className="flex items-center">
                        {part.supplier || 'Unspecified'}
                      </div>
                    </td>
                    <td className="p-2.5 text-center">
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
                    <td className="p-2.5 font-mono font-bold text-slate-800 dark:text-slate-200">
                      {part.poNumber ? (
                        <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700">
                          {part.poNumber}
                        </span>
                      ) : (
                        <span className="text-slate-400 italic">ยังไม่มี PO</span>
                      )}
                    </td>
                    <td className="p-2.5 text-right font-mono text-slate-600 dark:text-slate-400 font-medium">
                      {formatCurrency(targetAmt)}
                    </td>
                    <td className="p-2.5 text-right font-mono font-black text-slate-900 dark:text-white">
                      {formatCurrency(actualAmt)}
                    </td>
                    <td className="p-2.5 text-center">
                      {isSavingsItem ? (
                        <span className="text-emerald-700 dark:text-emerald-400 font-bold text-[11px]">
                          +{formatCurrency(diff)}
                        </span>
                      ) : (
                        <span className="text-rose-700 dark:text-rose-400 font-bold text-[11px]">
                          -{formatCurrency(Math.abs(diff))}
                        </span>
                      )}
                    </td>
                    <td className="p-2.5 text-slate-800 dark:text-slate-200 font-mono text-[11px]">
                      {part.storeLocation ? (
                        <span className="inline-flex items-center text-emerald-700 dark:text-emerald-400 font-bold">
                          <Warehouse className="w-3 h-3 mr-1" /> {part.storeLocation}
                        </span>
                      ) : (
                        <span className="text-slate-400 italic">-</span>
                      )}
                    </td>
                    <td className="p-2.5 text-center">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        part.status === 'Received' || part.status === 'Completed' || part.status === 'In Assembly'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          : part.status === 'Ordered'
                          ? 'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300'
                          : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                      }`}>
                        {part.status === 'Planned' ? 'ยังไม่สั่งซื้อ' : part.status === 'Ordered' ? 'สั่งซื้อแล้ว' : 'รับเข้าสโตร์แล้ว'}
                      </span>
                    </td>
                    <td className="p-2.5 text-center">
                      <div className="flex items-center justify-center space-x-1">
                        {part.status === 'Planned' && (
                          <button
                            onClick={() => handleQuickOrder(part)}
                            className="px-2 py-0.5 bg-sky-600 hover:bg-sky-500 text-white rounded text-[10px] font-bold transition-all shadow-sm flex items-center"
                          >
                            <ShoppingCart className="w-3 h-3 mr-1" /> สั่งซื้อ (PO)
                          </button>
                        )}

                        {part.status === 'Ordered' && (
                          <button
                            onClick={() => handleQuickReceive(part)}
                            className="px-2 py-0.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[10px] font-bold transition-all shadow-sm flex items-center animate-pulse"
                          >
                            <PackageCheck className="w-3 h-3 mr-1" /> รับเข้าสโตร์
                          </button>
                        )}

                        {(part.status === 'Received' || part.status === 'Completed' || part.status === 'In Assembly') && (
                          <span className="text-emerald-700 dark:text-emerald-400 font-extrabold text-[11px] flex items-center">
                            <Check className="w-3 h-3 mr-0.5" /> ในสโตร์แล้ว
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

      </div>

    </div>
  );
};
