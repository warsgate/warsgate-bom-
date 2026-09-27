import React, { useState, useMemo } from 'react';
import { 
  X, 
  Sparkles, 
  Bot, 
  AlertTriangle, 
  AlertCircle, 
  CheckCircle2, 
  Info, 
  Lightbulb, 
  ChevronRight, 
  ExternalLink, 
  Printer, 
  Layers, 
  Wrench, 
  DollarSign, 
  Clock, 
  ShieldCheck, 
  SlidersHorizontal,
  ArrowRight,
  TrendingDown
} from 'lucide-react';
import { BomPartItem, ModuleItem, ProjectItem } from '../types/bom';
import { analyzeBomWithAi, AiValidationIssue, ValidationCategory, ValidationSeverity } from '../utils/aiBomValidator';
import { formatCurrency } from '../utils/costCalculator';

interface AiBomAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  project?: ProjectItem;
  modules: ModuleItem[];
  parts: BomPartItem[];
  onEditPart?: (part: BomPartItem) => void;
}

export const AiBomAssistantModal: React.FC<AiBomAssistantModalProps> = ({
  isOpen,
  onClose,
  project,
  modules,
  parts,
  onEditPart,
}) => {
  // All hooks placed unconditionally before returns
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('ALL');
  const [expandedIssueId, setExpandedIssueId] = useState<string | null>(null);

  // Run AI Validation analysis
  const analysisResult = useMemo(() => {
    return analyzeBomWithAi(parts, modules);
  }, [parts, modules]);

  // Filter issues
  const filteredIssues = useMemo(() => {
    return analysisResult.issues.filter(issue => {
      if (selectedCategory !== 'ALL' && issue.category !== selectedCategory) return false;
      if (selectedSeverity !== 'ALL' && issue.severity !== selectedSeverity) return false;
      return true;
    });
  }, [analysisResult.issues, selectedCategory, selectedSeverity]);

  if (!isOpen) return null;

  const { healthScore, criticalCount, warningCount, suggestionCount, summary } = analysisResult;

  const getScoreColor = (score: number) => {
    if (score >= 85) return 'text-emerald-500 stroke-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800';
    if (score >= 65) return 'text-amber-500 stroke-amber-500 bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800';
    return 'text-rose-500 stroke-rose-500 bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800';
  };

  const getSeverityBadge = (severity: ValidationSeverity) => {
    switch (severity) {
      case 'critical':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-100 dark:bg-rose-950/70 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-800">
            <AlertTriangle className="w-2.5 h-2.5 mr-1 text-rose-600" /> วิกฤตเร่งด่วน
          </span>
        );
      case 'warning':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
            <AlertCircle className="w-2.5 h-2.5 mr-1 text-amber-600" /> ควรตรวจสอบ
          </span>
        );
      case 'suggestion':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
            <TrendingDown className="w-2.5 h-2.5 mr-1 text-emerald-600" /> แนะนำลดต้นทุน
          </span>
        );
      case 'info':
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black bg-sky-100 dark:bg-sky-950/70 text-sky-800 dark:text-sky-300 border border-sky-300 dark:border-sky-800">
            <Info className="w-2.5 h-2.5 mr-1 text-sky-600" /> ข้อมูลทั่วไป
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-5xl max-h-[95vh] flex flex-col shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        
        {/* ─── Header ─── */}
        <div className="p-4 sm:px-6 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 bg-gradient-to-r from-indigo-900 via-slate-900 to-slate-900 text-white print:hidden">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/30">
              <Bot className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-lg font-black tracking-tight flex items-center gap-1.5">
                  ผู้ช่วย AI ตรวจสอบ BOM (Engineering Assistant)
                  <Sparkles className="w-4 h-4 text-amber-400" />
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
                  AI Validation v2.4
                </span>
              </div>
              <p className="text-xs text-slate-300">
                {project ? `โครงการ: [${project.code}] ${project.name}` : 'ระบบวิเคราะห์ความสมบูรณ์และคู่ชิ้นส่วนอัตโนมัติ'}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => window.print()}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition-all border border-slate-700"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>พิมพ์รายงาน AI</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ─── Executive Summary KPI Card ─── */}
        <div className="p-4 sm:px-6 bg-slate-50/80 dark:bg-slate-950/50 border-b border-slate-200 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-4 gap-3">
          
          {/* Health Score Meter */}
          <div className={`p-3 rounded-2xl border flex items-center space-x-3.5 ${getScoreColor(healthScore)}`}>
            <div className="relative w-12 h-12 flex items-center justify-center shrink-0">
              <div className="font-mono font-black text-lg">{healthScore}%</div>
            </div>
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                คะแนนความสมบูรณ์
              </div>
              <div className="text-xs font-black text-slate-900 dark:text-white">
                {healthScore >= 85 ? 'พร้อมสั่งผลิต (Excellent)' : healthScore >= 65 ? 'มีข้อควรปรับปรุง (Good)' : 'ต้องตรวจสอบด่วน (Action Required)'}
              </div>
            </div>
          </div>

          {/* Critical Issues */}
          <div className="p-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase">
                จุดวิกฤต (Critical)
              </span>
              <div className="text-xl font-black text-rose-600 dark:text-rose-400">
                {criticalCount} <span className="text-xs font-normal text-slate-500">เรื่อง</span>
              </div>
            </div>
            <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/50 text-rose-600">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>

          {/* Cost Savings Opportunities */}
          <div className="p-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase">
                คำแนะนำลดต้นทุน
              </span>
              <div className="text-xl font-black text-emerald-600 dark:text-emerald-400">
                {suggestionCount} <span className="text-xs font-normal text-slate-500">ข้อเสนอ</span>
              </div>
            </div>
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600">
              <Lightbulb className="w-5 h-5" />
            </div>
          </div>

          {/* Scope Overview */}
          <div className="p-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between text-xs">
            <div className="space-y-0.5">
              <div className="text-slate-500 dark:text-slate-400">วิเคราะห์ทั้งหมด: <strong className="text-slate-900 dark:text-white">{summary.totalParts}</strong> Part</div>
              <div className="text-slate-500 dark:text-slate-400">งานกลึง (Feb): <strong className="text-amber-600">{summary.febPartsCount}</strong> Part</div>
              <div className="text-slate-500 dark:text-slate-400">ราคา ฿0: <strong className="text-rose-600">{summary.unpricedPartsCount}</strong> Part</div>
            </div>
            <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600">
              <ShieldCheck className="w-5 h-5" />
            </div>
          </div>

        </div>

        {/* ─── Category Filter Pills ─── */}
        <div className="p-3 px-4 sm:px-6 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-wrap items-center justify-between gap-2 text-xs print:hidden">
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              onClick={() => setSelectedCategory('ALL')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
                selectedCategory === 'ALL'
                  ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
              }`}
            >
              ทั้งหมด ({analysisResult.issues.length})
            </button>
            <button
              onClick={() => setSelectedCategory('accessories')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
                selectedCategory === 'accessories'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
              }`}
            >
              ⚙️ ชิ้นส่วนคู่ตัว (Accessories)
            </button>
            <button
              onClick={() => setSelectedCategory('drawing')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
                selectedCategory === 'drawing'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
              }`}
            >
              📐 แบบสั่งกลึง (Drawings)
            </button>
            <button
              onClick={() => setSelectedCategory('cost')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
                selectedCategory === 'cost'
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
              }`}
            >
              💰 ราคา & ต้นทุน (Cost)
            </button>
            <button
              onClick={() => setSelectedCategory('leadtime')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
                selectedCategory === 'leadtime'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
              }`}
            >
              ⏳ ระยะเวลานำส่ง (Lead-time)
            </button>
            <button
              onClick={() => setSelectedCategory('alternative')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
                selectedCategory === 'alternative'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
              }`}
            >
              💡 แนะนำลดต้นทุน (Savings)
            </button>
          </div>

          <div className="flex items-center space-x-1.5 text-xs text-slate-500">
            <span>ระดับ:</span>
            <select
              value={selectedSeverity}
              onChange={(e) => setSelectedSeverity(e.target.value)}
              className="bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg px-2 py-1 font-bold border border-slate-200 dark:border-slate-700 focus:outline-none"
            >
              <option value="ALL">ทุกระดับความสำคัญ</option>
              <option value="critical">🚨 วิกฤตเท่านั้น</option>
              <option value="warning">⚠️ ควรตรวจสอบ</option>
              <option value="suggestion">💡 ลดต้นทุน</option>
            </select>
          </div>
        </div>

        {/* ─── Issues Feed ─── */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3.5">
          {filteredIssues.length === 0 ? (
            <div className="p-12 text-center space-y-3 bg-slate-50 dark:bg-slate-950/40 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800">
              <CheckCircle2 className="w-12 h-12 mx-auto text-emerald-500 animate-bounce" />
              <div className="font-black text-sm text-slate-900 dark:text-white">
                ยอดเยี่ยม! ไม่พบปัญหาตามตัวกรองนี้
              </div>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                รายการชิ้นส่วน BOM มีข้อมูลครบถ้วนถูกต้องตามหลักการทางวิศวกรรม
              </p>
            </div>
          ) : (
            filteredIssues.map((issue) => {
              const isExpanded = expandedIssueId === issue.id;

              return (
                <div
                  key={issue.id}
                  className="p-4 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 shadow-sm hover:shadow-md transition-all space-y-3"
                >
                  {/* Top Bar: Severity & Title */}
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="flex items-start space-x-2.5">
                      <div className="mt-0.5">
                        {getSeverityBadge(issue.severity)}
                      </div>
                      <div>
                        <h4 className="font-black text-sm text-slate-900 dark:text-white leading-tight">
                          {issue.title}
                        </h4>
                        <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                          {issue.description}
                        </p>
                      </div>
                    </div>

                    {issue.potentialSavingsEstimate && (
                      <span className="px-2.5 py-1 rounded-xl text-xs font-black bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                        {issue.potentialSavingsEstimate}
                      </span>
                    )}
                  </div>

                  {/* Recommendation Card */}
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 text-xs flex items-start space-x-2.5">
                    <Sparkles className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-slate-900 dark:text-white block font-bold mb-0.5">
                        คำแนะนำจาก AI:
                      </strong>
                      <span className="text-slate-600 dark:text-slate-300">
                        {issue.recommendation}
                      </span>
                    </div>
                  </div>

                  {/* Affected Parts List */}
                  {issue.affectedParts && issue.affectedParts.length > 0 && (
                    <div className="space-y-2 pt-1 border-t border-slate-100 dark:border-slate-700/60">
                      <div className="flex items-center justify-between text-xs">
                        <button
                          onClick={() => setExpandedIssueId(isExpanded ? null : issue.id)}
                          className="font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center space-x-1"
                        >
                          <span>รายการชิ้นส่วนที่เกี่ยวข้อง ({issue.affectedParts.length} รายการ)</span>
                          <ChevronRight className={`w-3.5 h-3.5 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                        </button>
                      </div>

                      {isExpanded && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                          {issue.affectedParts.map(part => (
                            <div
                              key={part.id}
                              className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs"
                            >
                              <div className="truncate mr-2">
                                <div className="font-bold text-slate-900 dark:text-white truncate">
                                  #{part.itemNo} - {part.partName}
                                </div>
                                <div className="text-[11px] text-slate-500 font-mono truncate">
                                  {part.dwgNo || part.typeSpec || '-'}
                                </div>
                              </div>
                              {onEditPart && (
                                <button
                                  onClick={() => onEditPart(part)}
                                  className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 hover:bg-indigo-600 hover:text-white text-indigo-600 dark:text-indigo-400 font-bold border border-slate-200 dark:border-slate-700 transition-colors shrink-0 text-[11px]"
                                >
                                  แก้ไข
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                </div>
              );
            })
          )}
        </div>

        {/* ─── Footer ─── */}
        <div className="p-3 px-6 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex justify-between items-center text-xs print:hidden">
          <div className="text-slate-500 flex items-center space-x-2">
            <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
            <span>AI ทำการวิเคราะห์เทียบกับฐานข้อมูลชิ้นส่วนอัตโนมัติแบบเรียลไทม์</span>
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
