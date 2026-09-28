import React, { useState, useMemo } from 'react';
import { 
  Calculator, 
  Printer, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  CheckCircle2, 
  BarChart3, 
  Table as TableIcon,
  Layers,
  Sparkles,
  PieChart as PieIcon,
  ShieldCheck,
  Building2,
  DollarSign
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Legend,
  Cell,
  PieChart,
  Pie
} from 'recharts';
import { ModuleItem, ProjectCostSummary, ProjectItem, BomPartItem } from '../types/bom';
import { formatCurrency } from '../utils/costCalculator';

interface CostSummaryReportProps {
  summary: ProjectCostSummary;
  modules: ModuleItem[];
  project?: ProjectItem;
  parts?: BomPartItem[];
}

export const CostSummaryReport: React.FC<CostSummaryReportProps> = ({
  summary,
  modules,
  project,
  parts = []
}) => {
  const [viewMode, setViewMode] = useState<'ANALYTICS' | 'MATRIX'>('ANALYTICS');

  const {
    totalProjectCost,
    totalTargetBudget,
    totalMcCost,
    totalEeCost,
    totalStandardCost,
    totalFebCost,
    moduleSummaries,
  } = summary;

  // Variance calculations
  const variance = totalTargetBudget - totalProjectCost;
  const isWithinBudget = variance >= 0;
  const budgetConsumedPct = totalTargetBudget > 0 ? (totalProjectCost / totalTargetBudget) * 100 : 0;

  // Identify modules with cost overrun
  const overrunModules = useMemo(() => {
    return moduleSummaries.filter(m => m.targetBudget > 0 && m.totalModuleCost > m.targetBudget);
  }, [moduleSummaries]);

  // Chart data: Module Target Budget vs Actual Cost
  const chartData = useMemo(() => {
    return moduleSummaries.map(m => ({
      name: m.moduleCode,
      fullName: m.moduleName,
      targetBudget: m.targetBudget || 0,
      actualCost: m.totalModuleCost || 0,
      diff: (m.totalModuleCost || 0) - (m.targetBudget || 0),
      isOverrun: (m.totalModuleCost || 0) > (m.targetBudget || 0) && (m.targetBudget || 0) > 0
    }));
  }, [moduleSummaries]);

  // Category breakdown data
  const categorySplitData = [
    { name: '1. MC Standard', value: summary.moduleSummaries.reduce((acc, m) => acc + m.mcStandardCost, 0), color: '#2563eb' },
    { name: '2. MC Feb (สั่งกลึง/ขึ้นรูป)', value: summary.moduleSummaries.reduce((acc, m) => acc + m.mcFebCost, 0), color: '#38bdf8' },
    { name: '3. EE Standard', value: summary.moduleSummaries.reduce((acc, m) => acc + m.eeStandardCost, 0), color: '#d97706' },
    { name: '4. EE Feb (ประกอบตู้/สายไฟ)', value: summary.moduleSummaries.reduce((acc, m) => acc + m.eeFebCost, 0), color: '#fbbf24' },
  ].filter(d => d.value > 0);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-4 print:space-y-2">
      
      {/* Action Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm print:hidden">
        <div className="flex items-center space-x-2">
          <div className="p-1.5 rounded-lg bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400">
            <Calculator className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-black text-slate-900 dark:text-white flex items-center">
              รายงานวิเคราะห์งบประมาณ & ต้นทุนเครื่องจักร (Cost & Variance Analytics)
              {project && <span className="ml-2 font-mono text-red-600 dark:text-red-400">[{project.code}]</span>}
            </h3>
            <p className="text-[10px] text-slate-500">เปรียบเทียบ Target Budget กับ Actual Cost แบบ Real-time</p>
          </div>
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
          {/* Segmented View Mode */}
          <div className="flex bg-slate-100 dark:bg-slate-800 p-0.5 rounded-xl border border-slate-200 dark:border-slate-700/60 text-xs font-bold">
            <button
              onClick={() => setViewMode('ANALYTICS')}
              className={`px-3 py-1 rounded-lg transition-all flex items-center ${
                viewMode === 'ANALYTICS'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm font-extrabold'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5 mr-1 text-red-500" />
              วิเคราะห์ Variance & กราฟ
            </button>
            <button
              onClick={() => setViewMode('MATRIX')}
              className={`px-3 py-1 rounded-lg transition-all flex items-center ${
                viewMode === 'MATRIX'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm font-extrabold'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <TableIcon className="w-3.5 h-3.5 mr-1 text-blue-500" />
              ตาราง Cost Matrix
            </button>
          </div>

          <button
            onClick={handlePrint}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-black transition-all shadow-sm flex items-center"
          >
            <Printer className="w-3.5 h-3.5 mr-1" />
            พิมพ์ / PDF
          </button>
        </div>
      </div>

      {/* Variance KPI Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 print:grid-cols-4">
        {/* Target Budget */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3.5 rounded-xl shadow-sm">
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 uppercase">
            <span>งบประมาณตั้งต้น (Target)</span>
            <DollarSign className="w-4 h-4 text-blue-500" />
          </div>
          <div className="mt-1 text-xl font-black text-slate-900 dark:text-white font-mono">
            {formatCurrency(totalTargetBudget)}
          </div>
          <div className="mt-1 text-[10px] text-slate-400">
            รวมจาก {moduleSummaries.length} Modules
          </div>
        </div>

        {/* Actual BOM Cost */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3.5 rounded-xl shadow-sm">
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 uppercase">
            <span>ต้นทุนจริง BOM (Actual)</span>
            <Calculator className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="mt-1 text-xl font-black text-indigo-600 dark:text-indigo-400 font-mono">
            {formatCurrency(totalProjectCost)}
          </div>
          <div className="mt-1 text-[10px] font-bold text-slate-500">
            MC: {formatCurrency(totalMcCost)} | EE: {formatCurrency(totalEeCost)}
          </div>
        </div>

        {/* Variance Difference */}
        <div className={`border p-3.5 rounded-xl shadow-sm ${
          isWithinBudget 
            ? 'bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/60' 
            : 'bg-rose-50/60 dark:bg-rose-950/20 border-rose-200 dark:border-rose-800/60'
        }`}>
          <div className="flex items-center justify-between text-[11px] font-bold uppercase">
            <span className={isWithinBudget ? 'text-emerald-700 dark:text-emerald-300' : 'text-rose-700 dark:text-rose-300'}>
              {isWithinBudget ? 'ส่วนต่างคงเหลือ (Savings)' : 'งบประมาณบานปลาย (Overrun)'}
            </span>
            {isWithinBudget ? (
              <TrendingDown className="w-4 h-4 text-emerald-600" />
            ) : (
              <TrendingUp className="w-4 h-4 text-rose-600" />
            )}
          </div>
          <div className={`mt-1 text-xl font-black font-mono ${
            isWithinBudget ? 'text-emerald-700 dark:text-emerald-300' : 'text-rose-700 dark:text-rose-300'
          }`}>
            {isWithinBudget ? '+' : ''}{formatCurrency(variance)}
          </div>
          <div className="mt-1 text-[10px] font-bold">
            {isWithinBudget ? (
              <span className="text-emerald-600 dark:text-emerald-400">✓ คุมต้นทุนได้ตามเป้าหมาย</span>
            ) : (
              <span className="text-rose-600 dark:text-rose-400">⚠️ เกินเป้าหมายที่ตั้งไว้</span>
            )}
          </div>
        </div>

        {/* Budget Utilization Rate */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3.5 rounded-xl shadow-sm">
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 uppercase">
            <span>อัตราใช้งบ (Consumption)</span>
            <ShieldCheck className="w-4 h-4 text-amber-500" />
          </div>
          <div className="mt-1 flex items-baseline space-x-2">
            <span className={`text-xl font-black font-mono ${
              budgetConsumedPct > 100 ? 'text-rose-600' : budgetConsumedPct > 85 ? 'text-amber-500' : 'text-emerald-600'
            }`}>
              {budgetConsumedPct.toFixed(1)}%
            </span>
            <span className="text-xs text-slate-400 font-bold">ของงบรวม</span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all duration-500 ${
                budgetConsumedPct > 100 ? 'bg-rose-500' : budgetConsumedPct > 85 ? 'bg-amber-500' : 'bg-emerald-500'
              }`}
              style={{ width: `${Math.min(100, budgetConsumedPct)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Cost Overrun Warning Banner (if any) */}
      {overrunModules.length > 0 && (
        <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0" />
            <div>
              <span className="font-black text-rose-800 dark:text-rose-200">
                ตรวจพบ {overrunModules.length} Module ที่ต้นทุนอะไหล่เกิน Target Budget:
              </span>
              <div className="flex flex-wrap gap-2 mt-1">
                {overrunModules.map(m => (
                  <span key={m.moduleId} className="px-2 py-0.5 rounded-lg bg-rose-100 dark:bg-rose-900/60 text-rose-800 dark:text-rose-200 font-mono text-[11px] font-bold">
                    {m.moduleCode}: +{formatCurrency(m.totalModuleCost - m.targetBudget)} ฿
                  </span>
                ))}
              </div>
            </div>
          </div>
          <span className="text-[11px] text-rose-600 dark:text-rose-400 font-bold underline cursor-pointer" onClick={() => setViewMode('MATRIX')}>
            ดูรายละเอียดในตาราง Matrix &rarr;
          </span>
        </div>
      )}

      {/* ANALYTICS VIEW */}
      {viewMode === 'ANALYTICS' && (
        <div className="space-y-4">
          
          {/* Main Visual Comparison Bar Chart */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h4 className="text-xs font-black text-slate-900 dark:text-white flex items-center">
                  <BarChart3 className="w-4 h-4 mr-2 text-indigo-500" />
                  เปรียบเทียบ Target Budget vs Actual Cost แยกตามแต่ละ Module (฿)
                </h4>
                <p className="text-[11px] text-slate-500">แท่งสีน้ำเงินคืองบเป้าหมาย, แท่งสีม่วงคือต้นทุนชิ้นส่วนจริงใน BOM</p>
              </div>
            </div>

            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                  <XAxis 
                    dataKey="name" 
                    tick={{ fontSize: 11, fontWeight: 'bold' }} 
                    interval={0}
                  />
                  <YAxis 
                    tickFormatter={(val) => `${(val / 1000).toFixed(0)}k`} 
                    tick={{ fontSize: 10 }}
                  />
                  <Tooltip 
                    formatter={(value: any, name: string) => [
                      formatCurrency(Number(value)) + ' ฿',
                      name === 'targetBudget' ? 'Target Budget' : 'Actual Cost'
                    ]}
                    labelFormatter={(label) => {
                      const item = chartData.find(c => c.name === label);
                      return `${label} - ${item?.fullName || ''}`;
                    }}
                    contentStyle={{ 
                      backgroundColor: 'rgba(15, 23, 42, 0.95)', 
                      borderRadius: '12px', 
                      border: '1px solid rgba(255,255,255,0.1)',
                      color: '#fff',
                      fontSize: '11px',
                      fontWeight: 'bold'
                    }}
                  />
                  <Legend 
                    wrapperStyle={{ fontSize: '11px', fontWeight: 'bold', paddingTop: '10px' }}
                    formatter={(value) => value === 'targetBudget' ? 'Target Budget (เป้าหมาย)' : 'Actual Cost (เกิดขึ้นจริง)'}
                  />
                  <Bar dataKey="targetBudget" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={36} />
                  <Bar dataKey="actualCost" fill="#8b5cf6" radius={[4, 4, 0, 0]} maxBarSize={36}>
                    {chartData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={entry.isOverrun ? '#f43f5e' : '#8b5cf6'} 
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Sub Row: Category Split + Fabrication vs Standard */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Fabrication vs Standard Parts */}
            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
              <h4 className="text-xs font-black text-slate-900 dark:text-white flex items-center">
                <Layers className="w-4 h-4 mr-2 text-indigo-500" />
                สัดส่วนงานสั่งทำ (Fab Parts) vs งานซื้อสำเร็จรูป (Standard)
              </h4>
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="p-3 bg-sky-50 dark:bg-sky-950/30 rounded-xl border border-sky-100 dark:border-sky-900/40">
                  <div className="text-[11px] font-bold text-sky-700 dark:text-sky-300">Standard Parts (อะไหล่มาตรฐาน)</div>
                  <div className="text-lg font-black text-slate-900 dark:text-white font-mono mt-1">
                    {formatCurrency(totalStandardCost)}
                  </div>
                  <div className="text-[10px] text-slate-500 font-bold mt-0.5">
                    {totalProjectCost > 0 ? ((totalStandardCost / totalProjectCost) * 100).toFixed(1) : 0}% ของต้นทุนเครื่อง
                  </div>
                </div>

                <div className="p-3 bg-indigo-50 dark:bg-indigo-950/30 rounded-xl border border-indigo-100 dark:border-indigo-900/40">
                  <div className="text-[11px] font-bold text-indigo-700 dark:text-indigo-300">Fabrication Parts (งานสั่งกลึง/ทำ)</div>
                  <div className="text-lg font-black text-slate-900 dark:text-white font-mono mt-1">
                    {formatCurrency(totalFebCost)}
                  </div>
                  <div className="text-[10px] text-slate-500 font-bold mt-0.5">
                    {totalProjectCost > 0 ? ((totalFebCost / totalProjectCost) * 100).toFixed(1) : 0}% ของต้นทุนเครื่อง
                  </div>
                </div>
              </div>
            </div>

            {/* Category 4-Tier Matrix */}
            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
              <h4 className="text-xs font-black text-slate-900 dark:text-white flex items-center">
                <PieIcon className="w-4 h-4 mr-2 text-amber-500" />
                สัดส่วนโครงสร้างต้นทุน 4 กลุ่มหลัก (BOM Cost Structure)
              </h4>
              <div className="grid grid-cols-2 gap-2 pt-1 text-xs">
                {categorySplitData.map(cat => (
                  <div key={cat.name} className="p-2.5 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                    <div>
                      <div className="text-[11px] font-bold text-slate-600 dark:text-slate-400">{cat.name}</div>
                      <div className="font-mono font-black text-slate-900 dark:text-white mt-0.5">
                        {formatCurrency(cat.value)}
                      </div>
                    </div>
                    <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>
      )}

      {/* MATRIX VIEW (PRINTABLE & DETAILED) */}
      {(viewMode === 'MATRIX' || true) && (
        <div className={`p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm ${
          viewMode !== 'MATRIX' ? 'hidden print:block' : ''
        }`}>
          
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs font-black text-slate-900 dark:text-white flex items-center">
              <TableIcon className="w-4 h-4 mr-2 text-blue-500" />
              ตารางสรุปงบประมาณแยกตาม Module (Cost Matrix Breakdown)
            </h4>
            <span className="text-[11px] text-slate-500 font-mono">หน่วย: บาท (THB)</span>
          </div>

          {/* Matrix Data Table */}
          <div className="overflow-x-auto max-h-[calc(100vh-320px)] overflow-y-auto custom-scrollbar">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="divide-x divide-slate-200 dark:divide-slate-700 bg-slate-50 dark:bg-slate-900/80 border-b-2 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-black">
                  <th className="px-3 py-3 whitespace-nowrap min-w-[120px]">CODE</th>
                  <th className="px-3 py-3 min-w-[200px]">MODULE NAME</th>
                  <th className="px-3 py-3 text-right font-mono whitespace-nowrap min-w-[130px]">TARGET BUDGET (฿)</th>
                  <th className="px-3 py-3 text-right text-blue-700 dark:text-blue-400 whitespace-nowrap min-w-[110px]">1. MC STANDARD</th>
                  <th className="px-3 py-3 text-right text-blue-700 dark:text-blue-400 whitespace-nowrap min-w-[110px]">2. MC FEB</th>
                  <th className="px-3 py-3 text-right bg-blue-50/60 dark:bg-blue-950/30 text-blue-900 dark:text-blue-300 font-black whitespace-nowrap min-w-[110px]">TOTAL MC</th>
                  <th className="px-3 py-3 text-right text-amber-700 dark:text-amber-400 whitespace-nowrap min-w-[110px]">3. EE STANDARD</th>
                  <th className="px-3 py-3 text-right text-amber-700 dark:text-amber-400 whitespace-nowrap min-w-[110px]">4. EE FEB</th>
                  <th className="px-3 py-3 text-right bg-amber-50/60 dark:bg-amber-950/30 text-amber-900 dark:text-amber-300 font-black whitespace-nowrap min-w-[110px]">TOTAL EE</th>
                  <th className="px-3 py-3 text-right font-black bg-slate-200 dark:bg-slate-800 whitespace-nowrap min-w-[120px]">ACTUAL TOTAL (฿)</th>
                  <th className="px-3 py-3 text-right font-black whitespace-nowrap min-w-[110px]">VARIANCE (฿)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {moduleSummaries.map((mod) => {
                  const modVariance = (mod.targetBudget || 0) - mod.totalModuleCost;
                  const isModOverrun = modVariance < 0 && (mod.targetBudget || 0) > 0;

                  return (
                    <tr key={mod.moduleId} className="divide-x divide-slate-100 dark:divide-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="px-3 py-3 font-mono font-bold text-slate-800 dark:text-slate-200">{mod.moduleCode}</td>
                      <td className="px-3 py-3 font-extrabold text-slate-900 dark:text-white">{mod.moduleName}</td>
                      <td className="px-3 py-3 text-right font-mono font-bold text-slate-600 dark:text-slate-400">
                        {formatCurrency(mod.targetBudget)}
                      </td>
                      <td className="px-3 py-3 text-right font-mono text-slate-800 dark:text-slate-200">
                        {formatCurrency(mod.mcStandardCost)}
                      </td>
                      <td className="px-3 py-3 text-right font-mono text-slate-800 dark:text-slate-200">
                        {formatCurrency(mod.mcFebCost)}
                      </td>
                      <td className="px-3 py-3 text-right font-mono font-black text-blue-900 dark:text-blue-300 bg-blue-50/40 dark:bg-blue-950/20">
                        {formatCurrency(mod.totalMcCost)}
                      </td>
                      <td className="px-3 py-3 text-right font-mono text-slate-800 dark:text-slate-200">
                        {formatCurrency(mod.eeStandardCost)}
                      </td>
                      <td className="px-3 py-3 text-right font-mono text-slate-800 dark:text-slate-200">
                        {formatCurrency(mod.eeFebCost)}
                      </td>
                      <td className="px-3 py-3 text-right font-mono font-black text-amber-900 dark:text-amber-300 bg-amber-50/40 dark:bg-amber-950/20">
                        {formatCurrency(mod.totalEeCost)}
                      </td>
                      <td className="px-3 py-3 text-right font-mono font-black text-slate-900 dark:text-white bg-slate-100/60 dark:bg-slate-800/40">
                        {formatCurrency(mod.totalModuleCost)}
                      </td>
                      <td className={`px-3 py-3 text-right font-mono font-black ${
                        isModOverrun ? 'text-rose-600 dark:text-rose-400 bg-rose-50/30' : 'text-emerald-600 dark:text-emerald-400'
                      }`}>
                        {modVariance > 0 ? '+' : ''}{formatCurrency(modVariance)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              {/* Grand Total Row */}
              <tfoot className="bg-slate-900 text-white font-black text-xs border-t-2 border-slate-700">
                <tr className="divide-x divide-slate-700">
                  <td colSpan={2} className="px-3 py-3 text-right uppercase tracking-wider">PROJECT GRAND TOTAL:</td>
                  <td className="px-3 py-3 text-right font-mono">{formatCurrency(totalTargetBudget)}</td>
                  <td className="px-3 py-3 text-right font-mono text-blue-300">
                    {formatCurrency(moduleSummaries.reduce((acc, m) => acc + m.mcStandardCost, 0))}
                  </td>
                  <td className="px-3 py-3 text-right font-mono text-blue-300">
                    {formatCurrency(moduleSummaries.reduce((acc, m) => acc + m.mcFebCost, 0))}
                  </td>
                  <td className="px-3 py-3 text-right font-mono text-blue-400 bg-blue-950/60">
                    {formatCurrency(totalMcCost)}
                  </td>
                  <td className="px-3 py-3 text-right font-mono text-amber-300">
                    {formatCurrency(moduleSummaries.reduce((acc, m) => acc + m.eeStandardCost, 0))}
                  </td>
                  <td className="px-3 py-3 text-right font-mono text-amber-300">
                    {formatCurrency(moduleSummaries.reduce((acc, m) => acc + m.eeFebCost, 0))}
                  </td>
                  <td className="px-3 py-3 text-right font-mono text-amber-400 bg-amber-950/60">
                    {formatCurrency(totalEeCost)}
                  </td>
                  <td className="px-3 py-3 text-right font-mono font-black text-white bg-slate-800">
                    {formatCurrency(totalProjectCost)}
                  </td>
                  <td className={`px-3 py-3 text-right font-mono font-black ${
                    variance >= 0 ? 'text-emerald-400' : 'text-rose-400'
                  }`}>
                    {variance > 0 ? '+' : ''}{formatCurrency(variance)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

        </div>
      )}

    </div>
  );
};
