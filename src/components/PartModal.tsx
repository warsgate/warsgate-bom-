import React, { useState, useEffect } from 'react';
import { X, Wrench, Zap, Save, GitCommit, Search, Database } from 'lucide-react';
import { BomPartItem, CategoryType, MachineWorkflowStage, MasterPartItem, ModuleItem, PartCategoryType, PartStatus, QuotationItem } from '../types/bom';
import { PartLibraryModal } from './PartLibraryModal';
import { quotationsApi } from '../api/client';

interface PartModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (part: Partial<BomPartItem>) => void;
  initialPart?: BomPartItem | null;
  modules: ModuleItem[];
  defaultModuleId?: string;
}

const WORKFLOW_OPTIONS: MachineWorkflowStage[] = [
  '1. Design (DS,EE,PG)',
  '2. BOM Part List',
  '3. Procurement (STD,FEB)',
  '4. Assembly',
  '5. Testing',
  '6. BuyOff',
  '7. Packing',
  '8. Install & Service',
  '9. Others',
];

export const PartModal: React.FC<PartModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialPart,
  modules,
  defaultModuleId,
}) => {
  const [dwgNo, setDwgNo] = useState('');
  const [itemNo, setItemNo] = useState(1);
  const [partName, setPartName] = useState('');
  const [typeSpec, setTypeSpec] = useState('');
  const [category, setCategory] = useState<CategoryType>('MC');
  const [partType, setPartType] = useState<PartCategoryType>('Standard Part');
  const [moduleId, setModuleId] = useState('');
  const [qty, setQty] = useState(1);
  const [unit, setUnit] = useState('EA');
  const [maker, setMaker] = useState('');
  const [supplier, setSupplier] = useState('');
  const [targetUnitPrice, setTargetUnitPrice] = useState(0);
  const [unitPrice, setUnitPrice] = useState(0);
  const [poNumber, setPoNumber] = useState('');
  const [storeLocation, setStoreLocation] = useState('');
  const [quotationId, setQuotationId] = useState('');
  const [purchaseLink, setPurchaseLink] = useState('');
  const [status, setStatus] = useState<PartStatus>('Planned');
  const [workflowStage, setWorkflowStage] = useState<MachineWorkflowStage>('2. BOM Part List');
  const [remarks, setRemarks] = useState('');
  
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
  const [quotations, setQuotations] = useState<QuotationItem[]>([]);

  useEffect(() => {
    if (isOpen && modules.length > 0) {
      const projId = modules[0].projectId;
      if (projId) {
        quotationsApi.getAll(projId)
          .then(res => setQuotations(res))
          .catch(err => console.error(err));
      }
    }
  }, [isOpen, modules]);

  const handleSelectMasterPart = (master: MasterPartItem) => {
    setPartName(master.partName);
    setTypeSpec(master.typeSpec || '');
    setCategory(master.category);
    setPartType(master.partType);
    setUnit(master.unit || 'EA');
    setMaker(master.maker || '');
    setSupplier(master.supplier || '');
    setTargetUnitPrice(master.unitPrice || 0);
    setUnitPrice(master.unitPrice || 0);
    if (master.storeLocation) {
      setStoreLocation(master.storeLocation);
    }
    if (master.purchaseLink) {
      setPurchaseLink(master.purchaseLink);
    }
  };

  useEffect(() => {
    if (isOpen) {
      if (initialPart) {
        setDwgNo(initialPart.dwgNo || '');
        setItemNo(initialPart.itemNo || 1);
        setPartName(initialPart.partName || '');
        setTypeSpec(initialPart.typeSpec || '');
        setCategory(initialPart.category || 'MC');
        setPartType(initialPart.partType || 'Standard Part');
        setModuleId(initialPart.moduleId || defaultModuleId || modules[0]?.id || '');
        setQty(initialPart.qty || 1);
        setUnit(initialPart.unit || 'EA');
        setMaker(initialPart.maker || '');
        setSupplier(initialPart.supplier || '');
        setTargetUnitPrice(initialPart.targetUnitPrice || initialPart.unitPrice || 0);
        setUnitPrice(initialPart.unitPrice || 0);
        setPoNumber(initialPart.poNumber || '');
        setQuotationId(initialPart.quotationId || '');
        setStoreLocation(initialPart.storeLocation || '');
        setPurchaseLink(initialPart.purchaseLink || '');
        setStatus(initialPart.status || 'Planned');
        setWorkflowStage(initialPart.workflowStage || '2. BOM Part List');
        setRemarks(initialPart.remarks || '');
      } else {
        setDwgNo('073007-000-000-A');
        setItemNo(Date.now() % 1000);
        setPartName('');
        setTypeSpec('');
        setCategory('MC');
        setPartType('Standard Part');
        setModuleId(defaultModuleId || modules[0]?.id || '');
        setQty(1);
        setUnit('EA');
        setMaker('');
        setSupplier('');
        setTargetUnitPrice(0);
        setUnitPrice(0);
        setPoNumber('');
        setQuotationId('');
        setStoreLocation('');
        setPurchaseLink('');
        setStatus('Planned');
        setWorkflowStage('2. BOM Part List');
        setRemarks('');
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, initialPart]);

  if (!isOpen) return null;

  const targetTotalAmount = qty * targetUnitPrice;
  const totalAmount = qty * unitPrice;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (/https?:\/\/|www\./i.test(maker)) {
      alert('ช่อง MAKER (ผู้ผลิต) ไม่อนุญาตให้ใส่ Link Web กรุณาใส่ลิงก์ที่ช่อง "Link สั่งซื้อ (URL)" แทนครับ');
      return;
    }

    onSave({
      ...(initialPart ? { id: initialPart.id } : {}),
      dwgNo,
      itemNo: Number(itemNo),
      partName,
      typeSpec,
      category,
      partType,
      moduleId,
      qty: Number(qty),
      unit,
      maker,
      supplier,
      targetUnitPrice: Number(targetUnitPrice),
      targetTotalAmount,
      unitPrice: Number(unitPrice),
      totalAmount,
      poNumber,
      quotationId: quotationId || undefined,
      storeLocation,
      purchaseLink,
      status,
      workflowStage,
      remarks,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-sm">
      <div className="glass-panel w-full max-w-2xl rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center space-x-2">
            {category === 'MC' ? (
              <div className="p-2 rounded-lg bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400">
                <Wrench className="w-5 h-5" />
              </div>
            ) : (
              <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400">
                <Zap className="w-5 h-5" />
              </div>
            )}
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {initialPart ? 'แก้ไขรายการ Part & แผนงานการผลิต' : 'เพิ่มรายการ Part ใหม่'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">กรอกข้อมูลชิ้นส่วน งบประมาณสั่งซื้อ และผูกขั้นตอนแผนงานผลิต</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
          
          {/* Category & Part Type Selectors */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                1. หมวดหมู่ (Category)
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setCategory('MC')}
                  className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center space-x-1.5 transition-all ${
                    category === 'MC'
                      ? 'bg-red-100 dark:bg-red-500/20 text-red-800 dark:text-red-300 border-red-400 dark:border-red-500/60 shadow-sm'
                      : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <Wrench className="w-4 h-4 text-red-600 dark:text-red-400" />
                  <span>MC (Mechanical)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setCategory('EE')}
                  className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center space-x-1.5 transition-all ${
                    category === 'EE'
                      ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300 border-amber-400 dark:border-amber-500/60 shadow-sm'
                      : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <Zap className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  <span>EE (Electrical)</span>
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                2. ประเภท Part (Standard vs Feb)
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setPartType('Standard Part')}
                  className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center transition-all ${
                    partType === 'Standard Part'
                      ? 'bg-blue-100 dark:bg-blue-500/20 text-blue-800 dark:text-blue-300 border-blue-400 dark:border-blue-500/60 shadow-sm'
                      : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  Standard Part
                </button>

                <button
                  type="button"
                  onClick={() => setPartType('Feb Part')}
                  className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center transition-all ${
                    partType === 'Feb Part'
                      ? 'bg-rose-100 dark:bg-rose-500/20 text-rose-800 dark:text-rose-300 border-rose-400 dark:border-rose-500/60 shadow-sm'
                      : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  Fabricated (Feb)
                </button>
              </div>
            </div>
          </div>

          {/* Machine Production Workflow Stage Selector */}
          <div className="p-3 rounded-xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800">
            <label className="block text-xs font-black text-blue-900 dark:text-blue-300 mb-1 flex items-center">
              <GitCommit className="w-4 h-4 mr-1 text-blue-600" />
              ผูกกับขั้นตอนแผนงานผลิตเครื่องจักร (Machine Production Stage)
            </label>
            <select
              value={workflowStage}
              onChange={(e) => setWorkflowStage(e.target.value as MachineWorkflowStage)}
              className="w-full bg-white dark:bg-slate-900 border border-blue-300 dark:border-blue-700 rounded-xl px-3 py-2 text-xs font-black text-blue-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              {WORKFLOW_OPTIONS.map(opt => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>

          {/* Module & Drawing No */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                สังกัด Module <span className="text-rose-500">*</span>
              </label>
              <select
                required
                value={moduleId}
                onChange={(e) => setModuleId(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                {modules.map(m => (
                  <option key={m.id} value={m.id}>{m.code} - {m.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                DWG. No. (หมายเลขแบบ)
              </label>
              <input
                type="text"
                value={dwgNo}
                onChange={(e) => setDwgNo(e.target.value)}
                placeholder="e.g. 073007-000-000-A"
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>
          </div>

          {/* Item No, Part Name & Type Spec */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
            <div className="sm:col-span-3">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Item No.</label>
              <input
                type="number"
                value={itemNo}
                onChange={(e) => setItemNo(Number(e.target.value))}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>
            <div className="sm:col-span-5">
              <div className="flex justify-between items-center mb-1">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Part Name <span className="text-rose-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={() => setIsLibraryOpen(true)}
                  className="inline-flex items-center text-[10px] font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300"
                >
                  <Database className="w-3 h-3 mr-1" />
                  เลือกจากคลังอะไหล่
                </button>
              </div>
              <input
                type="text"
                required
                value={partName}
                onChange={(e) => setPartName(e.target.value)}
                placeholder="e.g. PLC Omron / Stand Profile"
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white font-bold placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>
            <div className="sm:col-span-4">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Type / Spec</label>
              <input
                type="text"
                value={typeSpec}
                onChange={(e) => setTypeSpec(e.target.value)}
                placeholder="e.g. CP1L-E / Denco DA-09"
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>
          </div>

          {/* Qty, Target Price vs Actual PO Price */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 rounded-xl bg-slate-100 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800">
            <div className="flex flex-col justify-end">
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1 whitespace-nowrap">
                Q'TY (จำนวน)
              </label>
              <input
                type="number"
                min="1"
                value={qty}
                onChange={(e) => setQty(Number(e.target.value))}
                className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-1 focus:ring-red-500"
              />
            </div>

            <div className="flex flex-col justify-end">
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1 whitespace-nowrap">
                Unit (หน่วย)
              </label>
              <input
                type="text"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                placeholder="EA / M / SET"
                className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-1 focus:ring-red-500"
              />
            </div>

            <div className="flex flex-col justify-end">
              <label className="block text-[11px] font-bold text-amber-700 dark:text-amber-400 mb-1 whitespace-nowrap truncate">
                Target Price (งบตั้งไว้ ฿)
              </label>
              <input
                type="number"
                step="0.01"
                value={targetUnitPrice}
                onChange={(e) => setTargetUnitPrice(Number(e.target.value))}
                className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-1 focus:ring-red-500"
              />
            </div>

            <div className="flex flex-col justify-end">
              <label className="block text-[11px] font-bold text-red-700 dark:text-red-400 mb-1 whitespace-nowrap truncate">
                Actual PO (สั่งซื้อจริง ฿)
              </label>
              <input
                type="number"
                step="0.01"
                value={unitPrice}
                onChange={(e) => setUnitPrice(Number(e.target.value))}
                className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-1 focus:ring-red-500"
              />
            </div>
          </div>

          {/* Supplier, Maker */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Supplier (ผู้จำหน่าย/ร้านค้า)</label>
              <input
                type="text"
                value={supplier}
                onChange={(e) => setSupplier(e.target.value)}
                placeholder="e.g. Mizumi, Omron, Dell, Denco, Shoppe"
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Maker (ผู้ผลิต)</label>
              <input
                type="text"
                value={maker}
                onChange={(e) => setMaker(e.target.value)}
                placeholder="e.g. Omron, Mitsubishi, Dell"
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>
          </div>

          {/* PO Number, Store Location */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">PO Number (เลขที่ใบสั่งซื้อ / อ้างอิง)</label>
              <input
                type="text"
                value={poNumber}
                onChange={(e) => setPoNumber(e.target.value)}
                placeholder="e.g. PO-2026-001 หรือ SHP-123"
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">อ้างอิงใบเสนอราคา (Quotation)</label>
              <select
                value={quotationId}
                onChange={(e) => setQuotationId(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                <option value="">-- ไม่ระบุ --</option>
                {quotations.map(q => (
                  <option key={q.id} value={q.id}>
                    {q.quotationNo} ({q.supplier})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Store Location */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Store Location (สถานที่เก็บ)</label>
              <input
                type="text"
                value={storeLocation}
                onChange={(e) => setStoreLocation(e.target.value)}
                placeholder="e.g. ตู้ A ชั้น 2"
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Link สั่งซื้อ (URL)</label>
              <input
                type="url"
                value={purchaseLink}
                onChange={(e) => setPurchaseLink(e.target.value)}
                placeholder="https://shopee.co.th/... หรืออื่นๆ"
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              ยกเลิก
            </button>

            <button
              type="submit"
              className="px-5 py-2 rounded-xl text-xs font-black text-white bg-gradient-to-r from-red-600 via-rose-700 to-rose-900 hover:from-red-500 hover:to-rose-800 shadow-md shadow-red-600/20 transition-all flex items-center"
            >
              <Save className="w-4 h-4 mr-1.5" />
              บันทึกข้อมูล Part & การสั่งซื้อ
            </button>
          </div>

        </form>

      </div>
      
      <PartLibraryModal 
        isOpen={isLibraryOpen}
        onClose={() => setIsLibraryOpen(false)}
        onSelectPart={handleSelectMasterPart}
      />
    </div>
  );
};
