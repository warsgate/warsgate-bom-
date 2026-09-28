import React, { useState, useMemo } from 'react';
import { 
  X, 
  Sparkles, 
  FileText, 
  ArrowRight, 
  Check, 
  AlertCircle, 
  CheckCircle2, 
  Copy, 
  Layers, 
  Wrench,
  Bot,
  Zap,
  Trash2,
  Plus
} from 'lucide-react';
import { BomPartItem, ModuleItem, ProjectItem, CategoryType, PartCategoryType } from '../types/bom';
import { formatCurrency } from '../utils/costCalculator';

interface CadBomExtractorModalProps {
  isOpen: boolean;
  onClose: () => void;
  project?: ProjectItem;
  modules: ModuleItem[];
  onImportParts: (parts: Partial<BomPartItem>[]) => Promise<void> | void;
}

interface ParsedCadPart {
  id: string;
  itemNo: number;
  dwgNo: string;
  partName: string;
  typeSpec: string;
  category: CategoryType;
  partType: PartCategoryType;
  qty: number;
  unit: string;
  maker: string;
  supplier: string;
  unitPrice: number;
  moduleId?: string;
}

const SAMPLE_CAD_BOM_1 = `1	WG-M01-001	Base Plate Lower	SS400 t=20 Milling & Black Oxide	1	EA	Warsgate	ร้านกลึงเจริญชัย	3500
2	WG-M01-002	Pillar Support Column	S45C Hard Chrome Shaft Dia 30x250	4	EA	Warsgate	ร้านกลึงเจริญชัย	850
3	HSR25R1SS+640L	Linear Guide Rail with Block	HSR25 - Length 640mm Grade H	2	SET	THK	Misumi Thailand	4200
4	CDQ2B40-50DZ	Compact Air Cylinder	Bore 40mm, Stroke 50mm	1	EA	SMC	SMC Thailand	1850
5	PR12-4DN	Inductive Proximity Sensor	NPN NO M12 Sensing 4mm	2	EA	Autonics	Sangchai Meter	450
6	WG-M01-003	Sensor Mounting Bracket	AL6061-T6 Anodized Clear t=5	2	EA	Warsgate	ร้าน CNC โปรเทค	480
7	CB-M6-25	Hex Socket Head Cap Screw	SUS304 M6x25 DIN912	16	EA	Misumi	สต็อกกลาง	12`;

const SAMPLE_CAD_BOM_2 = `DwgNo: WG-M02-010 | Name: Top Cover Guard | Spec: Acrylic Clear t=5 Laser Cut | Qty: 2 | Maker: Warsgate | Price: 750
DwgNo: WG-M02-011 | Name: Safety Hinge Heavy Duty | Spec: SUS304 60x60mm | Qty: 4 | Maker: Sugatsune | Price: 320
DwgNo: XCKN2118P20 | Name: Safety Limit Switch | Spec: 1NC+1NO Rotary Arm | Qty: 1 | Maker: Telemecanique | Price: 680
DwgNo: WG-M02-012 | Name: Aluminum Profile Frame | Spec: 40x40 Heavy Slot 8 Anodized | Qty: 6 | Maker: Item | Price: 550`;

