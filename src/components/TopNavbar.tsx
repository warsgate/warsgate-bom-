import React, { useState, useRef, useEffect } from 'react';
import { 
  Search, 
  FolderKanban, 
  DollarSign, 
  Package, 
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  Calendar,
  Table as TableIcon,
  Cpu,
  ShoppingCart,
  Grid,
  Calculator,
  Library,
  ChevronDown,
  Plus,
  FileSpreadsheet,
  Sun,
  Moon,
  ShieldCheck,
  UserCheck,
  Layers,
  FileText,
  MessageSquare,
  LayoutDashboard,
  History,
  Users,
  Check,
  Sparkles
} from 'lucide-react';
import { ProjectItem } from '../types/bom';
import { formatCurrency } from '../utils/costCalculator';

interface TopNavbarProps {
  activeTab: string;
  onTabChange: (tab: any) => void;
  projects: ProjectItem[];
  activeProjectId: string;
  setActiveProjectId: (id: string) => void;
  activeProject?: ProjectItem;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  totalCost: number;
  totalItems: number;
  totalModules: number;
  isSidebarCollapsed: boolean;
  onToggleSidebarCollapse: () => void;
  onOpenMobileSidebar: () => void;
  onOpenAddPart?: () => void;
  onOpenExportImport?: () => void;
  isDarkMode: boolean;
  setIsDarkMode: (val: boolean) => void;
  userRole?: 'OWNER' | 'ENGINEER';
  user?: any;
  onOpenSwitchUser?: () => void;
}

