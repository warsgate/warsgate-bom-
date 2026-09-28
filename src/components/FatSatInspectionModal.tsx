import React, { useState, useRef, useEffect } from 'react';
import { 
  X, 
  ClipboardCheck, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Printer, 
  PenTool, 
  RotateCcw, 
  Building2, 
  Calendar, 
  User, 
  ShieldCheck, 
  Zap, 
  Wrench, 
  Clock,
  Sparkles,
  Download
} from 'lucide-react';
import { ProjectItem } from '../types/bom';

interface FatSatInspectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  project?: ProjectItem;
}

interface ChecklistItem {
  id: string;
  category: 'PNEUMATIC' | 'ELECTRICAL' | 'MECHANICAL' | 'OPERATION';
  title: string;
  desc: string;
  status: 'PASS' | 'FAIL' | 'PENDING' | 'NA';
  remarks?: string;
}

const DEFAULT_CHECKLIST: ChecklistItem[] = [
  // Pneumatics
  { id: 'pn-1', category: 'PNEUMATIC', title: 'แรงดันลมระบบ (System Pressure Test)', desc: 'แรงดันลมเมน 5.5 - 6.0 Bar คงที่ ไม่พบจุดรั่วซึม (Leakage check)', status: 'PASS' },
  { id: 'pn-2', category: 'PNEUMATIC', title: 'กระบอกลม & โซลินอยด์วาล์ว (Pneumatic Motion)', desc: 'กระบอกสูบเคลื่อนที่ครบ Stroke, Speed Controller ปรับแต่งลื่นไหล', status: 'PASS' },
  { id: 'pn-3', category: 'PNEUMATIC', title: 'ชุดกรองดักน้ำ & ปรับแรงดัน (F.R.L. Unit)', desc: 'เดรนน้ำและตัววัดแรงดันลมทำงานปกติ', status: 'PASS' },
  
  // Electrical & Safety
  { id: 'el-1', category: 'ELECTRICAL', title: 'ไฟเลี้ยงหลัก & คอนโทรล (Power Supply & 24VDC)', desc: 'แรงดันไฟเมน 380V/220V และ 24VDC Power Supply นิ่งและเสถียร', status: 'PASS' },
  { id: 'el-2', category: 'ELECTRICAL', title: 'ระบบความปลอดภัย & E-Stop (Safety Interlock)', desc: 'ปุ่ม Emergency Stop และ Light Curtain สั่งตัดการเคลื่อนที่ของเครื่องจักรทันที', status: 'PASS' },
  { id: 'el-3', category: 'ELECTRICAL', title: 'เซนเซอร์ & สวิตช์ (Sensor I/O Check)', desc: 'Proximity, Fiber Optic, และ Photo Sensor ตรวจจับตำแหน่งชิ้นงานได้แม่นยำ 100%', status: 'PASS' },
  { id: 'el-4', category: 'ELECTRICAL', title: 'สายไฟ & มาร์คเกอร์ (Wiring & Earthing)', desc: 'เก็บสายในราง Wire Duct เรียบร้อย มี Wire Marker ครบ และขันกราวด์แน่นหนา', status: 'PASS' },
  
  // Mechanical
  { id: 'mc-1', category: 'MECHANICAL', title: 'แนวระนาบ & ฉาก (Machine Leveling & Alignment)', desc: 'ฐานเครื่องได้ระนาบระดับน้ำ เสาค้ำและจุดหมุนได้ฉากตามแบบ Drawing', status: 'PASS' },
  { id: 'mc-2', category: 'MECHANICAL', title: 'การขันแน่น & แต้มสี (Torque & QC Marking)', desc: 'น็อตยึดโครงสร้างและจุดสำคัญขันตามค่าแรงบิด พร้อมแต้มสี QC Mark', status: 'PASS' },
  { id: 'mc-3', category: 'MECHANICAL', title: 'ระบบหล่อลื่น (Lubrication & Greasing)', desc: 'ลิเนียร์ไกด์และบอลสกรูทาจารบีครบทุกจุด เคลื่อนที่ไม่มีเสียงสะดุด', status: 'PASS' },

  // Operation
  { id: 'op-1', category: 'OPERATION', title: 'ทดสอบเดินเครื่องเปล่า (Dry Run 30 Mins)', desc: 'เดินเครื่องต่อเนื่อง 30 นาที ไม่พบความร้อนผิดปกติหรือสัญญาณเตือน Error', status: 'PASS' },
  { id: 'op-2', category: 'OPERATION', title: 'เวลาต่อรอบ (Cycle Time Acceptance)', desc: 'เวลาการทำงานต่อชิ้นผ่านเกณฑ์ที่ตกลงในสเปค (Target Cycle Time)', status: 'PASS' },
  { id: 'op-3', category: 'OPERATION', title: 'คุณภาพชิ้นงาน (Workpiece Quality Inspection)', desc: 'ทดสอบผลิตชิ้นงานจริง ขนาดและความแม่นยำอยู่ในพิกัด Tolerance', status: 'PASS' },
];