export const CadBomExtractorModal: React.FC<CadBomExtractorModalProps> = ({
  isOpen,
  onClose,
  project,
  modules,
  onImportParts,
}) => {
  const [rawText, setRawText] = useState('');
  const [defaultModuleId, setDefaultModuleId] = useState<string>(modules[0]?.id || '');
  const [parsedParts, setParsedParts] = useState<ParsedCadPart[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Auto-detect Category & PartType rules
  const inferCategory = (name: string, spec: string, maker: string): CategoryType => {
    const text = `${name} ${spec} ${maker}`.toLowerCase();
    if (
      text.includes('sensor') || 
      text.includes('cable') || 
      text.includes('switch') || 
      text.includes('relay') || 
      text.includes('plc') || 
      text.includes('power supply') || 
      text.includes('solenoid') || 
      text.includes('terminal') ||
      text.includes('omron') ||
      text.includes('keyence') ||
      text.includes('autonics') ||
      text.includes('mitsubishi')
    ) {
      return 'EE';
    }
    return 'MC';
  };

  const inferPartType = (name: string, spec: string, maker: string): PartCategoryType => {
    const text = `${name} ${spec} ${maker}`.toLowerCase();
    // Known Standard brands/parts
    if (
      text.includes('smc') || 
      text.includes('festo') || 
      text.includes('misumi') || 
      text.includes('thk') || 
      text.includes('hiwin') || 
      text.includes('bearing') || 
      text.includes('cylinder') || 
      text.includes('screw') || 
      text.includes('bolt') || 
      text.includes('nut') || 
      text.includes('sensor') || 
      text.includes('switch') || 
      text.includes('motor') ||
      text.includes('fitting')
    ) {
      return 'Standard Part';
    }
    // Machining keywords
    if (
      text.includes('plate') || 
      text.includes('bracket') || 
      text.includes('shaft') || 
      text.includes('block') || 
      text.includes('cover') || 
      text.includes('jig') || 
      text.includes('ss400') || 
      text.includes('s45c') || 
      text.includes('al6061') || 
      text.includes('sus304') || 
      text.includes('milling') || 
      text.includes('lathe') ||
      text.includes('laser cut')
    ) {
      return 'Feb Part';
    }
    return 'Standard Part';
  };

  const handleParseText = () => {
    if (!rawText.trim()) return;
    setIsProcessing(true);

    const lines = rawText.split('\n').map(l => l.trim()).filter(Boolean);
    const results: ParsedCadPart[] = [];

    lines.forEach((line, idx) => {
      // Check for delimiter type: Tab, Pipe, Comma
      let parts: string[] = [];
      if (line.includes('\t')) {
        parts = line.split('\t').map(s => s.trim());
      } else if (line.includes('|')) {
        parts = line.split('|').map(s => s.replace(/.*?:/, '').trim());
      } else if (line.includes(',')) {
        parts = line.split(',').map(s => s.trim());
      } else {
        // Space separated fallback
        parts = line.split(/\s{2,}/).map(s => s.trim());
      }

      // If line is header, skip
      const firstCol = parts[0]?.toLowerCase() || '';
      if (firstCol === 'no' || firstCol === 'no.' || firstCol === 'item' || firstCol.includes('drawing')) {
        return;
      }

      let dwgNo = '';
      let partName = '';
      let typeSpec = '';
      let qty = 1;
      let unit = 'EA';
      let maker = '';
      let supplier = '';
      let unitPrice = 0;

      // Extract based on column length
      if (parts.length >= 7) {
        // Format: [ItemNo], DwgNo, PartName, Spec, Qty, Unit, Maker, [Supplier], [Price]
        let offset = 0;
        if (/^\d+$/.test(parts[0])) {
          offset = 1;
        }
        dwgNo = parts[offset] || '';
        partName = parts[offset + 1] || '';
        typeSpec = parts[offset + 2] || '';
        qty = parseFloat(parts[offset + 3]) || 1;
        unit = parts[offset + 4] || 'EA';
        maker = parts[offset + 5] || '';
        supplier = parts[offset + 6] || '';
        unitPrice = parseFloat(parts[offset + 7]) || 0;
      } else if (parts.length >= 4) {
        // Format: DwgNo, PartName, Spec, Qty
        dwgNo = parts[0] || '';
        partName = parts[1] || '';
        typeSpec = parts[2] || '';
        qty = parseFloat(parts[3]) || 1;
        if (parts[4]) maker = parts[4];
        if (parts[5]) unitPrice = parseFloat(parts[5]) || 0;
      } else {
        // Simple 2-3 parts: Name, Spec, Qty
        partName = parts[0] || `CAD Part ${idx + 1}`;
        typeSpec = parts[1] || '';
        qty = parseFloat(parts[2]) || 1;
      }

      // Auto fallback if dwgNo looks like part name
      if (!partName && dwgNo) {
        partName = dwgNo;
      }

      const category = inferCategory(partName, typeSpec, maker);
      const partType = inferPartType(partName, typeSpec, maker);

      results.push({
        id: `cad-part-${Date.now()}-${idx}`,
        itemNo: idx + 1,
        dwgNo,
        partName: partName || `Part #${idx + 1}`,
        typeSpec,
        category,
        partType,
        qty: qty || 1,
        unit: unit || 'EA',
        maker,
        supplier,
        unitPrice: unitPrice || 0,
        moduleId: defaultModuleId || undefined
      });
    });

    setParsedParts(results);
    setIsProcessing(false);
  };

  const handleUpdateParsedRow = (id: string, fields: Partial<ParsedCadPart>) => {
    setParsedParts(prev => prev.map(p => p.id === id ? { ...p, ...fields } : p));
  };

  const handleDeleteParsedRow = (id: string) => {
    setParsedParts(prev => prev.filter(p => p.id !== id));
  };

  const handleExecuteImport = async () => {
    if (parsedParts.length === 0) return;

    try {
      setIsProcessing(true);
      const payload: Partial<BomPartItem>[] = parsedParts.map((p, idx) => ({
        dwgNo: p.dwgNo || '',
        partName: p.partName,
        typeSpec: p.typeSpec || '',
        category: p.category,
        partType: p.partType,
        qty: p.qty,
        unit: p.unit || 'EA',
        maker: p.maker || '',
        supplier: p.supplier || '',
        unitPrice: p.unitPrice || 0,
        targetUnitPrice: p.unitPrice || 0,
        totalAmount: (p.qty || 1) * (p.unitPrice || 0),
        targetTotalAmount: (p.qty || 1) * (p.unitPrice || 0),
        moduleId: p.moduleId || defaultModuleId || undefined,
        status: 'Planned',
        workflowStage: '2. BOM Part List',
        remarks: '[AI CAD Extracted]'
      }));

      await onImportParts(payload);
      setSuccessMessage(`นำเข้าชิ้นส่วนจากแบบ CAD สำเร็จทั้งหมด ${parsedParts.length} รายการ!`);
      setTimeout(() => {
        setSuccessMessage('');
        onClose();
      }, 1800);
    } catch (err: any) {
      console.error(err);
      alert('เกิดข้อผิดพลาดในการนำเข้า BOM: ' + (err?.message || ''));
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 w-full max-w-5xl rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-indigo-900 via-slate-900 to-slate-900 text-white flex items-center justify-between border-b border-indigo-800/40">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-400 shadow-inner">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-sm font-black tracking-wide">
                  AI CAD & Drawing BOM Extractor
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-indigo-500/30 text-indigo-300 border border-indigo-400/40 flex items-center">
                  <Sparkles className="w-2.5 h-2.5 mr-1" />
                  Auto-Classify
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                วางข้อความตารางแบบ CAD / Drawing Parts List เพื่อแปลงเป็นรายการ BOM พร้อมจำแนก MC/EE และ Standard/Feb อัตโนมัติ
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar space-y-4 bg-slate-50 dark:bg-slate-950">
          
          {/* Success Banner */}
          {successMessage && (
            <div className="p-3 bg-emerald-600 text-white rounded-xl flex items-center space-x-2 text-xs font-bold shadow-lg animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-200" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Step 1: Input text & Quick presets */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <label className="text-xs font-black text-slate-900 dark:text-white flex items-center">
                <FileText className="w-3.5 h-3.5 mr-1.5 text-indigo-500" />
                วางตารางข้อความจาก CAD (SolidWorks, Inventor, AutoCAD, Excel)
              </label>
              
              {/* Presets */}
              <div className="flex items-center space-x-2 text-[10px] font-bold">
                <span className="text-slate-400">ตัวอย่างข้อมูล:</span>
                <button
                  type="button"
                  onClick={() => setRawText(SAMPLE_CAD_BOM_1)}
                  className="px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 transition-colors"
                >
                  SolidWorks Assembly Tabular
                </button>
                <button
                  type="button"
                  onClick={() => setRawText(SAMPLE_CAD_BOM_2)}
                  className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 transition-colors"
                >
                  Pipe Delimited CAD Notes
                </button>
              </div>
            </div>

            <textarea
              rows={4}
              value={rawText}
              onChange={e => setRawText(e.target.value)}
              placeholder="วางข้อความที่ Copy จากตารางในแบบ Drawing หรือ Excel ที่นี่...&#10;ตัวอย่าง: WG-M01-001	Base Plate Lower	SS400 t=20 Milling	1	EA	3500"
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />

            <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
              <div className="flex items-center space-x-2">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  นำเข้าสู่ Module เริ่มต้น:
                </label>
                <select
                  value={defaultModuleId}
                  onChange={e => setDefaultModuleId(e.target.value)}
                  className="bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-2.5 py-1 text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">(ไม่ระบุ Module / พาร์ทรวม)</option>
                  {modules.map(m => (
                    <option key={m.id} value={m.id}>
                      {m.code} - {m.name}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="button"
                onClick={handleParseText}
                disabled={!rawText.trim() || isProcessing}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-black shadow-md flex items-center transition-all"
              >
                <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                {isProcessing ? 'กำลังประมวลผล...' : 'กดแยกข้อมูลด้วย AI & Rule Engine'}
              </button>
            </div>
          </div>

          {/* Step 2: Parsed Preview & Verification */}
          {parsedParts.length > 0 && (
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden space-y-3 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-black text-slate-900 dark:text-white flex items-center">
                    <CheckCircle2 className="w-4 h-4 mr-1.5 text-emerald-500" />
                    ผลการสกัดข้อมูล ({parsedParts.length} รายการพร้อมนำเข้า)
                  </h4>
                  <p className="text-[10px] text-slate-500">
                    ตรวจทานหรือแก้ไขช่องข้อมูลก่อนกดยืนยันการนำเข้าสู่ระบบ BOM
                  </p>
                </div>

                <div className="text-xs font-bold text-indigo-600 dark:text-indigo-400 font-mono">
                  รวมมูลค่า: {formatCurrency(parsedParts.reduce((acc, p) => acc + (p.qty * p.unitPrice), 0))} ฿
                </div>
              </div>

              <div className="overflow-x-auto max-h-72 overflow-y-auto custom-scrollbar border border-slate-200 dark:border-slate-800 rounded-xl">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="sticky top-0 z-10 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-extrabold">
                    <tr className="divide-x divide-slate-200 dark:divide-slate-800 text-[11px]">
                      <th className="px-2.5 py-2 w-8 text-center">#</th>
                      <th className="px-2.5 py-2 w-28">DWG NO.</th>
                      <th className="px-2.5 py-2 min-w-[160px]">PART NAME</th>
                      <th className="px-2.5 py-2 min-w-[160px]">SPEC / MATERIAL</th>
                      <th className="px-2.5 py-2 w-20 text-center">CAT</th>
                      <th className="px-2.5 py-2 w-24 text-center">TYPE</th>
                      <th className="px-2.5 py-2 w-16 text-center">QTY</th>
                      <th className="px-2.5 py-2 w-14 text-center">UNIT</th>
                      <th className="px-2.5 py-2 w-24 text-right">UNIT PRICE</th>
                      <th className="px-2.5 py-2 w-10 text-center">ลบ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-sans">
                    {parsedParts.map((part, idx) => (
                      <tr key={part.id} className="divide-x divide-slate-100 dark:divide-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40">
                        <td className="px-2 py-1.5 text-center text-slate-400 font-mono text-[10px]">{idx + 1}</td>
                        <td className="px-2 py-1.5">
                          <input
                            type="text"
                            value={part.dwgNo}
                            onChange={e => handleUpdateParsedRow(part.id, { dwgNo: e.target.value })}
                            className="w-full bg-transparent border-0 p-0 text-xs font-mono font-bold text-slate-800 dark:text-slate-200 focus:ring-0"
                          />
                        </td>
                        <td className="px-2 py-1.5">
                          <input
                            type="text"
                            value={part.partName}
                            onChange={e => handleUpdateParsedRow(part.id, { partName: e.target.value })}
                            className="w-full bg-transparent border-0 p-0 text-xs font-extrabold text-slate-900 dark:text-white focus:ring-0"
                          />
                        </td>
                        <td className="px-2 py-1.5">
                          <input
                            type="text"
                            value={part.typeSpec}
                            onChange={e => handleUpdateParsedRow(part.id, { typeSpec: e.target.value })}
                            className="w-full bg-transparent border-0 p-0 text-xs text-slate-600 dark:text-slate-300 focus:ring-0"
                          />
                        </td>
                        <td className="px-2 py-1.5 text-center">
                          <select
                            value={part.category}
                            onChange={e => handleUpdateParsedRow(part.id, { category: e.target.value as CategoryType })}
                            className="bg-transparent border-0 text-[10px] font-black p-0 text-slate-800 dark:text-slate-200 cursor-pointer"
                          >
                            <option value="MC">MC</option>
                            <option value="EE">EE</option>
                          </select>
                        </td>
                        <td className="px-2 py-1.5 text-center">
                          <select
                            value={part.partType}
                            onChange={e => handleUpdateParsedRow(part.id, { partType: e.target.value as PartCategoryType })}
                            className="bg-transparent border-0 text-[10px] font-bold p-0 text-slate-800 dark:text-slate-200 cursor-pointer"
                          >
                            <option value="Standard Part">Standard</option>
                            <option value="Feb Part">Feb Part</option>
                          </select>
                        </td>
                        <td className="px-2 py-1.5 text-center">
                          <input
                            type="number"
                            min="1"
                            value={part.qty}
                            onChange={e => handleUpdateParsedRow(part.id, { qty: parseFloat(e.target.value) || 1 })}
                            className="w-full bg-transparent border-0 p-0 text-xs font-mono font-bold text-center text-slate-900 dark:text-white focus:ring-0"
                          />
                        </td>
                        <td className="px-2 py-1.5 text-center text-[10px] font-bold text-slate-500">
                          {part.unit}
                        </td>
                        <td className="px-2 py-1.5 text-right font-mono">
                          <input
                            type="number"
                            min="0"
                            value={part.unitPrice}
                            onChange={e => handleUpdateParsedRow(part.id, { unitPrice: parseFloat(e.target.value) || 0 })}
                            className="w-full bg-transparent border-0 p-0 text-xs font-mono font-black text-right text-slate-900 dark:text-white focus:ring-0"
                          />
                        </td>
                        <td className="px-2 py-1.5 text-center">
                          <button
                            type="button"
                            onClick={() => handleDeleteParsedRow(part.id)}
                            className="text-slate-400 hover:text-rose-500 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-slate-600 dark:text-slate-400 font-bold hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors text-xs"
          >
            ปิดหน้าต่าง
          </button>

          <button
            type="button"
            onClick={handleExecuteImport}
            disabled={parsedParts.length === 0 || isProcessing}
            className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-black rounded-xl shadow-md transition-all text-xs flex items-center"
          >
            <Check className="w-4 h-4 mr-2" />
            ยืนยันนำเข้า {parsedParts.length} รายการเข้าสู่ BOM
          </button>
        </div>

      </div>
    </div>
  );
};