export const TopNavbar: React.FC<TopNavbarProps> = ({
  activeTab,
  onTabChange,
  projects,
  activeProjectId,
  setActiveProjectId,
  activeProject,
  searchQuery,
  setSearchQuery,
  totalCost,
  totalItems,
  totalModules,
  isSidebarCollapsed,
  onToggleSidebarCollapse,
  onOpenMobileSidebar,
  onOpenAddPart,
  onOpenExportImport,
  isDarkMode,
  setIsDarkMode,
  userRole = 'ENGINEER',
  user,
  onOpenSwitchUser,
}) => {
  const [isProjectDropdownOpen, setIsProjectDropdownOpen] = useState(false);
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);

  const projectDropdownRef = useRef<HTMLDivElement>(null);
  const moreMenuRef = useRef<HTMLDivElement>(null);

  const isOwner = user?.role === 'LEVEL_2' || userRole === 'OWNER';

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (projectDropdownRef.current && !projectDropdownRef.current.contains(event.target as Node)) {
        setIsProjectDropdownOpen(false);
      }
      if (moreMenuRef.current && !moreMenuRef.current.contains(event.target as Node)) {
        setIsMoreMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Primary top navigation items
  const mainNavItems = [
    { id: 'master-plan', label: 'Master Plan', icon: Calendar, badge: 'Gantt' },
    { id: 'bom', label: 'BOM List', icon: TableIcon, badge: totalItems > 0 ? totalItems : undefined },
    { id: 'production-workflow', label: 'Workflow', icon: Cpu, badge: '9 ขั้นตอน' },
    { id: 'procurement', label: 'จัดซื้อ (PO)', icon: ShoppingCart },
    { id: 'all-modules', label: 'Modules', icon: Grid, badge: totalModules > 0 ? totalModules : undefined },
    { id: 'report', label: 'สรุปต้นทุน', icon: Calculator },
    { id: 'master-library', label: 'คลังอะไหล่', icon: Library },
  ];

  // Secondary "More" navigation items
  const moreNavItems = [
    { id: 'modules', label: 'MC & EE Relationship', subLabel: 'ความสัมพันธ์กลไกและไฟฟ้า', icon: Layers },
    { id: 'quotations', label: 'ใบเสนอราคา & เอกสาร', subLabel: 'Vendor Quotations', icon: FileText },
    { id: 'line-notify', label: 'แจ้งเตือน LINE Bot', subLabel: 'Real-time Alerts & Scheduler', icon: MessageSquare },
    { id: 'dashboard', label: 'Dashboard ภาพรวม', subLabel: 'Executive KPIs & Charts', icon: LayoutDashboard, isProtected: true },
    { id: 'workspaces', label: 'จัดการ Workspace', subLabel: 'สร้าง/แก้ไขโปรเจ็ค', icon: FolderKanban, isProtected: true },
    { id: 'users', label: 'จัดการสิทธิ์ผู้ใช้งาน', subLabel: 'User Roles & Access', icon: Users, isProtected: true },
    { id: 'history', label: 'ประวัติการทำงาน (History)', subLabel: 'System Audit Logs', icon: History, isProtected: true },
  ];

  const isCurrentTabInMore = moreNavItems.some(item => item.id === activeTab);

  return (
    <header className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-3 sm:px-4 py-2 sticky top-0 z-30 shadow-sm print:hidden select-none transition-colors duration-200">
      <div className="flex items-center justify-between gap-2.5">
        
        {/* ─── LEFT: Sidebar Toggle, Brand & Project Selector ─── */}
        <div className="flex items-center space-x-2 sm:space-x-3 flex-shrink-0">
          
          {/* 1. Mobile Sidebar Toggle Button */}
          <button
            onClick={onOpenMobileSidebar}
            className="lg:hidden p-1.5 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 transition-colors"
            title="เปิดเมนูหลัก (Mobile Drawer)"
          >
            <Menu className="w-4 h-4 text-red-600 dark:text-red-400" />
          </button>

          {/* 2. Desktop Sidebar Collapse/Expand Toggle Button */}
          <button
            onClick={onToggleSidebarCollapse}
            className={`hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-bold transition-all duration-200 shadow-sm ${
              isSidebarCollapsed
                ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-900/50 hover:bg-rose-100 dark:hover:bg-rose-900/60 ring-2 ring-rose-500/20'
                : 'bg-slate-100/80 dark:bg-slate-800/80 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
            title={isSidebarCollapsed ? "แสดงเมนูด้านซ้าย (Ctrl+B)" : "ซ่อนเมนูด้านซ้าย เพื่อขยายหน้าจอเต็ม (Ctrl+B)"}
          >
            {isSidebarCollapsed ? (
              <>
                <PanelLeftOpen className="w-4 h-4 text-rose-600 dark:text-rose-400 animate-pulse" />
                <span className="text-[11px] font-mono font-black">แสดงเมนู</span>
              </>
            ) : (
              <>
                <PanelLeftClose className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                <span className="text-[11px] font-mono font-medium text-slate-500 dark:text-slate-400">ซ่อนเมนู</span>
              </>
            )}
          </button>

          {/* 3. Small Logo Indicator when Sidebar is collapsed */}
          {isSidebarCollapsed && (
            <div className="hidden lg:flex items-center space-x-1.5 pr-1 border-r border-slate-200 dark:border-slate-800">
              <img src="/logo.png" alt="WARSGATE" className="h-6 object-contain" />
            </div>
          )}

          {/* 4. Active Project Selector Dropdown */}
          <div className="relative" ref={projectDropdownRef}>
            <button
              onClick={() => setIsProjectDropdownOpen(!isProjectDropdownOpen)}
              className="flex items-center space-x-2 px-2.5 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-950/80 hover:bg-slate-100 dark:hover:bg-slate-800/80 border border-slate-200 dark:border-slate-800 text-left transition-all group max-w-[200px] sm:max-w-[280px]"
              title="คลิกเพื่อสลับโปรเจ็ค / Workspace"
            >
              <div className="p-1 rounded-lg bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400 shrink-0">
                <FolderKanban className="w-3.5 h-3.5" />
              </div>
              <div className="truncate min-w-0">
                <div className="flex items-center space-x-1.5 truncate">
                  <span className="font-mono font-black text-[11px] text-red-600 dark:text-red-400">
                    [{activeProject?.code || 'PRJ'}]
                  </span>
                  <span className="text-xs font-black text-slate-800 dark:text-slate-100 truncate">
                    {activeProject?.name || 'Select Project'}
                  </span>
                </div>
              </div>
              <ChevronDown className={`w-3.5 h-3.5 text-slate-400 shrink-0 transition-transform duration-200 ${isProjectDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown Menu for Workspaces */}
            {isProjectDropdownOpen && (
              <div className="absolute left-0 mt-1.5 w-72 sm:w-80 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="px-3 py-1.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  <span>สลับ Workspace ({projects.length})</span>
                  <span className="text-[10px] font-mono text-red-500">Live Workspaces</span>
                </div>

                <div className="max-h-64 overflow-y-auto py-1">
                  {projects.map((proj) => {
                    const isCurrent = proj.id === activeProjectId;
                    return (
                      <button
                        key={proj.id}
                        onClick={() => {
                          setActiveProjectId(proj.id);
                          setIsProjectDropdownOpen(false);
                        }}
                        className={`w-full px-3 py-2 text-left flex items-center justify-between transition-colors ${
                          isCurrent
                            ? 'bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-300'
                            : 'hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-200'
                        }`}
                      >
                        <div className="min-w-0 pr-2">
                          <div className="flex items-center space-x-1.5">
                            <span className="font-mono font-black text-xs text-red-600 dark:text-red-400">
                              [{proj.code}]
                            </span>
                            <span className="text-xs font-bold truncate">{proj.name}</span>
                          </div>
                          <div className="text-[10px] text-slate-400 truncate mt-0.5">
                            ลูกค้า: {proj.customer || '-'} {proj.dwgNo ? `| DWG: ${proj.dwgNo}` : ''}
                          </div>
                        </div>
                        {isCurrent && <Check className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0" />}
                      </button>
                    );
                  })}
                </div>

                {isOwner && (
                  <div className="px-2 pt-1 border-t border-slate-100 dark:border-slate-800 mt-1">
                    <button
                      onClick={() => {
                        onTabChange('workspaces');
                        setIsProjectDropdownOpen(false);
                      }}
                      className="w-full py-1.5 text-center text-xs font-bold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-xl transition-colors"
                    >
                      + จัดการหรือเพิ่ม Workspace ทั้งหมด
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

        </div>

        {/* ─── CENTER: Desktop Horizontal Navigation Menu Bar ─── */}
        <nav className="hidden xl:flex items-center space-x-1 overflow-x-auto no-scrollbar py-0.5 px-2 bg-slate-100/70 dark:bg-slate-950/70 rounded-2xl border border-slate-200/80 dark:border-slate-800/80">
          {mainNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all duration-150 ${
                  isActive
                    ? 'bg-white dark:bg-slate-800 text-red-600 dark:text-red-400 shadow-sm border border-slate-200/80 dark:border-slate-700/80 scale-[1.02]'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-slate-800/50'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-red-600 dark:text-red-400' : 'text-slate-400'}`} />
                <span>{item.label}</span>
                {item.badge !== undefined && (
                  <span className={`text-[9px] font-mono font-bold px-1.5 py-0.2 rounded-md ${
                    isActive
                      ? 'bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-300'
                      : 'bg-slate-200/80 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                  }`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}

          {/* "More" Dropdown Menu for secondary tabs */}
          <div className="relative" ref={moreMenuRef}>
            <button
              onClick={() => setIsMoreMenuOpen(!isMoreMenuOpen)}
              className={`flex items-center space-x-1 px-2.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all duration-150 ${
                isCurrentTabInMore
                  ? 'bg-white dark:bg-slate-800 text-red-600 dark:text-red-400 shadow-sm border border-slate-200/80 dark:border-slate-700/80'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-slate-800/50'
              }`}
            >
              <span>เพิ่มเติม</span>
              <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${isMoreMenuOpen ? 'rotate-180' : ''}`} />
            </button>

            {isMoreMenuOpen && (
              <div className="absolute right-0 mt-1.5 w-64 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800">
                  เมนูเพิ่มเติม (Secondary Views)
                </div>
                <div className="py-1">
                  {moreNavItems.map((item) => {
                    if (item.isProtected && !isOwner) return null;
                    const Icon = item.icon;
                    const isTabActive = activeTab === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          onTabChange(item.id);
                          setIsMoreMenuOpen(false);
                        }}
                        className={`w-full px-3 py-2 text-left flex items-center space-x-2.5 transition-colors ${
                          isTabActive
                            ? 'bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-300 font-bold'
                            : 'hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        <Icon className={`w-4 h-4 ${isTabActive ? 'text-red-600 dark:text-red-400' : 'text-slate-400'}`} />
                        <div className="min-w-0">
                          <div className="text-xs truncate">{item.label}</div>
                          {item.subLabel && <div className="text-[10px] text-slate-400 truncate">{item.subLabel}</div>}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </nav>

        {/* ─── RIGHT: Search, Quick KPI & Actions ─── */}
        <div className="flex items-center space-x-2 flex-shrink-0">
          
          {/* Global Search Input */}
          <div className="relative w-32 sm:w-44 lg:w-56">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ค้นหา Part, DWG..."
              className="w-full pl-7 pr-2.5 py-1.5 text-xs bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-red-500 font-bold transition-all"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
          </div>

          {/* Quick KPI Badge (Parts & Total Amount) */}
          <div className="hidden lg:flex items-center space-x-2.5 px-2.5 py-1.5 rounded-xl bg-slate-100/90 dark:bg-slate-950/90 border border-slate-200 dark:border-slate-800 text-xs font-bold flex-shrink-0">
            <div className="flex items-center text-slate-600 dark:text-slate-300">
              <Package className="w-3.5 h-3.5 mr-1 text-slate-400" />
              <span>{totalItems} Parts</span>
            </div>
            <div className="h-3 w-px bg-slate-300 dark:bg-slate-700"></div>
            <div className="flex items-center text-slate-900 dark:text-white font-black font-mono">
              <DollarSign className="w-3.5 h-3.5 mr-0.5 text-emerald-500" />
              <span>{formatCurrency(totalCost)}</span>
            </div>
          </div>

          {/* Quick Action Button: Add Part */}
          {onOpenAddPart && (
            <button
              onClick={onOpenAddPart}
              className="hidden sm:flex items-center space-x-1 px-2.5 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-sm shadow-red-600/20 hover:shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all"
              title="เพิ่มรายการอะไหล่ใหม่ (Add Part)"
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden md:inline">เพิ่ม Part</span>
            </button>
          )}

          {/* Quick Action Button: Export/Import */}
          {onOpenExportImport && (
            <button
              onClick={onOpenExportImport}
              className="hidden md:flex p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 transition-colors"
              title="นำเข้า/ส่งออก Excel (Export / Import)"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            </button>
          )}

          {/* Dark / Light Mode Toggle */}
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 transition-colors"
            title={isDarkMode ? "เปลี่ยนเป็นธีมสว่าง (Light Mode)" : "เปลี่ยนเป็นธีมมืด (Dark Mode)"}
          >
            {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
          </button>

          {/* User Profile & Switch Role Pill */}
          {onOpenSwitchUser && (
            <button
              onClick={onOpenSwitchUser}
              className={`flex items-center space-x-1.5 px-2 py-1 rounded-xl border text-xs transition-all shadow-sm ${
                isOwner
                  ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-200 border-amber-300 dark:border-amber-600/30 hover:border-amber-400'
                  : 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-800 dark:text-indigo-200 border-indigo-200 dark:border-indigo-600/30 hover:border-indigo-400'
              }`}
              title="คลิกเพื่อสลับผู้ใช้งาน / สลับสิทธิ์ (Switch User)"
            >
              <div className={`w-5 h-5 rounded-lg flex items-center justify-center font-bold shrink-0 ${
                isOwner ? 'bg-amber-200/80 dark:bg-amber-500/30 text-amber-700 dark:text-amber-300' : 'bg-indigo-200/80 dark:bg-indigo-500/30 text-indigo-700 dark:text-indigo-300'
              }`}>
                {isOwner ? <ShieldCheck className="w-3.5 h-3.5" /> : <UserCheck className="w-3.5 h-3.5" />}
              </div>
              <span className="font-bold text-[11px] hidden sm:inline truncate max-w-[80px]">
                {user?.name || user?.username || (isOwner ? 'Admin' : 'Engineer')}
              </span>
            </button>
          )}

        </div>

      </div>
    </header>
  );
};
