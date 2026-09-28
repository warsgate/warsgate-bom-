import React, { useState, useEffect } from 'react';
import { 
  X, 
  Database, 
  Download, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  HardDrive, 
  FileText, 
  FileCode, 
  Copy, 
  Check, 
  RefreshCw,
  FolderOpen,
  ShieldCheck,
  Server,
  ArrowDownToLine
} from 'lucide-react';
import { backupApi, BackupResult, BackupFileItem } from '../api/client';

interface DatabaseBackupModalProps {
  isOpen: boolean;
  onClose: () => void;
  projects?: any[];
  modules?: any[];
  parts?: any[];
  masterTasks?: any[];
}

export const DatabaseBackupModal: React.FC<DatabaseBackupModalProps> = ({
  isOpen,
  onClose,
  projects = [],
  modules = [],
  parts = [],
  masterTasks = [],
}) => {
  const [loading, setLoading] = useState(false);
  const [fetchingList, setFetchingList] = useState(false);
  const [backupResult, setBackupResult] = useState<BackupResult | null>(null);
  const [backupsList, setBackupsList] = useState<BackupFileItem[]>([]);
  const [backupDir, setBackupDir] = useState<string>('');
  const [copiedPath, setCopiedPath] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchBackups = async () => {
    try {
      setFetchingList(true);
      const res = await backupApi.listBackups();
      if (res.success) {
        setBackupsList(res.backups || []);
        setBackupDir(res.backupDir || '');
      }
    } catch (err: any) {
      console.warn('Failed to fetch backup list:', err);
    } finally {
      setFetchingList(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchBackups();
      setErrorMessage(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleTriggerBackup = async () => {
    try {
      setLoading(true);
      setErrorMessage(null);
      const result = await backupApi.triggerBackup();
      if (result.success) {
        setBackupResult(result);
        if (result.backupDir) setBackupDir(result.backupDir);
        await fetchBackups();
      } else {
        setErrorMessage(result.message || 'ไม่สามารถสำรองข้อมูลได้');
      }
    } catch (err: any) {
      const msg = err.message || '';
      if (msg.includes('Route not found')) {
        setErrorMessage(
          'เซิร์ฟเวอร์ตอบกลับว่า "Route not found" (หากใช้งานผ่าน Cloud/Render อาจกำลังอยู่ในช่วง Deploy โค้ดใหม่ กรุณารอสักครู่ 2-3 นาที หรือใช้ปุ่ม "ดาวน์โหลด JSON จากเครื่องทันที" ด้านล่าง)'
        );
      } else {
        setErrorMessage(msg || 'เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์');
      }
    } finally {
      setLoading(false);
    }
  };

  // Instant browser-side export (Zero dependency on backend status)
  const handleBrowserDirectDownload = () => {
    const now = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');
    const timestamp = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;

    const exportData = {
      metadata: {
        timestamp: now.toISOString(),
        backupType: 'browser-memory-export',
        system: 'WARSGATE BOM System',
        counts: {
          projects: projects.length,
          modules: modules.length,
          parts: parts.length,
          masterTasks: masterTasks.length,
        },
      },
      data: {
        projects,
        modules,
        parts,
        masterTasks,
      },
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `warsgate_bom_browser_backup_${timestamp}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleCopyPath = () => {
    if (backupDir) {
      navigator.clipboard.writeText(backupDir);
      setCopiedPath(true);
      setTimeout(() => setCopiedPath(false), 2000);
    }
  };

  const formatDatetime = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleString('th-TH', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/60 dark:bg-slate-900/60">
          <div className="flex items-center space-x-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 text-white flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Database className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                สำรองฐานข้อมูลระบบ (Database Backup)
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 font-bold border border-emerald-300 dark:border-emerald-800">
                  SQLite Safe Copy
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                สำรองข้อมูลทั้งหมดลงเครื่องของคุณ พร้อมดาวน์โหลดไฟล์ .db, .sql, .json
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

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 custom-scrollbar">
          
          {/* Action Card: Server Backup */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-50/80 via-blue-50/40 to-white dark:from-indigo-950/20 dark:via-blue-950/10 dark:to-slate-900 border border-indigo-100 dark:border-indigo-900/30 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 rounded-2xl bg-indigo-600/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                <HardDrive className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  สำรองฐานข้อมูลผ่านเซิร์ฟเวอร์
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  บันทึกไฟล์ .db, .sql, .json ลงโฟลเดอร์ <code className="text-indigo-600 dark:text-indigo-400 font-mono font-bold">backups/</code> ในเครื่อง
                </p>
              </div>
            </div>

            <button
              onClick={handleTriggerBackup}
              disabled={loading}
              className={`px-5 py-3 rounded-xl font-bold text-xs text-white shadow-lg transition-all flex items-center space-x-2 shrink-0 ${
                loading
                  ? 'bg-slate-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-blue-500/25 hover:shadow-blue-500/40 hover:scale-[1.02] active:scale-[0.98]'
              }`}
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>กำลังสำรองข้อมูล...</span>
                </>
              ) : (
                <>
                  <Database className="w-4 h-4" />
                  <span>สำรองข้อมูลเดี๋ยวนี้</span>
                </>
              )}
            </button>
          </div>

          {/* Error Alert with Emergency Download Option */}
          {errorMessage && (
            <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/40 space-y-3 text-rose-700 dark:text-rose-300">
              <div className="flex items-start space-x-3">
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-rose-500" />
                <div className="text-xs">{errorMessage}</div>
              </div>
              
              <div className="pt-2 border-t border-rose-200 dark:border-rose-900/40 flex items-center justify-between">
                <span className="text-[11px] text-slate-600 dark:text-slate-400">
                  ต้องการดาวน์โหลดสำเนาข้อมูลฉุกเฉินทันที?
                </span>
                <button
                  onClick={handleBrowserDirectDownload}
                  className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center space-x-1.5 shadow-sm transition-all"
                >
                  <ArrowDownToLine className="w-3.5 h-3.5" />
                  <span>ดาวน์โหลด JSON จากเบราว์เซอร์ทันที</span>
                </button>
              </div>
            </div>
          )}

          {/* Quick Browser Direct Download Card */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  ดาวน์โหลดข้อมูล JSON ทันที (Direct Download)
                </p>
                <p className="text-[11px] text-slate-400">
                  ดาวน์โหลดข้อมูล {projects.length} โปรเจกต์, {parts.length} พาร์ท ลงเครื่องผ่านเบราว์เซอร์โดยตรง
                </p>
              </div>
            </div>
            <button
              onClick={handleBrowserDirectDownload}
              className="px-3.5 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs flex items-center space-x-1.5 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>บันทึก JSON ทันที</span>
            </button>
          </div>

          {/* Backup Location on Machine */}
          {backupDir && (
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
              <div className="flex items-center space-x-2.5 min-w-0 pr-2">
                <FolderOpen className="w-4 h-4 text-amber-500 shrink-0" />
                <span className="font-bold text-slate-600 dark:text-slate-400 shrink-0">โฟลเดอร์ในเครื่อง:</span>
                <span className="font-mono text-slate-800 dark:text-slate-200 truncate select-all">{backupDir}</span>
              </div>
              <button
                onClick={handleCopyPath}
                className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white text-[11px] font-bold flex items-center space-x-1 shrink-0 transition-colors shadow-sm"
                title="คัดลอกที่อยู่โฟลเดอร์"
              >
                {copiedPath ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                    <span className="text-emerald-600 dark:text-emerald-400">คัดลอกแล้ว</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Path</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* Latest Backup Success Card */}
          {backupResult && (
            <div className="p-4 rounded-2xl bg-emerald-50/80 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/60 space-y-3 animate-in fade-in duration-300">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 text-emerald-800 dark:text-emerald-300 font-bold text-xs">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>{backupResult.message} ({backupResult.timestamp})</span>
                </div>
                <span className="text-[10px] font-mono text-emerald-700 dark:text-emerald-400 font-bold bg-emerald-100 dark:bg-emerald-900/50 px-2 py-0.5 rounded-full">
                  ล่าสุด
                </span>
              </div>

              {/* Counts Badge Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-emerald-100 dark:border-emerald-900/40">
                  <span className="text-slate-400 block text-[10px]">โปรเจกต์</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{backupResult.counts.projects} โครงการ</span>
                </div>
                <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-emerald-100 dark:border-emerald-900/40">
                  <span className="text-slate-400 block text-[10px]">โมดูลย่อย</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{backupResult.counts.modules} โมดูล</span>
                </div>
                <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-emerald-100 dark:border-emerald-900/40">
                  <span className="text-slate-400 block text-[10px]">BOM Part List</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{backupResult.counts.parts} รายการ</span>
                </div>
                <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-emerald-100 dark:border-emerald-900/40">
                  <span className="text-slate-400 block text-[10px]">Master Tasks</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{backupResult.counts.masterTasks} แผนงาน</span>
                </div>
              </div>

              {/* Direct Download Buttons */}
              <div className="pt-2 flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">ดาวน์โหลด:</span>
                {backupResult.files.db && (
                  <a
                    href={backupApi.getDownloadUrl(backupResult.files.db)}
                    download={backupResult.files.db}
                    className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center space-x-1.5 shadow-sm transition-all"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>SQLite (.db)</span>
                  </a>
                )}
                {backupResult.files.sql && (
                  <a
                    href={backupApi.getDownloadUrl(backupResult.files.sql)}
                    download={backupResult.files.sql}
                    className="px-3 py-1.5 rounded-xl bg-slate-700 hover:bg-slate-800 text-white font-bold text-xs flex items-center space-x-1.5 shadow-sm transition-all"
                  >
                    <FileCode className="w-3.5 h-3.5" />
                    <span>SQL Dump (.sql)</span>
                  </a>
                )}
                {backupResult.files.json && (
                  <a
                    href={backupApi.getDownloadUrl(backupResult.files.json)}
                    download={backupResult.files.json}
                    className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center space-x-1.5 shadow-sm transition-all"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>JSON Export (.json)</span>
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Backup History Table */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                ประวัติไฟล์สำรองบนเครื่อง ({backupsList.length} ไฟล์)
              </h4>
              <button
                onClick={fetchBackups}
                disabled={fetchingList}
                className="text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
              >
                <RefreshCw className={`w-3 h-3 ${fetchingList ? 'animate-spin' : ''}`} />
                รีเฟรช
              </button>
            </div>

            {backupsList.length === 0 ? (
              <div className="p-8 text-center rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 text-slate-400 text-xs">
                ยังไม่มีไฟล์สำรองในเครื่อง กดปุ่ม "สำรองข้อมูลเดี๋ยวนี้" ด้านบนเพื่อเริ่มทำสำเนา
              </div>
            ) : (
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden divide-y divide-slate-100 dark:divide-slate-800 max-h-64 overflow-y-auto custom-scrollbar">
                {backupsList.map((item) => {
                  let badgeColor = 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border-blue-200 dark:border-blue-800';
                  let icon = <Database className="w-3.5 h-3.5" />;
                  if (item.type === 'sql') {
                    badgeColor = 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300 border-purple-200 dark:border-purple-800';
                    icon = <FileCode className="w-3.5 h-3.5" />;
                  } else if (item.type === 'json') {
                    badgeColor = 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800';
                    icon = <FileText className="w-3.5 h-3.5" />;
                  }

                  return (
                    <div
                      key={item.filename}
                      className="p-3 bg-white dark:bg-slate-900/60 hover:bg-slate-50 dark:hover:bg-slate-800/40 flex items-center justify-between transition-colors gap-2"
                    >
                      <div className="flex items-center space-x-3 min-w-0">
                        <span className={`px-2 py-0.5 rounded-lg text-[10px] font-mono font-bold border flex items-center gap-1 shrink-0 ${badgeColor}`}>
                          {icon}
                          .{item.type}
                        </span>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-800 dark:text-slate-200 font-mono truncate">
                            {item.filename}
                          </p>
                          <p className="text-[10px] text-slate-400">
                            {formatDatetime(item.createdAt)} • {item.sizeFormatted}
                          </p>
                        </div>
                      </div>

                      <a
                        href={backupApi.getDownloadUrl(item.filename)}
                        download={item.filename}
                        className="px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold flex items-center space-x-1 shrink-0 transition-colors"
                        title="ดาวน์โหลดไฟล์นี้"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">โหลด</span>
                      </a>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Quick Tip / Restore Instructions */}
          <div className="p-4 rounded-2xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/30 flex items-start space-x-3 text-xs text-amber-800 dark:text-amber-200">
            <ShieldCheck className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">เคล็ดลับการกู้คืนข้อมูล (Restore):</span> หากต้องการย้อนกลับไปยังสำเนาใด สามารถนำไฟล์ <code className="px-1 py-0.5 bg-amber-100 dark:bg-amber-900/60 rounded text-[11px] font-mono">dev_backup_...db</code> ไปเปลี่ยนชื่อเป็น <code className="px-1 py-0.5 bg-amber-100 dark:bg-amber-900/60 rounded text-[11px] font-mono">dev.db</code> แล้ววางทับในโฟลเดอร์ <code className="px-1 py-0.5 bg-amber-100 dark:bg-amber-900/60 rounded text-[11px] font-mono">backend/prisma/</code> ได้ทันที
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80 flex items-center justify-between">
          <div className="flex items-center space-x-2 text-[11px] text-slate-400">
            <Server className="w-3.5 h-3.5 text-emerald-500" />
            <span>SQLite Active • Local Storage</span>
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
