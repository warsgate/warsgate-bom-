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
  Sparkles,
  ChevronDown,
  Database,
  Cpu
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
  onOpenSwitchUser?: () => void;
}

interface NavGroup {
  groupTitle: string;
  items: {
    id: SidebarProps['activeTab'];
    label: string;
    subLabel?: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: string | number | null;
    isProtected?: boolean;
    isHighlight?: boolean;
  }[];
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
  user,
  onOpenSwitchUser,
}) => {
  const activeProject = projects.find(p => p.id === activeProjectId) || projects[0];

  const navGroups: NavGroup[] = [
    {
      groupTitle: 'OVERVIEW & MANAGEMENT',
      items: [
        {
          id: 'dashboard',
          label: 'Dashboard ภาพรวม',
          subLabel: 'KPIs & Cost Summary',
          icon: LayoutDashboard,
          isProtected: true,
        },
        {
          id: 'workspaces',
          label: 'จัดการ Workspace',
          subLabel: 'Multi-Project Hub',
          icon: FolderKanban,
          isProtected: true,
        },
        {
          id: 'users',
          label: 'จัดการสิทธิ์ผู้ใช้งาน',
          subLabel: 'User Roles & Access',
          icon: UserCheck,
          isProtected: true,
        },
      ]
    },
    {
      groupTitle: 'ENGINEERING & BOM',
      items: [
        {
          id: 'master-plan',
          label: 'Master Plan Gantt',
          subLabel: 'แผนงานกำหนดการ',
          icon: Calendar,
          badge: 'Gantt',
        },
        {
          id: 'all-modules',
          label: 'โครงสร้าง Modules',
          subLabel: 'Assembly Architecture',
          icon: Grid,
          badge: totalModules > 0 ? totalModules : undefined,
        },
        {
          id: 'modules',
          label: 'MC & EE Relationship',
          subLabel: 'ความสัมพันธ์เชิงลึก',
          icon: Layers,
        },
        {
          id: 'bom',
          label: 'BOM Part List',
          subLabel: 'ตารางอะไหล่ชิ้นส่วน',
          icon: TableIcon,
          badge: totalItems > 0 ? totalItems : undefined,
        },
      ]
    },
    {
      groupTitle: 'PROCUREMENT & COST',
      items: [
        {
          id: 'procurement',
          label: 'สั่งซื้อ & คลังสโตร์',
          subLabel: 'PO & Store Inventory',
          icon: ShoppingCart,
          isHighlight: true,
        },
        {
          id: 'report',
          label: 'สรุปต้นทุน Cost',
          subLabel: 'Budget vs Actual',
          icon: Calculator,
        },
        {
          id: 'quotations',
          label: 'ใบเสนอราคา & เอกสาร',
          subLabel: 'Vendor Quotations',
          icon: FileText,
        },
        {
          id: 'master-library',
          label: 'คลังอะไหล่กลาง',
          subLabel: 'Standard Part Library',
          icon: Library,
        },
      ]
    },
    {
      groupTitle: 'CLOUD & AUTOMATION',
      items: [
        {
          id: 'line-notify',
          label: 'แจ้งเตือน LINE Bot',
          subLabel: 'Real-time & 2x Scheduler',
          icon: MessageSquare,
          badge: 'Auto',
          isHighlight: true,
        },
      ]
    }
  ];

  const handleTabClick = (tabId: SidebarProps['activeTab']) => {
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

  const isOwner = user?.role === 'LEVEL_2' || userRole === 'OWNER';

  const sidebarContent = (
    <div className="w-[290px] bg-white/95 dark:bg-slate-950/95 text-slate-800 dark:text-slate-100 backdrop-blur-2xl border-r border-slate-200 dark:border-slate-800/70 flex flex-col h-full shadow-[6px_0_30px_rgba(0,0,0,0.08)] dark:shadow-[6px_0_30px_rgba(0,0,0,0.5)] transition-all z-20 relative select-none">
      
      {/* 1. Header & Logo */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-800/80 flex items-center justify-between relative overflow-hidden bg-white dark:bg-slate-950">
        {/* Subtle Ambient Top Glow */}
        <div className="absolute -top-10 -left-10 w-36 h-36 bg-rose-100/60 dark:bg-indigo-500/15 rounded-full blur-2xl pointer-events-none"></div>
        <div className="absolute -top-10 -right-10 w-36 h-36 bg-indigo-100/40 dark:bg-rose-500/10 rounded-full blur-2xl pointer-events-none"></div>

        <div className="flex flex-col items-start w-full relative z-10">
          <div className="flex items-center space-x-2">
            <img src="/logo.png" alt="WARSGATE AUTOMATION" className="h-7 object-contain drop-shadow-[0_2px_12px_rgba(244,63,94,0.3)]" />
            <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-md bg-gradient-to-r from-rose-500/20 to-indigo-500/20 text-rose-600 dark:text-rose-300 border border-rose-400/30">
              PRO
            </span>
          </div>
          <p className="text-[9px] text-slate-400 font-bold uppercase tracking-[0.18em] mt-1 pl-0.5">
            Enterprise BOM Intelligence
          </p>
        </div>

        {/* Mobile Close Button */}
        {onCloseMobile && (
          <button
            onClick={onCloseMobile}
            className="lg:hidden p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex-shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* 2. User & Privilege Switcher */}
      <div className="px-3.5 pt-3 pb-2">
        <div 
          onClick={() => {
            if (onOpenSwitchUser) {
              onOpenSwitchUser();
            } else {
              toggleRole();
            }
          }}
          className={`p-2.5 rounded-2xl border cursor-pointer transition-all duration-300 flex items-center justify-between shadow-sm relative overflow-hidden group hover:scale-[1.01] ${
            isOwner
              ? 'bg-gradient-to-r from-amber-50 via-white to-orange-50 dark:from-amber-950/40 dark:via-slate-900/90 dark:to-orange-950/30 border-amber-300 dark:border-amber-500/30 text-amber-800 dark:text-amber-200 hover:border-amber-400'
              : 'bg-gradient-to-r from-slate-50 via-white to-indigo-50 dark:from-slate-900/90 dark:via-slate-900/70 dark:to-indigo-950/30 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:border-indigo-400 dark:hover:border-indigo-500/50'
          }`}
          title="คลิกเพื่อสลับผู้ใช้งาน / สลับสิทธิ์ (Switch User)"
        >
          <div className="flex items-center space-x-2.5 min-w-0">
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold flex-shrink-0 shadow-inner ${
              isOwner ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-300 dark:border-amber-500/40' : 'bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/40'
            }`}>
              {isOwner ? (
                <ShieldCheck className="w-4 h-4" />
              ) : (
                <UserCheck className="w-4 h-4" />
              )}
            </div>
            <div className="min-w-0 text-left">
              <div className="text-xs font-black truncate tracking-wide text-slate-800 dark:text-white group-hover:text-rose-600 dark:group-hover:text-amber-300 transition-colors">
                {user?.name || user?.username || (userRole === 'OWNER' ? 'Executive Admin' : 'Lead Engineer')}
              </div>
              <div className="text-[9px] font-mono text-slate-400 flex items-center gap-1">
                <span className={`w-1.5 h-1.5 rounded-full ${isOwner ? 'bg-amber-400' : 'bg-emerald-400'} animate-pulse`}></span>
                <span>{isOwner ? 'LEVEL_2 • Super Admin' : 'LEVEL_1 • Engineer'}</span>
              </div>
            </div>
          </div>

          <span className="text-[9px] font-mono font-bold px-2 py-1 rounded-lg bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/20 text-slate-500 dark:text-slate-300 border border-slate-200 dark:border-white/10 shrink-0 transition-colors">
            สลับสิทธิ์
          </span>
        </div>
      </div>

      {/* 3. Workspace Selector */}
      <div className="px-3.5 pb-3 border-b border-slate-200 dark:border-slate-800/80">
        <div className="flex items-center justify-between mb-1.5 px-1">
          <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <FolderKanban className="w-3 h-3 text-rose-500" /> Active Workspace
          </span>
          {isOwner && (
            <button
              onClick={() => {
                onOpenAddProject();
                if (onCloseMobile) onCloseMobile();
              }}
              className="px-2 py-0.5 bg-rose-50 hover:bg-rose-500 text-rose-500 hover:text-white rounded-lg text-[10px] font-bold border border-rose-300 dark:border-rose-500/30 transition-all duration-200 flex items-center gap-1"
              title="สร้างโปรเจกต์ใหม่"
            >
              <Plus className="w-3 h-3" />
              <span>สร้าง</span>
            </button>
          )}
        </div>

        {/* Workspace Dropdown Box */}
        <div className="relative group">
          <select
            value={activeProjectId}
            onChange={(e) => setActiveProjectId(e.target.value)}
            className="w-full appearance-none bg-slate-50 dark:bg-slate-900/90 hover:bg-slate-100 dark:hover:bg-slate-900 text-xs font-black text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 rounded-xl py-2 px-3 pr-8 focus:outline-none focus:ring-2 focus:ring-rose-400/40 cursor-pointer transition-all shadow-sm"
          >
            {projects.map(p => (
              <option key={p.id} value={p.id} className="bg-white dark:bg-slate-950 text-slate-800 dark:text-white font-bold py-1">
                [{p.code}] {p.name}
              </option>
            ))}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-slate-400">
            <ChevronDown className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* Workspace Info Card */}
        {activeProject && (
          <div className="mt-2 bg-slate-50 dark:bg-slate-900/60 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800/80 flex items-center justify-between">
            <div className="min-w-0 pr-2">
              <div className="text-[9px] text-slate-500 dark:text-slate-400">ลูกค้า: <strong className="text-slate-700 dark:text-slate-200 font-bold">{activeProject.customer}</strong></div>
              <div className="text-[9px] text-slate-500 dark:text-slate-400 truncate">งบเป้าหมาย: <strong className="text-emerald-600 dark:text-emerald-400 font-mono">฿{(activeProject.targetBudget || 0).toLocaleString('th-TH')}</strong></div>
            </div>
            {isOwner && (
              <div className="flex items-center space-x-1 shrink-0">
                <button
                  onClick={() => onEditProject(activeProject)}
                  className="p-1.5 text-slate-400 hover:text-sky-600 dark:hover:text-sky-400 bg-white dark:bg-slate-800/80 hover:bg-sky-50 dark:hover:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700/60 transition-colors"
                  title="แก้ไขข้อมูล Workspace"
                >
                  <Edit2 className="w-3 h-3" />
                </button>
                <button
                  onClick={() => onDeleteProject(activeProject.id)}
                  className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 bg-white dark:bg-slate-800/80 hover:bg-rose-50 dark:hover:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700/60 transition-colors"
                  title="ลบ Workspace"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 4. Main Navigation Menu */}
      <nav className="flex-1 px-3 py-3 space-y-4 overflow-y-auto overflow-x-hidden no-scrollbar">
        {navGroups.map((group, gIdx) => {
          return (
            <div key={gIdx} className="space-y-1">
              {/* Group Header Title */}
              <div className="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-[0.2em] px-2.5 py-1">
                {group.groupTitle}
              </div>

              {/* Group Menu Items */}
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  const isLocked = item.isProtected && !isOwner;

                  return (
                    <button
                      key={item.id}
                      onClick={() => handleTabClick(item.id)}
                      className={`group w-full flex items-center justify-between px-3 py-2 rounded-xl text-left transition-all duration-200 relative overflow-hidden ${
                        isActive
                          ? 'bg-gradient-to-r from-rose-500 via-rose-500 to-indigo-500 text-white shadow-md shadow-rose-200 dark:shadow-rose-950/40 border border-rose-400/30'
                          : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-900/80 border border-transparent hover:border-slate-200 dark:hover:border-transparent'
                      }`}
                    >
                      {/* Active Left Indicator */}
                      {isActive && (
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-white rounded-r-full shadow-[0_0_8px_rgba(255,255,255,0.8)]"></div>
                      )}

                      <div className="flex items-center space-x-2.5 min-w-0 pr-1">
                        <div className={`p-1.5 rounded-lg flex-shrink-0 transition-colors ${
                          isActive 
                            ? 'bg-white/20 text-white' 
                            : item.isHighlight 
                              ? 'bg-rose-100 dark:bg-rose-500/15 text-rose-500 dark:text-rose-400 group-hover:bg-rose-200 dark:group-hover:bg-rose-500/25' 
                              : 'bg-slate-100 dark:bg-slate-900 text-slate-500 dark:text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200 group-hover:bg-slate-200 dark:group-hover:bg-slate-800'
                        }`}>
                          <Icon className="w-3.5 h-3.5" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-bold truncate leading-tight tracking-wide">
                            {item.label}
                          </div>
                          {item.subLabel && (
                            <div className={`text-[9px] truncate leading-tight mt-0.5 ${
                              isActive ? 'text-rose-100 opacity-90' : 'text-slate-400'
                            }`}>
                              {item.subLabel}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Right Badge / Lock Pill */}
                      {isLocked ? (
                        <span className="px-1.5 py-0.5 rounded-md text-[8px] bg-rose-100 dark:bg-rose-950/80 text-rose-500 dark:text-rose-400 font-bold flex items-center border border-rose-200 dark:border-rose-800/40 shrink-0">
                          <Lock className="w-2.5 h-2.5 mr-0.5" /> Admin
                        </span>
                      ) : item.badge ? (
                        <span className={`px-2 py-0.5 rounded-md text-[9px] font-mono font-bold shadow-sm shrink-0 transition-colors ${
                          isActive 
                            ? 'bg-white/25 text-white' 
                            : 'bg-slate-100 dark:bg-slate-900 text-slate-500 dark:text-slate-300 border border-slate-200 dark:border-slate-800 group-hover:border-slate-300 dark:group-hover:border-slate-700'
                        }`}>
                          {item.badge}
                        </span>
                      ) : null}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}

        {/* 5. Quick Actions */}
        <div className="pt-3 border-t border-slate-200 dark:border-slate-800/80 space-y-2">
          <div className="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-[0.2em] px-2.5">
            QUICK ACTIONS
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => {
                onOpenAddPart();
                if (onCloseMobile) onCloseMobile();
              }}
              className="py-2 px-2 bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-400 hover:to-rose-500 text-white text-[11px] font-bold rounded-xl shadow-md shadow-rose-100 dark:shadow-rose-950/40 transition-all flex items-center justify-center space-x-1 active:scale-95"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ เพิ่ม Part</span>
            </button>

            <button
              onClick={() => {
                onOpenAddModule();
                if (onCloseMobile) onCloseMobile();
              }}
              className="py-2 px-2 bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white text-[11px] font-bold rounded-xl border border-slate-200 dark:border-slate-800 transition-all flex items-center justify-center space-x-1 active:scale-95"
            >
              <Layers className="w-3.5 h-3.5 text-indigo-500" />
              <span>+ Module</span>
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => {
                onOpenExportImport();
                if (onCloseMobile) onCloseMobile();
              }}
              className="py-1.5 px-2 bg-slate-50 dark:bg-slate-900/80 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-300 hover:text-slate-800 dark:hover:text-white text-[10px] font-bold rounded-lg border border-slate-200 dark:border-slate-800 transition-all flex items-center justify-center space-x-1"
              title="Import / Export Excel"
            >
              <Download className="w-3 h-3 text-emerald-500" />
              <span>Excel Import</span>
            </button>

            <button
              onClick={() => {
                onResetData();
                if (onCloseMobile) onCloseMobile();
              }}
              className="py-1.5 px-2 bg-slate-50 dark:bg-slate-900/80 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-slate-400 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-300 text-[10px] font-bold rounded-lg border border-slate-200 dark:border-slate-800 hover:border-rose-200 dark:hover:border-rose-900/40 transition-all flex items-center justify-center space-x-1"
              title="Reset Demo Data"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset Data</span>
            </button>
          </div>
        </div>
      </nav>

      {/* 6. Bottom Status Footer */}
      <div className="p-3 border-t border-slate-200 dark:border-slate-800/80 flex items-center justify-between bg-slate-50 dark:bg-slate-950 text-xs">
        <div className="flex items-center space-x-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_#34d399]"></span>
          <div className="flex flex-col">
            <span className="text-[10px] font-mono font-bold text-slate-600 dark:text-slate-300 leading-tight">PostgreSQL Live</span>
            <span className="text-[8px] font-mono text-slate-400 leading-tight">Render Cloud v2.4</span>
          </div>
        </div>

        <button
          onClick={() => setIsDarkMode(!isDarkMode)}
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 transition-colors"
          title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
        >
          {isDarkMode ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-rose-500" />}
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
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-md transition-opacity"
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

