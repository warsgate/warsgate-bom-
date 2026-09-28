import React, { useState, useEffect, useMemo } from 'react';
import { 
  PackageOpen, 
  Search, 
  Plus, 
  Edit3, 
  Trash2, 
  Database, 
  Info, 
  Filter, 
  X, 
  RefreshCw, 
  FileSpreadsheet,
  AlertTriangle,
  ArrowRightLeft,
  Boxes,
  CheckCircle2,
  TrendingDown,
  TrendingUp,
  Sparkles,
  Layers,
  ArrowUpRight,
  MapPin,
  Check
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { MasterPartItem, CategoryType, PartCategoryType, ProjectItem, ModuleItem, BomPartItem } from '../types/bom';
import { masterPartsApi } from '../api/client';
import { formatCurrency } from '../utils/costCalculator';
import { formatShortUrl } from '../utils/urlFormatter';

interface MasterPartLibraryProps {
  projects?: ProjectItem[];
  activeProjectId?: string;
  modules?: ModuleItem[];
  onAddPartToBom?: (partData: Partial<BomPartItem>) => Promise<void> | void;
}

// Helper to parse stock metadata from description
export const parseStockMeta = (desc: string = '') => {
  const stockMatch = desc.match(/\[STOCK:?\s*(\d+(?:\.\d+)?)(?:\||\s*)MIN:?\s*(\d+(?:\.\d+)?)\]/i);
  if (stockMatch) {
    return {
      stockQty: parseFloat(stockMatch[1]) || 0,
      minStockQty: parseFloat(stockMatch[2]) || 0,
      cleanDesc: desc.replace(/\[STOCK:?\s*\d+(?:\.\d+)?(?:\||\s*)MIN:?\s*\d+(?:\.\d+)?\]/i, '').trim()
    };
  }
  return { stockQty: 0, minStockQty: 0, cleanDesc: desc };
};

export const formatStockMeta = (cleanDesc: string, stockQty: number, minStockQty: number) => {
  return `[STOCK:${stockQty}|MIN:${minStockQty}] ${cleanDesc || ''}`.trim();
};

export const MasterPartLibrary: React.FC<MasterPartLibraryProps> = ({
  projects = [],
  activeProjectId = '',
  modules = [],
  onAddPartToBom,
}) => {
  const [masterParts, setMasterParts] = useState<MasterPartItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [stockFilter, setStockFilter] = useState<'ALL' | 'LOW_STOCK' | 'IN_STOCK'>('ALL');
  const [successToast, setSuccessToast] = useState('');
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPart, setEditingPart] = useState<MasterPartItem | null>(null);

  // Quick Restock Modal state
  const [isRestockModalOpen, setIsRestockModalOpen] = useState(false);
  const [restockTargetPart, setRestockTargetPart] = useState<MasterPartItem | null>(null);
  const [restockAddQty, setRestockAddQty] = useState<number>(50);

  // Quick Issue to Project BOM Modal state
  const [isIssueModalOpen, setIsIssueModalOpen] = useState(false);
  const [issueTargetPart, setIssueTargetPart] = useState<MasterPartItem | null>(null);
  const [issueSelectedProjectId, setIssueSelectedProjectId] = useState<string>(activeProjectId);
  const [issueSelectedModuleId, setIssueSelectedModuleId] = useState<string>('');
  const [issueQty, setIssueQty] = useState<number>(1);
  const [isDeductingStock, setIsDeductingStock] = useState(true);

  // Selection state for RFQ
  const [selectedParts, setSelectedParts] = useState<Set<string>>(new Set());
  const [isRfqModalOpen, setIsRfqModalOpen] = useState(false);
  const [rfqQuantities, setRfqQuantities] = useState<Record<string, string>>({});
  const [rfqRemarks, setRfqRemarks] = useState<Record<string, string>>({});

  // Form state
  const [partName, setPartName] = useState('');
  const [typeSpec, setTypeSpec] = useState('');
  const [category, setCategory] = useState<CategoryType>('MC');
  const [partType, setPartType] = useState<PartCategoryType>('Standard Part');
  const [unit, setUnit] = useState('EA');
  const [maker, setMaker] = useState('');
  const [supplier, setSupplier] = useState('');
  const [unitPrice, setUnitPrice] = useState<number>(0);
  const [storeLocation, setStoreLocation] = useState('');
  const [purchaseLink, setPurchaseLink] = useState('');
  const [description, setDescription] = useState('');
  const [stockQty, setStockQty] = useState<number>(0);
  const [minStockQty, setMinStockQty] = useState<number>(0);

  const showToast = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(''), 4000);
  };

  const fetchMasterParts = async () => {
    try {
      setIsLoading(true);
      const data = await masterPartsApi.getAll();
      setMasterParts(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMasterParts();
  }, []);

  // Update selected project for issue modal if activeProjectId changes
  useEffect(() => {
    if (activeProjectId && !issueSelectedProjectId) {
      setIssueSelectedProjectId(activeProjectId);
    }
  }, [activeProjectId, issueSelectedProjectId]);

  const openAddModal = () => {
    setEditingPart(null);
    setPartName('');
    setTypeSpec('');
    setCategory('MC');
    setPartType('Standard Part');
    setUnit('EA');
    setMaker('');
    setSupplier('');
    setUnitPrice(0);
    setStoreLocation('');
    setPurchaseLink('');
    setDescription('');
    setStockQty(0);
    setMinStockQty(0);
    setIsModalOpen(true);
  };

  const openEditModal = (part: MasterPartItem) => {
    const meta = parseStockMeta(part.description);
    setEditingPart(part);
    setPartName(part.partName);
    setTypeSpec(part.typeSpec);
    setCategory(part.category);
    setPartType(part.partType);
    setUnit(part.unit);
    setMaker(part.maker);
    setSupplier(part.supplier);
    setUnitPrice(part.unitPrice);
    setStoreLocation(part.storeLocation);
    setPurchaseLink(part.purchaseLink || '');
    setDescription(meta.cleanDesc);
    setStockQty(part.stockQty ?? meta.stockQty);
    setMinStockQty(part.minStockQty ?? meta.minStockQty);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    const textFields = [partName, typeSpec, maker, supplier, storeLocation, description];
    if (textFields.some(val => /https?:\/\/|www\./i.test(String(val || '')))) {
      alert('ไม่อนุญาตให้ใส่ Link Web ในช่องข้อมูลทั่วไป กรุณาใส่ลิงก์ที่ช่อง "Link สั่งซื้อ (URL)" เท่านั้นครับ');
      return;
    }

    const encodedDescription = formatStockMeta(description, stockQty, minStockQty);

    const payload = {
      partName, 
      typeSpec, 
      category, 
      partType, 
      unit, 
      maker, 
      supplier, 
      unitPrice: Number(unitPrice), 
      storeLocation, 
      purchaseLink, 
      description: encodedDescription,
      stockQty: Number(stockQty),
      minStockQty: Number(minStockQty)
    };
    try {
      if (editingPart) {
        await masterPartsApi.update(editingPart.id, payload);
        showToast(`บันทึกการแก้ไข "${partName}" เรียบร้อยแล้ว`);
      } else {
        await masterPartsApi.create(payload);
        showToast(`เพิ่มอะไหล่ใหม่ "${partName}" ลงคลังกลางสำเร็จ`);
      }
      setIsModalOpen(false);
      fetchMasterParts();
    } catch (err) {
      alert('Failed to save master part');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('ยืนยันการลบรายการอะไหล่นี้ออกจากคลัง?')) return;
    try {
      await masterPartsApi.delete(id);
      showToast('ลบรายการอะไหล่ออกจากคลังเรียบร้อย');
      fetchMasterParts();
    } catch (err) {
      alert('Failed to delete master part');
    }
  };

  const handleSync = async () => {
    if (!confirm('ต้องการนำเข้ารายการ Part ที่ไม่ซ้ำจากทุกโปรเจกต์เดิม เข้ามายังคลังอะไหล่หรือไม่? (ใช้เวลาสักครู่)')) return;
    try {
      setIsLoading(true);
      const res = await masterPartsApi.sync();
      alert(`นำเข้าสำเร็จ! เพิ่มรายการใหม่ลงคลังทั้งหมด ${res.count} รายการ`);
      fetchMasterParts();
    } catch (err) {
      alert('Failed to sync master parts');
      setIsLoading(false);
    }
  };

  // Quick Restock Action
  const handleOpenRestockModal = (part: MasterPartItem) => {
    setRestockTargetPart(part);
    setRestockAddQty(50);
    setIsRestockModalOpen(true);
  };

  const handleExecuteRestock = async () => {
    if (!restockTargetPart) return;
    const meta = parseStockMeta(restockTargetPart.description);
    const currentStock = restockTargetPart.stockQty ?? meta.stockQty;
    const newStock = Math.max(0, currentStock + Number(restockAddQty || 0));
    const encodedDesc = formatStockMeta(meta.cleanDesc, newStock, restockTargetPart.minStockQty ?? meta.minStockQty);

    try {
      await masterPartsApi.update(restockTargetPart.id, {
        description: encodedDesc,
        stockQty: newStock
      });
      showToast(`เติมสต็อก "${restockTargetPart.partName}" +${restockAddQty} ${restockTargetPart.unit} สำเร็จ (คงเหลือ: ${newStock})`);
      setIsRestockModalOpen(false);
      fetchMasterParts();
    } catch (err) {
      alert('ไม่สามารถอัปเดตสต็อกได้');
    }
  };

  // Quick Issue to Machine BOM Action
  const handleOpenIssueModal = (part: MasterPartItem) => {
    setIssueTargetPart(part);
    setIssueQty(1);
    setIsDeductingStock(true);
    const targetProj = issueSelectedProjectId || activeProjectId || projects[0]?.id || '';
    setIssueSelectedProjectId(targetProj);
    const projMods = modules.filter(m => m.projectId === targetProj);
    setIssueSelectedModuleId(projMods[0]?.id || '');
    setIsIssueModalOpen(true);
  };

  const handleExecuteIssue = async () => {
    if (!issueTargetPart || !onAddPartToBom) return;
    const meta = parseStockMeta(issueTargetPart.description);
    const currentStock = issueTargetPart.stockQty ?? meta.stockQty;
    const qtyToDeduct = Number(issueQty || 1);

    if (isDeductingStock && currentStock < qtyToDeduct) {
      if (!confirm(`อะไหล่ในคลังมีเพียง ${currentStock} ${issueTargetPart.unit} (ต้องการเบิก ${qtyToDeduct}) ยืนยันการเบิกติดลบหรือไม่?`)) {
        return;
      }
    }

    try {
      // 1. Create part in project BOM
      await onAddPartToBom({
        projectId: issueSelectedProjectId,
        moduleId: issueSelectedModuleId || undefined,
        partName: issueTargetPart.partName,
        typeSpec: issueTargetPart.typeSpec,
        category: issueTargetPart.category,
        partType: issueTargetPart.partType,
        unit: issueTargetPart.unit,
        maker: issueTargetPart.maker,
        supplier: issueTargetPart.supplier,
        unitPrice: issueTargetPart.unitPrice,
        targetUnitPrice: issueTargetPart.unitPrice,
        qty: qtyToDeduct,
        storeLocation: issueTargetPart.storeLocation,
        purchaseLink: issueTargetPart.purchaseLink || '',
        status: 'In Assembly',
        remarks: `[เบิกจากคลังกลาง] ${issueTargetPart.storeLocation ? `(ที่เก็บ: ${issueTargetPart.storeLocation})` : ''}`,
      });

      // 2. Deduct central stock if checked
      if (isDeductingStock) {
        const newStock = Math.max(0, currentStock - qtyToDeduct);
        const encodedDesc = formatStockMeta(meta.cleanDesc, newStock, issueTargetPart.minStockQty ?? meta.minStockQty);
        await masterPartsApi.update(issueTargetPart.id, {
          description: encodedDesc,
          stockQty: newStock
        });
      }

      showToast(`เบิก "${issueTargetPart.partName}" จำนวน ${qtyToDeduct} ${issueTargetPart.unit} เข้า BOM เรียบร้อย!`);
      setIsIssueModalOpen(false);
      fetchMasterParts();
    } catch (err: any) {
      console.error(err);
      alert('เกิดข้อผิดพลาดในการเบิกอะไหล่เข้า BOM: ' + (err?.message || ''));
    }
  };

  // RFQ Selection handlers
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedParts(new Set(filteredParts.map(p => p.id)));
    } else {
      setSelectedParts(new Set());
    }
  };

  const handleSelect = (id: string) => {
    const next = new Set(selectedParts);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedParts(next);
  };

  const handleOpenRFQModal = () => {
    if (selectedParts.size === 0) return;
    const initialQty: Record<string, string> = {};
    const initialRemarks: Record<string, string> = {};
    selectedParts.forEach(id => {
      initialQty[id] = '1';
      const part = masterParts.find(p => p.id === id);
      initialRemarks[id] = part ? parseStockMeta(part.description).cleanDesc : '';
    });
    setRfqQuantities(initialQty);
    setRfqRemarks(initialRemarks);
    setIsRfqModalOpen(true);
  };

  const executeExportRFQ = () => {
    const selectedList = masterParts.filter(p => selectedParts.has(p.id));
    if (selectedList.length === 0) return;

    const dataToExport = selectedList.map((p, index) => ({
      'No.': index + 1,
      'Part Name': p.partName,
      'Type / Spec': p.typeSpec || '-',
      'Category': p.category,
      'Type': p.partType,
      'Unit': p.unit,
      'Quantity': Number(rfqQuantities[p.id]) || 1,
      'Maker': p.maker || '-',
      'Supplier': p.supplier || '-',
      'Store Location': p.storeLocation || '-',
      'Target Price': p.unitPrice || 0,
      'Purchase Link': p.purchaseLink || '-',
      'Remark': rfqRemarks[p.id] || ''
    }));

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'RFQ_Request');
    XLSX.writeFile(wb, `RFQ_MasterParts_${new Date().toISOString().split('T')[0]}.xlsx`);
    setIsRfqModalOpen(false);
  };

  // Stock Metrics Calculation
  const stockMetrics = useMemo(() => {
    let totalSKUs = masterParts.length;
    let totalUnits = 0;
    let lowStockCount = 0;
    let totalInventoryValue = 0;

    masterParts.forEach(p => {
      const meta = parseStockMeta(p.description);
      const stock = p.stockQty ?? meta.stockQty;
      const minStock = p.minStockQty ?? meta.minStockQty;
      totalUnits += stock;
      totalInventoryValue += stock * (p.unitPrice || 0);
      if (stock <= minStock && minStock > 0) {
        lowStockCount++;
      }
    });

    return {
      totalSKUs,
      totalUnits,
      lowStockCount,
      totalInventoryValue
    };
  }, [masterParts]);

  const filteredParts = useMemo(() => {
    let list = masterParts;
    
    // Filter by stock level
    if (stockFilter === 'LOW_STOCK') {
      list = list.filter(p => {
        const meta = parseStockMeta(p.description);
        const stock = p.stockQty ?? meta.stockQty;
        const minStock = p.minStockQty ?? meta.minStockQty;
        return stock <= minStock && minStock > 0;
      });
    } else if (stockFilter === 'IN_STOCK') {
      list = list.filter(p => {
        const meta = parseStockMeta(p.description);
        const stock = p.stockQty ?? meta.stockQty;
        return stock > 0;
      });
    }

    if (!searchQuery.trim()) return list;
    const q = searchQuery.toLowerCase();
    return list.filter(p => 
      p.partName.toLowerCase().includes(q) || 
      p.typeSpec.toLowerCase().includes(q) || 
      p.maker.toLowerCase().includes(q) || 
      p.supplier.toLowerCase().includes(q) ||
      (p.storeLocation && p.storeLocation.toLowerCase().includes(q))
    );
  }, [masterParts, searchQuery, stockFilter]);

  // Selected project modules for issue modal
  const issueProjectModules = useMemo(() => {
    return modules.filter(m => m.projectId === issueSelectedProjectId);
  }, [modules, issueSelectedProjectId]);

  return (
    <div className="space-y-4">
      {/* Toast Notification */}
      {successToast && (
        <div className="fixed top-4 right-4 z-50 bg-emerald-600 text-white px-4 py-3 rounded-xl shadow-xl flex items-center space-x-2 text-xs font-bold animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-200" />
          <span>{successToast}</span>
        </div>
      )}

      {/* Header Stock KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3.5 rounded-xl shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase">รายการ SKU ในคลัง</span>
            <Boxes className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="mt-1 text-xl font-black text-slate-900 dark:text-white">
            {stockMetrics.totalSKUs} <span className="text-xs font-bold text-slate-400">รายการ</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3.5 rounded-xl shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase">ยอดสต็อกรวมทั้งหมด</span>
            <Database className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="mt-1 text-xl font-black text-emerald-600 dark:text-emerald-400">
            {stockMetrics.totalUnits.toLocaleString()} <span className="text-xs font-bold text-slate-400">ชิ้น</span>
          </div>
        </div>

        <div 
          onClick={() => setStockFilter(prev => prev === 'LOW_STOCK' ? 'ALL' : 'LOW_STOCK')}
          className={`border p-3.5 rounded-xl shadow-sm cursor-pointer transition-all ${
            stockFilter === 'LOW_STOCK'
              ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-400 ring-2 ring-rose-400/20'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-rose-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-rose-600 dark:text-rose-400 uppercase flex items-center">
              ⚠️ ต่ำกว่า Safety Stock
            </span>
            <AlertTriangle className="w-4 h-4 text-rose-500" />
          </div>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-xl font-black text-rose-600 dark:text-rose-400">
              {stockMetrics.lowStockCount} <span className="text-xs font-bold text-slate-400">SKU</span>
            </span>
            <span className="text-[10px] font-bold text-rose-500 underline">
              {stockFilter === 'LOW_STOCK' ? 'ดูทั้งหมด' : 'คลิกเพื่อกรอง'}
            </span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3.5 rounded-xl shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase">มูลค่าสต็อกรวมในคลัง</span>
            <TrendingUp className="w-4 h-4 text-blue-500" />
          </div>
          <div className="mt-1 text-xl font-black text-slate-900 dark:text-white font-mono">
            {formatCurrency(stockMetrics.totalInventoryValue)}
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        
        {/* Action Bar */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3">
          
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative flex-1 sm:w-72">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text"
                placeholder="ค้นหาชื่อ, สเปค, Maker, Supplier, ที่เก็บ..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-bold"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Filter pills */}
            <div className="flex items-center bg-slate-100 dark:bg-slate-800/80 p-0.5 rounded-xl border border-slate-200 dark:border-slate-700/60 text-[11px] font-bold">
              <button
                onClick={() => setStockFilter('ALL')}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  stockFilter === 'ALL'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm font-extrabold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                ทั้งหมด ({masterParts.length})
              </button>
              <button
                onClick={() => setStockFilter('LOW_STOCK')}
                className={`px-2.5 py-1 rounded-lg transition-all flex items-center ${
                  stockFilter === 'LOW_STOCK'
                    ? 'bg-rose-500 text-white shadow-sm font-extrabold'
                    : 'text-rose-600 dark:text-rose-400 hover:text-rose-700'
                }`}
              >
                <AlertTriangle className="w-3 h-3 mr-1" />
                สต็อกต่ำ ({stockMetrics.lowStockCount})
              </button>
              <button
                onClick={() => setStockFilter('IN_STOCK')}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  stockFilter === 'IN_STOCK'
                    ? 'bg-emerald-600 text-white shadow-sm font-extrabold'
                    : 'text-emerald-600 dark:text-emerald-400 hover:text-emerald-700'
                }`}
              >
                พร้อมเบิก
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {selectedParts.size > 0 && (
              <button
                onClick={handleOpenRFQModal}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 mr-1.5" />
                ส่งขอราคา RFQ ({selectedParts.size})
              </button>
            )}

            <button
              onClick={handleSync}
              title="ดึงข้อมูลอะไหล่ทั้งหมดที่เคยใช้ใน BOM ทุกโปรเจกต์ มาเพิ่มลงในคลังกลาง"
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition-all flex items-center"
            >
              <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
              Sync จาก BOM
            </button>

            <button
              onClick={openAddModal}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black transition-all shadow-sm flex items-center"
            >
              <Plus className="w-3.5 h-3.5 mr-1" />
              เพิ่มอะไหล่ใหม่
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto max-h-[calc(100vh-360px)] overflow-y-auto custom-scrollbar">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="sticky top-0 z-10 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-extrabold">
              <tr className="divide-x divide-slate-200 dark:divide-slate-800">
                <th className="px-3 py-3 w-10 text-center">
                  <input 
                    type="checkbox" 
                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                    checked={filteredParts.length > 0 && selectedParts.size === filteredParts.length}
                    onChange={handleSelectAll}
                  />
                </th>
                <th className="px-3 py-3 w-12 text-center">ลำดับ</th>
                <th className="px-3 py-3 min-w-[200px]">ชื่ออะไหล่ & สเปค</th>
                <th className="px-3 py-3 w-20 text-center">หมวดหมู่</th>
                <th className="px-3 py-3 w-28 text-center">ที่เก็บ (Bin)</th>
                <th className="px-3 py-3 w-28 text-center">สถานะสต็อก</th>
                <th className="px-3 py-3 min-w-[100px]">Maker</th>
                <th className="px-3 py-3 min-w-[110px]">Supplier</th>
                <th className="px-3 py-3 w-24 text-center">Link สั่งซื้อ</th>
                <th className="px-3 py-3 w-28 text-right">ราคาต่อหน่วย</th>
                <th className="px-3 py-3 w-36 text-center">เบิก/เติมสต็อก</th>
                <th className="px-3 py-3 w-16 text-center">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {isLoading ? (
                <tr>
                  <td colSpan={12} className="p-8 text-center text-slate-400 font-medium">กำลังโหลดข้อมูลคลังอะไหล่...</td>
                </tr>
              ) : filteredParts.length === 0 ? (
                <tr>
                  <td colSpan={12} className="p-12 text-center text-slate-400 font-medium">
                    <PackageOpen className="w-8 h-8 mx-auto mb-3 opacity-20" />
                    <p>ไม่พบรายการอะไหล่ตามเงื่อนไขที่เลือก</p>
                  </td>
                </tr>
              ) : (
                filteredParts.map((part, index) => {
                  const meta = parseStockMeta(part.description);
                  const currentStock = part.stockQty ?? meta.stockQty;
                  const minStock = part.minStockQty ?? meta.minStockQty;
                  const isLowStock = minStock > 0 && currentStock <= minStock;
                  const isOutOfStock = currentStock <= 0;

                  return (
                    <tr key={part.id} className="divide-x divide-slate-100 dark:divide-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="px-3 py-2.5 text-center">
                        <input 
                          type="checkbox" 
                          className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                          checked={selectedParts.has(part.id)}
                          onChange={() => handleSelect(part.id)}
                        />
                      </td>
                      <td className="px-3 py-2.5 font-mono font-bold text-slate-400 text-center">{index + 1}</td>
                      <td className="px-3 py-2.5">
                        <div className="font-extrabold text-slate-900 dark:text-white flex items-center">
                          {part.partName}
                          {isLowStock && (
                            <span className="ml-1.5 px-1 py-0.2 rounded text-[9px] font-black bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300">
                              REORDER
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] font-mono text-slate-500 truncate max-w-[280px]">
                          {part.typeSpec || '-'}
                        </div>
                      </td>
                      <td className="px-3 py-2.5 text-center">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-black ${
                          part.category === 'MC' 
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300' 
                            : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                        }`}>
                          {part.category}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-center">
                        {part.storeLocation ? (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono text-[10px] font-bold">
                            <MapPin className="w-2.5 h-2.5 mr-0.5 text-slate-400" />
                            {part.storeLocation}
                          </span>
                        ) : (
                          <span className="text-slate-300 dark:text-slate-600">-</span>
                        )}
                      </td>
                      <td className="px-3 py-2.5 text-center">
                        {isOutOfStock ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                            หมดสต็อก (0)
                          </span>
                        ) : isLowStock ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-100 text-rose-700 dark:bg-rose-950/80 dark:text-rose-300">
                            ⚠️ เหลือ {currentStock} (Min: {minStock})
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                            ✓ มี {currentStock} {part.unit}
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-2.5 text-slate-600 dark:text-slate-400">{part.maker || '-'}</td>
                      <td className="px-3 py-2.5 text-slate-600 dark:text-slate-400">{part.supplier || '-'}</td>
                      <td className="px-3 py-2.5 text-center">
                        {part.purchaseLink ? (
                          <a
                            href={part.purchaseLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center text-[10px] font-bold text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/30 px-2 py-1 rounded-lg transition-colors border border-blue-200 dark:border-blue-800"
                            title="เปิดลิงก์สั่งซื้อ"
                          >
                            <span className="truncate max-w-[70px]">{formatShortUrl(part.purchaseLink)}</span>
                          </a>
                        ) : (
                          <span className="text-slate-300 dark:text-slate-600">-</span>
                        )}
                      </td>
                      <td className="px-3 py-2.5 text-right font-mono font-black text-slate-900 dark:text-white">
                        {formatCurrency(part.unitPrice)}
                      </td>
                      <td className="px-3 py-2.5 text-center">
                        <div className="flex items-center justify-center space-x-1">
                          <button
                            onClick={() => handleOpenIssueModal(part)}
                            title="เบิกอะไหล่นี้เข้า BOM ของเครื่องจักร"
                            className="px-2 py-1 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 rounded-lg text-[10px] font-bold flex items-center transition-colors"
                          >
                            <ArrowRightLeft className="w-3 h-3 mr-1" />
                            เบิกเข้าเครื่อง
                          </button>
                          <button
                            onClick={() => handleOpenRestockModal(part)}
                            title="เติมสต็อกสินค้าคงคลัง"
                            className="p-1 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded-lg text-[10px] font-black transition-colors"
                          >
                            + เติม
                          </button>
                        </div>
                      </td>
                      <td className="px-3 py-2.5 text-center">
                        <div className="flex items-center justify-center space-x-1">
                          <button onClick={() => openEditModal(part)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors" title="แก้ไข">
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => handleDelete(part.id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors" title="ลบ">
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

        {/* Summary Footer */}
        <div className="bg-slate-50 dark:bg-slate-900/50 p-3 text-xs font-bold text-slate-600 dark:text-slate-400 flex flex-wrap items-center justify-between gap-4 border-t border-slate-200 dark:border-slate-800">
          <div>
            แสดงผล: <span className="text-indigo-600 dark:text-indigo-400 font-black text-sm">{filteredParts.length}</span> จากทั้งหมด {masterParts.length} รายการ
          </div>
          <div className="flex space-x-6 text-[11px]">
            <div className="flex items-center">
              <div className="w-2 h-2 rounded-full bg-blue-500 mr-2"></div>
              Mechanical (MC): <span className="text-blue-600 dark:text-blue-400 font-black ml-1">{filteredParts.filter(p => p.category === 'MC').length}</span>
            </div>
            <div className="flex items-center">
              <div className="w-2 h-2 rounded-full bg-amber-500 mr-2"></div>
              Electrical (EE): <span className="text-amber-600 dark:text-amber-400 font-black ml-1">{filteredParts.filter(p => p.category === 'EE').length}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Add / Edit Master Part Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-sm">
          <div className="glass-panel w-full max-w-2xl rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center">
                <Database className="w-4 h-4 mr-2 text-indigo-500" />
                {editingPart ? 'แก้ไขอะไหล่ในคลัง' : 'เพิ่มอะไหล่ลงคลัง (New Master Part)'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSave} className="p-5 space-y-4 max-h-[75vh] overflow-y-auto custom-scrollbar">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Part Name <span className="text-rose-500">*</span></label>
                  <input type="text" required value={partName} onChange={e => setPartName(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Type / Spec</label>
                  <input type="text" value={typeSpec} onChange={e => setTypeSpec(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono" />
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">หมวดหมู่</label>
                  <select value={category} onChange={e => setCategory(e.target.value as CategoryType)} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500">
                    <option value="MC">MC (Mechanical)</option>
                    <option value="EE">EE (Electrical)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">ประเภท</label>
                  <select value={partType} onChange={e => setPartType(e.target.value as PartCategoryType)} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500">
                    <option value="Standard Part">Standard Part</option>
                    <option value="Feb Part">Feb Part</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">หน่วย (Unit)</label>
                  <input type="text" value={unit} onChange={e => setUnit(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">ราคามาตรฐาน (฿)</label>
                  <input type="number" min="0" step="any" value={unitPrice} onChange={e => setUnitPrice(Number(e.target.value))} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold" />
                </div>
              </div>

              {/* Central Stock Management Fields */}
              <div className="p-3 bg-indigo-50/50 dark:bg-indigo-950/20 rounded-xl border border-indigo-100 dark:border-indigo-900/40 space-y-3">
                <div className="flex items-center text-xs font-black text-indigo-700 dark:text-indigo-300">
                  <Boxes className="w-4 h-4 mr-1.5" />
                  การจัดการสต็อกคงคลังส่วนกลาง (Central Store Inventory)
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">จำนวนคงเหลือในคลัง (Stock Qty)</label>
                    <input 
                      type="number" 
                      min="0" 
                      value={stockQty} 
                      onChange={e => setStockQty(Number(e.target.value))} 
                      className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white font-mono font-black focus:ring-2 focus:ring-indigo-500" 
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">จุดสั่งซื้อซ้ำ (Minimum Safety Stock)</label>
                    <input 
                      type="number" 
                      min="0" 
                      value={minStockQty} 
                      onChange={e => setMinStockQty(Number(e.target.value))} 
                      className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white font-mono font-black focus:ring-2 focus:ring-indigo-500" 
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">พิกัดชั้นวาง (Store Location)</label>
                    <input 
                      type="text" 
                      value={storeLocation} 
                      onChange={e => setStoreLocation(e.target.value)} 
                      placeholder="เช่น Rack A-02" 
                      className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white font-mono focus:ring-2 focus:ring-indigo-500" 
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Maker (ผู้ผลิต)</label>
                  <input type="text" value={maker} onChange={e => setMaker(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Supplier (ผู้จัดจำหน่าย)</label>
                  <input type="text" value={supplier} onChange={e => setSupplier(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Link สั่งซื้อ (URL)</label>
                <input type="url" value={purchaseLink} onChange={e => setPurchaseLink(e.target.value)} placeholder="https://..." className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">หมายเหตุเพิ่มเติม</label>
                <textarea rows={2} value={description} onChange={e => setDescription(e.target.value)} placeholder="รายละเอียดอื่นๆ หรือสเปคเพิ่มเติม..." className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>

              <div className="flex justify-end pt-4 border-t border-slate-200 dark:border-slate-800">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 mr-2 rounded-xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700">
                  ยกเลิก
                </button>
                <button type="submit" className="px-5 py-2 rounded-xl text-xs font-black text-white bg-indigo-600 hover:bg-indigo-700 shadow-md">
                  บันทึก
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Quick Restock Modal */}
      {isRestockModalOpen && restockTargetPart && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h4 className="text-sm font-black text-slate-900 dark:text-white flex items-center">
                <Boxes className="w-4 h-4 mr-2 text-emerald-500" />
                เติมสต็อกอะไหล่ (Stock In)
              </h4>
              <button onClick={() => setIsRestockModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2">
              <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
                <div className="font-extrabold text-slate-900 dark:text-white">{restockTargetPart.partName}</div>
                <div className="text-[11px] text-slate-500 font-mono">{restockTargetPart.typeSpec || '-'}</div>
                <div className="mt-2 flex items-center justify-between text-[11px] font-bold">
                  <span className="text-slate-500">สต็อกคงเหลือปัจจุบัน:</span>
                  <span className="font-mono text-emerald-600 dark:text-emerald-400 font-black">
                    {restockTargetPart.stockQty ?? parseStockMeta(restockTargetPart.description).stockQty} {restockTargetPart.unit}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  จำนวนที่รับเข้าคลังเพิ่ม (+ Qty)
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="number"
                    min="1"
                    value={restockAddQty}
                    onChange={e => setRestockAddQty(Math.max(1, Number(e.target.value)))}
                    className="flex-1 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-sm font-black text-slate-900 dark:text-white font-mono focus:ring-2 focus:ring-emerald-500"
                  />
                  <span className="text-xs font-bold text-slate-500">{restockTargetPart.unit}</span>
                </div>
                {/* Quick Add Presets */}
                <div className="flex space-x-2 mt-2">
                  {[10, 20, 50, 100].map(amt => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setRestockAddQty(amt)}
                      className="px-2.5 py-1 text-[10px] font-bold rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-emerald-50 hover:text-emerald-600 text-slate-600 dark:text-slate-400 transition-colors"
                    >
                      +{amt}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setIsRestockModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={handleExecuteRestock}
                className="px-5 py-2 rounded-xl text-xs font-black text-white bg-emerald-600 hover:bg-emerald-700 shadow-md"
              >
                ยืนยันการรับเข้าคลัง
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick Issue to Machine BOM Modal */}
      {isIssueModalOpen && issueTargetPart && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h4 className="text-sm font-black text-slate-900 dark:text-white flex items-center">
                <ArrowRightLeft className="w-4 h-4 mr-2 text-indigo-600" />
                เบิกอะไหล่เข้าโปรเจกต์ (Issue to Machine BOM)
              </h4>
              <button onClick={() => setIsIssueModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
                <div className="font-extrabold text-slate-900 dark:text-white">{issueTargetPart.partName}</div>
                <div className="text-[11px] text-slate-500 font-mono">{issueTargetPart.typeSpec || '-'}</div>
                <div className="mt-2 flex items-center justify-between text-[11px] font-bold">
                  <span className="text-slate-500">คงเหลือในคลังกลาง:</span>
                  <span className="font-mono text-indigo-600 dark:text-indigo-400 font-black">
                    {issueTargetPart.stockQty ?? parseStockMeta(issueTargetPart.description).stockQty} {issueTargetPart.unit}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  เลือกโปรเจกต์เป้าหมาย <span className="text-rose-500">*</span>
                </label>
                <select
                  value={issueSelectedProjectId}
                  onChange={e => {
                    const newProjId = e.target.value;
                    setIssueSelectedProjectId(newProjId);
                    const mods = modules.filter(m => m.projectId === newProjId);
                    setIssueSelectedModuleId(mods[0]?.id || '');
                  }}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                >
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.code} - {p.name} ({p.customer})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  เลือก Module ในโปรเจกต์
                </label>
                <select
                  value={issueSelectedModuleId}
                  onChange={e => setIssueSelectedModuleId(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">(ไม่ระบุ Module / พาร์ทรวม)</option>
                  {issueProjectModules.map(m => (
                    <option key={m.id} value={m.id}>
                      {m.code} - {m.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    จำนวนที่ต้องการเบิก <span className="text-rose-500">*</span>
                  </label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="number"
                      min="1"
                      value={issueQty}
                      onChange={e => setIssueQty(Math.max(1, Number(e.target.value)))}
                      className="flex-1 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-black text-slate-900 dark:text-white font-mono focus:ring-2 focus:ring-indigo-500"
                    />
                    <span className="text-xs font-bold text-slate-500">{issueTargetPart.unit}</span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    มูลค่าเบิกรวม (฿)
                  </label>
                  <div className="px-3 py-2 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-mono font-black text-slate-900 dark:text-white">
                    {formatCurrency(issueQty * (issueTargetPart.unitPrice || 0))}
                  </div>
                </div>
              </div>

              <div className="pt-1">
                <label className="flex items-center space-x-2 cursor-pointer text-xs font-bold text-slate-700 dark:text-slate-300">
                  <input
                    type="checkbox"
                    checked={isDeductingStock}
                    onChange={e => setIsDeductingStock(e.target.checked)}
                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>ตัดยอดสต็อกคงเหลือในคลังกลางทันที (-{issueQty} {issueTargetPart.unit})</span>
                </label>
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setIsIssueModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={handleExecuteIssue}
                className="px-5 py-2 rounded-xl text-xs font-black text-white bg-indigo-600 hover:bg-indigo-700 shadow-md flex items-center"
              >
                <Check className="w-3.5 h-3.5 mr-1.5" />
                ยืนยันการเบิกเข้า BOM
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RFQ Input Modal */}
      {isRfqModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-sm">
          <div className="glass-panel w-full max-w-5xl rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between p-4 bg-emerald-50 dark:bg-emerald-900/30 border-b border-emerald-200 dark:border-emerald-800">
              <h3 className="text-base font-extrabold text-emerald-900 dark:text-emerald-100 flex items-center">
                <FileSpreadsheet className="w-5 h-5 mr-2 text-emerald-600" />
                ระบุจำนวนและหมายเหตุก่อนส่งขอราคา ({selectedParts.size} รายการ)
              </h3>
              <button onClick={() => setIsRfqModalOpen(false)} className="p-1.5 rounded-lg text-emerald-600 hover:text-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-800/50 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar bg-slate-50 dark:bg-slate-950">
              <table className="w-full text-left border-collapse text-xs bg-white dark:bg-slate-900 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-800">
                <thead className="sticky top-0 z-10 bg-slate-50 dark:bg-slate-900/80 border-b-2 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200">
                  <tr className="divide-x divide-slate-200 dark:divide-slate-700">
                    <th className="px-3 py-3 w-10 text-center">NO.</th>
                    <th className="px-3 py-3">PART NAME & SPEC</th>
                    <th className="px-3 py-3 w-20 text-center">UNIT</th>
                    <th className="px-3 py-3 w-32">QUANTITY</th>
                    <th className="px-3 py-3 w-48">REMARK</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredParts.filter(p => selectedParts.has(p.id)).map((part, index) => (
                    <tr key={part.id} className="divide-x divide-slate-100 dark:divide-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="px-3 py-3 text-center text-slate-500 font-mono">{index + 1}</td>
                      <td className="px-3 py-3">
                        <div className="font-bold text-slate-900 dark:text-white">{part.partName}</div>
                        <div className="text-[10px] text-slate-500 truncate max-w-[250px]">{part.typeSpec || '-'}</div>
                      </td>
                      <td className="px-3 py-3 text-center text-slate-600 font-medium">{part.unit}</td>
                      <td className="px-3 py-3">
                        <input 
                          type="number" 
                          min="1"
                          placeholder="จำนวน..."
                          className="w-full p-1.5 border border-slate-300 dark:border-slate-700 rounded-md bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                          value={rfqQuantities[part.id] || ''}
                          onChange={(e) => setRfqQuantities({...rfqQuantities, [part.id]: e.target.value})}
                        />
                      </td>
                      <td className="px-3 py-3">
                        <input 
                          type="text" 
                          placeholder="หมายเหตุเพิ่มเติม..."
                          className="w-full p-1.5 border border-slate-300 dark:border-slate-700 rounded-md bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                          value={rfqRemarks[part.id] !== undefined ? rfqRemarks[part.id] : parseStockMeta(part.description).cleanDesc}
                          onChange={(e) => setRfqRemarks({...rfqRemarks, [part.id]: e.target.value})}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsRfqModalOpen(false)}
                className="px-4 py-2 text-slate-600 dark:text-slate-400 font-bold hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors text-sm"
              >
                ยกเลิก
              </button>
              <button
                onClick={executeExportRFQ}
                className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md transition-colors text-sm flex items-center"
              >
                <FileSpreadsheet className="w-4 h-4 mr-2" />
                ดาวน์โหลด Excel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
