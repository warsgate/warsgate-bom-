import React, { useState, useEffect, useMemo } from 'react';
import { 
  X, 
  History, 
  GitCompare, 
  RotateCcw, 
  Plus, 
  Save, 
  Calendar, 
  User, 
  Layers, 
  DollarSign, 
  FileText, 
  CheckCircle2, 
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  Trash2
} from 'lucide-react';
import { BomPartItem, ModuleItem, ProjectItem } from '../types/bom';
import { formatCurrency } from '../utils/costCalculator';

export interface BomRevision {
  id: string;
  projectId: string;
  revCode: string; // e.g. "Rev.0", "Rev.1"
  createdAt: string; // ISO
  author: string;
  changeNotes: string;
  totalCost: number;
  totalParts: number;
  parts: BomPartItem[];
  modules: ModuleItem[];
}

interface RevisionControlModalProps {
  isOpen: boolean;
  onClose: () => void;
  project?: ProjectItem | null;
  currentParts: BomPartItem[];
  currentModules: ModuleItem[];
  currentUser?: any;
  onRestoreRevision?: (parts: BomPartItem[], modules: ModuleItem[]) => Promise<void>;
}

export const RevisionControlModal: React.FC<RevisionControlModalProps> = ({
  isOpen,
  onClose,
  project,
  currentParts,
  currentModules,
  currentUser,
  onRestoreRevision,
}) => {
  const projectId = project?.id || 'default_project';
  const storageKey = `wg_bom_revisions_${projectId}`;

  const [revisions, setRevisions] = useState<BomRevision[]>([]);
  const [activeTab, setActiveTab] = useState<'LIST' | 'DIFF' | 'NEW'>('LIST');

  // New Revision Form State
  const [newRevCode, setNewRevCode] = useState<string>('Rev.1');
  const [newAuthor, setNewAuthor] = useState<string>(currentUser?.name || 'Engineer');
  const [newNotes, setNewNotes] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);

  // Diff Selection State
  const [baseRevId, setBaseRevId] = useState<string>('');
  const [targetRevId, setTargetRevId] = useState<string>('CURRENT'); // 'CURRENT' or revId

  // Notification State
  const [successMsg, setSuccessMsg] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');

  // Load revisions from localStorage
  useEffect(() => {
    if (!isOpen) return;
    try {
      const saved = localStorage.getItem(storageKey);
      let parsed: BomRevision[] = [];
      if (saved) {
        try {
          const data = JSON.parse(saved);
          if (Array.isArray(data)) {
            parsed = data;
          }
        } catch {
          parsed = [];
        }
      }

      const safeParts = currentParts || [];
      const safeModules = currentModules || [];

      if (parsed.length > 0) {
        setRevisions(parsed);
        if (!baseRevId || !parsed.some(r => r.id === baseRevId)) {
          setBaseRevId(parsed[parsed.length - 1].id);
        }
      } else {
        // Auto-seed Rev.0 if none exists yet
        const currentCost = safeParts.reduce((sum, p) => sum + (p.totalAmount || ((p.qty || 1) * (p.unitPrice || 0))), 0);
        const initialRev: BomRevision = {
          id: 'rev_initial_' + Date.now(),
          projectId,
          revCode: 'Rev.0',
          createdAt: new Date().toISOString(),
          author: currentUser?.name || 'System (Initial Baseline)',
          changeNotes: 'Initial Baseline Release of BOM',
          totalCost: currentCost,
          totalParts: safeParts.length,
          parts: JSON.parse(JSON.stringify(safeParts)),
          modules: JSON.parse(JSON.stringify(safeModules)),
        };
        const initialList = [initialRev];
        try {
          localStorage.setItem(storageKey, JSON.stringify(initialList));
        } catch {
          // localStorage might be full or blocked
        }
        setRevisions(initialList);
        setBaseRevId(initialRev.id);
      }
    } catch (e) {
      console.error('Failed to load BOM revisions:', e);
    }
  }, [isOpen, projectId, storageKey, currentParts, currentModules, currentUser]);

  // Determine next suggested Rev code
  useEffect(() => {
    if (revisions.length > 0) {
      setNewRevCode(`Rev.${revisions.length}`);
    } else {
      setNewRevCode('Rev.1');
    }
  }, [revisions]);

  // Compute Diff between Base Revision and Target (Target can be 'CURRENT' or another Rev)
  const diffResult = useMemo(() => {
    if (revisions.length === 0) return null;

    const baseRev = revisions.find(r => r.id === baseRevId) || revisions[0];
    const safeCurrentParts = currentParts || [];
    const currentCost = safeCurrentParts.reduce((s, p) => s + (p.totalAmount || ((p.qty || 1) * (p.unitPrice || 0)) || 0), 0);

    const targetRev = targetRevId === 'CURRENT' 
      ? {
          id: 'CURRENT',
          projectId,
          revCode: 'Current BOM (ข้อมูลปัจจุบัน)',
          createdAt: new Date().toISOString(),
          author: 'Live Active System',
          changeNotes: 'สถานะปัจจุบัน',
          parts: safeCurrentParts,
          modules: currentModules || [],
          totalParts: safeCurrentParts.length,
          totalCost: currentCost
        }
      : revisions.find(r => r.id === targetRevId);

    if (!baseRev || !targetRev) {
      return null;
    }

    const baseParts = baseRev.parts || [];
    const targetParts = targetRev.parts || [];

    const baseMap = new Map<string, BomPartItem>();
    baseParts.forEach(p => baseMap.set(p.id, p));

    const targetMap = new Map<string, BomPartItem>();
    targetParts.forEach(p => targetMap.set(p.id, p));

    // Added: in target but not in base
    const added: BomPartItem[] = [];
    // Removed: in base but not in target
    const removed: BomPartItem[] = [];
    // Modified: in both, but key fields changed
    const modified: Array<{
      part: BomPartItem;
      changes: Array<{ field: string; oldVal: any; newVal: any }>;
    }> = [];
    // Unchanged
    const unchanged: BomPartItem[] = [];

    targetParts.forEach(tp => {
      const bp = baseMap.get(tp.id);
      if (!bp) {
        added.push(tp);
      } else {
        const changes: Array<{ field: string; oldVal: any; newVal: any }> = [];
        if (bp.partName !== tp.partName) changes.push({ field: 'ชื่อชิ้นส่วน (Part Name)', oldVal: bp.partName || '-', newVal: tp.partName || '-' });
        if (bp.qty !== tp.qty) changes.push({ field: 'จำนวน (Qty)', oldVal: `${bp.qty || 0} ${bp.unit || ''}`, newVal: `${tp.qty || 0} ${tp.unit || ''}` });
        if ((bp.unitPrice || 0) !== (tp.unitPrice || 0)) changes.push({ field: 'ราคาต่อหน่วย (Unit Price)', oldVal: formatCurrency(bp.unitPrice), newVal: formatCurrency(tp.unitPrice) });
        if ((bp.typeSpec || '') !== (tp.typeSpec || '')) changes.push({ field: 'สเปก / รุ่น (Spec)', oldVal: bp.typeSpec || '-', newVal: tp.typeSpec || '-' });
        if ((bp.maker || '') !== (tp.maker || '')) changes.push({ field: 'ผู้ผลิต (Maker)', oldVal: bp.maker || '-', newVal: tp.maker || '-' });
        if ((bp.supplier || '') !== (tp.supplier || '')) changes.push({ field: 'ผู้ขาย (Supplier)', oldVal: bp.supplier || '-', newVal: tp.supplier || '-' });

        if (changes.length > 0) {
          modified.push({ part: tp, changes });
        } else {
          unchanged.push(tp);
        }
      }
    });

    baseParts.forEach(bp => {
      if (!targetMap.has(bp.id)) {
        removed.push(bp);
      }
    });

    const costDiff = (targetRev.totalCost || 0) - (baseRev.totalCost || 0);

    return {
      baseRev,
      targetRev,
      added,
      removed,
      modified,
      unchanged,
      costDiff
    };
  }, [baseRevId, targetRevId, revisions, currentParts, currentModules, projectId]);

  // Handle Save New Revision Snapshot
  const handleSaveRevision = () => {
    if (!newRevCode.trim()) {
      setErrorMsg('กรุณากรอกรหัส Revision (เช่น Rev.1)');
      return;
    }
    setIsSaving(true);
    setErrorMsg('');
    try {
      const safeParts = currentParts || [];
      const currentCost = safeParts.reduce((sum, p) => sum + (p.totalAmount || ((p.qty || 1) * (p.unitPrice || 0))), 0);
      const newRev: BomRevision = {
        id: 'rev_' + Date.now(),
        projectId,
        revCode: newRevCode.trim(),
        createdAt: new Date().toISOString(),
        author: newAuthor.trim() || 'Engineer',
        changeNotes: newNotes.trim() || 'Engineering Change Order',
        totalCost: currentCost,
        totalParts: safeParts.length,
        parts: JSON.parse(JSON.stringify(safeParts)),
        modules: JSON.parse(JSON.stringify(currentModules || [])),
      };

      const updated = [...revisions, newRev];
      localStorage.setItem(storageKey, JSON.stringify(updated));
      setRevisions(updated);
      setSuccessMsg(`✅ บันทึก ${newRev.revCode} สำเร็จแล้ว (${safeParts.length} รายการ, ${formatCurrency(currentCost)})`);
      setNewNotes('');
      setActiveTab('LIST');
    } catch (err: any) {
      setErrorMsg('เกิดข้อผิดพลาดในการบันทึก: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  // Handle Delete Revision
  const handleDeleteRevision = (revId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('คุณแน่ใจหรือไม่ว่าต้องการลบประวัติ Revision นี้?')) return;
    const updated = revisions.filter(r => r.id !== revId);
    localStorage.setItem(storageKey, JSON.stringify(updated));
    setRevisions(updated);
  };

  // Handle Restore Revision
  const handleRestore = async (rev: BomRevision) => {
    if (!onRestoreRevision) return;
    const confirmText = `ต้องการย้อนคืนค่า BOM ของโปรเจกต์นี้กลับไปเป็น "${rev.revCode}" (${new Date(rev.createdAt).toLocaleString('th-TH')}) ใช่หรือไม่?\n\nข้อมูลปัจจุบันจะถูกแทนที่ด้วยรายการใน Revision นี้`;
    if (!confirm(confirmText)) return;

    try {
      await onRestoreRevision(rev.parts, rev.modules);
      setSuccessMsg(`คืนค่าโปรเจกต์เป็น ${rev.revCode} เรียบร้อยแล้ว!`);
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err: any) {
      setErrorMsg('คืนค่าไม่สำเร็จ: ' + err.message);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-5xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[94vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/70">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-gradient-to-br from-purple-600 to-indigo-700 text-white rounded-xl shadow-md">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white flex items-center space-x-2">
                <span>ระบบควบคุมเวอร์ชัน BOM (Revision Control & Diff)</span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300 font-mono font-bold">
                  {revisions.length} Revisions
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {project ? `[${project.code}] ${project.name}` : 'WARSGATE BOM'}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setActiveTab('NEW')}
              className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold shadow-md transition-all flex items-center space-x-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>สร้าง Revision ใหม่</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Selector */}
        <div className="flex items-center justify-between px-5 py-2.5 bg-slate-100/70 dark:bg-slate-950/40 border-b border-slate-200 dark:border-slate-800 text-xs font-bold">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setActiveTab('LIST')}
              className={`px-3 py-1.5 rounded-xl transition-all flex items-center space-x-1.5 ${
                activeTab === 'LIST'
                  ? 'bg-white dark:bg-slate-800 text-purple-700 dark:text-purple-300 shadow-sm font-black'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>ประวัติ Revision ทั้งหมด ({revisions.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('DIFF')}
              className={`px-3 py-1.5 rounded-xl transition-all flex items-center space-x-1.5 ${
                activeTab === 'DIFF'
                  ? 'bg-white dark:bg-slate-800 text-purple-700 dark:text-purple-300 shadow-sm font-black'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <GitCompare className="w-3.5 h-3.5" />
              <span>เปรียบเทียบความแตกต่าง (Visual Diff)</span>
            </button>
          </div>

          <span className="text-[11px] text-slate-500 font-medium hidden sm:inline">
            เก็บประวัติการแก้แบบ ECO, เปรียบเทียบต้นทุน และกู้คืนข้อมูล
          </span>
        </div>

        {/* Alerts */}
        {successMsg && (
          <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/40 border-b border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-300 font-bold flex items-center justify-between px-5">
            <span>{successMsg}</span>
            <button onClick={() => setSuccessMsg('')} className="text-emerald-600 hover:underline">ปิด</button>
          </div>
        )}
        {errorMsg && (
          <div className="p-2.5 bg-rose-50 dark:bg-rose-950/40 border-b border-rose-200 dark:border-rose-800 text-xs text-rose-800 dark:text-rose-300 font-bold flex items-center justify-between px-5">
            <span>{errorMsg}</span>
            <button onClick={() => setErrorMsg('')} className="text-rose-600 hover:underline">ปิด</button>
          </div>
        )}

        {/* Tab 1: Revision List View */}
        {activeTab === 'LIST' && (
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3 bg-slate-100/60 dark:bg-slate-950">
            {revisions.length === 0 ? (
              <div className="text-center py-16 text-slate-400">
                ยังไม่มีบันทึก Revision สำหรับโปรเจกต์นี้
              </div>
            ) : (
              revisions.slice().reverse().map((rev) => (
                <div
                  key={rev.id}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
                >
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex items-center space-x-2.5">
                      <span className="px-2.5 py-0.5 bg-purple-600 text-white font-mono font-black text-xs rounded-lg shadow-sm">
                        {rev.revCode}
                      </span>
                      <h4 className="text-sm font-black text-slate-900 dark:text-white truncate">
                        {rev.changeNotes || 'Engineering Baseline'}
                      </h4>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400 font-medium">
                      <span className="flex items-center">
                        <Calendar className="w-3.5 h-3.5 mr-1 text-slate-400" />
                        {new Date(rev.createdAt).toLocaleString('th-TH')}
                      </span>
                      <span className="flex items-center">
                        <User className="w-3.5 h-3.5 mr-1 text-slate-400" />
                        {rev.author}
                      </span>
                      <span className="flex items-center">
                        <Layers className="w-3.5 h-3.5 mr-1 text-slate-400" />
                        {rev.totalParts} รายการ
                      </span>
                      <span className="flex items-center font-mono font-bold text-slate-800 dark:text-slate-200">
                        <DollarSign className="w-3.5 h-3.5 mr-0.5 text-emerald-600" />
                        {formatCurrency(rev.totalCost)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 shrink-0">
                    <button
                      onClick={() => {
                        setBaseRevId(rev.id);
                        setTargetRevId('CURRENT');
                        setActiveTab('DIFF');
                      }}
                      className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition-colors flex items-center space-x-1"
                    >
                      <GitCompare className="w-3.5 h-3.5" />
                      <span>เทียบกับปัจจุบัน</span>
                    </button>
                    {onRestoreRevision && (
                      <button
                        onClick={() => handleRestore(rev)}
                        className="px-3 py-1.5 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800/60 rounded-xl text-xs font-bold transition-colors flex items-center space-x-1"
                        title="คืนค่า BOM ให้ตรงกับ Snapshot ในเวอร์ชันนี้"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>คืนค่าเป็น Rev นี้</span>
                      </button>
                    )}
                    <button
                      onClick={(e) => handleDeleteRevision(rev.id, e)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg transition-colors"
                      title="ลบ Snapshot นี้"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Tab 2: Visual Version Diff */}
        {activeTab === 'DIFF' && (
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-slate-100/60 dark:bg-slate-950">
            {/* Diff Comparison Selector Bar */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-1.5">
                  <span className="font-bold text-slate-600 dark:text-slate-400">เวอร์ชันเดิม (Base):</span>
                  <select
                    value={baseRevId}
                    onChange={e => setBaseRevId(e.target.value)}
                    className="bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-2.5 py-1 font-bold text-slate-800 dark:text-white focus:outline-none"
                  >
                    {revisions.map(r => (
                      <option key={r.id} value={r.id}>{r.revCode} - {r.changeNotes}</option>
                    ))}
                  </select>
                </div>

                <ArrowRight className="w-4 h-4 text-purple-600" />

                <div className="flex items-center space-x-1.5">
                  <span className="font-bold text-slate-600 dark:text-slate-400">เทียบกับ (Target):</span>
                  <select
                    value={targetRevId}
                    onChange={e => setTargetRevId(e.target.value)}
                    className="bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-2.5 py-1 font-bold text-slate-800 dark:text-white focus:outline-none"
                  >
                    <option value="CURRENT">-- BOM ปัจจุบัน (Current Live BOM) --</option>
                    {revisions.map(r => (
                      <option key={r.id} value={r.id}>{r.revCode} - {r.changeNotes}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Cost Variance Badge */}
              {diffResult && (
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-slate-500">ส่วนต่างต้นทุน (Cost Delta):</span>
                  <span className={`px-2.5 py-1 rounded-xl font-mono font-black text-xs flex items-center ${
                    diffResult.costDiff > 0
                      ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                      : diffResult.costDiff < 0
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                      : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                  }`}>
                    {diffResult.costDiff > 0 ? <TrendingUp className="w-3.5 h-3.5 mr-1" /> : diffResult.costDiff < 0 ? <TrendingDown className="w-3.5 h-3.5 mr-1" /> : null}
                    {diffResult.costDiff > 0 ? '+' : ''}{formatCurrency(diffResult.costDiff)}
                  </span>
                </div>
              )}
            </div>

            {/* Diff Summary Badges */}
            {diffResult && (
              <div className="grid grid-cols-4 gap-3">
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-xl text-center">
                  <div className="text-lg font-black text-emerald-700 dark:text-emerald-400">{diffResult.added.length}</div>
                  <div className="text-[11px] font-bold text-emerald-800 dark:text-emerald-300">+ เพิ่มรายการใหม่</div>
                </div>
                <div className="p-3 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 rounded-xl text-center">
                  <div className="text-lg font-black text-rose-700 dark:text-rose-400">{diffResult.removed.length}</div>
                  <div className="text-[11px] font-bold text-rose-800 dark:text-rose-300">- ตัดรายการออก</div>
                </div>
                <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl text-center">
                  <div className="text-lg font-black text-amber-700 dark:text-amber-400">{diffResult.modified.length}</div>
                  <div className="text-[11px] font-bold text-amber-800 dark:text-amber-300">~ แก้ไขสเปก/ราคา</div>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-center">
                  <div className="text-lg font-black text-slate-700 dark:text-slate-300">{diffResult.unchanged.length}</div>
                  <div className="text-[11px] font-bold text-slate-500">= คงเดิม</div>
                </div>
              </div>
            )}

            {/* Diff Detailed List */}
            {diffResult && (
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
                
                {/* 1. Added Items */}
                {diffResult.added.length > 0 && (
                  <div className="border-b border-slate-200 dark:border-slate-800">
                    <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 font-bold text-xs flex items-center space-x-1.5 px-4">
                      <span>🟢 รายการที่เพิ่มขึ้นมาใหม่ ({diffResult.added.length} รายการ)</span>
                    </div>
                    <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                      {diffResult.added.map(p => (
                        <div key={p.id} className="p-3 flex justify-between items-center hover:bg-slate-50/50">
                          <div>
                            <span className="font-mono font-bold text-slate-500 mr-2">#{p.itemNo}</span>
                            <span className="font-bold text-slate-900 dark:text-white mr-2">{p.partName}</span>
                            <span className="font-mono text-slate-500 text-[11px]">{p.typeSpec || '-'}</span>
                          </div>
                          <div className="font-mono font-bold text-emerald-700 dark:text-emerald-400">
                            +{formatCurrency(p.totalAmount || ((p.qty || 1) * (p.unitPrice || 0)))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 2. Modified Items */}
                {diffResult.modified.length > 0 && (
                  <div className="border-b border-slate-200 dark:border-slate-800">
                    <div className="p-2.5 bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 font-bold text-xs flex items-center space-x-1.5 px-4">
                      <span>🟡 รายการที่มีการเปลี่ยนแปลง ({diffResult.modified.length} รายการ)</span>
                    </div>
                    <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                      {diffResult.modified.map(({ part, changes }) => (
                        <div key={part.id} className="p-3 space-y-1 hover:bg-slate-50/50">
                          <div className="flex items-center space-x-2">
                            <span className="font-mono font-bold text-slate-500">#{part.itemNo}</span>
                            <span className="font-bold text-slate-900 dark:text-white">{part.partName}</span>
                          </div>
                          <div className="pl-6 space-y-0.5">
                            {changes.map((c, i) => (
                              <div key={i} className="text-[11px] flex items-center space-x-2 text-slate-600 dark:text-slate-400">
                                <span className="font-bold text-slate-700 dark:text-slate-300 w-36 shrink-0">{c.field}:</span>
                                <span className="line-through text-rose-500">{c.oldVal}</span>
                                <ArrowRight className="w-3 h-3 text-slate-400" />
                                <span className="font-bold text-emerald-600 dark:text-emerald-400">{c.newVal}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 3. Removed Items */}
                {diffResult.removed.length > 0 && (
                  <div className="border-b border-slate-200 dark:border-slate-800">
                    <div className="p-2.5 bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 font-bold text-xs flex items-center space-x-1.5 px-4">
                      <span>🔴 รายการที่ถูกตัดออก ({diffResult.removed.length} รายการ)</span>
                    </div>
                    <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                      {diffResult.removed.map(p => (
                        <div key={p.id} className="p-3 flex justify-between items-center hover:bg-slate-50/50">
                          <div>
                            <span className="font-mono font-bold text-slate-500 mr-2">#{p.itemNo}</span>
                            <span className="font-bold text-slate-900 dark:text-white mr-2 line-through">{p.partName}</span>
                            <span className="font-mono text-slate-500 text-[11px]">{p.typeSpec || '-'}</span>
                          </div>
                          <div className="font-mono font-bold text-rose-700 dark:text-rose-400">
                            -{formatCurrency(p.totalAmount || ((p.qty || 1) * (p.unitPrice || 0)))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {diffResult.added.length === 0 && diffResult.modified.length === 0 && diffResult.removed.length === 0 && (
                  <div className="p-8 text-center text-slate-400 text-xs font-bold">
                    ทั้ง 2 เวอร์ชันตรงกันทุกรายการ ไม่มีข้อแตกต่าง (Zero Diff)
                  </div>
                )}

              </div>
            )}

            {!diffResult && (
              <div className="p-12 text-center text-slate-400 text-xs font-bold bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
                ยังไม่มีข้อมูลสำหรับเปรียบเทียบ กรุณากดเลือก Revision ทางด้านบน หรือสร้าง Revision แรก
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Create New Revision Form */}
        {activeTab === 'NEW' && (
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-100/60 dark:bg-slate-950 flex justify-center">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm w-full max-w-lg space-y-4">
              <div className="flex items-center space-x-2 text-purple-700 dark:text-purple-400 font-black text-sm">
                <Save className="w-4 h-4" />
                <span>บันทึก Snapshot ประจำเวอร์ชันใหม่</span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                ระบบจะเก็บสำเนาสถานะปัจจุบันของ BOM ทั้งหมด ({currentParts.length} รายการ) ไว้เป็นหลักฐานเพื่อการตรวจสอบและย้อนกลับในอนาคต
              </p>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    รหัส Revision (เช่น Rev.1, Rev.2, Rev.1.1):
                  </label>
                  <input
                    type="text"
                    value={newRevCode}
                    onChange={e => setNewRevCode(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 font-mono font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    ผู้จัดทำ / วิศวกรผู้แก้ไข (Author):
                  </label>
                  <input
                    type="text"
                    value={newAuthor}
                    onChange={e => setNewAuthor(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    รายละเอียดการปรับปรุง / สาเหตุการแก้แบบ (Change Notes / ECO Reason):
                  </label>
                  <textarea
                    rows={3}
                    value={newNotes}
                    onChange={e => setNewNotes(e.target.value)}
                    placeholder="เช่น ปรับเปลี่ยนมอเตอร์เป็น 750W ตามสเปกแรงบิดใหม่, เพิ่ม Sensor เช็คตำแหน่ง..."
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-2 flex space-x-2">
                <button
                  type="button"
                  onClick={handleSaveRevision}
                  disabled={isSaving}
                  className="flex-1 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-700 text-white rounded-xl text-xs font-black shadow-md transition-all flex items-center justify-center space-x-1.5 disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>{isSaving ? 'กำลังบันทึก...' : 'ยืนยันบันทึก Revision Snapshot'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('LIST')}
                  className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-bold"
                >
                  ยกเลิก
                </button>
              </div>

            </div>
          </div>
        )}

        {/* Footer */}
        <div className="p-3 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-500 flex justify-between items-center px-5">
          <span>Revision Control System - Warsgate Automation</span>
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
