import React, { useState, useEffect } from 'react';
import { X, Printer, QrCode, Tag, Check, Layers, Filter } from 'lucide-react';
import { BomPartItem, ModuleItem, ProjectItem } from '../types/bom';
import { generateQrDataUrl, formatPartQrPayload } from '../utils/qrHelper';

interface QrTagModalProps {
  isOpen: boolean;
  onClose: () => void;
  project?: ProjectItem | null;
  modules: ModuleItem[];
  parts: BomPartItem[];
  singlePart?: BomPartItem | null;
}

export const QrTagModal: React.FC<QrTagModalProps> = ({
  isOpen,
  onClose,
  project,
  modules,
  parts,
  singlePart,
}) => {
  const [selectedModuleId, setSelectedModuleId] = useState<string>('ALL');
  const [qrMap, setQrMap] = useState<Record<string, string>>({});
  const [isGenerating, setIsGenerating] = useState(false);

  // Filter parts to display
  const displayParts = React.useMemo(() => {
    if (singlePart) return [singlePart];
    if (selectedModuleId === 'ALL') return parts;
    return parts.filter(p => p.moduleId === selectedModuleId);
  }, [singlePart, selectedModuleId, parts]);

  // Generate QR codes for all displayed parts
  useEffect(() => {
    if (!isOpen) return;
    let isCancelled = false;

    async function generateAll() {
      setIsGenerating(true);
      const newMap: Record<string, string> = {};
      for (const p of displayParts) {
        if (isCancelled) break;
        const payload = formatPartQrPayload(p);
        const dataUrl = await generateQrDataUrl(payload);
        newMap[p.id] = dataUrl;
      }
      if (!isCancelled) {
        setQrMap(newMap);
        setIsGenerating(false);
      }
    }

    generateAll();
    return () => { isCancelled = true; };
  }, [isOpen, displayParts]);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const getModuleName = (modId?: string) => {
    if (!modId) return 'Main Assembly / General';
    const found = modules.find(m => m.id === modId);
    return found ? found.name : 'Sub Module';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/70 backdrop-blur-sm overflow-y-auto">
      {/* Container */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-4xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[92vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header - Hidden on Print */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 print:hidden">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-red-600 text-white rounded-xl shadow-md">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white flex items-center">
                <span>{singlePart ? `ป้าย QR Tag ชิ้นส่วน: #${singlePart.itemNo}` : `พิมพ์ป้ายสติกเกอร์ QR Tag ติดชิ้นส่วน (${displayParts.length} รายการ)`}</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {project ? `[${project.code}] ${project.name}` : 'WARSGATE BOM AUTOMATION'}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handlePrint}
              disabled={isGenerating}
              className="px-4 py-2 bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-800 text-white rounded-xl text-xs font-bold shadow-md transition-all flex items-center disabled:opacity-50"
            >
              <Printer className="w-4 h-4 mr-1.5" />
              <span>พิมพ์สติกเกอร์ (Print A4)</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filter Controls - Hidden on Print */}
        {!singlePart && modules.length > 0 && (
          <div className="p-3 bg-slate-100/60 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-5 print:hidden">
            <div className="flex items-center space-x-2 text-xs font-bold text-slate-600 dark:text-slate-300">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <span>กรองตาม Module:</span>
              <select
                value={selectedModuleId}
                onChange={e => setSelectedModuleId(e.target.value)}
                className="bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1 text-xs font-bold focus:ring-2 focus:ring-red-500 focus:outline-none"
              >
                <option value="ALL">-- ทุก Module ({parts.length} รายการ) --</option>
                {modules.map(m => (
                  <option key={m.id} value={m.id}>
                    {m.code ? `[${m.code}] ` : ''}{m.name}
                  </option>
                ))}
              </select>
            </div>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              ขนาดมาตรฐาน 70x37mm หรือ 80x45mm (2 คอลัมน์)
            </span>
          </div>
        )}

        {/* Stickers Grid */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-100 dark:bg-slate-950 print:bg-white print:p-0 print:overflow-visible">
          {isGenerating && (
            <div className="text-center py-10 print:hidden">
              <div className="w-8 h-8 border-3 border-red-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
              <p className="text-xs text-slate-500 font-bold">กำลังสร้างรหัส QR Code...</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 print:grid-cols-2 print:gap-3 print:m-0">
            {displayParts.map((p) => {
              const qrSrc = qrMap[p.id];
              return (
                <div
                  key={p.id}
                  className="bg-white text-slate-900 border-2 border-slate-300 dark:border-slate-700 print:border-slate-400 rounded-xl p-3.5 shadow-sm flex flex-col justify-between relative overflow-hidden print:shadow-none print:break-inside-avoid print:rounded-lg"
                  style={{ minHeight: '150px' }}
                >
                  {/* Top Bar inside sticker */}
                  <div className="flex items-center justify-between border-b border-slate-200 pb-1.5 mb-2">
                    <div className="flex items-center space-x-1.5">
                      <span className="px-1.5 py-0.5 bg-red-600 text-white text-[9px] font-black rounded uppercase tracking-wider">
                        WARSGATE
                      </span>
                      <span className="text-[10px] font-bold text-slate-600 font-mono">
                        {project?.code || 'PRJ'}
                      </span>
                    </div>
                    <div className="text-[10px] font-black text-red-700 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full">
                      Item #{p.itemNo}
                    </div>
                  </div>

                  {/* Body: Details + QR Code */}
                  <div className="flex items-start justify-between space-x-2">
                    <div className="flex-1 space-y-1 pr-1">
                      <h4 className="text-xs font-black leading-snug line-clamp-2 text-slate-900">
                        {p.partName}
                      </h4>
                      {p.typeSpec && (
                        <p className="text-[10px] font-mono text-slate-600 line-clamp-1">
                          <strong>Spec:</strong> {p.typeSpec}
                        </p>
                      )}
                      <p className="text-[9px] text-slate-500 line-clamp-1">
                        <strong>Module:</strong> {getModuleName(p.moduleId)}
                      </p>
                      <div className="flex items-center space-x-2 text-[9px] text-slate-600 font-medium pt-0.5">
                        {p.maker && <span><strong>Brand:</strong> {p.maker}</span>}
                        {p.supplier && <span><strong>Vendor:</strong> {p.supplier}</span>}
                      </div>
                    </div>

                    {/* QR Code Canvas/Image */}
                    <div className="shrink-0 flex flex-col items-center">
                      <div className="p-1 bg-white border border-slate-200 rounded-lg shadow-inner">
                        {qrSrc ? (
                          <img
                            src={qrSrc}
                            alt={`QR for ${p.partName}`}
                            className="w-20 h-20 sm:w-22 sm:h-22 object-contain"
                          />
                        ) : (
                          <div className="w-20 h-20 bg-slate-100 flex items-center justify-center text-[9px] text-slate-400">
                            Loading...
                          </div>
                        )}
                      </div>
                      <span className="text-[8px] font-mono text-slate-500 mt-1 uppercase">
                        SCAN TO RECEIVE
                      </span>
                    </div>
                  </div>

                  {/* Footer inside sticker */}
                  <div className="mt-2 pt-1.5 border-t border-dashed border-slate-200 flex items-center justify-between text-[9px]">
                    <div className="flex items-center space-x-2 text-slate-500 font-bold">
                      <span>จำนวน: <strong className="text-slate-900">{p.qty} {p.unit}</strong></span>
                      {p.poNumber && <span>PO: <strong className="text-slate-800">{p.poNumber}</strong></span>}
                    </div>
                    <span className={`px-1.5 py-0.2 rounded font-black text-[8px] ${
                      p.status === 'Received' ? 'bg-emerald-100 text-emerald-800' :
                      p.status === 'Ordered' ? 'bg-amber-100 text-amber-800' :
                      'bg-slate-100 text-slate-700'
                    }`}>
                      {p.status || 'Planned'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {displayParts.length === 0 && (
            <div className="text-center py-16 text-slate-400 font-bold">
              ไม่พบรายการชิ้นส่วนในตัวกรองนี้
            </div>
          )}
        </div>

        {/* Footer info - Hidden on Print */}
        <div className="p-3 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between px-5 print:hidden">
          <span>💡 สามารถใช้กล้องมือถือหรือเครื่องสแกนบาร์โค้ดสแกน QR นี้เพื่อตรวจรับของเข้าสโตร์อัตโนมัติ</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold hover:bg-slate-300 dark:hover:bg-slate-700 text-xs"
          >
            ปิดหน้าต่าง
          </button>
        </div>

      </div>
    </div>
  );
};
