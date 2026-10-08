import React, { useState, useMemo } from 'react';
import { 
  X, 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  CheckCircle2, 
  Calculator, 
  Printer, 
  Layers, 
  Sliders, 
  Sparkles,
  PieChart as PieIcon,
  ShieldAlert,
  ArrowUpRight,
  ArrowDownRight,
  ChevronRight,
  Percent
} from 'lucide-react';
import { ProjectItem, ModuleItem, BomPartItem, ProjectCostSummary } from '../types/bom';
import { formatCurrency } from '../utils/costCalculator';

interface CostVarianceAnalyticsModalProps {
  isOpen: boolean;
  onClose: () => void;
  project?: ProjectItem;
  modules: ModuleItem[];
  parts: BomPartItem[];
  costSummary: ProjectCostSummary;
}

export const CostVarianceAnalyticsModal: React.FC<CostVarianceAnalyticsModalProps> = ({
  isOpen,
  onClose,
  project,
  modules,
  parts,
  costSummary,
}) => {
  // Simulator State: What-if analysis
  const [febCostAdjustmentPct, setFebCostAdjustmentPct] = useState<number>(0); // -20% to +30%
  const [stdCostAdjustmentPct, setStdCostAdjustmentPct] = useState<number>(0); // -20% to +20%
  const [sellingPriceOverride, setSellingPriceOverride] = useState<number | null>(null);

  // Active filter tab
  const [activeViewTab, setActiveViewTab] = useState<'OVERVIEW' | 'OVERRUN_MODULES' | 'COST_DRIVERS' | 'SIMULATOR'>('OVERVIEW');

  // Base values
  const contractSellingPrice = sellingPriceOverride !== null 
    ? sellingPriceOverride 
    : (project?.targetBudget && project.targetBudget > 0 ? project.targetBudget : costSummary.totalTargetBudget * 1.35 || 1200000);

  const baseTotalCost = costSummary.totalProjectCost;
  const baseTargetBudget = costSummary.totalTargetBudget;

  // Split into Standard vs Feb (Machining)
  const baseStandardCost = costSummary.totalStandardCost;
  const baseFebCost = costSummary.totalFebCost;

  // Committed vs Pending
  const committedParts = useMemo(() => {
    return parts.filter(p => (p.poNumber && p.poNumber.trim() !== '') || p.status === 'Ordered' || p.status === 'Received');
  }, [parts]);

  const committedCost = useMemo(() => {
    return committedParts.reduce((sum, p) => sum + (p.totalAmount || 0), 0);
  }, [committedParts]);

  const receivedCost = useMemo(() => {
    return parts.filter(p => p.status === 'Received').reduce((sum, p) => sum + (p.totalAmount || 0), 0);
  }, [parts]);

  const plannedPendingCost = baseTotalCost - committedCost;

  // Simulation calculations
  const simulatedFebCost = baseFebCost * (1 + febCostAdjustmentPct / 100);
  const simulatedStdCost = baseStandardCost * (1 + stdCostAdjustmentPct / 100);
  const simulatedTotalCost = simulatedFebCost + simulatedStdCost;

  // Gross profit & margin
  const projectedGrossProfit = contractSellingPrice - simulatedTotalCost;
  const projectedMarginPct = contractSellingPrice > 0 ? (projectedGrossProfit / contractSellingPrice) * 100 : 0;

  // Variance (Target Budget vs Actual)
  const totalVariance = baseTargetBudget - simulatedTotalCost;
  const isOverallWithinBudget = totalVariance >= 0;

  // Module breakdown with variance analysis
  const moduleVarianceList = useMemo(() => {
    return costSummary.moduleSummaries.map((m) => {
      const target = m.targetBudget || 0;
      const actual = m.totalModuleCost || 0;
      const diff = target - actual;
      const isOver = actual > target && target > 0;
      const consumedPct = target > 0 ? (actual / target) * 100 : 0;
      const overrunAmount = isOver ? actual - target : 0;
      const overrunPct = target > 0 ? ((actual - target) / target) * 100 : 0;

      return {
        ...m,
        target,
        actual,
        diff,
        isOver,
        consumedPct,
        overrunAmount,
        overrunPct,
      };
    }).sort((a, b) => b.overrunAmount - a.overrunAmount);
  }, [costSummary.moduleSummaries]);

  const overrunModules = useMemo(() => {
    return moduleVarianceList.filter(m => m.isOver);
  }, [moduleVarianceList]);

  // Top 5 Highest Cost Driver Parts
  const topCostParts = useMemo(() => {
    return [...parts].sort((a, b) => (b.totalAmount || 0) - (a.totalAmount || 0)).slice(0, 5);
  }, [parts]);

  // Top Overrun Culprit Parts (where actual total amount exceeded target total amount)
  const topOverrunParts = useMemo(() => {
    return parts
      .filter(p => (p.totalAmount || 0) > (p.targetTotalAmount || 0) && (p.targetTotalAmount || 0) > 0)
      .map(p => ({
        ...p,
        diffOver: (p.totalAmount || 0) - (p.targetTotalAmount || 0),
        diffPct: ((p.totalAmount || 0) - (p.targetTotalAmount || 0)) / (p.targetTotalAmount || 1) * 100,
      }))
      .sort((a, b) => b.diffOver - a.diffOver)
      .slice(0, 5);
  }, [parts]);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const getMarginBadge = (pct: number) => {
    if (pct >= 35) {
      return {
        text: 'กำไรดีเยี่ยม (Healthy Margin)',
        color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800',
        icon: <TrendingUp className="w-4 h-4 text-emerald-600" />
      };
    }
    if (pct >= 20) {
      return {
        text: 'กำไรปานกลาง (Acceptable Margin)',
        color: 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border-blue-300 dark:border-blue-800',
        icon: <CheckCircle2 className="w-4 h-4 text-blue-600" />
      };
    }
    if (pct >= 5) {
      return {
        text: 'กำไรต่ำ/เฝ้าระวัง (Slim Margin)',
        color: 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-300 dark:border-amber-800',
        icon: <AlertTriangle className="w-4 h-4 text-amber-600" />
      };
    }
    return {
      text: 'โครงการมีความเสี่ยงขาดทุน (Loss Alert)',
      color: 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border-rose-300 dark:border-rose-800',
      icon: <ShieldAlert className="w-4 h-4 text-rose-600" />
    };
  };

  const marginBadge = getMarginBadge(projectedMarginPct);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-900/70">
          <div className="flex items-center space-x-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Calculator className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-lg font-black text-slate-900 dark:text-white">
                  ระบบวิเคราะห์งบประมาณ & กำไรขั้นต้น (Cost Variance & Margin)
                </h2>
                {project && (
                  <span className="font-mono text-xs font-black px-2 py-0.5 rounded-lg bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800">
                    [{project.code}]
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                วิเคราะห์ Target Budget vs Committed PO vs Actual Cost และจำลองกำไรโครงการ
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handlePrint}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="พิมพ์รายงานต้นทุน"
            >
              <Printer className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="px-6 pt-3 border-b border-slate-100 dark:border-slate-800 flex space-x-2 overflow-x-auto no-scrollbar">
          {[
            { id: 'OVERVIEW', label: 'ภาพรวมต้นทุน & กำไร', icon: DollarSign },
            { 
              id: 'OVERRUN_MODULES', 
              label: `โมดูลงบบานปลาย (${overrunModules.length})`, 
              icon: AlertTriangle,
              badge: overrunModules.length > 0 ? overrunModules.length : null,
              badgeColor: 'bg-rose-500 text-white'
            },
            { id: 'COST_DRIVERS', label: 'Top 5 ชิ้นส่วนต้นทุนสูง', icon: Layers },
            { id: 'SIMULATOR', label: 'จำลองราคา & What-If', icon: Sliders },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeViewTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveViewTab(tab.id as any)}
                className={`flex items-center space-x-2 px-3.5 py-2.5 rounded-t-xl text-xs font-bold transition-all border-b-2 ${
                  isActive
                    ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400 bg-emerald-50/50 dark:bg-emerald-950/20'
                    : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
                {tab.badge && (
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${tab.badgeColor}`}>
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 custom-scrollbar">

          {/* Top KPI Cards: Revenue, Cost, Profit, Margin */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
            {/* 1. Contract Price (Revenue) */}
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                ราคาขายสัญญา (Contract Value)
              </span>
              <div className="mt-1 text-2xl font-black font-mono text-slate-900 dark:text-white truncate">
                {formatCurrency(contractSellingPrice)}
              </div>
              <div className="mt-1 text-[11px] text-slate-500">
                ลูกค้า: {project?.customer || 'General'}
              </div>
            </div>

            {/* 2. Total Manufacturing BOM Cost */}
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                ต้นทุนรวม BOM (Manufacturing Cost)
              </span>
              <div className="mt-1 text-2xl font-black font-mono text-blue-600 dark:text-blue-400 truncate">
                {formatCurrency(simulatedTotalCost)}
              </div>
              <div className="mt-1 text-[11px] text-slate-500 flex items-center justify-between">
                <span>Std: {formatCurrency(simulatedStdCost)}</span>
                <span>Feb: {formatCurrency(simulatedFebCost)}</span>
              </div>
            </div>

            {/* 3. Projected Gross Profit */}
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                กำไรขั้นต้นที่คาดการณ์ (Gross Profit)
              </span>
              <div className={`mt-1 text-2xl font-black font-mono truncate ${
                projectedGrossProfit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
              }`}>
                {formatCurrency(projectedGrossProfit)}
              </div>
              <div className="mt-1 text-[11px] text-slate-500 flex items-center gap-1">
                {projectedGrossProfit >= 0 ? (
                  <ArrowUpRight className="w-3.5 h-3.5 text-emerald-500" />
                ) : (
                  <ArrowDownRight className="w-3.5 h-3.5 text-rose-500" />
                )}
                <span>กำไรสุทธิก่อนค่าโสหุ้ย</span>
              </div>
            </div>

            {/* 4. Profit Margin % */}
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                อัตรากำไรขั้นต้น (Gross Margin %)
              </span>
              <div className={`mt-1 text-2xl font-black font-mono truncate ${
                projectedMarginPct >= 20 ? 'text-emerald-600 dark:text-emerald-400' : projectedMarginPct >= 10 ? 'text-amber-500' : 'text-rose-600'
              }`}>
                {projectedMarginPct.toFixed(1)}%
              </div>
              <div className="mt-1 flex items-center gap-1.5">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border flex items-center gap-1 ${marginBadge.color}`}>
                  {marginBadge.icon}
                  {marginBadge.text}
                </span>
              </div>
            </div>
          </div>

          {/* TAB 1: OVERVIEW */}
          {activeViewTab === 'OVERVIEW' && (
            <div className="space-y-6">
              
              {/* Committed vs Pending PO Cost Progress */}
              <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <span>สถานะการเบิกจ่าย & งบประมาณผูกพัน (Committed Cost Tracking)</span>
                    </h3>
                    <p className="text-xs text-slate-500">
                      แสดงสัดส่วนระหว่างรายการที่เปิด PO สั่งของไปแล้ว กับรายการที่ยังอยู่ในแผน (Planned)
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-slate-400 block">เปิด PO ไปแล้ว</span>
                    <span className="text-sm font-mono font-black text-emerald-600 dark:text-emerald-400">
                      {formatCurrency(committedCost)} ({baseTotalCost > 0 ? ((committedCost / baseTotalCost) * 100).toFixed(1) : 0}%)
                    </span>
                  </div>
                </div>

                {/* Progress Stack Bar */}
                <div className="h-4 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden flex">
                  <div 
                    style={{ width: `${baseTotalCost > 0 ? (receivedCost / baseTotalCost) * 100 : 0}%` }}
                    className="bg-emerald-500 h-full transition-all"
                    title={`ตรวจรับของเข้าสโตร์แล้ว: ${formatCurrency(receivedCost)}`}
                  />
                  <div 
                    style={{ width: `${baseTotalCost > 0 ? ((committedCost - receivedCost) / baseTotalCost) * 100 : 0}%` }}
                    className="bg-blue-500 h-full transition-all"
                    title={`เปิด PO รอรับของ: ${formatCurrency(committedCost - receivedCost)}`}
                  />
                  <div 
                    style={{ width: `${baseTotalCost > 0 ? (plannedPendingCost / baseTotalCost) * 100 : 0}%` }}
                    className="bg-slate-300 dark:bg-slate-700 h-full transition-all"
                    title={`ยังไม่เปิด PO (Planned): ${formatCurrency(plannedPendingCost)}`}
                  />
                </div>

                {/* Legend */}
                <div className="flex flex-wrap items-center gap-4 text-xs font-bold pt-1">
                  <div className="flex items-center space-x-1.5">
                    <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                    <span className="text-slate-600 dark:text-slate-300">ตรวจรับเข้าสโตร์แล้ว ({formatCurrency(receivedCost)})</span>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                    <span className="text-slate-600 dark:text-slate-300">เปิด PO สั่งแล้ว/รอของ ({formatCurrency(committedCost - receivedCost)})</span>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <div className="w-3 h-3 rounded-full bg-slate-300 dark:bg-slate-700"></div>
                    <span className="text-slate-500">ยังไม่เปิด PO ({formatCurrency(plannedPendingCost)})</span>
                  </div>
                </div>
              </div>

              {/* Module-by-Module Variance Progress Bars */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    สรุปงบประมาณแยกตามโมดูล (Module Variance Breakdown)
                  </h3>
                  <span className="text-xs text-slate-400">
                    {modules.length} โมดูล
                  </span>
                </div>

                <div className="space-y-2.5">
                  {moduleVarianceList.map((m) => {
                    const isOver = m.isOver;
                    const pct = Math.min(m.consumedPct, 100);

                    return (
                      <div 
                        key={m.moduleId}
                        className={`p-3.5 rounded-2xl border transition-all ${
                          isOver
                            ? 'bg-rose-50/40 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/40'
                            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-2">
                          <div className="flex items-center space-x-2">
                            <span className="font-mono font-black text-xs text-slate-700 dark:text-slate-300">
                              [{m.moduleCode}]
                            </span>
                            <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                              {m.moduleName}
                            </span>
                          </div>

                          <div className="flex items-center space-x-3 text-xs">
                            <span className="text-slate-400">
                              Target: <strong className="font-mono text-slate-600 dark:text-slate-300">{formatCurrency(m.target)}</strong>
                            </span>
                            <span className="text-slate-400">
                              Actual: <strong className={`font-mono ${isOver ? 'text-rose-600 font-black' : 'text-slate-800 dark:text-slate-200'}`}>{formatCurrency(m.actual)}</strong>
                            </span>
                            {isOver ? (
                              <span className="px-2 py-0.5 rounded-md bg-rose-100 dark:bg-rose-900/50 text-rose-700 dark:text-rose-300 font-mono font-bold text-[10px]">
                                เกินงบ +{formatCurrency(m.overrunAmount)} (+{m.overrunPct.toFixed(1)}%)
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 font-mono font-bold text-[10px]">
                                อยู่ในงบ (เหลือ {formatCurrency(m.diff)})
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                          <div 
                            style={{ width: `${pct}%` }}
                            className={`h-full transition-all ${
                              isOver ? 'bg-rose-500' : pct > 85 ? 'bg-amber-500' : 'bg-emerald-500'
                            }`}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>
          )}

          {/* TAB 2: OVERRUN MODULES (BUDGET OVERRUN ALERT) */}
          {activeViewTab === 'OVERRUN_MODULES' && (
            <div className="space-y-4">
              {overrunModules.length === 0 ? (
                <div className="p-12 text-center rounded-3xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 space-y-2">
                  <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
                  <h3 className="text-base font-bold text-emerald-800 dark:text-emerald-200">
                    ยอดเยี่ยม! ไม่มีโมดูลใดใช้งบประมาณเกินเกณฑ์ (All Under Budget)
                  </h3>
                  <p className="text-xs text-slate-500">
                    ทุกโมดูลในเครื่องจักรนี้มีต้นทุนอะไหล่รวมต่ำกว่า Target Budget ที่กำหนดไว้
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 flex items-start space-x-3 text-xs text-rose-800 dark:text-rose-200">
                    <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold">ตรวจพบโมดูลที่ต้นทุนบานปลาย ({overrunModules.length} โมดูล):</span>
                      <p className="mt-0.5 text-rose-700/80 dark:text-rose-300/80">
                        โมดูลเหล่านี้มีค่าอะไหล่/งานสั่งทำเกินกว่างบประมาณที่วิศวกรประเมินไว้ ควรพิจารณาต่อรองราคาซัพพลายเออร์ หรือหาสเปกทดแทน
                      </p>
                    </div>
                  </div>

                  <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden bg-white dark:bg-slate-900">
                    {overrunModules.map((m) => (
                      <div key={m.moduleId} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <span className="px-2 py-0.5 rounded font-mono font-bold text-xs bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300">
                              [{m.moduleCode}]
                            </span>
                            <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                              {m.moduleName}
                            </h4>
                          </div>
                          <p className="text-xs text-slate-400">
                            MC Cost: {formatCurrency(m.mcStandardCost + m.mcFebCost)} | EE Cost: {formatCurrency(m.eeStandardCost + m.eeFebCost)}
                          </p>
                        </div>

                        <div className="flex items-center space-x-4 shrink-0 text-right">
                          <div>
                            <span className="text-[10px] text-slate-400 block uppercase">งบที่ตั้งไว้</span>
                            <span className="font-mono text-xs font-bold text-slate-500">{formatCurrency(m.target)}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 block uppercase">ต้นทุนจริง</span>
                            <span className="font-mono text-sm font-black text-rose-600 dark:text-rose-400">{formatCurrency(m.actual)}</span>
                          </div>
                          <div className="px-3 py-1 rounded-xl bg-rose-500 text-white font-mono text-xs font-bold shadow-sm shadow-rose-500/20">
                            +{formatCurrency(m.overrunAmount)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: COST DRIVERS & OVERRUN CULPRITS */}
          {activeViewTab === 'COST_DRIVERS' && (
            <div className="space-y-6">
              
              {/* 1. Top 5 Most Expensive Parts */}
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center justify-between">
                  <span>5 อันดับชิ้นส่วนที่มีมูลค่าสูงสุดในเครื่อง (Top Cost Drivers)</span>
                  <span className="text-xs text-slate-400 font-normal">คิดเป็นสัดส่วนหลักของต้นทุนรวม</span>
                </h3>

                <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden bg-white dark:bg-slate-900">
                  {topCostParts.map((p, index) => (
                    <div key={p.id} className="p-3.5 flex items-center justify-between gap-3 text-xs">
                      <div className="flex items-center space-x-3 min-w-0">
                        <span className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 font-bold flex items-center justify-center text-slate-600 dark:text-slate-300 text-xs shrink-0">
                          {index + 1}
                        </span>
                        <div className="min-w-0">
                          <p className="font-bold text-slate-900 dark:text-white truncate">
                            {p.partName}
                          </p>
                          <p className="text-[11px] text-slate-400 truncate">
                            {p.typeSpec || p.dwgNo || '-'} • Maker: {p.maker || '-'} ({p.category} / {p.partType})
                          </p>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="font-mono font-black text-sm text-slate-900 dark:text-white block">
                          {formatCurrency(p.totalAmount)}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          จำนวน {p.qty} {p.unit} @ {formatCurrency(p.unitPrice)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 2. Top Overrun Parts (Actual > Target) */}
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center justify-between">
                  <span>ชิ้นส่วนที่ซื้อเกินราคาเป้าหมายสูงสุด (Highest Price Variance)</span>
                  <span className="text-xs text-slate-400 font-normal">เปรียบเทียบ Target Price vs Purchase Price</span>
                </h3>

                {topOverrunParts.length === 0 ? (
                  <div className="p-6 text-center rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 text-slate-400 text-xs">
                    ไม่มีรายการอะไหล่ที่ราคาซื้อจริงสูงกว่าราคาเป้าหมาย
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden bg-white dark:bg-slate-900">
                    {topOverrunParts.map((p) => (
                      <div key={p.id} className="p-3.5 flex items-center justify-between gap-3 text-xs">
                        <div className="min-w-0">
                          <p className="font-bold text-slate-900 dark:text-white truncate">
                            {p.partName}
                          </p>
                          <p className="text-[11px] text-slate-400 truncate">
                            เป้าหมาย: {formatCurrency(p.targetUnitPrice || 0)} ➔ ซื้อจริง: {formatCurrency(p.unitPrice)}
                          </p>
                        </div>

                        <div className="text-right shrink-0">
                          <span className="font-mono font-black text-xs text-rose-600 dark:text-rose-400 block">
                            +{formatCurrency(p.diffOver)}
                          </span>
                          <span className="text-[10px] text-rose-500 font-bold">
                            (+{p.diffPct.toFixed(1)}%)
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          )}

          {/* TAB 4: INTERACTIVE PROFIT SIMULATOR (WHAT-IF) */}
          {activeViewTab === 'SIMULATOR' && (
            <div className="space-y-6">
              <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-50/80 via-blue-50/40 to-white dark:from-indigo-950/20 dark:via-blue-950/10 dark:to-slate-900 border border-indigo-100 dark:border-indigo-900/40 space-y-4">
                <div className="flex items-center space-x-2">
                  <Sliders className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    เครื่องมือจำลองต้นทุนและความผันผวนของราคา (What-If Profit Simulator)
                  </h3>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  ทดลองปรับปัจจัยราคาชิ้นส่วนสั่งกลึง (Fabrication) หรือส่วนลดชิ้นส่วนมาตรฐาน (Standard Parts) เพื่อดูผลกระทบต่อกำไรสุทธิแบบ Real-time
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
                  {/* Slider 1: Fabrication Cost Fluctuation */}
                  <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="text-slate-700 dark:text-slate-300">ความผันผวนค่าสั่งกลึง/เชื่อม (Feb Parts)</span>
                      <span className={`font-mono text-sm ${
                        febCostAdjustmentPct > 0 ? 'text-rose-600' : febCostAdjustmentPct < 0 ? 'text-emerald-600' : 'text-slate-500'
                      }`}>
                        {febCostAdjustmentPct > 0 ? `+${febCostAdjustmentPct}%` : `${febCostAdjustmentPct}%`}
                      </span>
                    </div>
                    <input 
                      type="range"
                      min="-20"
                      max="30"
                      step="5"
                      value={febCostAdjustmentPct}
                      onChange={(e) => setFebCostAdjustmentPct(Number(e.target.value))}
                      className="w-full accent-indigo-600 cursor-pointer"
                    />
                    <div className="flex justify-between text-[10px] text-slate-400">
                      <span>-20% (ต่อรองลดได้)</span>
                      <span>0% (ราคาเดิม)</span>
                      <span>+30% (ร้านกลึงขึ้นราคา)</span>
                    </div>
                  </div>

                  {/* Slider 2: Standard Part Discount / Surcharge */}
                  <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="text-slate-700 dark:text-slate-300">ส่วนลด/เพิ่มราคาชิ้นส่วนมาตรฐาน (Standard Parts)</span>
                      <span className={`font-mono text-sm ${
                        stdCostAdjustmentPct > 0 ? 'text-rose-600' : stdCostAdjustmentPct < 0 ? 'text-emerald-600' : 'text-slate-500'
                      }`}>
                        {stdCostAdjustmentPct > 0 ? `+${stdCostAdjustmentPct}%` : `${stdCostAdjustmentPct}%`}
                      </span>
                    </div>
                    <input 
                      type="range"
                      min="-20"
                      max="20"
                      step="2.5"
                      value={stdCostAdjustmentPct}
                      onChange={(e) => setStdCostAdjustmentPct(Number(e.target.value))}
                      className="w-full accent-blue-600 cursor-pointer"
                    />
                    <div className="flex justify-between text-[10px] text-slate-400">
                      <span>-20% (Volume Discount)</span>
                      <span>0% (ราคาตั้งต้น)</span>
                      <span>+20% (ด่วน/Lead-time Surcharge)</span>
                    </div>
                  </div>
                </div>

                {/* Reset button */}
                {(febCostAdjustmentPct !== 0 || stdCostAdjustmentPct !== 0) && (
                  <div className="text-right">
                    <button
                      onClick={() => {
                        setFebCostAdjustmentPct(0);
                        setStdCostAdjustmentPct(0);
                      }}
                      className="text-xs text-indigo-600 dark:text-indigo-400 font-bold hover:underline"
                    >
                      ↺ รีเซ็ตค่าจำลองทั้งหมดเป็นค่าจริง
                    </button>
                  </div>
                )}
              </div>

              {/* Simulation Result Card */}
              <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  ผลการจำลองกำไรสุทธิ (Simulation Outcome)
                </h4>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[11px]">ต้นทุนหลังจำลอง</span>
                    <span className="text-base font-black font-mono text-slate-900 dark:text-white">
                      {formatCurrency(simulatedTotalCost)}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">ส่วนต่างจากเดิม</span>
                    <span className={`text-base font-black font-mono ${
                      simulatedTotalCost > baseTotalCost ? 'text-rose-600' : simulatedTotalCost < baseTotalCost ? 'text-emerald-600' : 'text-slate-500'
                    }`}>
                      {simulatedTotalCost - baseTotalCost >= 0 ? '+' : ''}{formatCurrency(simulatedTotalCost - baseTotalCost)}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">กำไรจำลอง</span>
                    <span className="text-base font-black font-mono text-emerald-600 dark:text-emerald-400">
                      {formatCurrency(projectedGrossProfit)}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Gross Margin</span>
                    <span className="text-base font-black font-mono text-indigo-600 dark:text-indigo-400">
                      {projectedMarginPct.toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>

            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80 flex items-center justify-between">
          <div className="flex items-center space-x-2 text-xs text-slate-500">
            <Percent className="w-4 h-4 text-emerald-500" />
            <span>Target Gross Margin: <strong>&gt;= 35.0%</strong></span>
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
