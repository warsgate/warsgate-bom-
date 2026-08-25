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
  Trash2,
  Library,
  FileText,
  MessageSquare,
  BellRing
} from 'lucide-react';
import { ProjectItem } from '../types/bom';

interface SidebarProps {
  activeTab: 'dashboard' | 'master-plan' | 'all-modules' | 'modules' | 'bom' | 'procurement' | 'report' | 'master-library' | 'quotations' | 'history' | 'workspaces' | 'users' | 'line-notify';
  onTabChange: (tab: 'dashboard' | 'master-plan' | 'all-modules' | 'modules' | 'bom' | 'procurement' | 'report' | 'master-library' | 'quotations' | 'history' | 'workspaces' | 'users' | 'line-notify') => void;
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
  user?: any;
  onLogout?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onTabChange,
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
      id: 'workspaces',
      label: 'จัดการ Workspace',
      icon: FolderKanban,
      badge: null,
      isProtected: true, // Admin only
    },
    {
      id: 'users',
      label: 'จัดการผู้ใช้งาน',
      icon: UserCheck,
      badge: null,
      isProtected: true, // Admin only
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
    {
      id: 'master-library',
      label: 'คลังอะไหล่ (Master Data)',
      icon: Library,
      badge: null,
      isProtected: false,
    },
    {
      id: 'quotations',
      label: 'ใบเสนอราคา (Quotations)',
      icon: FileText,
      badge: null,
      isProtected: false,
    },
    {
      id: 'line-notify',
      label: 'แจ้งเตือน LINE (Real-time)',
      icon: MessageSquare,
      badge: 'Bot Flex',
      isProtected: false,
    },
  ];

  const handleTabClick = (tabId: any) => {
    onTabChange(tabId);
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
    <div className="w-[280px] bg-gradient-to-b from-white/95 to-slate-50/90 dark:from-slate-900/95 dark:to-slate-950/90 backdrop-blur-2xl border-r border-slate-200/60 dark:border-slate-800/60 flex flex-col h-full shadow-[4px_0_24px_rgba(0,0,0,0.06)] dark:shadow-[4px_0_24px_rgba(0,0,0,0.4)] transition-all z-20 relative">
      
      {/* 1. Brand Logo Header */}
      <div className="p-5 border-b border-slate-200/60 dark:border-slate-800/60 flex items-center justify-between">
        <div className="flex flex-col items-start w-full">
          <img src="/logo.png" alt="WARSGATE AUTOMATION" className="h-8 object-contain mb-1.5 drop-shadow-md" />
          <p className="text-[10px] text-slate-500 dark:text-slate-400 font-black uppercase tracking-[0.2em] pl-1 bg-clip-text text-transparent bg-gradient-to-r from-slate-600 to-slate-400 dark:from-slate-300 dark:to-slate-500">
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
      <div className="px-4 pt-5 pb-2">
        <div 
          onClick={toggleRole}
          className={`p-2.5 rounded-2xl border cursor-pointer transition-all duration-300 flex items-center justify-between text-xs font-black shadow-sm hover:shadow-md ${
            userRole === 'OWNER'
              ? 'bg-gradient-to-br from-amber-50 to-orange-100 dark:from-amber-950/40 dark:to-orange-950/40 border-t border-amber-100 dark:border-t-amber-800 border-b border-amber-300 dark:border-b-amber-900 text-amber-900 dark:text-amber-300 hover:border-amber-400 shadow-[0_2px_10px_rgba(251,191,36,0.2)]'
              : 'bg-gradient-to-br from-slate-50 to-slate-200 dark:from-slate-800 dark:to-slate-900 border-t border-white dark:border-t-slate-700 border-b border-slate-300 dark:border-b-black text-slate-700 dark:text-slate-300 hover:border-slate-400 shadow-[0_2px_8px_rgba(0,0,0,0.05)]'
          }`}
          title="คลิกเพื่อสลับสิทธิ์ผู้ใช้งาน (Owner vs Engineer)"
        >
          <div className="flex items-center space-x-2 truncate">
            <div className={`p-1.5 rounded-xl ${userRole === 'OWNER' ? 'bg-amber-100 dark:bg-amber-900/50' : 'bg-slate-200 dark:bg-slate-700'}`}>
              {userRole === 'OWNER' ? (
                <ShieldCheck className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0" />
              ) : (
                <UserCheck className="w-4 h-4 text-slate-600 dark:text-slate-300 flex-shrink-0" />
              )}
            </div>
            <span className="truncate tracking-wide">
              {userRole === 'OWNER' ? 'ผู้บริหาร / เจ้าของ' : 'วิศวกร / ทีมงาน'}
            </span>
          </div>

          <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-1 rounded-lg ${userRole === 'OWNER' ? 'bg-amber-200/50 text-amber-800 dark:text-amber-200' : 'bg-slate-200/70 dark:bg-slate-700 text-slate-600 dark:text-slate-300'}`}>
            สลับสิทธิ์
          </span>
        </div>
      </div>

      {/* 3. Project Selector */}
      <div className="px-4 pb-4 border-b border-slate-200/60 dark:border-slate-800/60">
        <div className="flex items-center justify-between mb-2 mt-2">
          <span className="text-[10px] font-black text-rose-600 dark:text-rose-400 uppercase tracking-widest flex items-center">
            <FolderKanban className="w-3.5 h-3.5 mr-1.5" /> Workspace
          </span>
          {userRole === 'OWNER' && (
            <button
              onClick={() => {
                onOpenAddProject();
                if (onCloseMobile) onCloseMobile();
              }}
              className="px-2.5 py-1 bg-rose-50 text-rose-700 hover:bg-rose-600 hover:text-white dark:bg-rose-500/10 dark:text-rose-400 dark:hover:bg-rose-600 dark:hover:text-white rounded-lg text-[10px] font-black transition-all duration-200 flex items-center"
              title="สร้างโปรเจกต์ใหม่"
            >
              <FolderPlus className="w-3 h-3 mr-1" />
              เพิ่ม
            </button>
          )}
        </div>

        <div className="relative group">
          <select
            value={activeProjectId}
            onChange={(e) => setActiveProjectId(e.target.value)}
            className="w-full appearance-none bg-slate-50 dark:bg-slate-800/50 text-xs font-black text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700/80 rounded-xl p-2.5 pr-8 focus:outline-none focus:ring-2 focus:ring-rose-500/50 cursor-pointer transition-colors hover:border-slate-300 dark:hover:border-slate-600"
          >
            {projects.map(p => (
              <option key={p.id} value={p.id} className="font-bold">
                [{p.code}] {p.name}
              </option>
            ))}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-500">
            <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
          </div>
        </div>

        {activeProject && (
          <div className="flex items-center justify-between mt-3 bg-slate-50 dark:bg-slate-800/30 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
            <div className="text-[10px] text-slate-500 dark:text-slate-400 font-bold truncate">
              ลูกค้า: <span className="text-slate-800 dark:text-slate-200 font-black">{activeProject.customer}</span>
            </div>
            {userRole === 'OWNER' && (
              <div className="flex items-center space-x-1.5 flex-shrink-0 ml-2">
                <button
                  onClick={() => onEditProject(activeProject)}
                  className="p-1.5 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 transition-colors"
                  title="แก้ไขข้อมูลโปรเจกต์"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => onDeleteProject(activeProject.id)}
                  className="p-1.5 text-slate-400 hover:text-red-600 dark:hover:text-red-400 bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 transition-colors"
                  title="ลบโปรเจกต์"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 4. Main Navigation Menu */}
      <nav className="flex-1 px-4 py-4 space-y-1.5 overflow-y-auto overflow-x-hidden no-scrollbar">
        <div className="text-[10px] font-black text-slate-400/80 dark:text-slate-500/80 uppercase tracking-[0.2em] px-2 py-1 mb-2">
          Menu
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          const isLocked = item.isProtected && userRole !== 'OWNER';

          return (
            <button
              key={item.id}
              onClick={() => handleTabClick(item.id)}
              className={`group w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-xs font-black transition-all duration-300 ${
                isActive
                  ? 'bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-[0_4px_12px_rgba(225,29,72,0.4)] scale-[1.03] border-t border-rose-400/50 border-b border-rose-800/80 z-10'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800/90 hover:text-rose-600 dark:hover:text-rose-400 hover:translate-x-1 hover:shadow-sm border border-transparent'
              }`}
            >
              <div className="flex items-center space-x-3 truncate">
                <Icon className={`w-4 h-4 flex-shrink-0 transition-transform duration-300 ${isActive ? 'text-white' : 'text-slate-400 group-hover:scale-110 group-hover:text-rose-500'}`} />
                <span className="truncate tracking-wide">{item.label}</span>
              </div>

              {isLocked ? (
                <span className="px-1.5 py-0.5 rounded-md text-[9px] bg-red-100/80 dark:bg-red-950/80 text-red-700 dark:text-red-400 font-bold flex items-center backdrop-blur-sm">
                  <Lock className="w-3 h-3 mr-0.5" /> Owner Only
                </span>
              ) : item.badge !== null ? (
                <span className={`px-2 py-0.5 rounded-lg text-[10px] font-mono font-black shadow-sm transition-colors ${
                  isActive ? 'bg-white/25 text-white' : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-600 group-hover:border-rose-200 dark:group-hover:border-rose-900/50'
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
      <aside className="hidden lg:flex h-screen sticky top-0 z-30 flex-shrink-0 print:hidden">
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
