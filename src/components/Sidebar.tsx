import React from 'react';
import { 
  LayoutDashboard, 
  Layers, 
  Grid,
  Table as TableIcon, 
  Calculator, 
  Plus, 
  Download, 
  RotateCcw, 
  Sun,
  Moon,
  ShoppingCart,
  FolderKanban,
  FolderPlus,
  X,
  Lock,
  ShieldCheck,
  UserCheck,
  Calendar,
  Edit2,
  Trash2
} from 'lucide-react';
import { ProjectItem } from '../types/bom';

interface SidebarProps {
  activeTab: 'dashboard' | 'master-plan' | 'all-modules' | 'modules' | 'bom' | 'procurement' | 'report';
  setActiveTab: (tab: 'dashboard' | 'master-plan' | 'all-modules' | 'modules' | 'bom' | 'procurement' | 'report') => void;
  projects: ProjectItem[];
  activeProjectId: string;
  setActiveProjectId: (id: string) => void;
  onOpenAddProject: () => void;
  onOpenAddPart: () => void;
  onOpenAddModule: () => void;
  onOpenExportImport: () => void;
  onResetData: () => void;
  totalItems: number;
  totalModules: number;
  isDarkMode: boolean;
  setIsDarkMode: (val: boolean) => void;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
  userRole: 'OWNER' | 'ENGINEER';
  setUserRole: (role: 'OWNER' | 'ENGINEER') => void;
  onEditProject: (project: ProjectItem) => void;
  onDeleteProject: (id: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
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
  totalItems,
  totalModules,
  isDarkMode,
  setIsDarkMode,
  isMobileOpen = false,
  onCloseMobile,
  userRole,
  setUserRole,
  onEditProject,
  onDeleteProject,
}) => {
  const activeProject = projects.find(p => p.id === activeProjectId) || projects[0];

  const navItems = [
    {
      id: 'dashboard',
      label: 'Dashboard ภาพรวม',
      icon: LayoutDashboard,
      badge: null,
      isProtected: true, // Only for Owner/Executive!
    },
    {
      id: 'master-plan',
      label: 'Master Plan แผนงานหลัก (Gantt)',
      icon: Calendar,
      badge: 'MS Project',
      isProtected: false,
    },
    {
      id: 'all-modules',
      label: 'โครงสร้าง Module ทั้งโปรเจกต์',
      icon: Grid,
      badge: totalModules,
      isProtected: false,
    },
    {
      id: 'modules',
      label: 'ความสัมพันธ์ MC & EE เชิงลึก',
      icon: Layers,
      badge: null,
      isProtected: false,
    },
    {
      id: 'bom',
      label: 'Part List (BOM Table)',
      icon: TableIcon,
      badge: totalItems,
      isProtected: false,
    },
    {
      id: 'procurement',
      label: 'สั่งซื้อ & สโตร์ (Procurement)',
      icon: ShoppingCart,
      badge: null,
      isProtected: false,
    },
    {
      id: 'report',
      label: 'สรุป Cost แยก Module',
      icon: Calculator,
      badge: null,
      isProtected: false,
    },
  ];

  const handleSelectTab = (tabId: any) => {
    setActiveTab(tabId);
    if (onCloseMobile) onCloseMobile();
  };

  const toggleRole = () => {
    if (userRole === 'OWNER') {
      setUserRole('ENGINEER');
    } else {
      setUserRole('OWNER');
    }
  };

  const sidebarContent = (
    <div className="w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col h-full shadow-lg transition-colors">
      
      {/* 1. Brand Logo Header */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-900">
        <div className="flex flex-col items-start w-full">
          <img src="/logo.png" alt="WARSGATE AUTOMATION" className="h-8 object-contain mb-1 drop-shadow-sm" />
          <p className="text-[9px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest pl-1">
            Multi-Project BOM System
          </p>
        </div>

        {/* Mobile Close Button */}
        {onCloseMobile && (
          <button
            onClick={onCloseMobile}
            className="lg:hidden p-1 rounded-lg text-slate-400 hover:text-slate-800 dark:hover:text-white flex-shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* 2. User Role Switcher Badge */}
      <div className="px-3 pt-3">
        <div 
          onClick={toggleRole}
          className={`p-2 rounded-xl border cursor-pointer transition-all flex items-center justify-between text-xs font-black ${
            userRole === 'OWNER'
              ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-300'
              : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
          }`}
          title="คลิกเพื่อสลับสิทธิ์ผู้ใช้งาน (Owner vs Engineer)"
        >
          <div className="flex items-center space-x-1.5 truncate">
            {userRole === 'OWNER' ? (
              <ShieldCheck className="w-4 h-4 text-amber-600 flex-shrink-0" />
            ) : (
              <UserCheck className="w-4 h-4 text-blue-600 flex-shrink-0" />
            )}
            <span className="truncate">
              {userRole === 'OWNER' ? '👑 ผู้บริหาร / เจ้าของ' : '👷 วิศวกร / ทีมงาน'}
            </span>
          </div>

          <span className="text-[9px] underline text-slate-500 font-bold flex-shrink-0">
            สลับสิทธิ์
          </span>
        </div>
      </div>

      {/* 3. Active Project Selector Card */}
      <div className="p-3 mx-3 my-2.5 bg-red-50/80 dark:bg-slate-950 rounded-xl border border-red-200 dark:border-slate-800 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-black text-red-700 dark:text-red-400 uppercase tracking-wider flex items-center">
            <FolderKanban className="w-3 h-3 mr-1" /> Active Project
          </span>
          <button
            onClick={() => {
              onOpenAddProject();
              if (onCloseMobile) onCloseMobile();
            }}
            className="px-2 py-0.5 bg-red-600 hover:bg-red-500 text-white rounded text-[10px] font-black transition-all shadow-sm flex items-center"
            title="สร้างโปรเจกต์ใหม่"
          >
            <FolderPlus className="w-3 h-3 mr-0.5" />
            + เพิ่ม
          </button>
        </div>

        <select
          value={activeProjectId}
          onChange={(e) => setActiveProjectId(e.target.value)}
          className="w-full bg-white dark:bg-slate-900 text-xs font-black text-slate-900 dark:text-white border border-slate-300 dark:border-slate-800 rounded-lg p-1.5 focus:outline-none focus:ring-1 focus:ring-red-500 cursor-pointer"
        >
          {projects.map(p => (
            <option key={p.id} value={p.id} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-bold">
              [{p.code}] {p.name}
            </option>
          ))}
        </select>

        {activeProject && (
          <div className="flex items-center justify-between mt-1">
            <div className="text-[10px] text-slate-600 dark:text-slate-400 font-bold truncate">
              ลูกค้า: <span className="text-slate-900 dark:text-slate-200 font-extrabold">{activeProject.customer}</span>
            </div>
            <div className="flex items-center space-x-1.5 flex-shrink-0 ml-2">
              <button
                onClick={() => onEditProject(activeProject)}
                className="p-1 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 bg-white dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-700 shadow-sm transition-colors"
                title="แก้ไขข้อมูลโปรเจกต์"
              >
                <Edit2 className="w-3 h-3" />
              </button>
              <button
                onClick={() => onDeleteProject(activeProject.id)}
                className="p-1 text-slate-400 hover:text-red-600 dark:hover:text-red-400 bg-white dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-700 shadow-sm transition-colors"
                title="ลบโปรเจกต์"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 4. Main Navigation Menu */}
      <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
        <div className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider px-3 py-1">
          NAVIGATION MENU
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          const isLocked = item.isProtected && userRole !== 'OWNER';

          return (
            <button
              key={item.id}
              onClick={() => handleSelectTab(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-black transition-all ${
                isActive
                  ? 'bg-gradient-to-r from-red-600 to-rose-700 text-white shadow-md shadow-red-600/30'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-red-50 dark:hover:bg-slate-800 hover:text-red-600'
              }`}
            >
              <div className="flex items-center space-x-2.5 truncate">
                <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-white' : 'text-slate-500 dark:text-slate-400'}`} />
                <span className="truncate">{item.label}</span>
              </div>

              {isLocked ? (
                <span className="px-1.5 py-0.5 rounded text-[9px] bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-400 font-bold flex items-center">
                  <Lock className="w-3 h-3 mr-0.5" /> เฉพาะผู้บริหาร
                </span>
              ) : item.badge !== null ? (
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                  isActive ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-slate-100'
                }`}>
                  {item.badge}
                </span>
              ) : null}
            </button>
          );
        })}

        {/* Action Buttons Section */}
        <div className="pt-4 space-y-2 border-t border-slate-200 dark:border-slate-800/80 mt-4">
          <div className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider px-3">
            QUICK ACTIONS
          </div>

          <button
            onClick={() => {
              onOpenAddPart();
              if (onCloseMobile) onCloseMobile();
            }}
            className="w-full py-2 px-3 bg-gradient-to-r from-red-600 via-rose-700 to-rose-900 hover:from-red-500 hover:to-rose-800 text-white text-xs font-black rounded-xl shadow-md transition-all flex items-center justify-center space-x-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>+ เพิ่มรายการ Part</span>
          </button>

          <button
            onClick={() => {
              onOpenAddModule();
              if (onCloseMobile) onCloseMobile();
            }}
            className="w-full py-2 px-3 bg-red-100 dark:bg-red-950/60 hover:bg-red-200 text-red-800 dark:text-red-300 text-xs font-black rounded-xl border border-red-300 dark:border-red-800 transition-all flex items-center justify-center space-x-1.5"
          >
            <Layers className="w-4 h-4 text-red-600" />
            <span>+ เพิ่ม Module ใหม่</span>
          </button>

          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              onClick={() => {
                onOpenExportImport();
                if (onCloseMobile) onCloseMobile();
              }}
              className="py-1.5 px-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-lg border border-slate-200 dark:border-slate-700 transition-all flex items-center justify-center space-x-1"
              title="Import / Export Excel"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Excel</span>
            </button>

            <button
              onClick={() => {
                onResetData();
                if (onCloseMobile) onCloseMobile();
              }}
              className="py-1.5 px-2 bg-slate-100 dark:bg-slate-800 hover:bg-red-50 text-slate-700 dark:text-slate-300 hover:text-red-600 text-xs font-bold rounded-lg border border-slate-200 dark:border-slate-700 transition-all flex items-center justify-center space-x-1"
              title="Reset Demo Data"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          </div>
        </div>
      </nav>

      {/* 5. Bottom Footer / Theme Switcher */}
      <div className="p-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950">
        <div className="flex items-center space-x-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="text-[10px] font-mono font-bold text-slate-600 dark:text-slate-400">IndexedDB Active</span>
        </div>

        <button
          onClick={() => setIsDarkMode(!isDarkMode)}
          className="p-1.5 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-300 dark:border-slate-700 transition-colors"
          title={isDarkMode ? "Light Mode" : "Dark Mode"}
        >
          {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-red-600" />}
        </button>
      </div>

    </div>
  );

  return (
    <>
      {/* Desktop Sidebar (Pinned Left) */}
      <aside className="hidden lg:flex h-screen sticky top-0 z-30 flex-shrink-0">
        {sidebarContent}
      </aside>

      {/* Mobile & Tablet Drawer (Overlay) */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          {/* Backdrop Blur */}
          <div 
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
            onClick={onCloseMobile}
          ></div>
          
          {/* Sidebar Panel Slide-in */}
          <div className="relative z-10 flex-1 max-w-xs h-full animate-in slide-in-from-left duration-200">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};
