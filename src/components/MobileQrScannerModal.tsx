import React, { useState, useEffect, useRef } from 'react';
import { X, Camera, QrCode, CheckCircle2, AlertTriangle, Truck, MapPin, Calendar, PackageCheck, RefreshCw } from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';
import { BomPartItem, ModuleItem, ProjectItem } from '../types/bom';
import { parsePartQrPayload } from '../utils/qrHelper';

interface MobileQrScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  parts: BomPartItem[];
  projects: ProjectItem[];
  modules: ModuleItem[];
  onReceivePart: (partId: string, storeLocation: string, receiveDate: string) => Promise<void>;
}

export const MobileQrScannerModal: React.FC<MobileQrScannerModalProps> = ({
  isOpen,
  onClose,
  parts,
  projects,
  modules,
  onReceivePart,
}) => {
  const [scannedCode, setScannedCode] = useState<string>('');
  const [matchedPart, setMatchedPart] = useState<BomPartItem | null>(null);
  const [storeLocation, setStoreLocation] = useState<string>('สโตร์หลัก (Main Workshop)');
  const [receiveDate, setReceiveDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [cameraActive, setCameraActive] = useState<boolean>(false);
  const [manualInput, setManualInput] = useState<string>('');

  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const scannerContainerId = 'mobile-qr-reader';

  // Play audio chime on scan
  const playBeep = (isSuccess = true) => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = isSuccess ? 'sine' : 'sawtooth';
      osc.frequency.setValueAtTime(isSuccess ? 880 : 330, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.2);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.25);
    } catch {
      // AudioContext not allowed or not supported
    }
  };

  const handleDetectedCode = (rawText: string) => {
    setScannedCode(rawText);
    const partId = parsePartQrPayload(rawText);
    if (!partId) {
      setErrorMessage('รูปแบบ QR Code ไม่ถูกต้อง');
      setMatchedPart(null);
      playBeep(false);
      return;
    }

    const found = parts.find(p => p.id === partId);
    if (found) {
      setMatchedPart(found);
      setErrorMessage('');
      playBeep(true);
      if (found.storeLocation) {
        setStoreLocation(found.storeLocation);
      }
    } else {
      setMatchedPart(null);
      setErrorMessage(`ไม่พบชิ้นส่วนรหัส [${partId}] ในระบบ หรืออยู่ในโปรเจกต์อื่น`);
      playBeep(false);
    }
  };

  // Start Camera Scanner
  useEffect(() => {
    if (!isOpen) {
      if (html5QrCodeRef.current && cameraActive) {
        html5QrCodeRef.current.stop().catch(console.warn);
        setCameraActive(false);
      }
      return;
    }

    let isMounted = true;
    const qrCodeScanner = new Html5Qrcode(scannerContainerId);
    html5QrCodeRef.current = qrCodeScanner;

    Html5Qrcode.getCameras()
      .then(cameras => {
        if (!isMounted || !cameras || cameras.length === 0) return;
        // Prefer back camera on mobile
        const cameraId = cameras.length > 1 ? cameras[cameras.length - 1].id : cameras[0].id;
        
        qrCodeScanner.start(
          cameraId,
          {
            fps: 10,
            qrbox: { width: 220, height: 220 },
          },
          (decodedText) => {
            handleDetectedCode(decodedText);
          },
          () => {}
        )
        .then(() => {
          if (isMounted) setCameraActive(true);
        })
        .catch(err => {
          console.warn('Could not start QR camera:', err);
        });
      })
      .catch(err => {
        console.warn('Could not list cameras:', err);
      });

    return () => {
      isMounted = false;
      if (qrCodeScanner && qrCodeScanner.isScanning) {
        qrCodeScanner.stop().catch(console.warn);
      }
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleConfirmReceive = async () => {
    if (!matchedPart) return;
    setIsProcessing(true);
    setSuccessMessage('');
    setErrorMessage('');
    try {
      await onReceivePart(matchedPart.id, storeLocation, receiveDate);
      setSuccessMessage(`✅ รับเข้าสโตร์สำเร็จ: #${matchedPart.itemNo} ${matchedPart.partName}`);
      playBeep(true);
      // Reset for next scan
      setTimeout(() => {
        setMatchedPart(null);
        setScannedCode('');
        setManualInput('');
      }, 1500);
    } catch (err: any) {
      setErrorMessage(err.message || 'บันทึกไม่สำเร็จ');
      playBeep(false);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualInput.trim()) return;
    handleDetectedCode(manualInput.trim());
  };

  const getModuleName = (modId?: string) => {
    const found = modules.find(m => m.id === modId);
    return found ? found.name : '-';
  };

  const getProjectName = (projId?: string) => {
    const found = projects.find(p => p.id === projId);
    return found ? `[${found.code}] ${found.name}` : '-';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/80 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-lg shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-emerald-600 text-white shadow-md">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                สแกน QR Code ตรวจรับของเข้าสโตร์
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Mobile Store Receiving Scanner</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4">
          
          {/* Camera Viewport */}
          <div className="relative rounded-2xl overflow-hidden bg-black aspect-video flex items-center justify-center border-2 border-slate-300 dark:border-slate-700 shadow-inner">
            <div id={scannerContainerId} className="w-full h-full object-cover"></div>
            
            {/* Overlay Target Guide */}
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <div className="w-48 h-48 border-2 border-dashed border-emerald-400/80 rounded-2xl flex items-center justify-center">
                <div className="w-44 h-44 border border-emerald-400/30 rounded-xl"></div>
              </div>
            </div>

            {!cameraActive && (
              <div className="absolute inset-0 bg-slate-950/80 flex flex-col items-center justify-center p-4 text-center">
                <Camera className="w-10 h-10 text-slate-500 mb-2 animate-pulse" />
                <p className="text-xs text-slate-300 font-bold">กำลังเปิดใช้งานกล้อง...</p>
                <p className="text-[10px] text-slate-500 mt-1">โปรดกดยืนยันอนุญาตการใช้งานกล้องในเบราว์เซอร์</p>
              </div>
            )}
          </div>

          {/* Manual Input / Barcode Gun Form */}
          <form onSubmit={handleManualSubmit} className="flex space-x-2">
            <div className="relative flex-1">
              <QrCode className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={manualInput}
                onChange={e => setManualInput(e.target.value)}
                placeholder="สแกนด้วยปืนบาร์โค้ด หรือพิมพ์รหัส Part ID..."
                className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white font-mono focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2 bg-slate-800 dark:bg-slate-700 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-colors"
            >
              ค้นหา
            </button>
          </form>

          {/* Alerts */}
          {errorMessage && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 rounded-xl text-xs text-rose-700 dark:text-rose-300 font-bold flex items-center space-x-2 animate-in fade-in">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 rounded-xl text-xs text-emerald-800 dark:text-emerald-300 font-black flex items-center space-x-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Scanned Part Details Card */}
          {matchedPart && (
            <div className="p-4 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/40 dark:to-teal-950/20 border-2 border-emerald-500/60 rounded-2xl space-y-3 animate-in zoom-in-95 duration-200">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-600 text-white font-black">
                    Item #{matchedPart.itemNo}
                  </span>
                  <span className="ml-2 text-xs font-bold text-slate-600 dark:text-slate-300">
                    {getProjectName(matchedPart.projectId)}
                  </span>
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-black ${
                  matchedPart.status === 'Received' ? 'bg-emerald-200 text-emerald-900' : 'bg-amber-100 text-amber-900'
                }`}>
                  สถานะเดิม: {matchedPart.status || 'Planned'}
                </span>
              </div>

              <div>
                <h4 className="text-sm font-black text-slate-900 dark:text-white leading-snug">
                  {matchedPart.partName}
                </h4>
                {matchedPart.typeSpec && (
                  <p className="text-xs font-mono text-slate-600 dark:text-slate-300 mt-0.5">
                    <strong>Spec:</strong> {matchedPart.typeSpec}
                  </p>
                )}
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  <strong>Module:</strong> {getModuleName(matchedPart.moduleId)}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs bg-white/80 dark:bg-slate-900/80 p-2.5 rounded-xl border border-emerald-200 dark:border-emerald-900/40 font-medium">
                <div><strong>จำนวน:</strong> {matchedPart.qty} {matchedPart.unit}</div>
                <div><strong>ผู้จำหน่าย:</strong> {matchedPart.supplier || matchedPart.maker || '-'}</div>
                {matchedPart.poNumber && <div className="col-span-2"><strong>เลขที่ PO:</strong> {matchedPart.poNumber}</div>}
              </div>

              {/* Receiving Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-emerald-200 dark:border-emerald-900/40">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center">
                    <MapPin className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                    <span>ตำแหน่งจัดเก็บ (Store Location)</span>
                  </label>
                  <select
                    value={storeLocation}
                    onChange={e => setStoreLocation(e.target.value)}
                    className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  >
                    <option value="สโตร์หลัก (Main Workshop)">สโตร์หลัก (Main Workshop)</option>
                    <option value="ชั้นวาง Rack A (Mechanical)">ชั้นวาง Rack A (Mechanical)</option>
                    <option value="ชั้นวาง Rack B (Electrical / PLC)">ชั้นวาง Rack B (Electrical / PLC)</option>
                    <option value="โซนหน้าเครื่องจักร (Line Assembly)">โซนหน้าเครื่องจักร (Line Assembly)</option>
                    <option value="ตู้ควบคุม Control Cabinet">ตู้ควบคุม Control Cabinet</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center">
                    <Calendar className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                    <span>วันที่รับเข้าจริง (Receive Date)</span>
                  </label>
                  <input
                    type="date"
                    value={receiveDate}
                    onChange={e => setReceiveDate(e.target.value)}
                    className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-xs font-mono font-bold text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Confirm Receive Button */}
              <button
                type="button"
                onClick={handleConfirmReceive}
                disabled={isProcessing}
                className="w-full py-2.5 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-800 text-white rounded-xl text-xs font-black shadow-lg shadow-emerald-600/30 transition-all flex items-center justify-center space-x-1.5 disabled:opacity-50"
              >
                <PackageCheck className="w-4 h-4" />
                <span>{isProcessing ? 'กำลังบันทึก...' : 'บันทึกรับเข้าสโตร์ทันที (Confirm Receive)'}</span>
              </button>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 flex justify-between items-center px-4">
          <span>สแกน QR เพื่ออัปเดตสถานะเป็น "Received" พร้อมระบุตำแหน่งและวันที่รับเข้า</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 rounded-lg text-xs font-bold text-slate-700 dark:text-slate-300"
          >
            ปิด
          </button>
        </div>

      </div>
    </div>
  );
};
