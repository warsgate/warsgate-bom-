import React from 'react';
import { Search, FolderKanban, DollarSign, Package, Menu } from 'lucide-react';
import { ProjectItem } from '../types/bom';
import { formatCurrency } from '../utils/costCalculator';

interface TopNavbarProps {
  activeProject?: ProjectItem;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  totalCost: number;
  totalItems: number;
  onOpenMobileSidebar?: () => void;
}

export const TopNavbar: React.FC<TopNavbarProps> = ({
  activeProject,
  searchQuery,
  setSearchQuery,
  totalCost,
  totalItems,
  onOpenMobileSidebar,
}) => {
  return (
    <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 py-3 sticky top-0 z-20 shadow-sm flex items-center justify-between gap-3 print:hidden">
      
      {/* Mobile Hamburger Toggle & Project Info */}
      <div className="flex items-center space-x-3 truncate">
        
        {/* Mobile Hamburger Menu Button */}
        <button
          onClick={onOpenMobileSidebar}
          className="lg:hidden p-2 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 transition-colors"
          title="เปิดเมนูหลัก"
        >
          <Menu className="w-5 h-5 text-red-600 dark:text-red-400" />
        </button>

        {/* Active Project Master Badge */}
        <div className="flex items-center space-x-2 truncate">
          <div className="p-1.5 rounded-lg bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400 hidden sm:block">
            <FolderKanban className="w-4 h-4" />
          </div>
          <div className="truncate">
            <div className="flex items-center space-x-1.5 truncate">
              <span className="font-mono font-black text-xs text-red-600 dark:text-red-400">
                [{activeProject?.code || 'PRJ-001'}]
              </span>
              <h2 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white truncate">
                {activeProject?.name || 'Project Name'}
              </h2>
            </div>
            <p className="text-[10px] sm:text-[11px] text-slate-500 font-bold truncate hidden sm:block">
              ลูกค้า: {activeProject?.customer} {activeProject?.dwgNo ? `| DWG Master: ${activeProject.dwgNo}` : ''}
            </p>
          </div>
        </div>

      </div>

      {/* Center Search & Right KPI Quick Pill */}
      <div className="flex items-center space-x-2.5 flex-shrink-0">
        
        {/* Search */}
        <div className="relative w-36 sm:w-64">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ค้นหา Part, DWG..."
            className="w-full pl-7 pr-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl text-slate-900 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-red-500 font-bold"
          />
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
        </div>

        {/* Project Cost Quick Badge (Neutral Slate/White text for normal numbers) */}
        <div className="hidden md:flex items-center space-x-3 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-bold flex-shrink-0">
          <div className="flex items-center text-slate-700 dark:text-slate-300">
            <Package className="w-3.5 h-3.5 mr-1 text-slate-400" />
            <span>{totalItems} Parts</span>
          </div>
          <div className="h-3 w-px bg-slate-300 dark:bg-slate-700"></div>
          <div className="flex items-center text-slate-900 dark:text-white font-black">
            <DollarSign className="w-3.5 h-3.5 mr-0.5 text-emerald-600" />
            <span>{formatCurrency(totalCost)}</span>
          </div>
        </div>

      </div>

    </header>
  );
};
