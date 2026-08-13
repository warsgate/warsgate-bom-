import React, { useState } from 'react';
import { X, Download, Upload, FileSpreadsheet, CheckCircle, AlertCircle, FileText } from 'lucide-react';
import * as XLSX from 'xlsx';
import { BomPartItem, CategoryType, ModuleItem, PartCategoryType, PartStatus } from '../types/bom';

interface ExportImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  parts: BomPartItem[];
  modules: ModuleItem[];
  onImportParts: (parts: Partial<BomPartItem>[]) => void;
}

export const ExportImportModal: React.FC<ExportImportModalProps> = ({
  isOpen,
  onClose,
  parts,
  modules,
  onImportParts,
}) => {
  const [activeTab, setActiveTab] = useState<'export' | 'import'>('import');
  const [previewData, setPreviewData] = useState<Partial<BomPartItem>[]>([]);
  const [importFileName, setImportFileName] = useState('');
  const [targetModuleId, setTargetModuleId] = useState(modules[0]?.id || '');
  const [importStatusMessage, setImportStatusMessage] = useState('');

  if (!isOpen) return null;

  // Handle Export to Excel
  const handleExportExcel = () => {
    const dataToExport = parts.map((part) => {
      const mod = modules.find(m => m.id === part.moduleId);
      return {
        'Item No': part.itemNo,
        'DWG No': part.dwgNo,
        'Part Name': part.partName,
        'Type / Spec': part.typeSpec,
        'Category (MC/EE)': part.category,
        'Part Type (Standard/Feb)': part.partType,
        'Module Code': mod?.code || '',
        'Module Name': mod?.name || '',
        'Q\'TY': part.qty,
        'Unit': part.unit,
        'Maker': part.maker,
        'Supplier': part.supplier,
        'Target Price (THB)': part.targetUnitPrice || part.unitPrice,
        'Actual PO Price (THB)': part.unitPrice,
        'Total Amount (THB)': part.totalAmount || (part.qty * part.unitPrice),
        'PO Number': part.poNumber || '',
        'Store Location': part.storeLocation || '',
        'Status': part.status,
        'Remarks': part.remarks || '',
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'BOM Part List');
    XLSX.writeFile(workbook, `WARSGATE_BOM_PartList_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  // Download Sample Template Excel
  const handleDownloadSample = () => {
    const sampleData = [
      {
        'Item No': 1,
        'DWG No': '073007-000-000-A',
        'Part Name': 'Control Box Assembly',
        'Type / Spec': 'Denco DA-09',
        'Category (MC/EE)': 'MC',
        'Part Type': 'Feb Part',
        'Q\'TY': 1,
        'Unit': 'EA',
        'Maker': 'Denco',
        'Supplier': 'Denco Direct',
        'Target Price': 3500,
        'Actual Price': 3500,
        'PO Number': 'PO-2026-001',
        'Store Location': 'Rack A-01',
        'Status': 'Planned',
        'Remarks': 'Sample Item',
      },
      {
        'Item No': 2,
        'DWG No': '073007-000-000-A',
        'Part Name': 'Circuit Breaker 2P 3A',
        'Type / Spec': 'CP30 2P 3A',
        'Category (MC/EE)': 'EE',
        'Part Type': 'Standard Part',
        'Q\'TY': 1,
        'Unit': 'EA',
        'Maker': 'Mitsubishi',
        'Supplier': 'Mizumi',
        'Target Price': 1800,
        'Actual Price': 1000,
        'PO Number': 'PO-2026-002',
        'Store Location': 'Shelf E-04',
        'Status': 'Received',
        'Remarks': 'Sample EE Item',
      }
    ];

    const worksheet = XLSX.utils.json_to_sheet(sampleData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'BOM Sample Template');
    XLSX.writeFile(workbook, 'WARSGATE_BOM_Sample_Template.xlsx');
  };

  // Handle Excel File Upload / Drag & Drop
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportFileName(file.name);
    const reader = new FileReader();

    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const workbook = XLSX.read(bstr, { type: 'binary' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];

        const rawData: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

        const mapped: Partial<BomPartItem>[] = rawData.map((row, index) => {
          const catStr = String(row['Category (MC/EE)'] || row['Category'] || row['MC/EE'] || 'MC').toUpperCase();
          const category: CategoryType = catStr.includes('EE') ? 'EE' : 'MC';

          const typeStr = String(row['Part Type'] || row['Part Type (Standard/Feb)'] || row['Type'] || 'Standard Part');
          const partType: PartCategoryType = typeStr.toLowerCase().includes('feb') ? 'Feb Part' : 'Standard Part';

          const qty = Number(row['Q\'TY'] || row['QTY'] || row['Qty'] || row['Quantity'] || 1);
          const targetPrice = Number(row['Target Price'] || row['Target Price (THB)'] || row['Price'] || 0);
          const actualPrice = Number(row['Actual PO Price (THB)'] || row['Actual Price'] || row['Unit Price'] || targetPrice);
          
          const statusStr = String(row['Status'] || 'Planned');
          let status: PartStatus = 'Planned';
          if (statusStr.includes('Order')) status = 'Ordered';
          if (statusStr.includes('Receiv')) status = 'Received';
          if (statusStr.includes('Assembly')) status = 'In Assembly';
          if (statusStr.includes('Complete')) status = 'Completed';

          return {
            itemNo: Number(row['Item No'] || row['Item'] || index + 1),
            dwgNo: String(row['DWG No'] || row['DWG'] || row['Drawing No'] || '073007-000-000-A'),
            partName: String(row['Part Name'] || row['Name'] || row['Description'] || `Imported Item ${index + 1}`),
            typeSpec: String(row['Type / Spec'] || row['Spec'] || row['Type Spec'] || ''),
            category,
            partType,
            moduleId: targetModuleId,
            qty,
            unit: String(row['Unit'] || 'EA'),
            maker: String(row['Maker'] || ''),
            supplier: String(row['Supplier'] || ''),
            targetUnitPrice: targetPrice,
            targetTotalAmount: qty * targetPrice,
            unitPrice: actualPrice,
            totalAmount: qty * actualPrice,
            poNumber: String(row['PO Number'] || row['PO'] || ''),
            storeLocation: String(row['Store Location'] || row['Location'] || ''),
            status,
            remarks: String(row['Remarks'] || ''),
          };
        });

        setPreviewData(mapped);
        setImportStatusMessage(`อ่านไฟล์สำเร็จ พบข้อมูล ${mapped.length} รายการ`);
      } catch (err) {
        console.error(err);
        setImportStatusMessage('เกิดข้อผิดพลาดในการอ่านไฟล์ Excel กรุณาตรวจสอบรูปแบบไฟล์');
      }
    };

    reader.readAsBinaryString(file);
  };

  const handleConfirmImport = () => {
    if (previewData.length === 0) return;
    onImportParts(previewData);
    setImportStatusMessage(`นำเข้าข้อมูลเรียบร้อยแล้ว ${previewData.length} รายการ`);
    setTimeout(() => {
      onClose();
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-sm">
      <div className="glass-panel w-full max-w-2xl rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center space-x-2">
            <div className="p-2 rounded-xl bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                Import / Export ข้อมูล Excel BOM Part List
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">นำเข้าไฟล์ Excel (.xlsx, .xls, .csv) หรือส่งออกรายงาน</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 px-5 pt-3 bg-slate-50/50 dark:bg-slate-950">
          <button
            onClick={() => setActiveTab('import')}
            className={`px-4 py-2 text-xs font-black border-b-2 transition-all flex items-center ${
              activeTab === 'import'
                ? 'border-red-600 text-red-600 dark:text-red-400'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Upload className="w-4 h-4 mr-1.5" />
            นำเข้าไฟล์ Excel (Import)
          </button>

          <button
            onClick={() => setActiveTab('export')}
            className={`px-4 py-2 text-xs font-black border-b-2 transition-all flex items-center ${
              activeTab === 'export'
                ? 'border-red-600 text-red-600 dark:text-red-400'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Download className="w-4 h-4 mr-1.5" />
            ส่งออกไฟล์ Excel (Export)
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
          
          {activeTab === 'import' && (
            <div className="space-y-4">
              
              {/* Target Module Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  เลือก Module เป้าหมายสำหรับชิ้นส่วนที่นำเข้า
                </label>
                <select
                  value={targetModuleId}
                  onChange={(e) => setTargetModuleId(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white font-bold focus:outline-none"
                >
                  {modules.map(m => (
                    <option key={m.id} value={m.id}>{m.code} - {m.name}</option>
                  ))}
                </select>
              </div>

              {/* Upload Box */}
              <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-red-500 dark:hover:border-red-500 rounded-2xl p-6 text-center bg-slate-50/50 dark:bg-slate-950/50 transition-all">
                <input
                  type="file"
                  accept=".xlsx, .xls, .csv"
                  onChange={handleFileUpload}
                  id="excel-file-upload"
                  className="hidden"
                />
                <label htmlFor="excel-file-upload" className="cursor-pointer block space-y-2">
                  <div className="w-12 h-12 rounded-2xl bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400 flex items-center justify-center mx-auto">
                    <Upload className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-xs font-black text-slate-900 dark:text-white">
                      {importFileName ? importFileName : 'คลิกเพื่อเลือกไฟล์ Excel (.xlsx, .csv) หรือลากไฟล์มาวางที่นี่'}
                    </span>
                    <p className="text-[11px] text-slate-500 mt-1">รองรับไฟล์ Excel ของระบบ BOM Part List</p>
                  </div>
                </label>
              </div>

              {/* Status & Sample Template */}
              <div className="flex justify-between items-center text-xs">
                {importStatusMessage ? (
                  <span className="text-emerald-700 dark:text-emerald-400 font-extrabold flex items-center">
                    <CheckCircle className="w-4 h-4 mr-1" />
                    {importStatusMessage}
                  </span>
                ) : (
                  <span></span>
                )}

                <button
                  type="button"
                  onClick={handleDownloadSample}
                  className="text-red-600 dark:text-red-400 font-bold hover:underline flex items-center"
                >
                  <FileText className="w-3.5 h-3.5 mr-1" />
                  ดาวน์โหลดไฟล์แม่แบบตัวอย่าง (Sample Template)
                </button>
              </div>

              {/* Preview Table */}
              {previewData.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-black text-slate-900 dark:text-white">
                    ตัวอย่างข้อมูลที่กำลังจะนำเข้า ({previewData.length} รายการ)
                  </h4>
                  <div className="max-h-48 overflow-y-auto border border-slate-200 dark:border-slate-800 rounded-xl">
                    <table className="w-full text-left text-[11px] border-collapse">
                      <thead className="bg-slate-100 dark:bg-slate-950 font-bold sticky top-0">
                        <tr>
                          <th className="p-2">Item #</th>
                          <th className="p-2">Part Name</th>
                          <th className="p-2">Spec</th>
                          <th className="p-2 text-center">CAT</th>
                          <th className="p-2 text-right">Q'ty</th>
                          <th className="p-2 text-right">Price</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                        {previewData.map((part, i) => (
                          <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-900">
                            <td className="p-2 font-mono">{part.itemNo}</td>
                            <td className="p-2 font-bold">{part.partName}</td>
                            <td className="p-2 font-mono text-slate-500">{part.typeSpec || '-'}</td>
                            <td className="p-2 text-center font-bold">{part.category}</td>
                            <td className="p-2 text-right font-mono">{part.qty}</td>
                            <td className="p-2 text-right font-mono font-bold text-red-600">{part.unitPrice}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Action */}
              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  disabled={previewData.length === 0}
                  onClick={handleConfirmImport}
                  className={`px-5 py-2 rounded-xl text-xs font-black text-white transition-all flex items-center ${
                    previewData.length > 0
                      ? 'bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-800 shadow-md'
                      : 'bg-slate-300 dark:bg-slate-800 cursor-not-allowed text-slate-500'
                  }`}
                >
                  <Upload className="w-4 h-4 mr-1.5" />
                  นำเข้าข้อมูลสู่ระบบ ({previewData.length} รายการ)
                </button>
              </div>

            </div>
          )}

          {activeTab === 'export' && (
            <div className="space-y-4 py-4 text-center">
              <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-3">
                <FileSpreadsheet className="w-12 h-12 text-red-600 mx-auto" />
                <h4 className="text-sm font-black text-slate-900 dark:text-white">
                  ส่งออกข้อมูล BOM Part List ทั้งหมด ({parts.length} รายการ)
                </h4>
                <p className="text-xs text-slate-500">
                  ไฟล์ Excel ที่ส่งออกจะมีข้อมูลครบถ้วนทั้ง DWG No., Spec, ราคาประมาณการ, ราคาสั่งซื้อจริง, PO Number และตำแหน่งในสโตร์
                </p>
                <button
                  onClick={handleExportExcel}
                  className="px-6 py-2.5 bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-800 text-white rounded-xl text-xs font-black shadow-md transition-all inline-flex items-center"
                >
                  <Download className="w-4 h-4 mr-2" />
                  ดาวน์โหลดไฟล์ Excel (.xlsx)
                </button>
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
