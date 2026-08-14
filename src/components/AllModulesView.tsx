import React, { useState, useMemo } from 'react';
import { 
  Wrench, 
  Zap, 
  Plus, 
  Edit3, 
  ArrowRight, 
  Search, 
  Sliders, 
  User,
  Table as TableIcon,
  Grid,
  Layers,
  FileText,
  Trash2
} from 'lucide-react';
import { BomPartItem, ModuleItem } from '../types/bom';
import { formatCurrency } from '../utils/costCalculator';

interface AllModulesViewProps {
  modules: ModuleItem[];
  parts: BomPartItem[];
  onSelectModuleForDetail: (moduleId: string) => void;
  onOpenAddModule: () => void;
  onOpenEditModule: (module: ModuleItem) => void;
  onOpenAddPartToModule: (moduleId: string) => void;
  onDeleteModule: (moduleId: string) => void;
}

export const AllModulesView: React.FC<AllModulesViewProps> = ({
  modules,
  parts,
  onSelectModuleForDetail,
  onOpenAddModule,
  onOpenEditModule,
  onOpenAddPartToModule,
  onDeleteModule,
}) => {
  const [filterScope, setFilterScope] = useState<'ALL' | 'MC_ONLY' | 'EE_ONLY' | 'BOTH'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table'); // Default: Table View!

  // Filtered modules logic
  const filteredModules = useMemo(() => {
    return modules.filter(m => {
      const mParts = parts.filter(p => p.moduleId === m.id);
      const mMcCount = mParts.filter(p => p.category === 'MC').length;
      const mEeCount = mParts.filter(p => p.category === 'EE').length;

      if (filterScope === 'MC_ONLY' && m.moduleType !== 'MC_ONLY' && !(mMcCount > 0 && mEeCount === 0)) return false;
      if (filterScope === 'EE_ONLY' && m.moduleType !== 'EE_ONLY' && !(mEeCount > 0 && mMcCount === 0)) return false;
      if (filterScope === 'BOTH' && m.moduleType !== 'BOTH' && !(mMcCount > 0 && mEeCount > 0)) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesCode = m.code.toLowerCase().includes(q);
        const matchesName = m.name.toLowerCase().includes(q);
        const matchesDwg = (m.dwgNo || '').toLowerCase().includes(q);
        const matchesEng = (m.responsibleEngineer || '').toLowerCase().includes(q);
        if (!matchesCode && !matchesName && !matchesDwg && !matchesEng) return false;
      }

      return true;
    });
  }, [modules, parts, filterScope, searchQuery]);

  // Overall totals across filtered modules
  const filteredModuleIds = useMemo(() => new Set(filteredModules.map(m => m.id)), [filteredModules]);
  const filteredParts = useMemo(() => parts.filter(p => filteredModuleIds.has(p.moduleId)), [parts, filteredModuleIds]);

  const grandTotalBudget = filteredModules.reduce((acc, m) => acc + (m.targetBudget || 0), 0);
  const grandTotalMcCost = filteredParts.filter(p => p.category === 'MC').reduce((acc, p) => acc + (p.totalAmount || (p.qty * p.unitPrice)), 0);
  const grandTotalEeCost = filteredParts.filter(p => p.category === 'EE').reduce((acc, p) => acc + (p.totalAmount || (p.qty * p.unitPrice)), 0);
  const grandTotalCost = grandTotalMcCost + grandTotalEeCost;

  return (
    <div className="space-y-4">
      
      {/* Top Banner / Summary Header */}
      <div className="p-4 rounded-xl border border-blue-200 dark:border-blue-900/40 bg-white dark:bg-slate-900 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
        <div>
          <div className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-black bg-blue-100 dark:bg-blue-500/20 text-blue-800 dark:text-blue-300 mb-1">
            WARSGATE All Modules Overview
          </div>
          <h2 className="text-lg font-black text-slate-900 dark:text-white">
            โครงสร้าง Module ทั้งโปรเจกต์ ({modules.length} Modules)
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-bold mt-0.5">
            สรุปข้อมูลตารางโครงสร้าง Module, งบประมาณเป้าหมาย, วิศวกรผู้รับผิดชอบ และชิ้นส่วน MC / EE
          </p>
        </div>

        <div className="flex items-center space-x-2 w-full md:w-auto">
          {/* View Mode Toggle Switch */}
          <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setViewMode('table')}
              className={`px-2.5 py-1 rounded-lg text-xs font-black flex items-center space-x-1 transition-all ${
                viewMode === 'table'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900'
              }`}
              title="มุมมองตาราง Data Table"
            >
              <TableIcon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">ตาราง (Table)</span>
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`px-2.5 py-1 rounded-lg text-xs font-black flex items-center space-x-1 transition-all ${
                viewMode === 'grid'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900'
              }`}
              title="มุมมองการ์ด Grid Cards"
            >
              <Grid className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">การ์ด (Cards)</span>
            </button>
          </div>

          <button
            onClick={onOpenAddModule}
            className="px-3.5 py-1.5 bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-800 text-white rounded-xl text-xs font-black shadow-md transition-all flex items-center whitespace-nowrap"
          >
            <Plus className="w-4 h-4 mr-1" />
            + เพิ่ม Module ใหม่
          </button>
        </div>
      </div>

      {/* Filter Bar & Controls */}
      <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-2 text-xs">
        
        {/* Module Scope Filter */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="font-black text-slate-700 dark:text-slate-300 mr-1">กรองประเภท:</span>
          
          <button
            onClick={() => setFilterScope('ALL')}
            className={`px-3 py-1 rounded-lg font-black transition-all ${
              filterScope === 'ALL'
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            ทั้งหมด ({modules.length})
          </button>

          <button
            onClick={() => setFilterScope('MC_ONLY')}
            className={`px-3 py-1 rounded-lg font-black transition-all flex items-center space-x-1 ${
              filterScope === 'MC_ONLY'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-blue-50 dark:bg-blue-950/40 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
            }`}
          >
            <Wrench className="w-3.5 h-3.5" />
            <span>เฉพาะ MC</span>
          </button>

          <button
            onClick={() => setFilterScope('EE_ONLY')}
            className={`px-3 py-1 rounded-lg font-black transition-all flex items-center space-x-1 ${
              filterScope === 'EE_ONLY'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>เฉพาะ EE</span>
          </button>

          <button
            onClick={() => setFilterScope('BOTH')}
            className={`px-3 py-1 rounded-lg font-black transition-all flex items-center space-x-1 ${
              filterScope === 'BOTH'
                ? 'bg-slate-800 text-white shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>มีทั้ง MC & EE</span>
          </button>
        </div>

        {/* Search Input */}
        <div className="w-full md:w-64 relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ค้นหา Module, Code, DWG..."
            className="w-full pl-8 pr-3 py-1 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-red-500 font-bold"
          />
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
        </div>

      </div>

      {/* Main Content Area: Table View vs Grid Cards View */}
      {viewMode === 'table' ? (
        /* Data Table View */
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm">
          <div className="max-h-[calc(100vh-280px)] overflow-y-auto overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="sticky top-0 z-10 bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-black border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="p-3">CODE & SCOPE</th>
                  <th className="p-3">MODULE NAME & DWG</th>
                  <th className="p-3">ENGINEER</th>
                  <th className="p-3 text-right">MC PARTS (กลไก)</th>
                  <th className="p-3 text-right">EE PARTS (ไฟฟ้า)</th>
                  <th className="p-3 text-right">TOTAL COST</th>
                  <th className="p-3 text-right">TARGET BUDGET</th>
                  <th className="p-3 text-center">PROGRESS (% USED)</th>
                  <th className="p-3 text-center">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {filteredModules.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="p-8 text-center text-slate-400 font-medium">
                      ไม่พบข้อมูล Module ที่ตรงตามเงื่อนไขที่เลือก
                    </td>
                  </tr>
                ) : (
                  filteredModules.map((mod) => {
                    const mParts = parts.filter(p => p.moduleId === mod.id);
                    const mcParts = mParts.filter(p => p.category === 'MC');
                    const eeParts = mParts.filter(p => p.category === 'EE');

                    const mcCost = mcParts.reduce((acc, p) => acc + (p.totalAmount || (p.qty * p.unitPrice)), 0);
                    const eeCost = eeParts.reduce((acc, p) => acc + (p.totalAmount || (p.qty * p.unitPrice)), 0);
                    const totalCost = mcCost + eeCost;
                    const targetBudget = mod.targetBudget || 10000;
                    const pctUsed = targetBudget > 0 ? (totalCost / targetBudget) * 100 : 0;
                    const isOver = pctUsed > 100;

                    return (
                      <tr key={mod.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/60 transition-colors">
                        
                        {/* Module Code & Scope */}
                        <td className="p-3">
                          <div className="flex items-center space-x-1.5">
                            <span className="px-2 py-0.5 rounded text-xs font-mono font-black bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700">
                              {mod.code}
                            </span>
                            {mod.moduleType && (
                              <span className={`px-1.5 py-0.2 rounded text-[9px] font-black ${
                                mod.moduleType === 'MC_ONLY' 
                                  ? 'bg-blue-100 text-blue-800' 
                                  : mod.moduleType === 'EE_ONLY' 
                                  ? 'bg-amber-100 text-amber-800' 
                                  : 'bg-slate-100 text-slate-700'
                              }`}>
                                {mod.moduleType === 'MC_ONLY' ? 'เฉพาะ MC' : mod.moduleType === 'EE_ONLY' ? 'เฉพาะ EE' : 'MC & EE'}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Module Name & DWG */}
                        <td className="p-3">
                          <div className="font-extrabold text-slate-900 dark:text-white text-xs">{mod.name}</div>
                          {mod.dwgNo && (
                            <div className="text-[10px] font-mono text-slate-500 font-bold">
                              DWG: {mod.dwgNo}
                            </div>
                          )}
                        </td>

                        {/* Responsible Engineer */}
                        <td className="p-3 text-slate-700 dark:text-slate-300 font-bold text-xs">
                          <div className="flex items-center">
                            <User className="w-3 h-3 mr-1 text-slate-400" />
                            {mod.responsibleEngineer || 'Jeerawat'}
                          </div>
                        </td>

                        {/* MC Cost & Count */}
                        <td className="p-3 text-right">
                          <div className="font-mono font-black text-blue-700 dark:text-blue-400 text-xs">
                            {formatCurrency(mcCost)}
                          </div>
                          <div className="text-[10px] font-bold text-slate-500">
                            {mcParts.length} Parts
                          </div>
                        </td>

                        {/* EE Cost & Count */}
                        <td className="p-3 text-right">
                          <div className="font-mono font-black text-amber-700 dark:text-amber-400 text-xs">
                            {formatCurrency(eeCost)}
                          </div>
                          <div className="text-[10px] font-bold text-slate-500">
                            {eeParts.length} Parts
                          </div>
                        </td>

                        {/* Total Cost */}
                        <td className="p-3 text-right font-mono font-black text-slate-900 dark:text-white text-sm bg-slate-50/50 dark:bg-slate-950/50">
                          {formatCurrency(totalCost)}
                        </td>

                        {/* Target Budget */}
                        <td className="p-3 text-right font-mono font-bold text-slate-600 dark:text-slate-400 text-xs">
                          {formatCurrency(targetBudget)}
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

                        {/* Actions */}
                        <td className="p-3 text-center">
                          <div className="flex items-center justify-center space-x-1">
                            <button
                              onClick={() => onOpenAddPartToModule(mod.id)}
                              className="px-2 py-0.5 bg-red-50 hover:bg-red-100 text-red-700 dark:text-red-300 rounded text-[10px] font-bold border border-red-200 dark:border-red-800 flex items-center"
                              title="+ Part ใน Module นี้"
                            >
                              <Plus className="w-3 h-3 mr-0.5" /> + Part
                            </button>
                            <button
                              onClick={() => onOpenEditModule(mod)}
                              className="p-1 text-slate-500 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-800 rounded"
                              title="แก้ไข Module"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => onDeleteModule(mod.id)}
                              className="p-1 text-slate-500 hover:text-red-600 dark:hover:text-red-400 bg-slate-100 dark:bg-slate-800 rounded"
                              title="ลบ Module"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => onSelectModuleForDetail(mod.id)}
                              className="p-1 text-blue-600 hover:text-blue-800 bg-blue-50 dark:bg-blue-950 rounded border border-blue-200 dark:border-blue-800"
                              title="ดูรายละเอียด MC & EE"
                            >
                              <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>

                      </tr>
                    );
                  })
                )}
              </tbody>
              {/* Summary Footer */}
              <tfoot className="bg-slate-100 dark:bg-slate-950 font-black text-xs border-t-2 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white">
                <tr>
                  <td colSpan={3} className="p-3 text-right uppercase tracking-wider">TOTAL FILTERED SUMMARY:</td>
                  <td className="p-3 text-right font-mono text-blue-700 dark:text-blue-400">{formatCurrency(grandTotalMcCost)}</td>
                  <td className="p-3 text-right font-mono text-amber-700 dark:text-amber-400">{formatCurrency(grandTotalEeCost)}</td>
                  <td className="p-3 text-right font-mono text-slate-900 dark:text-white text-sm bg-slate-200 dark:bg-slate-800">{formatCurrency(grandTotalCost)}</td>
                  <td className="p-3 text-right font-mono text-slate-700 dark:text-slate-300">{formatCurrency(grandTotalBudget)}</td>
                  <td colSpan={2} className="p-3 text-center">
                    <span className="text-[11px] font-black text-slate-700 dark:text-slate-300">
                      แสดง {filteredModules.length} Modules
                    </span>
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      ) : (
        /* Grid Cards View */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredModules.length === 0 ? (
            <div className="col-span-2 p-12 text-center text-slate-400 bg-white dark:bg-slate-900 border rounded-2xl text-xs font-medium">
              ไม่พบข้อมูล Module ที่ตรงตามเงื่อนไขที่เลือก
            </div>
          ) : (
            filteredModules.map((mod) => {
              const mParts = parts.filter(p => p.moduleId === mod.id);
              const mcParts = mParts.filter(p => p.category === 'MC');
              const eeParts = mParts.filter(p => p.category === 'EE');

              const mcCost = mcParts.reduce((acc, p) => acc + (p.totalAmount || (p.qty * p.unitPrice)), 0);
              const eeCost = eeParts.reduce((acc, p) => acc + (p.totalAmount || (p.qty * p.unitPrice)), 0);
              const totalCost = mcCost + eeCost;
              const targetBudget = mod.targetBudget || 10000;
              const pctUsed = targetBudget > 0 ? (totalCost / targetBudget) * 100 : 0;

              return (
                <div
                  key={mod.id}
                  className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-3"
                >
                  {/* Header Info */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-1.5">
                        <span className="px-2.5 py-0.5 rounded text-xs font-mono font-black bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700">
                          {mod.code}
                        </span>
                        {mod.moduleType && (
                          <span className={`px-2 py-0.5 rounded text-[10px] font-black ${
                            mod.moduleType === 'MC_ONLY' 
                              ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300' 
                              : mod.moduleType === 'EE_ONLY' 
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' 
                              : 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200'
                          }`}>
                            {mod.moduleType === 'MC_ONLY' ? 'เฉพาะ MC' : mod.moduleType === 'EE_ONLY' ? 'เฉพาะ EE' : 'MC & EE'}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => onOpenAddPartToModule(mod.id)}
                          className="px-2 py-1 bg-red-50 dark:bg-red-950/60 hover:bg-red-100 text-red-700 dark:text-red-300 rounded-lg text-[11px] font-bold border border-red-200 dark:border-red-800 flex items-center"
                          title="เพิ่ม Part ใน Module นี้"
                        >
                          <Plus className="w-3 h-3 mr-0.5" /> + Part
                        </button>
                        <button
                          onClick={() => onOpenEditModule(mod)}
                          className="p-1 text-slate-400 hover:text-slate-800 dark:hover:text-white bg-slate-100 dark:bg-slate-800 rounded-lg"
                          title="แก้ไข Module"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onDeleteModule(mod.id)}
                          className="p-1 text-slate-400 hover:text-red-600 dark:hover:text-red-400 bg-slate-100 dark:bg-slate-800 rounded-lg"
                          title="ลบ Module"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <h3 className="text-base font-black text-slate-900 dark:text-white">{mod.name}</h3>
                    
                    <div className="flex items-center space-x-3 text-xs text-slate-500 font-bold">
                      {mod.dwgNo && <span className="font-mono">DWG: {mod.dwgNo}</span>}
                      {mod.responsibleEngineer && (
                        <span className="flex items-center">
                          <User className="w-3 h-3 mr-1 text-slate-400" /> {mod.responsibleEngineer}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Cost KPI Matrix inside Card */}
                  <div className="grid grid-cols-3 gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-500 font-bold block">ราคารวม (Total)</span>
                      <span className="font-black text-slate-900 dark:text-white text-sm">{formatCurrency(totalCost)}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-blue-700 dark:text-blue-400 font-bold flex items-center">
                        <Wrench className="w-3 h-3 mr-0.5" /> MC ({mcParts.length})
                      </span>
                      <span className="font-black text-blue-800 dark:text-blue-300 text-xs">{formatCurrency(mcCost)}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-amber-700 dark:text-amber-400 font-bold flex items-center">
                        <Zap className="w-3 h-3 mr-0.5" /> EE ({eeParts.length})
                      </span>
                      <span className="font-black text-amber-800 dark:text-amber-300 text-xs">{formatCurrency(eeCost)}</span>
                    </div>
                  </div>

                  {/* Budget Progress Bar */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] font-bold text-slate-600 dark:text-slate-400">
                      <span>งบประมาณที่ใช้ไป ({pctUsed.toFixed(1)}%)</span>
                      <span>Target: {formatCurrency(targetBudget)}</span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all ${
                          pctUsed > 100 ? 'bg-rose-600' : pctUsed > 80 ? 'bg-amber-500' : 'bg-blue-600'
                        }`}
                        style={{ width: `${Math.min(pctUsed, 100)}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Key Parts Preview Snippets */}
                  <div className="border-t border-slate-100 dark:border-slate-800 pt-2 space-y-1">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
                      ตัวอย่างรายการชิ้นส่วน ({mParts.length} Parts Total)
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {mParts.slice(0, 4).map(p => (
                        <span 
                          key={p.id}
                          className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border ${
                            p.category === 'MC' 
                              ? 'bg-blue-50 text-blue-800 border-blue-200 dark:bg-blue-950 dark:text-blue-300' 
                              : 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950 dark:text-amber-300'
                          }`}
                        >
                          {p.partName} ({p.qty} {p.unit})
                        </span>
                      ))}
                      {mParts.length > 4 && (
                        <span className="text-[10px] text-slate-500 font-bold px-1 py-0.5">
                          +{mParts.length - 4} รายการอื่น ๆ
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Card Action Link */}
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                    <button
                      onClick={() => onSelectModuleForDetail(mod.id)}
                      className="text-xs font-black text-blue-600 dark:text-blue-400 hover:text-blue-700 flex items-center"
                    >
                      ดูความสัมพันธ์ MC & EE เชิงลึก
                      <ArrowRight className="w-3.5 h-3.5 ml-1" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

    </div>
  );
};
