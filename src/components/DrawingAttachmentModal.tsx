import React, { useState, useMemo } from 'react';
import { 
  X, 
  FileText, 
  Image as ImageIcon, 
  Upload, 
  ExternalLink, 
  Search, 
  Check, 
  Copy, 
  Eye, 
  Download, 
  Link as LinkIcon, 
  Paperclip, 
  Layers, 
  Sparkles,
  RefreshCw,
  FolderOpen,
  Maximize2
} from 'lucide-react';
import { ProjectItem, ModuleItem, BomPartItem } from '../types/bom';
import { attachmentsApi } from '../api/client';

interface DrawingAttachmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  project?: ProjectItem;
  modules: ModuleItem[];
  parts: BomPartItem[];
  initialPartId?: string;
  onUpdatePart?: (id: string, fields: Partial<BomPartItem>) => void;
}

export const DrawingAttachmentModal: React.FC<DrawingAttachmentModalProps> = ({
  isOpen,
  onClose,
  project,
  modules,
  parts,
  initialPartId,
  onUpdatePart,
}) => {
  // Selected Part
  const [selectedPartId, setSelectedPartId] = useState<string>(initialPartId || (parts[0]?.id || ''));
  const [searchQuery, setSearchQuery] = useState('');
  const [activeModuleFilter, setActiveModuleFilter] = useState<string>('ALL');

  // Upload & Link Input state
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [externalUrlInput, setExternalUrlInput] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);

  // Active view: Preview vs Upload
  const [previewFileUrl, setPreviewFileUrl] = useState<string | null>(null);

  // Filter parts
  const filteredParts = useMemo(() => {
    return parts.filter(p => {
      const matchModule = activeModuleFilter === 'ALL' || p.moduleId === activeModuleFilter;
      const q = searchQuery.toLowerCase();
      const matchSearch = !q || 
        p.partName.toLowerCase().includes(q) || 
        p.dwgNo.toLowerCase().includes(q) || 
        p.typeSpec.toLowerCase().includes(q) ||
        (p.maker && p.maker.toLowerCase().includes(q));
      return matchModule && matchSearch;
    });
  }, [parts, activeModuleFilter, searchQuery]);

  // Current selected part object
  const currentPart = useMemo(() => {
    return parts.find(p => p.id === selectedPartId) || filteredParts[0] || parts[0];
  }, [parts, selectedPartId, filteredParts]);

  if (!isOpen) return null;

  // Handle file upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      setUploadError(null);

      const result = await attachmentsApi.upload(file);
      if (result.success && result.fileUrl) {
        const fullUrl = attachmentsApi.getFileUrl(result.fileUrl);
        // Save to current part
        if (currentPart && onUpdatePart) {
          onUpdatePart(currentPart.id, {
            purchaseLink: result.fileUrl,
          });
        }
        setPreviewFileUrl(fullUrl);
      } else {
        setUploadError('อัปโหลดไม่สำเร็จ กรุณาลองใหม่อีกครั้ง');
      }
    } catch (err: any) {
      setUploadError(err.message || 'เกิดข้อผิดพลาดในการอัปโหลดไฟล์');
    } finally {
      setIsUploading(false);
    }
  };

  // Handle attach external link (Google Drive / Cloud URL)
  const handleSaveExternalLink = () => {
    if (!externalUrlInput.trim() || !currentPart || !onUpdatePart) return;
    onUpdatePart(currentPart.id, {
      purchaseLink: externalUrlInput.trim(),
    });
    setPreviewFileUrl(externalUrlInput.trim());
    setExternalUrlInput('');
  };

  const handleCopyLink = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  // Resolve drawing/attachment url for current part
  const attachedUrl = currentPart?.purchaseLink || '';
  const resolvedAttachedUrl = attachedUrl ? attachmentsApi.getFileUrl(attachedUrl) : '';
  const isPdf = attachedUrl.toLowerCase().endsWith('.pdf') || attachedUrl.includes('.pdf');
  const isImage = /\.(jpg|jpeg|png|webp|gif|svg)$/i.test(attachedUrl);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-6xl h-[92vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-900/70">
          <div className="flex items-center space-x-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-sky-600 to-blue-500 text-white flex items-center justify-center shadow-lg shadow-sky-500/20">
              <Paperclip className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-lg font-black text-slate-900 dark:text-white">
                  คลังเอกสารแบบ Drawing 2D & รูปถ่ายหน้างาน (Drawing & Document Hub)
                </h2>
                {project && (
                  <span className="font-mono text-xs font-black px-2 py-0.5 rounded-lg bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800">
                    [{project.code}]
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                แนบไฟล์แบบสั่งทำ 2D PDF, รูปถ่ายหน้างานประกอบจริง, หรือลิงก์ Google Drive ประจำชิ้นส่วน
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body: Split-pane layout */}
        <div className="flex-1 flex overflow-hidden">
          
          {/* LEFT PANE: Part List & Filter */}
          <div className="w-80 border-r border-slate-100 dark:border-slate-800 flex flex-col bg-slate-50/50 dark:bg-slate-950/40">
            {/* Search & Module filter */}
            <div className="p-3 border-b border-slate-100 dark:border-slate-800 space-y-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="ค้นหา Part, DWG..."
                  className="w-full pl-8 pr-2.5 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-sky-500 font-bold"
                />
              </div>

              {/* Module Filter Pills */}
              <div className="flex gap-1 overflow-x-auto no-scrollbar py-0.5">
                <button
                  onClick={() => setActiveModuleFilter('ALL')}
                  className={`px-2 py-0.5 text-[10px] font-bold rounded-lg whitespace-nowrap transition-colors ${
                    activeModuleFilter === 'ALL'
                      ? 'bg-sky-600 text-white'
                      : 'bg-white dark:bg-slate-900 text-slate-500 border border-slate-200 dark:border-slate-800'
                  }`}
                >
                  ทั้งหมด ({parts.length})
                </button>
                {modules.map(m => (
                  <button
                    key={m.id}
                    onClick={() => setActiveModuleFilter(m.id)}
                    className={`px-2 py-0.5 text-[10px] font-bold rounded-lg whitespace-nowrap transition-colors ${
                      activeModuleFilter === m.id
                        ? 'bg-sky-600 text-white'
                        : 'bg-white dark:bg-slate-900 text-slate-500 border border-slate-200 dark:border-slate-800'
                    }`}
                  >
                    {m.code}
                  </button>
                ))}
              </div>
            </div>

            {/* Part List Scroll */}
            <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/80 custom-scrollbar">
              {filteredParts.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-400">
                  ไม่พบรายการชิ้นส่วน
                </div>
              ) : (
                filteredParts.map((p) => {
                  const isSelected = p.id === currentPart?.id;
                  const hasAttachment = Boolean(p.purchaseLink && p.purchaseLink.trim());

                  return (
                    <button
                      key={p.id}
                      onClick={() => {
                        setSelectedPartId(p.id);
                        if (p.purchaseLink) setPreviewFileUrl(attachmentsApi.getFileUrl(p.purchaseLink));
                      }}
                      className={`w-full p-3 text-left transition-colors flex items-start justify-between gap-2 ${
                        isSelected
                          ? 'bg-sky-50 dark:bg-sky-950/40 border-l-4 border-sky-600 dark:border-sky-400'
                          : 'hover:bg-slate-100/60 dark:hover:bg-slate-800/40'
                      }`}
                    >
                      <div className="min-w-0 pr-1">
                        <div className="flex items-center space-x-1.5">
                          <span className="font-mono text-[10px] font-bold text-slate-400">
                            #{p.itemNo}
                          </span>
                          <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                            {p.partName}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 truncate mt-0.5 font-mono">
                          DWG: {p.dwgNo || '-'}
                        </p>
                      </div>

                      {hasAttachment && (
                        <span className="p-1 rounded-md bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 shrink-0" title="มีไฟล์แนบแล้ว">
                          <Paperclip className="w-3 h-3" />
                        </span>
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* RIGHT PANE: Selected Part Attachment Details & Viewer */}
          <div className="flex-1 flex flex-col overflow-y-auto bg-white dark:bg-slate-900 p-6 space-y-5 custom-scrollbar">
            
            {currentPart ? (
              <>
                {/* Part Header Card */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="px-2 py-0.5 rounded font-mono font-bold text-xs bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300">
                        #{currentPart.itemNo} {currentPart.category} / {currentPart.partType}
                      </span>
                      <h3 className="text-base font-black text-slate-900 dark:text-white">
                        {currentPart.partName}
                      </h3>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-1 font-mono">
                      <span>DWG No: <strong>{currentPart.dwgNo || '-'}</strong></span>
                      <span>Spec: <strong>{currentPart.typeSpec || '-'}</strong></span>
                      <span>Maker: <strong>{currentPart.maker || '-'}</strong></span>
                      <span>Qty: <strong>{currentPart.qty} {currentPart.unit}</strong></span>
                    </div>
                  </div>

                  {attachedUrl && (
                    <div className="flex items-center space-x-2 shrink-0">
                      <a
                        href={resolvedAttachedUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold flex items-center space-x-1.5 shadow-sm transition-all"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>เปิดดูแบบขยายใหญ่</span>
                      </a>
                    </div>
                  )}
                </div>

                {/* Upload & Link Manager */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  
                  {/* Card 1: Direct File Upload (PDF / Image) */}
                  <div className="p-4 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 hover:border-sky-500 transition-colors bg-slate-50/50 dark:bg-slate-950/30 flex flex-col justify-between space-y-3">
                    <div className="flex items-center space-x-2.5">
                      <div className="p-2 rounded-xl bg-sky-100 dark:bg-sky-950 text-sky-600 dark:text-sky-400">
                        <Upload className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                          อัปโหลดไฟล์แบบ Drawing / ภาพถ่าย
                        </h4>
                        <p className="text-[10px] text-slate-400">
                          รองรับ PDF, PNG, JPG, STEP, DXF (ขนาดไม่เกิน 25MB)
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <label className={`px-4 py-2 rounded-xl text-xs font-bold text-white transition-all cursor-pointer flex items-center space-x-1.5 shadow-sm ${
                        isUploading 
                          ? 'bg-slate-400 cursor-not-allowed' 
                          : 'bg-sky-600 hover:bg-sky-700 shadow-sky-500/20'
                      }`}>
                        {isUploading ? (
                          <>
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            <span>กำลังอัปโหลด...</span>
                          </>
                        ) : (
                          <>
                            <FolderOpen className="w-3.5 h-3.5" />
                            <span>เลือกไฟล์จากเครื่อง</span>
                          </>
                        )}
                        <input
                          type="file"
                          accept=".pdf,image/*,.step,.stl,.dxf,.dwg"
                          onChange={handleFileUpload}
                          disabled={isUploading}
                          className="hidden"
                        />
                      </label>
                    </div>

                    {uploadError && (
                      <p className="text-[11px] text-rose-500 font-bold">{uploadError}</p>
                    )}
                  </div>

                  {/* Card 2: External Cloud Link (Google Drive / OneDrive / NAS) */}
                  <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/30 flex flex-col justify-between space-y-3">
                    <div className="flex items-center space-x-2.5">
                      <div className="p-2 rounded-xl bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
                        <LinkIcon className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                          ใส่ลิงก์ Cloud หรือ Google Drive
                        </h4>
                        <p className="text-[10px] text-slate-400">
                          วาง URL เอกสารจาก Google Drive หรือ Server ภายใน
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <input
                        type="url"
                        value={externalUrlInput}
                        onChange={(e) => setExternalUrlInput(e.target.value)}
                        placeholder="https://drive.google.com/file/..."
                        className="flex-1 px-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-sky-500"
                      />
                      <button
                        onClick={handleSaveExternalLink}
                        disabled={!externalUrlInput.trim()}
                        className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 dark:disabled:bg-slate-800 text-white font-bold text-xs transition-colors shrink-0 shadow-sm"
                      >
                        บันทึก
                      </button>
                    </div>
                  </div>

                </div>

                {/* Preview Section */}
                <div className="flex-1 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col bg-slate-50/50 dark:bg-slate-950/50 min-h-[350px]">
                  <div className="px-4 py-2.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-bold text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-900">
                    <span className="flex items-center gap-1.5">
                      <Eye className="w-4 h-4 text-sky-500" />
                      ตัวอย่างไฟล์แบบ (Drawing & Photo Preview)
                    </span>

                    {attachedUrl && (
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleCopyLink(resolvedAttachedUrl)}
                          className="text-[11px] text-slate-500 hover:text-slate-800 dark:hover:text-white flex items-center gap-1"
                        >
                          {copiedLink ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                          <span>{copiedLink ? 'คัดลอกแล้ว' : 'Copy URL'}</span>
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="flex-1 p-4 flex items-center justify-center">
                    {attachedUrl ? (
                      isPdf ? (
                        <iframe
                          src={resolvedAttachedUrl}
                          className="w-full h-full min-h-[400px] rounded-xl border border-slate-200 dark:border-slate-800 bg-white"
                          title="Drawing PDF Preview"
                        />
                      ) : isImage ? (
                        <div className="max-h-[450px] overflow-auto flex items-center justify-center p-2">
                          <img 
                            src={resolvedAttachedUrl} 
                            alt={currentPart.partName} 
                            className="max-h-[420px] max-w-full rounded-xl object-contain shadow-md"
                          />
                        </div>
                      ) : (
                        <div className="p-8 text-center space-y-3">
                          <div className="w-12 h-12 rounded-2xl bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 mx-auto flex items-center justify-center">
                            <ExternalLink className="w-6 h-6" />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                              มีลิงก์แนบเอกสารภายนอก
                            </p>
                            <p className="text-[11px] text-slate-400 font-mono mt-0.5 truncate max-w-md mx-auto">
                              {attachedUrl}
                            </p>
                          </div>
                          <a
                            href={resolvedAttachedUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs shadow-sm transition-all"
                          >
                            <span>เปิดลิงก์ในหน้าต่างใหม่</span>
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      )
                    ) : (
                      <div className="p-8 text-center text-slate-400 space-y-2">
                        <ImageIcon className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-700" />
                        <p className="text-xs font-bold">ยังไม่มีไฟล์แบบ Drawing หรือรูปภาพแนบในชิ้นส่วนนี้</p>
                        <p className="text-[11px]">ใช้อัปโหลดไฟล์หรือวางลิงก์ Cloud ด้านบนเพื่อเพิ่มเอกสารแบบ</p>
                      </div>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <div className="p-12 text-center text-slate-400 text-xs">
                กรุณาเลือกชิ้นส่วนจากรายการทางด้านซ้ายเพื่อดูหรือแนบไฟล์แบบ
              </div>
            )}

          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80 flex items-center justify-between">
          <div className="flex items-center space-x-2 text-xs text-slate-500">
            <Paperclip className="w-4 h-4 text-sky-500" />
            <span>มีพาร์ทที่มีไฟล์แบบแนบแล้ว: <strong>{parts.filter(p => Boolean(p.purchaseLink?.trim())).length}</strong> จาก {parts.length} รายการ</span>
          </div>

          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 font-bold text-xs text-slate-700 dark:text-slate-300 transition-colors"
          >
            ปิดหน้าต่าง
          </button>
        </div>
      </div>
    </div>
  );
};