export const FatSatInspectionModal: React.FC<FatSatInspectionModalProps> = ({
  isOpen,
  onClose,
  project,
}) => {
  const [testType, setTestType] = useState<'FAT' | 'SAT'>('FAT');
  const [checklist, setChecklist] = useState<ChecklistItem[]>(DEFAULT_CHECKLIST);
  const [inspectorName, setInspectorName] = useState('นายประสิทธิ์ บุญมี (วิศวกรผู้ส่งมอบ)');
  const [clientInspectorName, setClientInspectorName] = useState(project?.contactPerson || 'ตัวแทนฝ่ายตรวจรับของลูกค้า');
  const [inspectionDate, setInspectionDate] = useState(new Date().toISOString().split('T')[0]);
  const [generalRemarks, setGeneralRemarks] = useState('เครื่องจักรผ่านเกณฑ์การทดสอบตามข้อกำหนดของแบบ และพร้อมส่งมอบ');

  // Canvas signatures
  const canvasRefEngineer = useRef<HTMLCanvasElement | null>(null);
  const canvasRefClient = useRef<HTMLCanvasElement | null>(null);
  const [isDrawingEngineer, setIsDrawingEngineer] = useState(false);
  const [isDrawingClient, setIsDrawingClient] = useState(false);

  // Setup canvas
  const initCanvas = (canvas: HTMLCanvasElement | null) => {
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#0f172a';
  };

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        initCanvas(canvasRefEngineer.current);
        initCanvas(canvasRefClient.current);
      }, 200);
    }
  }, [isOpen]);

  const startDraw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>, type: 'ENGINEER' | 'CLIENT') => {
    const canvas = type === 'ENGINEER' ? canvasRefEngineer.current : canvasRefClient.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);

    if (type === 'ENGINEER') setIsDrawingEngineer(true);
    else setIsDrawingClient(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>, type: 'ENGINEER' | 'CLIENT') => {
    const isDrawing = type === 'ENGINEER' ? isDrawingEngineer : isDrawingClient;
    if (!isDrawing) return;

    const canvas = type === 'ENGINEER' ? canvasRefEngineer.current : canvasRefClient.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDraw = (type: 'ENGINEER' | 'CLIENT') => {
    if (type === 'ENGINEER') setIsDrawingEngineer(false);
    else setIsDrawingClient(false);
  };

  const clearCanvas = (type: 'ENGINEER' | 'CLIENT') => {
    const canvas = type === 'ENGINEER' ? canvasRefEngineer.current : canvasRefClient.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const handleUpdateStatus = (id: string, status: 'PASS' | 'FAIL' | 'PENDING' | 'NA') => {
    setChecklist(prev => prev.map(item => item.id === id ? { ...item, status } : item));
  };

  const counts = {
    pass: checklist.filter(c => c.status === 'PASS').length,
    fail: checklist.filter(c => c.status === 'FAIL').length,
    pending: checklist.filter(c => c.status === 'PENDING').length,
  };

  const overallResult = counts.fail > 0 ? 'FAIL' : counts.pending > 0 ? 'CONDITIONAL' : 'PASS';

  const handlePrint = () => {
    window.print();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 w-full max-w-5xl rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[94vh]">
        
        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-emerald-900 via-slate-900 to-slate-900 text-white flex items-center justify-between border-b border-emerald-800/40 print:hidden">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-400 shadow-inner">
              <ClipboardCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-sm font-black tracking-wide">
                  ใบตรวจรับเครื่องจักร {testType} (Digital Machine Acceptance Test)
                </h3>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                  overallResult === 'PASS' ? 'bg-emerald-500/30 text-emerald-300 border border-emerald-400/40' :
                  overallResult === 'FAIL' ? 'bg-rose-500/30 text-rose-300 border border-rose-400/40' :
                  'bg-amber-500/30 text-amber-300 border border-amber-400/40'
                }`}>
                  ผลประเมิน: {overallResult}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {testType === 'FAT' ? 'Factory Acceptance Test (ตรวจรับก่อนออกจากโรงงานผู้ผลิต)' : 'Site Acceptance Test (ตรวจรับ ณ โรงงานลูกค้า)'}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-black transition-colors flex items-center"
            >
              <Printer className="w-3.5 h-3.5 mr-1" />
              พิมพ์รายงาน A4
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
          
          {/* Machine & Client Info Box */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 gap-2">
              <div>
                <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 tracking-wider uppercase">
                  WARSGATE AUTOMATION CO., LTD.
                </span>
                <h2 className="text-base font-black text-slate-900 dark:text-white">
                  ใบตรวจรับและส่งมอบเครื่องจักร ({testType} CERTIFICATE)
                </h2>
              </div>

              {/* Toggle FAT / SAT */}
              <div className="flex bg-slate-100 dark:bg-slate-800 p-0.5 rounded-xl border border-slate-200 dark:border-slate-700/60 text-xs font-black print:hidden">
                <button
                  type="button"
                  onClick={() => setTestType('FAT')}
                  className={`px-3 py-1 rounded-lg transition-all ${
                    testType === 'FAT' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-500'
                  }`}
                >
                  FAT (โรงงานผู้ผลิต)
                </button>
                <button
                  type="button"
                  onClick={() => setTestType('SAT')}
                  className={`px-3 py-1 rounded-lg transition-all ${
                    testType === 'SAT' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-500'
                  }`}
                >
                  SAT (โรงงานลูกค้า)
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <span className="text-slate-400 font-bold block text-[10px]">รหัสโปรเจกต์:</span>
                <span className="font-mono font-black text-slate-900 dark:text-white">{project?.code || 'PRJ-107'}</span>
              </div>
              <div>
                <span className="text-slate-400 font-bold block text-[10px]">ชื่อเครื่องจักร:</span>
                <span className="font-extrabold text-slate-900 dark:text-white truncate block">{project?.name || 'Automation Machine'}</span>
              </div>
              <div>
                <span className="text-slate-400 font-bold block text-[10px]">ลูกค้า (Customer):</span>
                <span className="font-extrabold text-slate-900 dark:text-white">{project?.customer || 'Siam Denso'}</span>
              </div>
              <div>
                <span className="text-slate-400 font-bold block text-[10px]">วันที่ตรวจสอบ:</span>
                <input
                  type="date"
                  value={inspectionDate}
                  onChange={e => setInspectionDate(e.target.value)}
                  className="bg-transparent font-mono font-bold text-slate-900 dark:text-white p-0 border-0 text-xs"
                />
              </div>
            </div>
          </div>

          {/* Checklist Table */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="p-3 bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs font-black">
              <span>รายการตรวจสอบมาตรฐาน (Inspection Checklist)</span>
              <div className="flex space-x-3 text-[11px]">
                <span className="text-emerald-600">✓ ผ่าน: {counts.pass}</span>
                <span className="text-rose-600">✗ ไม่ผ่าน: {counts.fail}</span>
                <span className="text-amber-600">⏳ รอตรวจ: {counts.pending}</span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-[11px] font-extrabold text-slate-600 dark:text-slate-400">
                  <tr className="divide-x divide-slate-200 dark:divide-slate-800">
                    <th className="px-3 py-2 w-10 text-center">#</th>
                    <th className="px-3 py-2 w-32">หมวดหมู่</th>
                    <th className="px-3 py-2 min-w-[200px]">หัวข้อการทดสอบ & เกณฑ์ยอมรับ</th>
                    <th className="px-3 py-2 w-48 text-center">ผลการตรวจสอบ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {checklist.map((item, index) => (
                    <tr key={item.id} className="divide-x divide-slate-100 dark:divide-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="px-3 py-2.5 text-center font-mono text-slate-400 text-[10px]">{index + 1}</td>
                      <td className="px-3 py-2.5">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-black ${
                          item.category === 'PNEUMATIC' ? 'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300' :
                          item.category === 'ELECTRICAL' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' :
                          item.category === 'MECHANICAL' ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300' :
                          'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                        }`}>
                          {item.category}
                        </span>
                      </td>
                      <td className="px-3 py-2.5">
                        <div className="font-extrabold text-slate-900 dark:text-white">{item.title}</div>
                        <div className="text-[11px] text-slate-500 mt-0.5">{item.desc}</div>
                      </td>
                      <td className="px-3 py-2.5 text-center">
                        <div className="flex items-center justify-center space-x-1.5">
                          {(['PASS', 'FAIL', 'PENDING'] as const).map(st => (
                            <button
                              key={st}
                              type="button"
                              onClick={() => handleUpdateStatus(item.id, st)}
                              className={`px-2.5 py-1 rounded-lg text-[10px] font-black transition-all ${
                                item.status === st
                                  ? st === 'PASS' ? 'bg-emerald-600 text-white shadow-sm' :
                                    st === 'FAIL' ? 'bg-rose-600 text-white shadow-sm' :
                                    'bg-amber-500 text-white shadow-sm'
                                  : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900'
                              }`}
                            >
                              {st === 'PASS' ? '✓ ผ่าน' : st === 'FAIL' ? '✗ ไม่ผ่าน' : 'รอ'}
                            </button>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* General Remarks */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
            <label className="text-xs font-black text-slate-900 dark:text-white">
              สรุปความเห็นเพิ่มเติมของคณะกรรมการตรวจรับ:
            </label>
            <textarea
              rows={2}
              value={generalRemarks}
              onChange={e => setGeneralRemarks(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-xs text-slate-900 dark:text-white"
            />
          </div>

          {/* Sign-off Section with HTML5 Canvas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Engineer Signature */}
            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-slate-900 dark:text-white flex items-center">
                  <User className="w-3.5 h-3.5 mr-1 text-emerald-500" />
                  วิศวกรผู้ส่งมอบเครื่องจักร (Warsgate Automation)
                </span>
                <button
                  type="button"
                  onClick={() => clearCanvas('ENGINEER')}
                  className="text-[10px] text-slate-400 hover:text-rose-500 flex items-center print:hidden"
                >
                  <RotateCcw className="w-3 h-3 mr-0.5" /> ลบลายเซ็น
                </button>
              </div>

              <div className="border border-dashed border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-950 h-28 relative overflow-hidden">
                <canvas
                  ref={canvasRefEngineer}
                  width={400}
                  height={112}
                  onMouseDown={e => startDraw(e, 'ENGINEER')}
                  onMouseMove={e => draw(e, 'ENGINEER')}
                  onMouseUp={() => stopDraw('ENGINEER')}
                  onMouseLeave={() => stopDraw('ENGINEER')}
                  onTouchStart={e => startDraw(e, 'ENGINEER')}
                  onTouchMove={e => draw(e, 'ENGINEER')}
                  onTouchEnd={() => stopDraw('ENGINEER')}
                  className="w-full h-full cursor-crosshair"
                />
                <span className="absolute bottom-1 right-2 text-[9px] text-slate-400 pointer-events-none print:hidden">
                  (เซ็นชื่อด้วยนิ้วหรือปากกา)
                </span>
              </div>

              <input
                type="text"
                value={inspectorName}
                onChange={e => setInspectorName(e.target.value)}
                placeholder="ชื่อ-นามสกุล และตำแหน่ง..."
                className="w-full bg-transparent border-b border-slate-200 dark:border-slate-700 text-xs font-bold text-center text-slate-800 dark:text-slate-200 py-1"
              />
            </div>

            {/* Client Signature */}
            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-slate-900 dark:text-white flex items-center">
                  <ShieldCheck className="w-3.5 h-3.5 mr-1 text-indigo-500" />
                  ตัวแทนลูกค้าผู้ตรวจรับเครื่องจักร (Client Inspector)
                </span>
                <button
                  type="button"
                  onClick={() => clearCanvas('CLIENT')}
                  className="text-[10px] text-slate-400 hover:text-rose-500 flex items-center print:hidden"
                >
                  <RotateCcw className="w-3 h-3 mr-0.5" /> ลบลายเซ็น
                </button>
              </div>

              <div className="border border-dashed border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-950 h-28 relative overflow-hidden">
                <canvas
                  ref={canvasRefClient}
                  width={400}
                  height={112}
                  onMouseDown={e => startDraw(e, 'CLIENT')}
                  onMouseMove={e => draw(e, 'CLIENT')}
                  onMouseUp={() => stopDraw('CLIENT')}
                  onMouseLeave={() => stopDraw('CLIENT')}
                  onTouchStart={e => startDraw(e, 'CLIENT')}
                  onTouchMove={e => draw(e, 'CLIENT')}
                  onTouchEnd={() => stopDraw('CLIENT')}
                  className="w-full h-full cursor-crosshair"
                />
                <span className="absolute bottom-1 right-2 text-[9px] text-slate-400 pointer-events-none print:hidden">
                  (เซ็นชื่อด้วยนิ้วหรือปากกา)
                </span>
              </div>

              <input
                type="text"
                value={clientInspectorName}
                onChange={e => setClientInspectorName(e.target.value)}
                placeholder="ชื่อ-นามสกุล ตัวแทนลูกค้า..."
                className="w-full bg-transparent border-b border-slate-200 dark:border-slate-700 text-xs font-bold text-center text-slate-800 dark:text-slate-200 py-1"
              />
            </div>

          </div>

        </div>

        {/* Footer */}
        <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center print:hidden">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-slate-600 dark:text-slate-400 font-bold hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors text-xs"
          >
            ปิด
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl shadow-md transition-all text-xs flex items-center"
          >
            <Printer className="w-4 h-4 mr-2" />
            พิมพ์ใบรับรอง {testType} (Print Certificate)
          </button>
        </div>

      </div>
    </div>
  );
};
