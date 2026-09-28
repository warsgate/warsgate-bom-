import React, { useState, useMemo, useEffect } from 'react';
import { 
  X, 
  Share2, 
  Copy, 
  Check, 
  Building2, 
  ExternalLink, 
  Eye, 
  DollarSign, 
  Calendar, 
  Send, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  Sparkles, 
  Link, 
  MessageCircle, 
  FileText 
} from 'lucide-react';
import { BomPartItem, ProjectItem } from '../types/bom';
import { formatCurrency } from '../utils/costCalculator';

interface VendorPortalModalProps {
  isOpen: boolean;
  onClose: () => void;
  project?: ProjectItem;
  parts: BomPartItem[];
  onUpdatePart?: (partId: string, updatedFields: Partial<BomPartItem>) => void;
}

export const VendorPortalModal: React.FC<VendorPortalModalProps> = ({
  isOpen,
  onClose,
  project,
  parts,
  onUpdatePart,
}) => {
  // Hooks placed unconditionally
  const [selectedVendor, setSelectedVendor] = useState<string>('');
  const [copiedLink, setCopiedCopiedLink] = useState(false);
  const [copiedLineMsg, setCopiedLineMsg] = useState(false);
  const [isLivePreviewMode, setIsLivePreviewMode] = useState(false);

  // Auto-detect vendor from URL if present
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const v = params.get('vendor');
      if (v) {
        setSelectedVendor(v);
        setIsLivePreviewMode(true);
      }
    }
  }, [isOpen]);

  // Vendor edited prices & stages state for live editing
  const [editedPrices, setEditedPrices] = useState<Record<string, number>>({});
  const [editedDates, setEditedDates] = useState<Record<string, string>>({});
  const [editedStages, setEditedStages] = useState<Record<string, string>>({});
  const [savedSuccessMsg, setSavedSuccessMsg] = useState('');

  // Extract unique vendors
  const vendorList = useMemo(() => {
    const list = Array.from(new Set(parts.map(p => p.supplier?.trim()).filter(Boolean))) as string[];
    return list.sort();
  }, [parts]);

  // Set default selected vendor
  const currentVendor = selectedVendor || vendorList[0] || '';

  // Filter parts for selected vendor
  const vendorParts = useMemo(() => {
    if (!currentVendor) return [];
    return parts.filter(p => (p.supplier || '').trim() === currentVendor);
  }, [parts, currentVendor]);

  // Generate Magic Portal URL
  const portalUrl = useMemo(() => {
    if (typeof window === 'undefined') return '';
    const base = window.location.origin + window.location.pathname;
    return `${base}?vendor=${encodeURIComponent(currentVendor)}&projectId=${project?.id || ''}`;
  }, [currentVendor, project?.id]);

  // Pre-filled LINE message
  const lineMessage = useMemo(() => {
    return `เรียน ${currentVendor || 'ร้านค้า/ร้านกลึง'}\n` +
      `ทางบริษัท WARSGATE AUTOMATION ขอส่งรายการสั่งผลิต/ขอใบเสนอราคา โครงการ [${project?.code || 'PROJECT'}] ${project?.name || ''}\n` +
      `มีชิ้นงานทั้งหมด ${vendorParts.length} รายการ\n` +
      `สามารถเปิดดูแบบ Drawing CAD, เสนอราคา และอัปเดตสถานะงานได้ที่ลิงก์นี้ครับ:\n` +
      `${portalUrl}`;
  }, [currentVendor, project, vendorParts.length, portalUrl]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(portalUrl);
    setCopiedCopiedLink(true);
    setTimeout(() => setCopiedCopiedLink(false), 2500);
  };

  const handleCopyLineMessage = () => {
    navigator.clipboard.writeText(lineMessage);
    setCopiedLineMsg(true);
    setTimeout(() => setCopiedLineMsg(false), 2500);
  };

  const handleSaveVendorUpdates = () => {
    if (!onUpdatePart) return;

    vendorParts.forEach(p => {
      const updates: Partial<BomPartItem> = {};
      let hasChange = false;

      if (editedPrices[p.id] !== undefined && editedPrices[p.id] !== p.unitPrice) {
        updates.unitPrice = editedPrices[p.id];
        updates.totalAmount = (p.qty || 1) * editedPrices[p.id];
        hasChange = true;
      }

      if (editedDates[p.id] !== undefined && editedDates[p.id] !== p.receiveDate) {
        updates.receiveDate = editedDates[p.id];
        hasChange = true;
      }

      if (editedStages[p.id]) {
        const stage = editedStages[p.id];
        let cleanRemarks = (p.remarks || '').replace(/\[FAB:[A-Z_]+\]/g, '').trim();
        updates.remarks = `[FAB:${stage}] ${cleanRemarks}`.trim();
        if (stage === 'READY_ASSEMBLY') updates.status = 'Completed';
        else if (stage === 'QC_INSPECTION') updates.status = 'Received';
        else if (stage === 'IN_MACHINING' || stage === 'SURFACE_FINISH') updates.status = 'Ordered';
        hasChange = true;
      }

      if (hasChange) {
        onUpdatePart(p.id, updates);
      }
    });

    setSavedSuccessMsg('บันทึกข้อมูลและอัปเดตราคาเข้าสู่ระบบ BOM เรียบร้อยแล้ว!');
    setTimeout(() => setSavedSuccessMsg(''), 4000);
  };

  const totalQuotedAmount = useMemo(() => {
    return vendorParts.reduce((sum, p) => {
      const price = editedPrices[p.id] !== undefined ? editedPrices[p.id] : p.unitPrice;
      return sum + ((p.qty || 1) * price);
    }, 0);
  }, [vendorParts, editedPrices]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-5xl max-h-[95vh] flex flex-col shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        
        {/* ─── Header ─── */}
        <div className="p-4 sm:px-6 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 bg-gradient-to-r from-blue-700 via-indigo-700 to-slate-900 text-white">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-2xl bg-white/10 backdrop-blur-md text-white border border-white/20 shadow-md">
              <Share2 className="w-6 h-6 text-blue-200" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-lg font-black tracking-tight">
                  พอร์ทัลร้านกลึง & ซัพพลายเออร์ (Vendor Self-Service Portal)
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-white/20 text-white border border-white/20">
                  Magic Link
                </span>
              </div>
              <p className="text-xs text-blue-100">
                ส่งลิงก์ให้ร้านกลึงเปิดผ่านมือถือ เพื่อดูแบบ CAD, เสนอราคา และอัปเดตสถานะงานเองแบบเรียลไทม์
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-white/70 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ─── Vendor Selector Bar ─── */}
        <div className="p-3 sm:px-6 bg-slate-50 dark:bg-slate-950/50 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center space-x-2">
            <span className="font-bold text-slate-500 uppercase text-[11px] flex items-center gap-1">
              <Building2 className="w-3.5 h-3.5" />
              <span>เลือกร้านกลึง/ผู้ขาย:</span>
            </span>
            <select
              value={currentVendor}
              onChange={(e) => setSelectedVendor(e.target.value)}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs font-black text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30"
            >
              {vendorList.map(v => (
                <option key={v} value={v}>
                  {v} ({parts.filter(p => (p.supplier || '').trim() === v).length} รายการ)
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsLivePreviewMode(!isLivePreviewMode)}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all border text-xs ${
                isLivePreviewMode 
                  ? 'bg-blue-600 text-white border-blue-600 shadow-sm' 
                  : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
              }`}
            >
              {isLivePreviewMode ? '👀 มุมมองที่ร้านกลึงเห็น' : '⚙️ เมนูแชร์ลิงก์ส่ง LINE'}
            </button>
          </div>
        </div>

        {/* ─── Main Content ─── */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          
          {/* SECTION A: SHARE MAGIC LINK CARD */}
          {!isLivePreviewMode && (
            <div className="space-y-4">
              
              {/* Copy URL Card */}
              <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-slate-800/80 dark:to-indigo-950/30 border border-blue-200 dark:border-indigo-900 shadow-sm space-y-3">
                <div className="flex items-center space-x-2">
                  <Sparkles className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  <h3 className="font-black text-sm text-slate-900 dark:text-white">
                    Magic Link ประจำร้าน: {currentVendor || '-'}
                  </h3>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300">
                  ร้านกลึงสามารถเปิดลิงก์นี้จากสมาร์ตโฟนหรือแท็บเล็ตได้ทันที โดยไม่ต้องลงโปรแกรมและไม่ต้องมีบัญชีผู้ใช้
                </p>

                {/* URL Input with Copy Button */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    readOnly
                    value={portalUrl}
                    className="flex-1 px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono font-bold text-slate-800 dark:text-slate-200 select-all focus:outline-none"
                  />
                  <button
                    onClick={handleCopyLink}
                    className={`px-4 py-2.5 rounded-xl text-xs font-black flex items-center space-x-1.5 transition-all shadow-sm ${
                      copiedLink
                        ? 'bg-emerald-600 text-white'
                        : 'bg-blue-600 hover:bg-blue-700 text-white'
                    }`}
                  >
                    {copiedLink ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    <span>{copiedLink ? 'คัดลอกแล้ว!' : 'คัดลอกลิงก์'}</span>
                  </button>
                </div>
              </div>

              {/* Pre-formatted LINE Message */}
              <div className="p-4 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <MessageCircle className="w-4 h-4 text-emerald-600" />
                    <span className="font-bold text-xs text-slate-900 dark:text-white">
                      ข้อความพร้อมส่งทาง LINE ให้ร้านกลึง:
                    </span>
                  </div>
                  <button
                    onClick={handleCopyLineMessage}
                    className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                  >
                    {copiedLineMsg ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedLineMsg ? 'คัดลอกข้อความแล้ว!' : 'คัดลอกข้อความทั้งหมด'}</span>
                  </button>
                </div>

                <div className="p-3 bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-sans text-slate-700 dark:text-slate-300 whitespace-pre-line leading-relaxed select-all">
                  {lineMessage}
                </div>
              </div>

            </div>
          )}

          {/* SECTION B: VENDOR LIVE PREVIEW & EDITING TABLE */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-black text-sm text-slate-900 dark:text-white flex items-center gap-2">
                  <span>รายการชิ้นส่วนของร้าน {currentVendor}</span>
                  <span className="px-2 py-0.5 rounded-full text-xs font-black bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
                    {vendorParts.length} รายการ
                  </span>
                </h4>
                <p className="text-xs text-slate-500">
                  ร้านกลึงสามารถกรอกราคาและคลิกอัปเดตขั้นตอนการผลิตได้โดยตรง
                </p>
              </div>

              <div className="text-right">
                <span className="text-[11px] text-slate-400 block font-bold">มูลค่าเสนอราคารวม:</span>
                <span className="font-mono font-black text-base text-emerald-600 dark:text-emerald-400">
                  {formatCurrency(totalQuotedAmount)}
                </span>
              </div>
            </div>

            {savedSuccessMsg && (
              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 text-emerald-800 dark:text-emerald-300 text-xs font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{savedSuccessMsg}</span>
              </div>
            )}

            {/* Table */}
            <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm bg-white dark:bg-slate-900">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-950/80 border-b border-slate-200 dark:border-slate-800 text-[11px] font-black text-slate-600 dark:text-slate-300">
                  <tr>
                    <th className="p-3 text-center w-12">#</th>
                    <th className="p-3 w-36">แบบ (Drawing)</th>
                    <th className="p-3">ชื่อชิ้นงาน / วัสดุ</th>
                    <th className="p-3 text-center w-16">จำนวน</th>
                    <th className="p-3 w-32">ราคาเสนอ (฿/ชิ้น)</th>
                    <th className="p-3 w-36">กำหนดส่งมอบ</th>
                    <th className="p-3 w-40">สถานะผลิต</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 font-medium">
                  {vendorParts.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-400">
                        ยังไม่มีชิ้นงานที่ระบุผู้ขายเป็นร้าน {currentVendor}
                      </td>
                    </tr>
                  ) : (
                    vendorParts.map(part => {
                      const currentPrice = editedPrices[part.id] !== undefined ? editedPrices[part.id] : (part.unitPrice || 0);
                      const currentDate = editedDates[part.id] !== undefined ? editedDates[part.id] : (part.receiveDate || '');
                      const hasDrawing = !!part.purchaseLink;

                      return (
                        <tr key={part.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/50 transition-colors">
                          <td className="p-3 text-center font-mono font-bold text-slate-400">
                            #{part.itemNo}
                          </td>

                          {/* DWG No & Quick View Link */}
                          <td className="p-3">
                            <div className="font-mono font-black text-slate-900 dark:text-white">
                              {part.dwgNo || '-'}
                            </div>
                            {hasDrawing ? (
                              <a
                                href={part.purchaseLink}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center space-x-1 text-[10px] font-bold text-sky-600 dark:text-sky-400 hover:underline mt-0.5"
                              >
                                <Eye className="w-3 h-3" />
                                <span>เปิดดูแบบ CAD</span>
                              </a>
                            ) : (
                              <span className="text-[10px] text-slate-400">รอแนบแบบ</span>
                            )}
                          </td>

                          {/* Part Name & Spec */}
                          <td className="p-3">
                            <div className="font-bold text-slate-900 dark:text-white">
                              {part.partName}
                            </div>
                            {part.typeSpec && (
                              <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400 truncate max-w-xs">
                                {part.typeSpec}
                              </div>
                            )}
                          </td>

                          {/* Quantity */}
                          <td className="p-3 text-center font-mono font-black text-slate-900 dark:text-white">
                            {part.qty} <span className="text-[10px] font-normal text-slate-400">{part.unit}</span>
                          </td>

                          {/* Unit Price Input */}
                          <td className="p-3">
                            <div className="relative">
                              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs">฿</span>
                              <input
                                type="number"
                                min="0"
                                value={currentPrice === 0 ? '' : currentPrice}
                                onChange={(e) => {
                                  const val = parseFloat(e.target.value) || 0;
                                  setEditedPrices(prev => ({ ...prev, [part.id]: val }));
                                }}
                                placeholder="0.00"
                                className="w-full pl-6 pr-2 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono font-black text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                              />
                            </div>
                          </td>

                          {/* Target Delivery Date */}
                          <td className="p-3">
                            <input
                              type="date"
                              value={currentDate}
                              onChange={(e) => {
                                setEditedDates(prev => ({ ...prev, [part.id]: e.target.value }));
                              }}
                              className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none"
                            />
                          </td>

                          {/* Machining Status Quick Stage Toggle */}
                          <td className="p-3">
                            <select
                              value={editedStages[part.id] || (part.remarks?.match(/\[FAB:([A-Z_]+)\]/)?.[1] || (part.status === 'Completed' ? 'READY_ASSEMBLY' : part.status === 'Received' ? 'QC_INSPECTION' : part.status === 'Ordered' ? 'IN_MACHINING' : 'PENDING_DWG'))}
                              onChange={(e) => {
                                setEditedStages(prev => ({ ...prev, [part.id]: e.target.value }));
                              }}
                              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl p-1.5 text-xs font-bold text-slate-900 dark:text-white focus:outline-none cursor-pointer"
                            >
                              <option value="PENDING_DWG">1. รับแบบแล้ว (Pending)</option>
                              <option value="IN_MACHINING">2. กำลังกลึง (In Machining)</option>
                              <option value="SURFACE_FINISH">3. ส่งชุบผิว (Surface Finish)</option>
                              <option value="QC_INSPECTION">4. ตรวจขนาด QC</option>
                              <option value="READY_ASSEMBLY">5. เสร็จพร้อมส่งมอบ</option>
                            </select>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Save Action Bar */}
            {vendorParts.length > 0 && (
              <div className="flex justify-end pt-2">
                <button
                  onClick={handleSaveVendorUpdates}
                  className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-500 hover:to-indigo-800 text-white rounded-xl text-xs font-black shadow-lg shadow-indigo-600/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center space-x-2"
                >
                  <Send className="w-4 h-4" />
                  <span>บันทึกการเสนอราคา & อัปเดตสถานะงานเข้า BOM</span>
                </button>
              </div>
            )}

          </div>

        </div>

        {/* ─── Footer ─── */}
        <div className="p-3 px-6 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex justify-between items-center text-xs">
          <div className="text-slate-500 flex items-center space-x-2">
            <Link className="w-3.5 h-3.5 text-blue-500" />
            <span>ลิงก์ Magic Link สามารถเข้าถึงได้โดยตรงจากภายนอกโรงงาน</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 rounded-xl font-bold transition-all"
          >
            ปิดหน้าต่าง
          </button>
        </div>

      </div>
    </div>
  );
};
