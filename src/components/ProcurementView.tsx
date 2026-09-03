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
  BellRing,
  Calendar,
  AlertTriangle,
  Edit3,
  X
} from 'lucide-react';
import { BomPartItem, ModuleItem, PartStatus } from '../types/bom';
import { calculateProcurementSummary, formatCurrency } from '../utils/costCalculator';
import { formatShortUrl } from '../utils/urlFormatter';
import { lineApi } from '../api/client';

interface ProcurementViewProps {
  parts: BomPartItem[];
  modules: ModuleItem[];
  onUpdatePartStatus: (
    partId: string, 
    status: PartStatus, 
    extraData?: { 
      poNumber?: string; 
      storeLocation?: string; 
      receiveDate?: string; 
      orderDate?: string;
      supplier?: string;
      [key: string]: any;
    }
  ) => void;
  onEditPart: (part: BomPartItem) => void;
}

const getTodayIso = () => new Date().toISOString().split('T')[0];

const getSevenDaysLaterIso = () => {
  const d = new Date();
  d.setDate(d.getDate() + 7);
  return d.toISOString().split('T')[0];
};

export const ProcurementView: React.FC<ProcurementViewProps> = ({
  parts,
  modules,
  onUpdatePartStatus,
  onEditPart,
}) => {
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>(() => {
    const params = new URLSearchParams(window.location.search);
    const filter = params.get('filter')?.toUpperCase() || params.get('status')?.toUpperCase();
    if (filter === 'PENDING' || filter === 'ORDERED' || filter === 'RECEIVED' || filter === 'STORE' || filter === 'OVERDUE') {
      return filter;
    }
    return 'ALL';
  });
  const [selectedSupplierFilter, setSelectedSupplierFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals state
  const [orderingPart, setOrderingPart] = useState<BomPartItem | null>(null);
  const [orderForm, setOrderForm] = useState({
    poNumber: '',
    orderDate: '',
    receiveDate: '',
    supplier: '',
    storeLocation: '',
  });

  const [receivingPart, setReceivingPart] = useState<BomPartItem | null>(null);
  const [receiveForm, setReceiveForm] = useState({
    receiveDate: '',
    storeLocation: '',
  });

  // Sync status filter if URL parameter changes
  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const filter = params.get('filter')?.toUpperCase() || params.get('status')?.toUpperCase();
    if (filter === 'PENDING' || filter === 'ORDERED' || filter === 'RECEIVED' || filter === 'STORE' || filter === 'OVERDUE') {
      setSelectedStatusFilter(filter);
    }
  }, []);

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

  // Calculate overdue items count (Ordered parts past their scheduled delivery date)
  const overdueItemsCount = useMemo(() => {
    const today = getTodayIso();
    return parts.filter(p => 
      p.status === 'Ordered' && 
      p.receiveDate && 
      p.receiveDate < today
    ).length;
  }, [parts]);

  const filteredParts = useMemo(() => {
    const today = getTodayIso();
    return parts.filter(part => {
      if (selectedStatusFilter === 'PENDING' && part.status !== 'Planned') return false;
      if (selectedStatusFilter === 'ORDERED' && part.status !== 'Ordered') return false;
      if (selectedStatusFilter === 'RECEIVED' && part.status !== 'Received') return false;
      if (selectedStatusFilter === 'STORE' && part.status !== 'Received' && part.status !== 'Completed' && part.status !== 'In Assembly') return false;
      if (selectedStatusFilter === 'OVERDUE') {
        if (!(part.status === 'Ordered' && part.receiveDate && part.receiveDate < today)) return false;
      }

      if (selectedSupplierFilter !== 'ALL' && (part.supplier || '') !== selectedSupplierFilter) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = part.partName.toLowerCase().includes(q);
        const matchesSpec = part.typeSpec.toLowerCase().includes(q);
        const matchesSupplier = (part.supplier || '').toLowerCase().includes(q);
        const matchesPo = (part.poNumber || '').toLowerCase().includes(q);
        const matchesStore = (part.storeLocation || '').toLowerCase().includes(q);
        const matchesOrderDate = (part.orderDate || '').toLowerCase().includes(q);
        const matchesReceiveDate = (part.receiveDate || '').toLowerCase().includes(q);
        if (!matchesName && !matchesSpec && !matchesSupplier && !matchesPo && !matchesStore && !matchesOrderDate && !matchesReceiveDate) {
          return false;
        }
      }

      return true;
    });
  }, [parts, selectedStatusFilter, selectedSupplierFilter, searchQuery]);

  // Open Order Modal
  const handleOpenOrderModal = (part: BomPartItem) => {
    setOrderingPart(part);
    setOrderForm({
      poNumber: part.poNumber || `PO-2026-${Math.floor(Math.random() * 899 + 100)}`,
      orderDate: part.orderDate || getTodayIso(),
      receiveDate: part.receiveDate || getSevenDaysLaterIso(),
      supplier: part.supplier || '',
      storeLocation: part.storeLocation || 'Store Shelf A-1',
    });
  };

  // Submit Order Modal
  const handleSubmitOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderingPart) return;
    onUpdatePartStatus(orderingPart.id, 'Ordered', {
      poNumber: orderForm.poNumber.trim(),
      orderDate: orderForm.orderDate || undefined,
      receiveDate: orderForm.receiveDate || undefined,
      supplier: orderForm.supplier.trim() || undefined,
      storeLocation: orderForm.storeLocation.trim() || undefined,
    });
    setOrderingPart(null);
  };

  // Open Receive Modal
  const handleOpenReceiveModal = (part: BomPartItem) => {
    setReceivingPart(part);
    setReceiveForm({
      receiveDate: part.receiveDate || getTodayIso(),
      storeLocation: part.storeLocation || 'Store Shelf A-1',
    });
  };

  // Submit Receive Modal
  const handleSubmitReceive = (e: React.FormEvent) => {
    e.preventDefault();
    if (!receivingPart) return;
    onUpdatePartStatus(receivingPart.id, 'Received', {
      receiveDate: receiveForm.receiveDate || getTodayIso(),
      storeLocation: receiveForm.storeLocation.trim() || undefined,
    });
    setReceivingPart(null);
  };

  // Helper for delivery status badge
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
          <Truck className="w-2.5 h-2.5 mr-0.5 text-amber-700" /> กำหนดส่งวันนี้
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
            <div className="flex items-baseline space-x-2">
              <h3 className="text-2xl font-black text-sky-900 dark:text-sky-300 tracking-tight">
                {orderedItemsCount} <span className="text-xs font-bold text-slate-600">รายการ</span>
              </h3>
              {overdueItemsCount > 0 && (
                <span className="px-1.5 py-0.5 rounded text-[10px] font-black bg-rose-100 dark:bg-rose-900/50 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800">
                  ⚠️ เลยกำหนด {overdueItemsCount}
                </span>
              )}
            </div>
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

            {overdueItemsCount > 0 && (
              <button
                onClick={() => setSelectedStatusFilter('OVERDUE')}
                className={`px-2.5 py-1 rounded-lg text-xs font-black transition-all flex items-center space-x-1 ${
                  selectedStatusFilter === 'OVERDUE'
                    ? 'bg-rose-600 text-white shadow-sm'
                    : 'bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800 animate-pulse'
                }`}
              >
                <AlertTriangle className="w-3 h-3 mr-1" />
                <span>เลยกำหนดส่ง ({overdueItemsCount})</span>
              </button>
            )}

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
            <thead className="sticky top-0 z-10 bg-slate-50 dark:bg-slate-900/80 border-b-2 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-black">
              <tr>
                <th className="px-3 py-3 whitespace-nowrap">ITEM #</th>
                <th className="px-3 py-3 min-w-[180px]">PART NAME & TYPE SPEC</th>
                <th className="px-3 py-3 whitespace-nowrap">SUPPLIER</th>
                <th className="px-3 py-3 text-center whitespace-nowrap">LINK</th>
                <th className="px-3 py-3 font-mono whitespace-nowrap">PO NUMBER</th>
                <th className="px-3 py-3 whitespace-nowrap min-w-[130px] bg-blue-50/70 dark:bg-blue-950/30 text-blue-900 dark:text-blue-200">
                  <div className="flex items-center space-x-1">
                    <Calendar className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                    <span>วันสั่งสินค้า</span>
                  </div>
                </th>
                <th className="px-3 py-3 whitespace-nowrap min-w-[160px] bg-indigo-50/70 dark:bg-indigo-950/30 text-indigo-900 dark:text-indigo-200">
                  <div className="flex items-center space-x-1">
                    <Truck className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                    <span>กำหนดส่งสินค้าเข้า</span>
                  </div>
                </th>
                <th className="px-3 py-3 text-right whitespace-nowrap">TARGET COST (฿)</th>
                <th className="px-3 py-3 text-right whitespace-nowrap">ACTUAL PO COST (฿)</th>
                <th className="px-3 py-3 text-center whitespace-nowrap">VARIANCE</th>
                <th className="px-3 py-3 whitespace-nowrap">STORE LOCATION</th>
                <th className="px-3 py-3 text-center whitespace-nowrap">STATUS</th>
                <th className="px-3 py-3 text-center whitespace-nowrap">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredParts.map(part => {
                const targetAmt = part.targetTotalAmount || (part.qty * (part.targetUnitPrice || part.unitPrice));
                const actualAmt = part.totalAmount || (part.qty * part.unitPrice);
                const diff = targetAmt - actualAmt;
                const isSavingsItem = diff >= 0;

                return (
                  <tr key={part.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="px-3 py-3 font-mono font-bold text-slate-500">{part.itemNo}</td>
                    
                    <td className="px-3 py-3">
                      <div className="font-extrabold text-slate-900 dark:text-white flex items-center justify-between group">
                        <span>{part.partName}</span>
                        <button
                          onClick={() => onEditPart(part)}
                          className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-opacity p-0.5"
                          title="แก้ไข Part"
                        >
                          <Edit3 className="w-3 h-3" />
                        </button>
                      </div>
                      <div className="text-[10px] font-mono text-slate-500">{part.typeSpec || '-'}</div>
                    </td>

                    <td className="px-3 py-3 font-bold text-slate-800 dark:text-slate-200 whitespace-nowrap">
                      {part.supplier || <span className="text-slate-400 font-normal italic">-</span>}
                    </td>

                    <td className="px-3 py-3 text-center whitespace-nowrap">
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

                    <td className="px-3 py-3 font-mono font-bold text-slate-800 dark:text-slate-200 whitespace-nowrap">
                      {part.poNumber ? (
                        <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700">
                          {part.poNumber}
                        </span>
                      ) : (
                        <span className="text-slate-400 italic">ยังไม่มี PO</span>
                      )}
                    </td>

                    {/* วันสั่งสินค้า (Order Date) */}
                    <td className="px-3 py-3 bg-blue-50/30 dark:bg-blue-950/10 whitespace-nowrap">
                      <div className="flex items-center space-x-1.5">
                        <Calendar className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                        <input
                          type="date"
                          value={part.orderDate ? String(part.orderDate).split('T')[0] : ''}
                          onChange={(e) => {
                            const newDate = e.target.value;
                            onUpdatePartStatus(part.id, part.status, { orderDate: newDate });
                          }}
                          className="w-32 px-1.5 py-0.5 text-xs font-mono font-bold rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                          title="คลิกเพื่อเลือกวันสั่งสินค้า"
                        />
                      </div>
                    </td>

                    {/* กำหนดส่งสินค้าเข้า (Receive / Expected Delivery Date) */}
                    <td className="px-3 py-3 bg-indigo-50/30 dark:bg-indigo-950/10 whitespace-nowrap">
                      <div className="flex flex-col space-y-1">
                        <div className="flex items-center space-x-1.5">
                          <Truck className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                          <input
                            type="date"
                            value={part.receiveDate ? String(part.receiveDate).split('T')[0] : ''}
                            onChange={(e) => {
                              const newDate = e.target.value;
                              onUpdatePartStatus(part.id, part.status, { receiveDate: newDate });
                            }}
                            className="w-32 px-1.5 py-0.5 text-xs font-mono font-bold rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                            title="คลิกเพื่อเลือกกำหนดส่งสินค้าเข้า"
                          />
                        </div>
                        {getDeliveryBadge(part.receiveDate, part.status)}
                      </div>
                    </td>

                    <td className="px-3 py-3 text-right font-mono text-slate-600 dark:text-slate-400 font-medium whitespace-nowrap">
                      {formatCurrency(targetAmt)}
                    </td>

                    <td className="px-3 py-3 text-right font-mono font-black text-slate-900 dark:text-white whitespace-nowrap">
                      {formatCurrency(actualAmt)}
                    </td>

                    <td className="px-3 py-3 text-center whitespace-nowrap">
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

                    <td className="px-3 py-3 text-slate-800 dark:text-slate-200 font-mono text-[11px] whitespace-nowrap">
                      {part.storeLocation ? (
                        <span className="inline-flex items-center text-emerald-700 dark:text-emerald-400 font-bold">
                          <Warehouse className="w-3 h-3 mr-1" /> {part.storeLocation}
                        </span>
                      ) : (
                        <span className="text-slate-400 italic">-</span>
                      )}
                    </td>

                    <td className="px-3 py-3 text-center whitespace-nowrap">
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

                    <td className="px-3 py-3 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center space-x-1.5">
                        {part.status === 'Planned' && (
                          <button
                            onClick={() => handleOpenOrderModal(part)}
                            className="px-2 py-1 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-[10px] font-bold transition-all shadow-sm flex items-center"
                            title="เปิดแบบฟอร์มออกใบสั่งซื้อและกำหนดวัน"
                          >
                            <ShoppingCart className="w-3 h-3 mr-1" /> สั่งซื้อ (PO)
                          </button>
                        )}

                        {part.status === 'Ordered' && (
                          <>
                            <button
                              onClick={() => handleOpenReceiveModal(part)}
                              className="px-2 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[10px] font-bold transition-all shadow-sm flex items-center animate-pulse"
                              title="บันทึกรับสินค้าเข้าสโตร์"
                            >
                              <PackageCheck className="w-3 h-3 mr-1" /> รับเข้าสโตร์
                            </button>
                            <button
                              onClick={() => handleOpenOrderModal(part)}
                              className="p-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-[10px] font-bold transition-all"
                              title="แก้ไขข้อมูล PO & วันที่"
                            >
                              <Edit3 className="w-3 h-3" />
                            </button>
                          </>
                        )}

                        {(part.status === 'Received' || part.status === 'Completed' || part.status === 'In Assembly') && (
                          <div className="flex items-center space-x-1">
                            <span className="text-emerald-700 dark:text-emerald-400 font-extrabold text-[11px] flex items-center">
                              <Check className="w-3 h-3 mr-0.5" /> ในสโตร์แล้ว
                            </span>
                            <button
                              onClick={() => onEditPart(part)}
                              className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded transition-colors"
                              title="ดูรายละเอียด Part"
                            >
                              <Edit3 className="w-3 h-3" />
                            </button>
                          </div>
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

      {/* ─── Order (PO) Modal ─────────────────────────────────────── */}
      {orderingPart && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-sm">
          <div className="glass-panel w-full max-w-lg rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 bg-sky-50 dark:bg-sky-950/40 border-b border-sky-100 dark:border-slate-800">
              <div className="flex items-center space-x-2">
                <div className="p-2 rounded-xl bg-sky-600 text-white shadow-sm">
                  <ShoppingCart className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-white">
                    สั่งซื้อสินค้า & กำหนดวันจัดส่ง (Purchase Order)
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    ระบุเลขที่ PO วันที่สั่งซื้อ และกำหนดวันที่สินค้าจะส่งเข้าสโตร์
                  </p>
                </div>
              </div>
              <button
                onClick={() => setOrderingPart(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-white dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmitOrder} className="p-4 space-y-4 text-xs">
              
              {/* Part Overview */}
              <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] font-mono font-bold text-slate-400">ITEM #{orderingPart.itemNo}</span>
                    <h4 className="font-black text-slate-900 dark:text-white text-sm">{orderingPart.partName}</h4>
                    <div className="text-[11px] font-mono text-slate-500">{orderingPart.typeSpec || '-'}</div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-bold text-slate-400">จำนวนสั่งซื้อ</span>
                    <div className="text-sm font-black text-slate-900 dark:text-white">{orderingPart.qty} {orderingPart.unit}</div>
                  </div>
                </div>
              </div>

              {/* PO Number */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  เลขที่ใบสั่งซื้อ (PO Number) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={orderForm.poNumber}
                  onChange={(e) => setOrderForm(prev => ({ ...prev, poNumber: e.target.value }))}
                  placeholder="e.g. PO-2026-001 หรือ SHP-123"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              {/* Order Date & Expected Delivery Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-black text-blue-700 dark:text-blue-400 mb-1 flex items-center">
                    <Calendar className="w-3.5 h-3.5 mr-1" /> วันสั่งสินค้า (Order Date)
                  </label>
                  <input
                    type="date"
                    required
                    value={orderForm.orderDate}
                    onChange={(e) => setOrderForm(prev => ({ ...prev, orderDate: e.target.value }))}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black text-indigo-700 dark:text-indigo-400 mb-1 flex items-center">
                    <Truck className="w-3.5 h-3.5 mr-1" /> กำหนดส่งสินค้าเข้า (Delivery Date)
                  </label>
                  <input
                    type="date"
                    required
                    value={orderForm.receiveDate}
                    onChange={(e) => setOrderForm(prev => ({ ...prev, receiveDate: e.target.value }))}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Supplier & Store Location */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    ผู้จำหน่าย / ร้านค้า (Supplier)
                  </label>
                  <input
                    type="text"
                    value={orderForm.supplier}
                    onChange={(e) => setOrderForm(prev => ({ ...prev, supplier: e.target.value }))}
                    placeholder="e.g. Mizumi, Omron, Shopee"
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    ตำแหน่งจัดเก็บในสโตร์ (Store Location)
                  </label>
                  <input
                    type="text"
                    value={orderForm.storeLocation}
                    onChange={(e) => setOrderForm(prev => ({ ...prev, storeLocation: e.target.value }))}
                    placeholder="e.g. Store Shelf A-1, Rack B"
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setOrderingPart(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-black bg-sky-600 hover:bg-sky-500 text-white shadow-md transition-all flex items-center space-x-1.5"
                >
                  <ShoppingCart className="w-3.5 h-3.5" />
                  <span>บันทึกสั่งซื้อ (Ordered)</span>
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* ─── Receive into Store Modal ─────────────────────────────── */}
      {receivingPart && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-sm">
          <div className="glass-panel w-full max-w-md rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 bg-emerald-50 dark:bg-emerald-950/40 border-b border-emerald-100 dark:border-slate-800">
              <div className="flex items-center space-x-2">
                <div className="p-2 rounded-xl bg-emerald-600 text-white shadow-sm">
                  <PackageCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-white">
                    รับสินค้าเข้าสโตร์ (Receive into Store)
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    ยืนยันวันที่รับสินค้าเข้าจริงและระบุตำแหน่งจัดเก็บ
                  </p>
                </div>
              </div>
              <button
                onClick={() => setReceivingPart(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-white dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmitReceive} className="p-4 space-y-4 text-xs">
              
              {/* Part Overview */}
              <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] font-mono font-bold text-slate-400">ITEM #{receivingPart.itemNo}</span>
                    <h4 className="font-black text-slate-900 dark:text-white text-sm">{receivingPart.partName}</h4>
                    <div className="text-[11px] font-mono text-slate-500">{receivingPart.typeSpec || '-'}</div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-bold text-slate-400">PO Number</span>
                    <div className="text-xs font-mono font-bold text-sky-700 dark:text-sky-400">{receivingPart.poNumber || '-'}</div>
                  </div>
                </div>

                {receivingPart.orderDate && (
                  <div className="pt-2 mt-2 border-t border-slate-200 dark:border-slate-800 flex justify-between text-[11px] text-slate-500">
                    <span>วันสั่งซื้อ: <strong className="text-slate-700 dark:text-slate-300 font-mono">{receivingPart.orderDate}</strong></span>
                    {receivingPart.receiveDate && (
                      <span>กำหนดส่งเดิม: <strong className="text-slate-700 dark:text-slate-300 font-mono">{receivingPart.receiveDate}</strong></span>
                    )}
                  </div>
                )}
              </div>

              {/* Actual Receive Date */}
              <div>
                <label className="block text-xs font-black text-emerald-800 dark:text-emerald-400 mb-1 flex items-center">
                  <Calendar className="w-3.5 h-3.5 mr-1" /> วันที่รับสินค้าเข้าจริง (Receive Date) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={receiveForm.receiveDate}
                  onChange={(e) => setReceiveForm(prev => ({ ...prev, receiveDate: e.target.value }))}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Store Location */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  ตำแหน่งจัดเก็บในคลัง (Store Location) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={receiveForm.storeLocation}
                  onChange={(e) => setReceiveForm(prev => ({ ...prev, storeLocation: e.target.value }))}
                  placeholder="e.g. Store Shelf A-1, Bin C-02"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setReceivingPart(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-black bg-emerald-600 hover:bg-emerald-500 text-white shadow-md transition-all flex items-center space-x-1.5"
                >
                  <PackageCheck className="w-3.5 h-3.5" />
                  <span>บันทึกรับเข้าสโตร์ (Received)</span>
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
};
