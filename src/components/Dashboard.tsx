import React from 'react';
import { 
  DollarSign, 
  Wrench, 
  Zap, 
  Settings, 
  TrendingUp, 
  TrendingDown, 
  BarChart3,
  Layers,
  ArrowRight,
  User,
  PieChart as PieIcon
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  Legend 
} from 'recharts';
import { ModuleItem, ProjectCostSummary } from '../types/bom';
import { formatCurrency } from '../utils/costCalculator';

interface DashboardProps {
  summary: ProjectCostSummary;
  modules: ModuleItem[];
  onSelectModuleTab: () => void;
  onSelectBomTab: () => void;
  isDarkMode?: boolean;
}

const CATEGORY_COLORS = {
  MC: '#3b82f6', // Clean Tech Blue for MC
  EE: '#d97706', // Tech Amber Gold for EE
};

export const Dashboard: React.FC<DashboardProps> = ({
  summary,
  modules,
  onSelectModuleTab,
  onSelectBomTab,
  isDarkMode = false
}) => {
  const {
    totalProjectCost,
    totalTargetBudget,
    totalMcCost,
    totalEeCost,
    totalStandardCost,
    totalFebCost,
    mcItemsCount,
    eeItemsCount,
    standardItemsCount,
    febItemsCount,
    moduleSummaries,
  } = summary;

  const budgetDifference = totalTargetBudget - totalProjectCost;
  const isUnderBudget = budgetDifference >= 0;

  // Chart data preparation
  const categoryPieData = [
    { name: 'Mechanical (MC)', value: totalMcCost, count: mcItemsCount, color: CATEGORY_COLORS.MC },
    { name: 'Electrical (EE)', value: totalEeCost, count: eeItemsCount, color: CATEGORY_COLORS.EE },
  ];

  const moduleBarData = moduleSummaries.map(m => ({
    name: m.moduleCode,
    fullName: m.moduleName,
    ActualCost: m.totalModuleCost,
    Budget: m.targetBudget,
    MC: m.totalMcCost,
    EE: m.totalEeCost,
  }));

  return (
    <div className="space-y-4">
      
      {/* KPI Cards Grid - Neutral & Professional Number Colors */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        
        {/* Card 1: Total Project Cost */}
        <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm hover:shadow-md transition-all group">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              TOTAL PROJECT COST
            </span>
            <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-1.5">
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              {formatCurrency(totalProjectCost)}
            </h2>
            <div className="flex items-center justify-between mt-1 text-[11px] border-t border-slate-100 dark:border-slate-800 pt-1">
              {isUnderBudget ? (
                <span className="text-emerald-700 dark:text-emerald-400 font-extrabold flex items-center">
                  <TrendingDown className="w-3 h-3 mr-0.5" />
                  ต่ำกว่างบ {formatCurrency(budgetDifference)}
                </span>
              ) : (
                <span className="text-rose-700 dark:text-rose-400 font-extrabold flex items-center">
                  <TrendingUp className="w-3 h-3 mr-0.5" />
                  เกินงบ {formatCurrency(Math.abs(budgetDifference))}
                </span>
              )}
              <span className="text-slate-500 font-bold">Target: {formatCurrency(totalTargetBudget)}</span>
            </div>
          </div>
        </div>

        {/* Card 2: Mechanical Cost (MC) */}
        <div className="p-3.5 rounded-xl border border-blue-200 dark:border-blue-950/80 bg-blue-50/50 dark:bg-slate-900/80 shadow-sm hover:shadow-md transition-all group">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black text-blue-900 dark:text-blue-300 uppercase tracking-wider">
              1. MECHANICAL PART (MC)
            </span>
            <div className="p-2 rounded-lg bg-blue-200 dark:bg-blue-500/20 text-blue-800 dark:text-blue-400">
              <Wrench className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-1.5">
            <h2 className="text-xl sm:text-2xl font-black text-blue-950 dark:text-blue-300 tracking-tight">
              {formatCurrency(totalMcCost)}
            </h2>
            <div className="flex items-center justify-between mt-1 text-[11px] text-slate-700 dark:text-slate-300 font-bold border-t border-blue-200 dark:border-slate-800 pt-1">
              <span>{mcItemsCount} รายการ</span>
              <span className="text-blue-800 dark:text-blue-400 font-black">
                {totalProjectCost > 0 ? ((totalMcCost / totalProjectCost) * 100).toFixed(1) : 0}% of Total
              </span>
            </div>
          </div>
        </div>

        {/* Card 3: Electrical Cost (EE) */}
        <div className="p-3.5 rounded-xl border border-amber-300 dark:border-amber-950/80 bg-amber-50/70 dark:bg-slate-900/80 shadow-sm hover:shadow-md transition-all group">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black text-amber-900 dark:text-amber-300 uppercase tracking-wider">
              2. ELECTRICAL PART (EE)
            </span>
            <div className="p-2 rounded-lg bg-amber-200 dark:bg-amber-500/20 text-amber-800 dark:text-amber-400">
              <Zap className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-1.5">
            <h2 className="text-xl sm:text-2xl font-black text-amber-950 dark:text-amber-300 tracking-tight">
              {formatCurrency(totalEeCost)}
            </h2>
            <div className="flex items-center justify-between mt-1 text-[11px] text-slate-700 dark:text-slate-300 font-bold border-t border-amber-200 dark:border-slate-800 pt-1">
              <span>{eeItemsCount} รายการ</span>
              <span className="text-amber-800 dark:text-amber-400 font-black">
                {totalProjectCost > 0 ? ((totalEeCost / totalProjectCost) * 100).toFixed(1) : 0}% of Total
              </span>
            </div>
          </div>
        </div>

        {/* Card 4: Standard vs Feb breakdown */}
        <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm hover:shadow-md transition-all group">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              STANDARD VS FABRICATED (FEB)
            </span>
            <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200">
              <Settings className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-1 space-y-1">
            <div className="flex justify-between text-[11px]">
              <span className="text-blue-800 dark:text-blue-400 font-extrabold">Std Parts ({standardItemsCount})</span>
              <span className="text-slate-900 dark:text-slate-100 font-black">{formatCurrency(totalStandardCost)}</span>
            </div>
            <div className="flex justify-between text-[11px]">
              <span className="text-rose-800 dark:text-rose-400 font-extrabold">Feb Parts ({febItemsCount})</span>
              <span className="text-slate-900 dark:text-slate-100 font-black">{formatCurrency(totalFebCost)}</span>
            </div>
            <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden flex mt-1">
              <div 
                className="bg-blue-600 h-full" 
                style={{ width: `${totalProjectCost > 0 ? (totalStandardCost / totalProjectCost) * 100 : 0}%` }}
              ></div>
              <div 
                className="bg-red-600 h-full" 
                style={{ width: `${totalProjectCost > 0 ? (totalFebCost / totalProjectCost) * 100 : 0}%` }}
              ></div>
            </div>
          </div>
        </div>

      </div>

      {/* Recharts Analytics Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        
        {/* Module Cost Comparison Bar Chart */}
        <div className="lg:col-span-2 p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-1.5">
              <BarChart3 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <h3 className="text-xs font-black text-slate-900 dark:text-white">
                เปรียบเทียบ Cost แยกตาม Module (Budget vs Actual)
              </h3>
            </div>
            <span className="text-[11px] font-bold text-slate-500">{moduleSummaries.length} Modules</span>
          </div>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={moduleBarData} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? "#1e293b" : "#e2e8f0"} />
                <XAxis dataKey="name" stroke={isDarkMode ? "#cbd5e1" : "#334155"} fontSize={11} tickLine={false} fontWeight="bold" />
                <YAxis stroke={isDarkMode ? "#cbd5e1" : "#334155"} fontSize={11} tickFormatter={(v) => `฿${v / 1000}k`} fontWeight="bold" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: isDarkMode ? '#0f172a' : '#ffffff', 
                    borderColor: isDarkMode ? '#334155' : '#94a3b8', 
                    borderRadius: '8px', 
                    color: isDarkMode ? '#fff' : '#0f172a',
                    fontWeight: 'bold',
                    fontSize: '11px'
                  }}
                  formatter={(value: any) => [formatCurrency(Number(value)), '']}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '4px', fontWeight: 'bold' }} />
                <Bar dataKey="ActualCost" name="Actual Cost (฿)" fill="#2563eb" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Budget" name="Target Budget (฿)" fill="#64748b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Breakdown (MC vs EE) */}
        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center space-x-1.5 mb-2">
              <PieIcon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <h3 className="text-xs font-black text-slate-900 dark:text-white">
                สัดส่วน MC (Mechanical) vs EE (Electrical)
              </h3>
            </div>

            <div className="h-44 w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={65}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {categoryPieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: isDarkMode ? '#0f172a' : '#ffffff', 
                      borderColor: isDarkMode ? '#334155' : '#94a3b8', 
                      borderRadius: '8px',
                      fontSize: '11px',
                      fontWeight: 'bold'
                    }}
                    formatter={(value: any) => [formatCurrency(Number(value)), 'Cost']}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="space-y-1 border-t border-slate-100 dark:border-slate-800 pt-2 text-[11px]">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
                <span className="text-slate-800 dark:text-slate-200 font-bold">Mechanical (MC)</span>
              </div>
              <span className="text-slate-900 dark:text-white font-black">{formatCurrency(totalMcCost)}</span>
            </div>
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-600"></span>
                <span className="text-slate-800 dark:text-slate-200 font-bold">Electrical (EE)</span>
              </div>
              <span className="text-slate-900 dark:text-white font-black">{formatCurrency(totalEeCost)}</span>
            </div>
          </div>
        </div>

      </div>

      {/* สรุป Cost ราย Module (Module Breakdowns) - Executive Data Table */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm space-y-3">
        
        {/* Table Header Bar */}
        <div className="p-3 bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Layers className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <h3 className="text-sm font-black text-slate-900 dark:text-white">
              สรุป Cost ราย Module (Module Breakdowns Data Table)
            </h3>
          </div>
          <button
            onClick={onSelectModuleTab}
            className="text-xs font-black text-blue-600 dark:text-blue-400 hover:text-blue-700 flex items-center"
          >
            ดูความสัมพันธ์ MC & EE เชิงลึก
            <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </button>
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-black border-b border-slate-200 dark:border-slate-800">
                <th className="p-3">MODULE CODE & NAME</th>
                <th className="p-3">ENGINEER & DWG</th>
                <th className="p-3 text-right">MC COST (กลไก)</th>
                <th className="p-3 text-right">EE COST (ไฟฟ้า)</th>
                <th className="p-3 text-right">TOTAL COST</th>
                <th className="p-3 text-right">TARGET BUDGET</th>
                <th className="p-3 text-center">PROGRESS (% USED)</th>
                <th className="p-3 text-center">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {moduleSummaries.map((mod) => {
                const modItem = modules.find(m => m.id === mod.moduleId);
                const pctUsed = mod.targetBudget > 0 ? (mod.totalModuleCost / mod.targetBudget) * 100 : 0;
                const isOver = pctUsed > 100;

                return (
                  <tr key={mod.moduleId} className="hover:bg-slate-50 dark:hover:bg-slate-900/60 transition-colors">
                    
                    {/* Module Code & Name */}
                    <td className="p-3">
                      <div className="flex items-center space-x-1.5 mb-0.5">
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-black bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700">
                          {mod.moduleCode}
                        </span>
                        {modItem?.moduleType && (
                          <span className={`px-1.5 py-0.2 rounded text-[9px] font-black ${
                            modItem.moduleType === 'MC_ONLY' 
                              ? 'bg-blue-100 text-blue-800' 
                              : modItem.moduleType === 'EE_ONLY' 
                              ? 'bg-amber-100 text-amber-800' 
                              : 'bg-slate-100 text-slate-700'
                          }`}>
                            {modItem.moduleType === 'MC_ONLY' ? 'เฉพาะ MC' : modItem.moduleType === 'EE_ONLY' ? 'เฉพาะ EE' : 'MC & EE'}
                          </span>
                        )}
                      </div>
                      <div className="font-extrabold text-slate-900 dark:text-white text-xs">{mod.moduleName}</div>
                    </td>

                    {/* Engineer & DWG */}
                    <td className="p-3 text-slate-700 dark:text-slate-300">
                      <div className="flex items-center font-bold text-xs">
                        <User className="w-3 h-3 mr-1 text-slate-400" />
                        {modItem?.responsibleEngineer || 'Jeerawat'}
                      </div>
                      <div className="text-[10px] font-mono text-slate-500 font-bold">
                        DWG: {modItem?.dwgNo || '-'}
                      </div>
                    </td>

                    {/* MC Cost */}
                    <td className="p-3 text-right">
                      <div className="font-mono font-black text-blue-700 dark:text-blue-400 text-xs">
                        {formatCurrency(mod.totalMcCost)}
                      </div>
                      <div className="text-[10px] font-bold text-slate-500">
                        {mod.mcItemCount} Parts
                      </div>
                    </td>

                    {/* EE Cost */}
                    <td className="p-3 text-right">
                      <div className="font-mono font-black text-amber-700 dark:text-amber-400 text-xs">
                        {formatCurrency(mod.totalEeCost)}
                      </div>
                      <div className="text-[10px] font-bold text-slate-500">
                        {mod.eeItemCount} Parts
                      </div>
                    </td>

                    {/* Total Module Cost */}
                    <td className="p-3 text-right font-mono font-black text-slate-900 dark:text-white text-sm bg-slate-50/50 dark:bg-slate-950/50">
                      {formatCurrency(mod.totalModuleCost)}
                    </td>

                    {/* Target Budget */}
                    <td className="p-3 text-right font-mono font-bold text-slate-600 dark:text-slate-400 text-xs">
                      {formatCurrency(mod.targetBudget)}
                    </td>

                    {/* Budget Utilization Progress Bar */}
                    <td className="p-3 text-center w-36">
                      <div className="space-y-1">
                        <div className="flex justify-between items-center text-[10px] font-black">
                          <span className={isOver ? 'text-rose-600' : 'text-emerald-700 dark:text-emerald-400'}>
                            {pctUsed.toFixed(1)}%
                          </span>
                          <span className="text-slate-500 font-normal">
                            {isOver ? 'เกินงบ' : 'ปกติ'}
                          </span>
                        </div>
                        <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                          <div 
                            className={`h-full transition-all ${
                              isOver ? 'bg-rose-600' : pctUsed > 80 ? 'bg-amber-500' : 'bg-blue-600'
                            }`}
                            style={{ width: `${Math.min(pctUsed, 100)}%` }}
                          ></div>
                        </div>
                      </div>
                    </td>

                    {/* Action */}
                    <td className="p-3 text-center">
                      <button
                        onClick={onSelectModuleTab}
                        className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-950/40 text-blue-700 dark:text-blue-400 rounded-lg font-black text-[11px] transition-all border border-slate-200 dark:border-slate-700 inline-flex items-center"
                      >
                        ดูรายละเอียด
                        <ArrowRight className="w-3 h-3 ml-1" />
                      </button>
                    </td>

                  </tr>
                );
              })}
            </tbody>
            {/* Summary Footer */}
            <tfoot className="bg-slate-100 dark:bg-slate-950 font-black text-xs border-t-2 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white">
              <tr>
                <td colSpan={2} className="p-3 text-right uppercase tracking-wider">PROJECT GRAND TOTAL:</td>
                <td className="p-3 text-right font-mono text-blue-700 dark:text-blue-400">{formatCurrency(totalMcCost)}</td>
                <td className="p-3 text-right font-mono text-amber-700 dark:text-amber-400">{formatCurrency(totalEeCost)}</td>
                <td className="p-3 text-right font-mono text-slate-900 dark:text-white text-sm bg-slate-200 dark:bg-slate-800">{formatCurrency(totalProjectCost)}</td>
                <td className="p-3 text-right font-mono text-slate-700 dark:text-slate-300">{formatCurrency(totalTargetBudget)}</td>
                <td colSpan={2} className="p-3 text-center">
                  <span className={`px-2 py-0.5 rounded text-[11px] font-black ${
                    isUnderBudget ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-rose-100 text-rose-800'
                  }`}>
                    {isUnderBudget ? 'อยู่ภายใต้งบประมาณ' : 'เกินงบประมาณประเมิน'}
                  </span>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

      </div>

    </div>
  );
};
