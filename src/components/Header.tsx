import React from 'react';
import { 
  LayoutDashboard, 
  Layers, 
  Table as TableIcon, 
  Calculator, 
  Plus, 
  Download, 
  RotateCcw, 
  Search,
  Sun,
  Moon,
  ShoppingCart,
  FolderKanban,
  FolderPlus
} from 'lucide-react';
import { ProjectItem } from '../types/bom';

interface HeaderProps {
  activeTab: 'dashboard' | 'modules' | 'bom' | 'procurement' | 'report';
  setActiveTab: (tab: 'dashboard' | 'modules' | 'bom' | 'procurement' | 'report') => void;
  projects: ProjectItem[];
  activeProjectId: string;
  setActiveProjectId: (id: string) => void;
  onOpenAddProject: () => void;
  onOpenAddPart: () => void;
  onOpenAddModule: () => void;
  onOpenExportImport: () => void;
  onResetData: () => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  totalItems: number;
  isDarkMode: boolean;
  setIsDarkMode: (val: boolean) => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  projects,
  activeProjectId,
  setActiveProjectId,
  onOpenAddProject,
  onOpenAddPart,
  onOpenAddModule,
  onOpenExportImport,
  onResetData,
  searchQuery,
  setSearchQuery,
  totalItems,
  isDarkMode,
  setIsDarkMode,
}) => {
  const activeProject = projects.find(p => p.id === activeProjectId) || projects[0];

  return (
    <header className="sticky top-0 z-40 bg-white dark:bg-slate-900 border-b border-rose-200 dark:border-slate-800 shadow-sm transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Main Header Bar */}
        <div className="flex items-center justify-between h-14 gap-3">
          
          {/* Logo & Brand Identity */}
          <div className="flex items-center space-x-2.5 flex-shrink-0">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-red-600 via-rose-700 to-rose-950 flex items-center justify-center text-white font-black text-lg shadow-sm tracking-tighter">
              <span className="transform -skew-x-6 text-white">W</span>
            </div>
            <div>
              <div className="flex items-center space-x-1">
                <span className="font-black text-base text-red-600 dark:text-red-500 tracking-tight">
                  WARSGATE
                </span>
                <span className="font-black text-base text-slate-900 dark:text-slate-100 tracking-wider">
                  AUTOMATION
                </span>
              </div>
            </div>
          </div>

          {/* Project Switcher Bar */}
          <div className="flex items-center space-x-1.5 bg-slate-100 dark:bg-slate-950 px-2 py-1 rounded-lg border border-slate-300 dark:border-slate-800 max-w-sm w-full">
            <FolderKanban className="w-3.5 h-3.5 text-red-600 dark:text-red-400 flex-shrink-0" />
            <select
              value={activeProjectId}
              onChange={(e) => setActiveProjectId(e.target.value)}
              className="bg-transparent text-xs font-black text-slate-900 dark:text-white focus:outline-none w-full truncate cursor-pointer"
            >
              {projects.map(p => (
                <option key={p.id} value={p.id} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-bold">
                  [{p.code}] {p.name} ({p.customer})
                </option>
              ))}
            </select>
            <button
              onClick={onOpenAddProject}
              className="px-2 py-0.5 bg-red-600 hover:bg-red-500 text-white rounded text-[11px] font-black transition-all shadow-sm flex items-center flex-shrink-0 whitespace-nowrap"
              title="สร้างโปรเจกต์ใหม่"
            >
              <FolderPlus className="w-3 h-3 mr-0.5" />
              + โปรเจกต์
            </button>
          </div>

          {/* Quick Search */}
          <div className="hidden lg:flex max-w-xs w-full">
            <div className="relative w-full">
              <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
                <Search className="h-3.5 w-3.5 text-slate-500" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search part, DWG, spec..."
                className="block w-full pl-8 pr-2.5 py-1 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-red-500 font-bold"
              />
            </div>
          </div>

          {/* Action Buttons & Theme Switcher */}
          <div className="flex items-center space-x-1.5 flex-shrink-0">
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="p-1.5 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-rose-50 dark:hover:bg-slate-800 border border-slate-300 dark:border-slate-700 transition-colors"
              title={isDarkMode ? "Light Mode" : "Dark Mode"}
            >
              {isDarkMode ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-red-600" />}
            </button>

            <button
              onClick={onOpenAddModule}
              className="inline-flex items-center px-2.5 py-1 text-xs font-black rounded-lg text-red-800 dark:text-red-300 bg-red-100 dark:bg-red-950/60 border border-red-300 dark:border-red-800/60 hover:bg-red-200 transition-all whitespace-nowrap"
            >
              <Layers className="w-3.5 h-3.5 mr-1 text-red-600" />
              + Module
            </button>

            <button
              onClick={onOpenAddPart}
              className="inline-flex items-center px-3 py-1 text-xs font-black rounded-lg text-white bg-gradient-to-r from-red-600 via-rose-700 to-rose-900 hover:from-red-500 hover:to-rose-800 shadow-sm transition-all whitespace-nowrap"
            >
              <Plus className="w-3.5 h-3.5 mr-1" />
              เพิ่ม Part
            </button>

            <button
              onClick={onOpenExportImport}
              className="p-1.5 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-300 dark:border-slate-800 transition-colors"
              title="Import / Export Excel"
            >
              <Download className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={onResetData}
              className="p-1.5 rounded-lg text-slate-700 dark:text-slate-300 hover:text-red-600 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-300 dark:border-slate-800 transition-colors"
              title="Reset Demo Data"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>

        </div>

        {/* Compact Navigation Tabs & Active Project Info Bar */}
        <div className="flex items-center justify-between border-t border-slate-200 dark:border-slate-800/80 py-1 overflow-x-auto gap-2">
          
          <div className="flex space-x-1">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`flex items-center space-x-1.5 px-3 py-1 rounded-lg text-xs font-black transition-all whitespace-nowrap ${
                activeTab === 'dashboard'
                  ? 'bg-red-600 text-white shadow-sm'
                  : 'text-slate-800 dark:text-slate-300 hover:text-red-600 hover:bg-red-50'
              }`}
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span>Dashboard ภาพรวม</span>
            </button>

            <button
              onClick={() => setActiveTab('modules')}
              className={`flex items-center space-x-1.5 px-3 py-1 rounded-lg text-xs font-black transition-all whitespace-nowrap ${
                activeTab === 'modules'
                  ? 'bg-red-600 text-white shadow-sm'
                  : 'text-slate-800 dark:text-slate-300 hover:text-red-600 hover:bg-red-50'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>ความสัมพันธ์ Module (MC & EE)</span>
            </button>

            <button
              onClick={() => setActiveTab('bom')}
              className={`flex items-center space-x-1.5 px-3 py-1 rounded-lg text-xs font-black transition-all whitespace-nowrap ${
                activeTab === 'bom'
                  ? 'bg-red-600 text-white shadow-sm'
                  : 'text-slate-800 dark:text-slate-300 hover:text-red-600 hover:bg-red-50'
              }`}
            >
              <TableIcon className="w-3.5 h-3.5" />
              <span>Part List (BOM Table)</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold ${
                activeTab === 'bom' ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-slate-100'
              }`}>
                {totalItems}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('procurement')}
              className={`flex items-center space-x-1.5 px-3 py-1 rounded-lg text-xs font-black transition-all whitespace-nowrap ${
                activeTab === 'procurement'
                  ? 'bg-red-600 text-white shadow-sm'
                  : 'text-slate-800 dark:text-slate-300 hover:text-red-600 hover:bg-red-50'
              }`}
            >
              <ShoppingCart className="w-3.5 h-3.5 text-amber-500" />
              <span>สั่งซื้อ & สโตร์ (Procurement)</span>
            </button>

            <button
              onClick={() => setActiveTab('report')}
              className={`flex items-center space-x-1.5 px-3 py-1 rounded-lg text-xs font-black transition-all whitespace-nowrap ${
                activeTab === 'report'
                  ? 'bg-red-600 text-white shadow-sm'
                  : 'text-slate-800 dark:text-slate-300 hover:text-red-600 hover:bg-red-50'
              }`}
            >
              <Calculator className="w-3.5 h-3.5" />
              <span>สรุป Cost แยก Module</span>
            </button>
          </div>

          {/* Active Project Sub-badge */}
          {activeProject && (
            <div className="hidden md:flex items-center space-x-2 text-[11px] font-bold text-slate-700 dark:text-slate-300 bg-red-50 dark:bg-slate-950 px-2.5 py-0.5 rounded border border-red-200 dark:border-slate-800 flex-shrink-0">
              <span className="font-mono text-red-600 dark:text-red-400">[{activeProject.code}]</span>
              <span className="truncate max-w-[200px]">{activeProject.name}</span>
            </div>
          )}

        </div>

      </div>
    </header>
  );
};
