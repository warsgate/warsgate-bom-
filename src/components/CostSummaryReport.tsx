import React from 'react';
import { 
  Calculator, 
  Printer
} from 'lucide-react';
import { ModuleItem, ProjectCostSummary } from '../types/bom';
import { formatCurrency } from '../utils/costCalculator';

interface CostSummaryReportProps {
  summary: ProjectCostSummary;
  modules: ModuleItem[];
}

export const CostSummaryReport: React.FC<CostSummaryReportProps> = ({
  summary,
}) => {
  const {
    totalProjectCost,
    totalTargetBudget,
    totalMcCost,
    totalEeCost,
    moduleSummaries,
  } = summary;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-4 print:space-y-2">
      
      {/* Action Bar */}
      <div className="flex justify-between items-center bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm print:hidden">
        <div className="flex items-center space-x-2">
          <div className="p-1.5 rounded-lg bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400">
            <Calculator className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-black text-slate-900 dark:text-white">
              สรุปงบประมาณแยก Module & Project (Cost Matrix)
            </h3>
          </div>
        </div>

        <button
          onClick={handlePrint}
          className="px-3 py-1 bg-red-600 hover:bg-red-500 text-white rounded-lg text-xs font-black transition-all shadow-sm flex items-center"
        >
          <Printer className="w-3.5 h-3.5 mr-1" />
          พิมพ์รายงาน / PDF
        </button>
      </div>

      {/* Main Cost Matrix Report Card */}
      <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
        
        {/* Matrix Data Table */}
        <div className="overflow-x-auto max-h-[calc(100vh-280px)] overflow-y-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 font-black">
                <th className="px-3 py-3">CODE</th>
                <th className="px-3 py-3">MODULE NAME</th>
                <th className="px-3 py-3 text-right font-mono">TARGET BUDGET (฿)</th>
                <th className="px-3 py-3 text-right text-blue-700 dark:text-blue-400">1. MC STANDARD</th>
                <th className="px-3 py-3 text-right text-blue-700 dark:text-blue-400">2. MC FEB</th>
                <th className="px-3 py-3 text-right bg-blue-50/60 dark:bg-blue-950/30 text-blue-900 dark:text-blue-300 font-black">TOTAL MC</th>
                <th className="px-3 py-3 text-right text-amber-700 dark:text-amber-400">3. EE STANDARD</th>
                <th className="px-3 py-3 text-right text-amber-700 dark:text-amber-400">4. EE FEB</th>
                <th className="px-3 py-3 text-right bg-amber-50/60 dark:bg-amber-950/30 text-amber-900 dark:text-amber-300 font-black">TOTAL EE</th>
                <th className="px-3 py-3 text-right font-black bg-slate-200 dark:bg-slate-800">GRAND TOTAL (฿)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {moduleSummaries.map((mod) => (
                <tr key={mod.moduleId} className="hover:bg-slate-50 dark:hover:bg-slate-900/60 transition-colors">
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
                </tr>
              ))}
            </tbody>
            {/* Grand Total Row */}
            <tfoot className="bg-slate-900 text-white font-black text-xs border-t-2 border-slate-700">
              <tr>
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
              </tr>
            </tfoot>
          </table>
        </div>

      </div>

    </div>
  );
};
