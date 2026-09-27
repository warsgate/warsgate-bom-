import React, { useState, useMemo } from 'react';
import { 
  X, 
  Printer, 
  FileSpreadsheet, 
  FileCheck2, 
  Building2, 
  Calendar, 
  Truck, 
  CreditCard, 
  Layers, 
  Check, 
  Filter,
  DollarSign,
  AlertCircle
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { BomPartItem, ModuleItem, ProjectItem } from '../types/bom';
import { formatCurrency } from '../utils/costCalculator';
import { thaiBahtText } from '../utils/thaiBaht';

interface PoRfqGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  project?: ProjectItem | null;
  modules: ModuleItem[];
  parts: BomPartItem[];
  onSyncPoToParts?: (partIds: string[], poNumber: string, orderDate: string) => Promise<void>;
}

export const PoRfqGeneratorModal: React.FC<PoRfqGeneratorModalProps> = ({
  isOpen,
  onClose,
  project,
  modules,
  parts,
  onSyncPoToParts,
}) => {
  const [docType, setDocType] = useState<'PO' | 'RFQ'>('PO');
  const [selectedSupplier, setSelectedSupplier] = useState<string>('ALL');
  const [onlyUnordered, setOnlyUnordered] = useState<boolean>(true);

  // Document Fields
  const [docNo, setDocNo] = useState<string>(() => {
    const today = new Date();
    const yymm = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}`;
    return `PO-${yymm}-001`;
  });
  const [docDate, setDocDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [deliveryDate, setDeliveryDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 14);
    return d.toISOString().split('T')[0];
  });
  const [paymentTerms, setPaymentTerms] = useState<string>('เครดิต 30 วัน (Credit 30 Days)');
  const [supplierName, setSupplierName] = useState<string>('');
  const [supplierContact, setSupplierContact] = useState<string>('');
  const [supplierPhone, setSupplierPhone] = useState<string>('');
  const [supplierEmail, setSupplierEmail] = useState<string>('');
  const [notes, setNotes] = useState<string>('กรุณาแนบใบกำกับภาษีและใบส่งของมาพร้อมกับสินค้า');
  const [includeVat, setIncludeVat] = useState<boolean>(true);
  const [selectedPartIds, setSelectedPartIds] = useState<string[]>([]);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncSuccessMsg, setSyncSuccessMsg] = useState<string>('');

  // Extract unique supplier list
  const supplierList = useMemo(() => {
    const set = new Set<string>();
    parts.forEach(p => {
      const s = (p.supplier || p.maker || '').trim();
      if (s) set.add(s);
    });
    return Array.from(set).sort();
  }, [parts]);

  // Update docNo when docType changes
  const handleDocTypeChange = (type: 'PO' | 'RFQ') => {
    setDocType(type);
    const prefix = type === 'PO' ? 'PO' : 'RFQ';
    const today = new Date();
    const yymm = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}`;
    setDocNo(`${prefix}-${yymm}-001`);
  };

  // Filter parts for document
  const availableParts = useMemo(() => {
    return parts.filter(p => {
      if (selectedSupplier !== 'ALL') {
        const s = (p.supplier || p.maker || '').trim();
        if (s.toLowerCase() !== selectedSupplier.toLowerCase()) return false;
      }
      if (onlyUnordered && p.status === 'Ordered') return false;
      if (onlyUnordered && p.status === 'Received') return false;
      return true;
    });
  }, [parts, selectedSupplier, onlyUnordered]);

  // When available parts change or supplier changes, select all by default
  React.useEffect(() => {
    setSelectedPartIds(availableParts.map(p => p.id));
    if (selectedSupplier !== 'ALL') {
      setSupplierName(selectedSupplier);
    }
  }, [availableParts, selectedSupplier]);

  const itemsToInclude = useMemo(() => {
    return availableParts.filter(p => selectedPartIds.includes(p.id));
  }, [availableParts, selectedPartIds]);

  const subtotal = useMemo(() => {
    return itemsToInclude.reduce((sum, p) => sum + (p.totalAmount || (p.qty * p.unitPrice)), 0);
  }, [itemsToInclude]);

  const vatAmount = includeVat ? subtotal * 0.07 : 0;
  const grandTotal = subtotal + vatAmount;

  if (!isOpen) return null;

  const togglePartSelection = (id: string) => {
    setSelectedPartIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedPartIds(availableParts.map(p => p.id));
    } else {
      setSelectedPartIds([]);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportExcel = () => {
    const wb = XLSX.utils.book_new();

    const data: any[][] = [
      ['บริษัท วอร์สเกต ออโตเมชั่น จำกัด (WARSGATE AUTOMATION CO., LTD.)'],
      ['168/19 หมู่ที่ 1 ต.บึงน้ำรักษ์ อ.ธัญบุรี จ.ปทุมธานี 12110'],
      ['เลขประจำตัวผู้เสียภาษี: 0135564023451 โทร: 02-xxx-xxxx'],
      [''],
      [docType === 'PO' ? 'ใบสั่งซื้อสินค้า (PURCHASE ORDER)' : 'ใบขอเสนอราคา (REQUEST FOR QUOTATION)'],
      [''],
      ['เลขที่เอกสาร (Doc No):', docNo, '', 'วันที่ (Date):', docDate],
      ['โปรเจกต์ (Project):', `[${project?.code || ''}] ${project?.name || ''}`, '', 'กำหนดส่งมอบ (Delivery Date):', deliveryDate],
      ['ผู้จำหน่าย (Vendor):', supplierName || selectedSupplier, '', 'เงื่อนไขการชำระเงิน:', paymentTerms],
      ['ผู้ติดต่อ (Contact):', supplierContact, '', 'โทรศัพท์ (Tel):', supplierPhone],
      [''],
      ['ลำดับ (No.)', 'รหัสแบบ (DWG No.)', 'รายการสินค้า (Description / Part Name)', 'สเปก / รุ่น (Spec / Model)', 'แบรนด์ (Maker)', 'จำนวน (Qty)', 'หน่วย (Unit)', 'ราคาต่อหน่วย (Unit Price)', 'จำนวนเงิน (Amount)']
    ];

    itemsToInclude.forEach((p, idx) => {
      data.push([
        idx + 1,
        p.dwgNo || '-',
        p.partName,
        p.typeSpec || '-',
        p.maker || '-',
        p.qty,
        p.unit || 'PCS',
        docType === 'RFQ' ? '' : p.unitPrice,
        docType === 'RFQ' ? '' : (p.totalAmount || (p.qty * p.unitPrice))
      ]);
    });

    data.push(['']);
    if (docType === 'PO') {
      data.push(['', '', '', '', '', '', '', 'รวมเป็นเงิน (Subtotal):', subtotal]);
      if (includeVat) {
        data.push(['', '', '', '', '', '', '', 'ภาษีมูลค่าเพิ่ม (VAT 7%):', vatAmount]);
      }
      data.push(['', '', '', '', '', '', '', 'จำนวนเงินรวมทั้งสิ้น (Grand Total):', grandTotal]);
      data.push(['จำนวนเงินตัวอักษร:', thaiBahtText(grandTotal)]);
    }

    data.push(['']);
    data.push(['หมายเหตุ (Notes):', notes]);

    const ws = XLSX.utils.aoa_to_sheet(data);
    ws['!cols'] = [
      { wch: 8 },
      { wch: 16 },
      { wch: 32 },
      { wch: 22 },
      { wch: 14 },
      { wch: 10 },
      { wch: 10 },
      { wch: 16 },
      { wch: 18 }
    ];

    XLSX.utils.book_append_sheet(wb, ws, docType);
    const fileName = `${docType}_${(supplierName || 'Vendor').replace(/\s+/g, '_')}_${docNo}.xlsx`;
    XLSX.writeFile(wb, fileName);
  };

  const handleSyncToBom = async () => {
    if (!onSyncPoToParts || itemsToInclude.length === 0) return;
    setIsSyncing(true);
    setSyncSuccessMsg('');
    try {
      await onSyncPoToParts(itemsToInclude.map(p => p.id), docNo, docDate);
      setSyncSuccessMsg(`บันทึกเลขที่ ${docNo} และปรับสถานะเป็น Ordered ให้กับ ${itemsToInclude.length} รายการเรียบร้อยแล้ว`);
    } catch (err: any) {
      alert('เกิดข้อผิดพลาดในการอัปเดต BOM: ' + err.message);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-5xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[94vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Modal Controls Header - Hidden on Print */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/70 print:hidden">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-gradient-to-br from-indigo-600 to-blue-700 text-white rounded-xl shadow-md">
              <FileCheck2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white flex items-center space-x-2">
                <span>ระบบสร้างใบสั่งซื้อ (PO) & ขอราคา (RFQ)</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300 font-bold">
                  Warsgate Automation
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                รวมรายการตามผู้จำหน่าย (Supplier) ออกเอกสารทางการ และเชื่อมโยงเข้า BOM
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleExportExcel}
              disabled={itemsToInclude.length === 0}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md transition-all flex items-center disabled:opacity-50"
              title="ส่งออกเอกสารเป็น Excel (.xlsx)"
            >
              <FileSpreadsheet className="w-4 h-4 mr-1.5" />
              <span>ส่งออก Excel</span>
            </button>
            <button
              onClick={handlePrint}
              disabled={itemsToInclude.length === 0}
              className="px-3.5 py-2 bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-800 text-white rounded-xl text-xs font-bold shadow-md transition-all flex items-center disabled:opacity-50"
              title="พิมพ์เอกสาร A4 หรือบันทึกเป็น PDF"
            >
              <Printer className="w-4 h-4 mr-1.5" />
              <span>พิมพ์เอกสาร (Print / PDF)</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filter and Configuration Toolbar - Hidden on Print */}
        <div className="p-3 bg-slate-100/70 dark:bg-slate-950/40 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs px-5 print:hidden">
          
          <div className="flex flex-wrap items-center gap-3">
            {/* Doc Type Selector */}
            <div className="flex items-center p-0.5 bg-slate-200 dark:bg-slate-800 rounded-xl">
              <button
                type="button"
                onClick={() => handleDocTypeChange('PO')}
                className={`px-3 py-1 rounded-lg font-black transition-all ${
                  docType === 'PO' ? 'bg-white dark:bg-slate-900 text-indigo-700 dark:text-indigo-400 shadow-sm' : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                ใบสั่งซื้อ (PO)
              </button>
              <button
                type="button"
                onClick={() => handleDocTypeChange('RFQ')}
                className={`px-3 py-1 rounded-lg font-black transition-all ${
                  docType === 'RFQ' ? 'bg-white dark:bg-slate-900 text-indigo-700 dark:text-indigo-400 shadow-sm' : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                ใบขอเสนอราคา (RFQ)
              </button>
            </div>

            {/* Supplier Filter Dropdown */}
            <div className="flex items-center space-x-1.5">
              <span className="font-bold text-slate-600 dark:text-slate-300">เลือกผู้ขาย:</span>
              <select
                value={selectedSupplier}
                onChange={e => setSelectedSupplier(e.target.value)}
                className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-2.5 py-1 font-bold text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              >
                <option value="ALL">-- แสดงทั้งหมด ({parts.length} รายการ) --</option>
                {supplierList.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            {/* Unordered filter toggle */}
            <label className="flex items-center space-x-1.5 font-bold text-slate-600 dark:text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={onlyUnordered}
                onChange={e => setOnlyUnordered(e.target.checked)}
                className="rounded text-indigo-600 focus:ring-indigo-500"
              />
              <span>เฉพาะรายการที่ยังไม่ได้สั่ง</span>
            </label>
          </div>

          {/* Sync PO to BOM Action Button */}
          {docType === 'PO' && onSyncPoToParts && (
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={handleSyncToBom}
                disabled={isSyncing || itemsToInclude.length === 0}
                className="px-3 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-700 text-white rounded-xl font-bold shadow-sm flex items-center space-x-1.5 disabled:opacity-50"
              >
                <Check className="w-3.5 h-3.5" />
                <span>{isSyncing ? 'กำลังบันทึก...' : 'บันทึกเลขที่ PO ลง BOM'}</span>
              </button>
            </div>
          )}

        </div>

        {/* Sync Success Alert - Hidden on Print */}
        {syncSuccessMsg && (
          <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/40 border-b border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-300 font-bold flex items-center justify-between px-5 print:hidden">
            <span>✅ {syncSuccessMsg}</span>
            <button onClick={() => setSyncSuccessMsg('')} className="text-emerald-600 hover:underline">ปิด</button>
          </div>
        )}

        {/* Printable Document Sheet Viewport */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-100 dark:bg-slate-950 print:bg-white print:p-0 print:overflow-visible">
          
          {/* A4 Paper Document Container */}
          <div className="bg-white text-slate-900 border border-slate-300 rounded-2xl p-6 sm:p-8 max-w-4xl mx-auto shadow-lg print:border-none print:shadow-none print:p-0 print:max-w-none print:rounded-none">
            
            {/* Header: Company & Doc Title */}
            <div className="border-b-2 border-slate-900 pb-4 mb-4">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="px-2 py-0.5 bg-red-600 text-white font-black text-sm rounded tracking-wider">
                      WARSGATE
                    </span>
                    <h1 className="text-lg font-black tracking-tight text-slate-900">
                      บริษัท วอร์สเกต ออโตเมชั่น จำกัด
                    </h1>
                  </div>
                  <p className="text-xs text-slate-600">
                    WARSGATE AUTOMATION CO., LTD.
                  </p>
                  <p className="text-[11px] text-slate-600">
                    168/19 หมู่ที่ 1 ต.บึงน้ำรักษ์ อ.ธัญบุรี จ.ปทุมธานี 12110
                  </p>
                  <p className="text-[11px] text-slate-600">
                    เลขประจำตัวผู้เสียภาษี: <strong className="font-mono text-slate-900">0135564023451</strong> | โทร: 02-000-0000 | Email: contact@warsgate.co.th
                  </p>
                </div>

                <div className="text-right">
                  <div className="inline-block border-2 border-slate-900 px-4 py-1.5 rounded-xl bg-slate-50">
                    <h2 className="text-base sm:text-lg font-black tracking-tight text-slate-900">
                      {docType === 'PO' ? 'ใบสั่งซื้อ (PURCHASE ORDER)' : 'ใบขอเสนอราคา (REQUEST FOR QUOTATION)'}
                    </h2>
                  </div>
                  <div className="mt-2 text-xs space-y-1">
                    <div className="flex justify-end space-x-2">
                      <span className="font-bold text-slate-600">เลขที่ / No:</span>
                      <input
                        type="text"
                        value={docNo}
                        onChange={e => setDocNo(e.target.value)}
                        className="font-mono font-bold text-slate-900 border-b border-dashed border-slate-400 text-right w-36 focus:outline-none print:border-none"
                      />
                    </div>
                    <div className="flex justify-end space-x-2">
                      <span className="font-bold text-slate-600">วันที่ / Date:</span>
                      <input
                        type="date"
                        value={docDate}
                        onChange={e => setDocDate(e.target.value)}
                        className="font-mono font-bold text-slate-900 border-b border-dashed border-slate-400 text-right w-36 focus:outline-none print:border-none"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Document Info Grid: Vendor & Project */}
            <div className="grid grid-cols-2 gap-4 text-xs mb-4 border border-slate-300 rounded-xl p-3 bg-slate-50/50 print:bg-transparent">
              {/* Left: Vendor Info */}
              <div className="space-y-1.5 pr-2 border-r border-slate-200">
                <div className="font-black text-slate-800 text-[11px] uppercase tracking-wider text-red-700">
                  ข้อมูลผู้จำหน่าย (VENDOR / SUPPLIER)
                </div>
                <div className="flex items-center space-x-1">
                  <span className="w-20 font-bold text-slate-600 shrink-0">ชื่อผู้จำหน่าย:</span>
                  <input
                    type="text"
                    value={supplierName}
                    onChange={e => setSupplierName(e.target.value)}
                    placeholder="ชื่อบริษัท / ร้านค้า..."
                    className="flex-1 font-bold text-slate-900 border-b border-dashed border-slate-300 bg-transparent px-1 focus:outline-none print:border-none"
                  />
                </div>
                <div className="flex items-center space-x-1">
                  <span className="w-20 font-bold text-slate-600 shrink-0">ผู้ติดต่อ:</span>
                  <input
                    type="text"
                    value={supplierContact}
                    onChange={e => setSupplierContact(e.target.value)}
                    placeholder="ชื่อผู้ติดต่อ..."
                    className="flex-1 text-slate-900 border-b border-dashed border-slate-300 bg-transparent px-1 focus:outline-none print:border-none"
                  />
                </div>
                <div className="flex items-center space-x-1">
                  <span className="w-20 font-bold text-slate-600 shrink-0">โทรศัพท์/อีเมล:</span>
                  <input
                    type="text"
                    value={supplierPhone}
                    onChange={e => setSupplierPhone(e.target.value)}
                    placeholder="เบอร์โทร / อีเมล..."
                    className="flex-1 text-slate-900 border-b border-dashed border-slate-300 bg-transparent px-1 focus:outline-none print:border-none"
                  />
                </div>
              </div>

              {/* Right: Project & Terms */}
              <div className="space-y-1.5 pl-2">
                <div className="font-black text-slate-800 text-[11px] uppercase tracking-wider text-red-700">
                  เงื่อนไขและการส่งมอบ (PROJECT & TERMS)
                </div>
                <div className="flex items-center space-x-1">
                  <span className="w-24 font-bold text-slate-600 shrink-0">โปรเจกต์อ้างอิง:</span>
                  <span className="font-bold text-slate-900 truncate">
                    {project ? `[${project.code}] ${project.name}` : '-'}
                  </span>
                </div>
                <div className="flex items-center space-x-1">
                  <span className="w-24 font-bold text-slate-600 shrink-0">กำหนดส่งมอบ:</span>
                  <input
                    type="date"
                    value={deliveryDate}
                    onChange={e => setDeliveryDate(e.target.value)}
                    className="font-mono font-bold text-slate-900 border-b border-dashed border-slate-300 bg-transparent px-1 focus:outline-none print:border-none"
                  />
                </div>
                <div className="flex items-center space-x-1">
                  <span className="w-24 font-bold text-slate-600 shrink-0">เงื่อนไขการชำระ:</span>
                  <input
                    type="text"
                    value={paymentTerms}
                    onChange={e => setPaymentTerms(e.target.value)}
                    className="flex-1 font-bold text-slate-900 border-b border-dashed border-slate-300 bg-transparent px-1 focus:outline-none print:border-none"
                  />
                </div>
              </div>
            </div>

            {/* Items Table */}
            <div className="border border-slate-300 rounded-xl overflow-hidden mb-4">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100 text-slate-800 font-black border-b border-slate-300 text-[11px]">
                    <th className="p-2 w-10 text-center print:hidden">
                      <input
                        type="checkbox"
                        checked={itemsToInclude.length === availableParts.length && availableParts.length > 0}
                        onChange={e => handleSelectAll(e.target.checked)}
                        className="rounded text-indigo-600"
                      />
                    </th>
                    <th className="p-2 w-10 text-center">ลำดับ</th>
                    <th className="p-2 w-28">รหัสแบบ (DWG)</th>
                    <th className="p-2">รายการชิ้นส่วน / ชนิดอะไหล่</th>
                    <th className="p-2 w-24">แบรนด์/ผู้ผลิต</th>
                    <th className="p-2 w-16 text-right">จำนวน</th>
                    <th className="p-2 w-14 text-center">หน่วย</th>
                    {docType === 'PO' && <th className="p-2 w-24 text-right">ราคา/หน่วย</th>}
                    {docType === 'PO' && <th className="p-2 w-28 text-right">จำนวนเงิน</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {availableParts.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="p-6 text-center text-slate-400 font-bold">
                        ไม่พบรายการชิ้นส่วนสำหรับผู้จำหน่ายนี้
                      </td>
                    </tr>
                  ) : (
                    availableParts.map((p, idx) => {
                      const isSelected = selectedPartIds.includes(p.id);
                      if (!isSelected && typeof window !== 'undefined' && (window as any).isPrinting) {
                        return null; // Don't print unselected
                      }
                      const amount = p.totalAmount || (p.qty * p.unitPrice);
                      return (
                        <tr key={p.id} className={`${!isSelected ? 'opacity-40 bg-slate-50' : 'hover:bg-slate-50/50'}`}>
                          <td className="p-2 text-center print:hidden">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => togglePartSelection(p.id)}
                              className="rounded text-indigo-600"
                            />
                          </td>
                          <td className="p-2 text-center font-mono font-bold text-slate-600">{idx + 1}</td>
                          <td className="p-2 font-mono font-bold text-slate-800 text-[11px]">{p.dwgNo || '-'}</td>
                          <td className="p-2">
                            <div className="font-black text-slate-900">{p.partName}</div>
                            {p.typeSpec && <div className="text-[10px] font-mono text-slate-600">{p.typeSpec}</div>}
                          </td>
                          <td className="p-2 text-slate-700 font-medium">{p.maker || p.supplier || '-'}</td>
                          <td className="p-2 text-right font-mono font-bold text-slate-900">{p.qty}</td>
                          <td className="p-2 text-center text-slate-600">{p.unit || 'PCS'}</td>
                          {docType === 'PO' && (
                            <td className="p-2 text-right font-mono text-slate-700">
                              {formatCurrency(p.unitPrice)}
                            </td>
                          )}
                          {docType === 'PO' && (
                            <td className="p-2 text-right font-mono font-black text-slate-900">
                              {formatCurrency(amount)}
                            </td>
                          )}
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Calculations & Totals (Only in PO mode) */}
            {docType === 'PO' && (
              <div className="flex justify-between items-start text-xs border border-slate-300 rounded-xl p-3 bg-slate-50/60 mb-4 print:bg-transparent">
                <div className="flex-1 pr-6 space-y-2">
                  <div className="font-bold text-slate-700">
                    จำนวนเงินตัวอักษร / Thai Baht Text:
                  </div>
                  <div className="p-2 bg-white border border-slate-200 rounded-lg font-bold text-slate-900 text-[11px]">
                    ( {thaiBahtText(grandTotal)} )
                  </div>
                  <div className="pt-1">
                    <label className="text-[11px] font-bold text-slate-600 flex items-center space-x-1.5 cursor-pointer print:hidden">
                      <input
                        type="checkbox"
                        checked={includeVat}
                        onChange={e => setIncludeVat(e.target.checked)}
                        className="rounded text-indigo-600"
                      />
                      <span>คำนวณภาษีมูลค่าเพิ่ม (VAT 7%)</span>
                    </label>
                  </div>
                </div>

                <div className="w-64 space-y-1.5 font-bold">
                  <div className="flex justify-between text-slate-600">
                    <span>รวมเป็นเงิน (Subtotal):</span>
                    <span className="font-mono text-slate-900">{formatCurrency(subtotal)}</span>
                  </div>
                  {includeVat && (
                    <div className="flex justify-between text-slate-600">
                      <span>ภาษีมูลค่าเพิ่ม 7% (VAT):</span>
                      <span className="font-mono text-slate-900">{formatCurrency(vatAmount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm font-black pt-1.5 border-t-2 border-slate-900 text-slate-900">
                    <span>ยอดสุทธิ (Grand Total):</span>
                    <span className="font-mono text-red-700">{formatCurrency(grandTotal)}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Notes / Remark */}
            <div className="text-xs mb-6">
              <span className="font-bold text-slate-700">หมายเหตุ / Conditions:</span>
              <textarea
                rows={2}
                value={notes}
                onChange={e => setNotes(e.target.value)}
                className="w-full mt-1 p-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 text-xs focus:outline-none print:border-none print:p-0 print:bg-transparent"
              />
            </div>

            {/* Signatures Block */}
            <div className="grid grid-cols-3 gap-4 pt-4 border-t border-slate-300 text-center text-xs">
              <div className="space-y-10">
                <p className="font-bold text-slate-700">ผู้สั่งซื้อ / จัดทำ (Prepared By)</p>
                <div className="border-b border-slate-400 mx-4"></div>
                <p className="text-[11px] text-slate-500">วันที่: ...../...../..........</p>
              </div>
              <div className="space-y-10">
                <p className="font-bold text-slate-700">วิศวกรตรวจสอบ (Checked By)</p>
                <div className="border-b border-slate-400 mx-4"></div>
                <p className="text-[11px] text-slate-500">วันที่: ...../...../..........</p>
              </div>
              <div className="space-y-10">
                <p className="font-bold text-slate-700">ผู้อนุมัติสั่งซื้อ (Authorized Signature)</p>
                <div className="border-b border-slate-400 mx-4"></div>
                <p className="text-[11px] text-slate-500">วันที่: ...../...../..........</p>
              </div>
            </div>

          </div>

        </div>

        {/* Modal Footer Controls - Hidden on Print */}
        <div className="p-3 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-500 flex justify-between items-center px-5 print:hidden">
          <span>รวม {itemsToInclude.length} รายการสำหรับ {docType === 'PO' ? 'สั่งซื้อ' : 'ขอราคา'}</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 rounded-lg text-xs font-bold text-slate-700 dark:text-slate-300"
          >
            ปิดหน้าต่าง
          </button>
        </div>

      </div>
    </div>
  );
};
