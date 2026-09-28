import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  QrCode, 
  Printer, 
  Eye, 
  Copy, 
  Check, 
  ExternalLink, 
  ShieldCheck, 
  Cpu, 
  Zap, 
  Wind, 
  Calendar, 
  Building2, 
  Sparkles,
  Layers,
  FileText
} from 'lucide-react';
import QRCode from 'qrcode';
import { ProjectItem, ModuleItem } from '../types/bom';

interface MachineNameplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  project?: ProjectItem;
  modules: ModuleItem[];
}

export const MachineNameplateModal: React.FC<MachineNameplateModalProps> = ({
  isOpen,
  onClose,
  project,
  modules,
}) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copiedLink, setCopiedLink] = useState(false);
  const [isCustomerPreview, setIsCustomerPreview] = useState(false);

  // Machine Nameplate Specs Form
  const [serialNo, setSerialNo] = useState(`WG-${project?.runningNumber ? String(project.runningNumber).padStart(4, '0') : '2026-001'}`);
  const [voltage, setVoltage] = useState('380VAC 3-Phase 50Hz');
  const [airPressure, setAirPressure] = useState('0.5 - 0.6 MPa (5-6 Bar)');
  const [weightKg, setWeightKg] = useState('650 KG');
  const [manufactureYear, setManufactureYear] = useState('2026');

  // Customer portal URL
  const portalUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}${window.location.pathname}?tab=production-workflow&projectId=${project?.id || ''}&clientView=true`
    : '';

  useEffect(() => {
    if (portalUrl) {
      QRCode.toDataURL(portalUrl, {
        width: 240,
        margin: 1,
        color: {
          dark: '#0f172a',
          light: '#ffffff'
        }
      }).then(url => setQrDataUrl(url)).catch(console.error);
    }
  }, [portalUrl]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(portalUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handlePrint = () => {
    window.print();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 w-full max-w-4xl rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white flex items-center justify-between border-b border-slate-700/60 print:hidden">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-400 shadow-inner">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-sm font-black tracking-wide">
                  Machine Nameplate & Customer Live Portal
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-indigo-500/30 text-indigo-300 border border-indigo-400/40">
                  ป้ายเนมเพลทติดโครงเครื่องจักร
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                พิมพ์ป้ายชื่อเครื่องจักรโลหะพร้อม QR Code สำหรับลูกค้าสแกนดูความคืบหน้า คู่มือ และแบบไวริ่ง
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsCustomerPreview(!isCustomerPreview)}
              className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white rounded-xl text-xs font-bold transition-colors flex items-center"
            >
              <Eye className="w-3.5 h-3.5 mr-1" />
              {isCustomerPreview ? 'สลับดูป้าย Nameplate' : 'พรีวิวมุมมองลูกค้า'}
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 custom-scrollbar space-y-5 bg-slate-50 dark:bg-slate-950">
          
          {!isCustomerPreview ? (
            /* VIEW 1: MACHINE NAMEPLATE (INDUSTRIAL STAINLESS LOOK) */
            <div className="space-y-4">
              
              {/* Editable Specs Toolbar */}
              <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs print:hidden">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-0.5">Serial No.</label>
                  <input
                    type="text"
                    value={serialNo}
                    onChange={e => setSerialNo(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-2 py-1 font-mono font-bold text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-0.5">Voltage</label>
                  <input
                    type="text"
                    value={voltage}
                    onChange={e => setVoltage(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-2 py-1 font-mono font-bold text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-0.5">Air Pressure</label>
                  <input
                    type="text"
                    value={airPressure}
                    onChange={e => setAirPressure(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-2 py-1 font-mono font-bold text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-0.5">Weight</label>
                  <input
                    type="text"
                    value={weightKg}
                    onChange={e => setWeightKg(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-2 py-1 font-mono font-bold text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-0.5">Year</label>
                  <input
                    type="text"
                    value={manufactureYear}
                    onChange={e => setManufactureYear(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-2 py-1 font-mono font-bold text-xs"
                  />
                </div>
              </div>

              {/* INDUSTRIAL ALUMINUM NAMEPLATE PLATE */}
              <div className="max-w-2xl mx-auto p-6 bg-gradient-to-b from-slate-100 via-slate-200 to-slate-300 dark:from-slate-800 dark:via-slate-900 dark:to-slate-950 border-4 border-slate-400 dark:border-slate-600 rounded-2xl shadow-xl relative overflow-hidden text-slate-900 dark:text-white">
                
                {/* 4 Corner Rivet Holes */}
                <div className="absolute top-2 left-2 w-3.5 h-3.5 rounded-full bg-slate-400 dark:bg-slate-600 border border-slate-500 shadow-inner flex items-center justify-center">
                  <div className="w-1.5 h-1.5 rounded-full bg-slate-600 dark:bg-slate-800"></div>
                </div>
                <div className="absolute top-2 right-2 w-3.5 h-3.5 rounded-full bg-slate-400 dark:bg-slate-600 border border-slate-500 shadow-inner flex items-center justify-center">
                  <div className="w-1.5 h-1.5 rounded-full bg-slate-600 dark:bg-slate-800"></div>
                </div>
                <div className="absolute bottom-2 left-2 w-3.5 h-3.5 rounded-full bg-slate-400 dark:bg-slate-600 border border-slate-500 shadow-inner flex items-center justify-center">
                  <div className="w-1.5 h-1.5 rounded-full bg-slate-600 dark:bg-slate-800"></div>
                </div>
                <div className="absolute bottom-2 right-2 w-3.5 h-3.5 rounded-full bg-slate-400 dark:bg-slate-600 border border-slate-500 shadow-inner flex items-center justify-center">
                  <div className="w-1.5 h-1.5 rounded-full bg-slate-600 dark:bg-slate-800"></div>
                </div>

                {/* Company Title */}
                <div className="text-center pb-3 border-b-2 border-slate-400 dark:border-slate-600">
                  <span className="text-[11px] font-black tracking-widest text-red-600 dark:text-red-500 uppercase">
                    WARSGATE AUTOMATION
                  </span>
                  <h1 className="text-lg font-black tracking-wider uppercase text-slate-900 dark:text-white">
                    CUSTOM AUTOMATION MACHINERY
                  </h1>
                  <span className="text-[9px] font-bold text-slate-500">BANGKOK / SAMUT PRAKAN, THAILAND</span>
                </div>

                {/* Main Plate Details */}
                <div className="grid grid-cols-3 gap-4 pt-4 items-center">
                  
                  {/* Left specs (2 cols) */}
                  <div className="col-span-2 space-y-2 text-xs">
                    <div className="grid grid-cols-3 pb-1 border-b border-slate-300 dark:border-slate-700">
                      <span className="font-bold text-slate-500 text-[10px]">MODEL / CODE:</span>
                      <span className="col-span-2 font-black font-mono">{project?.code || 'PRJ-107'}</span>
                    </div>

                    <div className="grid grid-cols-3 pb-1 border-b border-slate-300 dark:border-slate-700">
                      <span className="font-bold text-slate-500 text-[10px]">MACHINE NAME:</span>
                      <span className="col-span-2 font-extrabold truncate">{project?.name || 'Automation Machine'}</span>
                    </div>

                    <div className="grid grid-cols-3 pb-1 border-b border-slate-300 dark:border-slate-700">
                      <span className="font-bold text-slate-500 text-[10px]">SERIAL NO.:</span>
                      <span className="col-span-2 font-mono font-black text-red-600 dark:text-red-400">{serialNo}</span>
                    </div>

                    <div className="grid grid-cols-3 pb-1 border-b border-slate-300 dark:border-slate-700">
                      <span className="font-bold text-slate-500 text-[10px]">CLIENT:</span>
                      <span className="col-span-2 font-bold">{project?.customer || 'Customer'}</span>
                    </div>

                    <div className="grid grid-cols-3 pb-1 border-b border-slate-300 dark:border-slate-700">
                      <span className="font-bold text-slate-500 text-[10px]">POWER SUPPLY:</span>
                      <span className="col-span-2 font-mono font-bold">{voltage}</span>
                    </div>

                    <div className="grid grid-cols-3 pb-1 border-b border-slate-300 dark:border-slate-700">
                      <span className="font-bold text-slate-500 text-[10px]">PNEUMATICS:</span>
                      <span className="col-span-2 font-mono font-bold">{airPressure}</span>
                    </div>

                    <div className="grid grid-cols-3">
                      <span className="font-bold text-slate-500 text-[10px]">WEIGHT / YEAR:</span>
                      <span className="col-span-2 font-mono font-bold">{weightKg} | {manufactureYear}</span>
                    </div>
                  </div>

                  {/* Right: QR Code */}
                  <div className="flex flex-col items-center justify-center p-2 bg-white rounded-xl border-2 border-slate-300 shadow-sm text-slate-900">
                    {qrDataUrl ? (
                      <img src={qrDataUrl} alt="Machine QR" className="w-28 h-28 object-contain" />
                    ) : (
                      <div className="w-28 h-28 bg-slate-100 flex items-center justify-center text-xs text-slate-400">Loading...</div>
                    )}
                    <span className="text-[9px] font-black uppercase text-slate-700 mt-1">SCAN FOR MANUAL</span>
                  </div>

                </div>

              </div>
            </div>
          ) : (
            /* VIEW 2: CUSTOMER READ-ONLY PORTAL PREVIEW */
            <div className="max-w-xl mx-auto bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 rounded-lg bg-red-600 flex items-center justify-center text-white font-black text-xs">
                    WG
                  </div>
                  <div>
                    <h3 className="text-xs font-black text-slate-900 dark:text-white">
                      Warsgate Client Project Portal
                    </h3>
                    <span className="text-[10px] text-emerald-600 font-bold">● Live Connected</span>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                  Client View (Cost Hidden)
                </span>
              </div>

              {/* Progress & Stage */}
              <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-slate-900 dark:text-white">
                    {project?.name || 'Automation Machine'}
                  </span>
                  <span className="font-mono font-bold text-xs text-indigo-600 dark:text-indigo-400">
                    {project?.code}
                  </span>
                </div>

                <div>
                  <div className="flex justify-between text-[11px] font-bold text-slate-500 mb-1">
                    <span>สถานะปัจจุบัน: 4. Assembly & Wiring</span>
                    <span>82%</span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div className="bg-emerald-500 h-full rounded-full" style={{ width: '82%' }}></div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] pt-1 border-t border-slate-200 dark:border-slate-800">
                  <div>
                    <span className="text-slate-400 block text-[10px]">กำหนดส่งมอบ:</span>
                    <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{project?.targetDeliveryDate || '2026-10-15'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">วิศวกรผู้ดูแล:</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">{project?.contactPerson || 'Warsgate Engineering Team'}</span>
                  </div>
                </div>
              </div>

              {/* Modules List */}
              <div className="space-y-2">
                <h4 className="text-xs font-black text-slate-900 dark:text-white flex items-center">
                  <Layers className="w-3.5 h-3.5 mr-1.5 text-indigo-500" />
                  โมดูลการทำงาน ({modules.length} Modules)
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {modules.map(m => (
                    <div key={m.id} className="p-2.5 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800">
                      <div className="font-mono font-bold text-indigo-600 dark:text-indigo-400 text-[10px]">{m.code}</div>
                      <div className="font-extrabold text-slate-900 dark:text-white">{m.name}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Downloads / Manuals */}
              <div className="p-3 bg-indigo-50/50 dark:bg-indigo-950/20 rounded-xl border border-indigo-100 dark:border-indigo-900/40 space-y-2">
                <div className="text-[11px] font-bold text-indigo-800 dark:text-indigo-300 flex items-center">
                  <FileText className="w-3.5 h-3.5 mr-1" />
                  เอกสารคู่มือเครื่องจักร (Machine Documentation)
                </div>
                <div className="flex flex-wrap gap-2 text-[10px] font-bold">
                  <button type="button" className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-300">
                    📖 Operation Manual PDF
                  </button>
                  <button type="button" className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-300">
                    ⚡ Electrical Schematic
                  </button>
                  <button type="button" className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-300">
                    ⚙️ Recommended Spare Parts
                  </button>
                </div>
              </div>

            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center print:hidden">
          <button
            type="button"
            onClick={handleCopyLink}
            className="px-3.5 py-2 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 rounded-xl transition-colors flex items-center"
          >
            {copiedLink ? <Check className="w-4 h-4 mr-1 text-emerald-500" /> : <Copy className="w-4 h-4 mr-1" />}
            {copiedLink ? 'คัดลอกลิงก์แล้ว' : 'คัดลอกลิงก์ Client Portal'}
          </button>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={handlePrint}
              className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-black rounded-xl shadow-md transition-colors text-xs flex items-center"
            >
              <Printer className="w-4 h-4 mr-1.5" />
              พิมพ์ป้าย Nameplate
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
