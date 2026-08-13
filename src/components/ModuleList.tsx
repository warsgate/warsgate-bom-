import React, { useState, useMemo } from 'react';
import { 
  Wrench, 
  Zap, 
  Plus, 
  Edit3, 
  ChevronRight,
  Layers,
  Sliders,
  Filter
} from 'lucide-react';
import { BomPartItem, ModuleItem } from '../types/bom';
import { formatCurrency } from '../utils/costCalculator';

interface ModuleListProps {
  modules: ModuleItem[];
  parts: BomPartItem[];
  onAddPartToModule: (moduleId: string) => void;
  onEditModule: (module: ModuleItem) => void;
  onDeleteModule: (moduleId: string) => void;
  onEditPart: (part: BomPartItem) => void;
}

export const ModuleList: React.FC<ModuleListProps> = ({
  modules,
  parts,
  onAddPartToModule,
  onEditModule,
  onDeleteModule,
  onEditPart,
}) => {
  const [selectedModuleId, setSelectedModuleId] = useState<string>(modules[0]?.id || '');
  const [filterScope, setFilterScope] = useState<'ALL' | 'MC_ONLY' | 'EE_ONLY' | 'BOTH'>('ALL');

  // Filter Modules by scope
  const filteredModules = useMemo(() => {
    return modules.filter(m => {
      if (filterScope === 'ALL') return true;

      const mParts = parts.filter(p => p.moduleId === m.id);
      const mMcCount = mParts.filter(p => p.category === 'MC').length;
      const mEeCount = mParts.filter(p => p.category === 'EE').length;

      if (filterScope === 'MC_ONLY') {
        return m.moduleType === 'MC_ONLY' || (mMcCount > 0 && mEeCount === 0);
      }
      if (filterScope === 'EE_ONLY') {
        return m.moduleType === 'EE_ONLY' || (mEeCount > 0 && mMcCount === 0);
      }
      if (filterScope === 'BOTH') {
        return m.moduleType === 'BOTH' || (mMcCount > 0 && mEeCount > 0);
      }
      return true;
    });
  }, [modules, parts, filterScope]);

  const activeModule = filteredModules.find(m => m.id === selectedModuleId) || filteredModules[0] || modules[0];

  const moduleParts = parts.filter(p => p.moduleId === activeModule?.id);
  const mcParts = moduleParts.filter(p => p.category === 'MC');
  const eeParts = moduleParts.filter(p => p.category === 'EE');

  const totalMcCost = mcParts.reduce((acc, p) => acc + (p.totalAmount || (p.qty * p.unitPrice)), 0);
  const totalEeCost = eeParts.reduce((acc, p) => acc + (p.totalAmount || (p.qty * p.unitPrice)), 0);
  const totalModuleCost = totalMcCost + totalEeCost;

  return (
    <div className="space-y-4">
      
      {/* Module Scope Filter Buttons Bar */}
      <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center space-x-2">
          <Filter className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          <span className="font-black text-slate-900 dark:text-white">กรองประเภท Module:</span>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
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
                : 'bg-blue-50 dark:bg-blue-950/40 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800 hover:bg-blue-100'
            }`}
          >
            <Wrench className="w-3.5 h-3.5" />
            <span>มีเฉพาะ MC</span>
          </button>

          <button
            onClick={() => setFilterScope('EE_ONLY')}
            className={`px-3 py-1 rounded-lg font-black transition-all flex items-center space-x-1 ${
              filterScope === 'EE_ONLY'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-300 border border-amber-200 dark:border-amber-800 hover:bg-amber-100'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>มีเฉพาะ EE</span>
          </button>

          <button
            onClick={() => setFilterScope('BOTH')}
            className={`px-3 py-1 rounded-lg font-black transition-all flex items-center space-x-1 ${
              filterScope === 'BOTH'
                ? 'bg-slate-800 text-white shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 hover:bg-slate-200'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>มีทั้ง MC & EE</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Left Module Selector / Right Interlinked Parts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        
        {/* Left Column: List of Modules */}
        <div className="lg:col-span-4 space-y-2">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center">
              <Layers className="w-3.5 h-3.5 mr-1 text-blue-600" /> Modules ({filteredModules.length})
            </span>
          </div>

          <div className="space-y-2 max-h-[580px] overflow-y-auto pr-1">
            {filteredModules.length === 0 ? (
              <div className="p-6 text-center text-slate-400 bg-white dark:bg-slate-900 border rounded-xl text-xs font-medium">
                ไม่พบ Module ที่ตรงตามเงื่อนไขที่เลือก
              </div>
            ) : (
              filteredModules.map((mod) => {
                const mParts = parts.filter(p => p.moduleId === mod.id);
                const mMcCount = mParts.filter(p => p.category === 'MC').length;
                const mEeCount = mParts.filter(p => p.category === 'EE').length;
                const mCost = mParts.reduce((acc, p) => acc + (p.totalAmount || (p.qty * p.unitPrice)), 0);
                const isSelected = mod.id === activeModule?.id;

                return (
                  <div
                    key={mod.id}
                    onClick={() => setSelectedModuleId(mod.id)}
                    className={`p-3 rounded-xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-blue-50/90 dark:bg-blue-950/80 border-blue-500 shadow-sm'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <div className="flex items-center space-x-1.5">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                          isSelected ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200'
                        }`}>
                          {mod.code}
                        </span>
                        {mod.moduleType && mod.moduleType !== 'BOTH' && (
                          <span className={`px-1.5 py-0.2 rounded text-[9px] font-black ${
                            mod.moduleType === 'MC_ONLY' ? 'bg-blue-100 text-blue-800' : 'bg-amber-100 text-amber-800'
                          }`}>
                            {mod.moduleType === 'MC_ONLY' ? 'MC Only' : 'EE Only'}
                          </span>
                        )}
                      </div>
                      <span className="text-xs font-black text-slate-900 dark:text-white">
                        {formatCurrency(mCost)}
                      </span>
                    </div>

                    <h4 className="text-xs font-black text-slate-900 dark:text-white mt-1 truncate">{mod.name}</h4>
                    {mod.dwgNo && (
                      <p className="text-[10px] text-slate-500 font-mono">DWG: {mod.dwgNo}</p>
                    )}

                    <div className="flex items-center justify-between text-[11px] font-bold mt-2 pt-1 border-t border-slate-200 dark:border-slate-800">
                      <div className="flex items-center space-x-2">
                        <span className="text-blue-700 dark:text-blue-400 flex items-center font-extrabold">
                          <Wrench className="w-3 h-3 mr-0.5" /> MC({mMcCount})
                        </span>
                        <span className="text-amber-700 dark:text-amber-400 flex items-center font-extrabold">
                          <Zap className="w-3 h-3 mr-0.5" /> EE({mEeCount})
                        </span>
                      </div>
                      <ChevronRight className={`w-3.5 h-3.5 ${isSelected ? 'text-blue-600' : 'text-slate-400'}`} />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Selected Module Details & MC/EE Split Columns */}
        {activeModule && (
          <div className="lg:col-span-8 space-y-3">
            
            {/* Compact Module Overview Header */}
            <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-2">
              <div className="flex items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
                <div className="flex items-center space-x-2">
                  <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-blue-100 dark:bg-blue-500/20 text-blue-800 dark:text-blue-300">
                    {activeModule.code}
                  </span>
                  <h3 className="text-sm font-black text-slate-900 dark:text-white truncate">{activeModule.name}</h3>
                  {activeModule.moduleType && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-black bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                      {activeModule.moduleType === 'MC_ONLY' ? 'เฉพาะ MC' : activeModule.moduleType === 'EE_ONLY' ? 'เฉพาะ EE' : 'MC & EE ทั้งคู่'}
                    </span>
                  )}
                </div>

                <div className="flex items-center space-x-1.5">
                  <button
                    onClick={() => onAddPartToModule(activeModule.id)}
                    className="px-2.5 py-1 bg-red-600 hover:bg-red-500 text-white text-xs font-black rounded-lg transition-all flex items-center shadow-sm"
                  >
                    <Plus className="w-3.5 h-3.5 mr-0.5" />
                    + Part ใน Module นี้
                  </button>
                  <button
                    onClick={() => onEditModule(activeModule)}
                    className="p-1 text-slate-500 hover:text-slate-900 bg-slate-100 dark:bg-slate-800 rounded-lg"
                    title="แก้ไข Module"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Module Cost KPI Summary Bar - Neutral Number Colors */}
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] text-slate-500 font-bold block">Total Module Cost</span>
                  <span className="font-black text-slate-900 dark:text-white text-sm">{formatCurrency(totalModuleCost)}</span>
                </div>
                <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/40">
                  <span className="text-[10px] text-blue-700 dark:text-blue-400 font-bold block">MC Cost</span>
                  <span className="font-black text-blue-900 dark:text-blue-300 text-sm">{formatCurrency(totalMcCost)}</span>
                </div>
                <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40">
                  <span className="text-[10px] text-amber-800 dark:text-amber-400 font-bold block">EE Cost</span>
                  <span className="font-black text-amber-900 dark:text-amber-300 text-sm">{formatCurrency(totalEeCost)}</span>
                </div>
              </div>
            </div>

            {/* Split View: Compact MC Parts (Left) vs EE Parts (Right) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              
              {/* 1. Mechanical Parts (MC) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between p-2 rounded-lg bg-blue-100 dark:bg-blue-950/40 border border-blue-200 text-xs">
                  <div className="flex items-center space-x-1.5 font-black text-blue-950 dark:text-blue-300">
                    <Wrench className="w-3.5 h-3.5 text-blue-600" />
                    <span>1. Mechanical (MC)</span>
                  </div>
                  <span className="font-mono font-bold px-1.5 py-0.2 rounded bg-blue-200 text-blue-950 text-[10px]">
                    {mcParts.length} Parts
                  </span>
                </div>

                <div className="space-y-1.5 max-h-[460px] overflow-y-auto pr-1">
                  {mcParts.length === 0 ? (
                    <div className="p-4 text-center text-slate-400 bg-white dark:bg-slate-900 border rounded-lg text-xs font-medium">
                      ไม่มีรายการ MC ใน Module นี้
                    </div>
                  ) : (
                    mcParts.map((part) => (
                      <div 
                        key={part.id}
                        onClick={() => onEditPart(part)}
                        className="bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:border-blue-400 cursor-pointer transition-all hover:shadow-sm group"
                      >
                        <div className="flex justify-between items-start">
                          <div className="truncate pr-2">
                            <div className="text-[10px] font-mono text-slate-500 font-bold">#{part.itemNo} | {part.partType}</div>
                            <h5 className="text-xs font-black text-slate-900 dark:text-white group-hover:text-blue-600 truncate">
                              {part.partName}
                            </h5>
                          </div>
                          <span className="text-xs font-black text-slate-900 dark:text-white flex-shrink-0">
                            {formatCurrency(part.totalAmount || (part.qty * part.unitPrice))}
                          </span>
                        </div>

                        <div className="flex justify-between items-center text-[10px] text-slate-500 mt-1 font-semibold">
                          <span>Spec: {part.typeSpec || '-'}</span>
                          <span>Qty: {part.qty} {part.unit}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* 2. Electrical Parts (EE) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between p-2 rounded-lg bg-amber-100 dark:bg-amber-950/40 border border-amber-200 text-xs">
                  <div className="flex items-center space-x-1.5 font-black text-amber-900 dark:text-amber-300">
                    <Zap className="w-3.5 h-3.5 text-amber-600" />
                    <span>2. Electrical (EE)</span>
                  </div>
                  <span className="font-mono font-bold px-1.5 py-0.2 rounded bg-amber-200 text-amber-900 text-[10px]">
                    {eeParts.length} Parts
                  </span>
                </div>

                <div className="space-y-1.5 max-h-[460px] overflow-y-auto pr-1">
                  {eeParts.length === 0 ? (
                    <div className="p-4 text-center text-slate-400 bg-white dark:bg-slate-900 border rounded-lg text-xs font-medium">
                      ไม่มีรายการ EE ใน Module นี้
                    </div>
                  ) : (
                    eeParts.map((part) => (
                      <div 
                        key={part.id}
                        onClick={() => onEditPart(part)}
                        className="bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:border-amber-400 cursor-pointer transition-all hover:shadow-sm group"
                      >
                        <div className="flex justify-between items-start">
                          <div className="truncate pr-2">
                            <div className="text-[10px] font-mono text-slate-500 font-bold">#{part.itemNo} | {part.partType}</div>
                            <h5 className="text-xs font-black text-slate-900 dark:text-white group-hover:text-amber-600 truncate">
                              {part.partName}
                            </h5>
                          </div>
                          <span className="text-xs font-black text-slate-900 dark:text-white flex-shrink-0">
                            {formatCurrency(part.totalAmount || (part.qty * part.unitPrice))}
                          </span>
                        </div>

                        <div className="flex justify-between items-center text-[10px] text-slate-500 mt-1 font-semibold">
                          <span>Spec: {part.typeSpec || '-'}</span>
                          <span>Qty: {part.qty} {part.unit}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>

          </div>
        )}
      </div>

    </div>
  );
};
