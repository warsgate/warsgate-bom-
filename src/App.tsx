import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { projectsApi, modulesApi, partsApi, masterTasksApi } from './api/client';
import { Sidebar } from './components/Sidebar';
import { TopNavbar } from './components/TopNavbar';
import { Dashboard } from './components/Dashboard';
import { MasterPlanGanttView } from './components/MasterPlanGanttView';
import { AllModulesView } from './components/AllModulesView';
import { ModuleList } from './components/ModuleList';
import { BomTable } from './components/BomTable';
import { ProcurementView } from './components/ProcurementView';
import { CostSummaryReport } from './components/CostSummaryReport';
import { ExecutiveAuthOverlay } from './components/ExecutiveAuthOverlay';
import { PartModal } from './components/PartModal';
import { ModuleModal } from './components/ModuleModal';
import { ProjectModal } from './components/ProjectModal';
import { MasterTaskModal } from './components/MasterTaskModal';
import { ActualCompletionModal } from './components/ActualCompletionModal';
import { ExportImportModal } from './components/ExportImportModal';
import { MasterPartLibrary } from './components/MasterPartLibrary';
import { QuotationsView } from './components/QuotationsView';
import { BomPartItem, MasterPlanTaskItem, ModuleItem, ProjectItem, PartStatus } from './types/bom';
import { calculateProjectCostSummary } from './utils/costCalculator';
import { LoginPage } from './pages/LoginPage';
import { useAuth } from './contexts/AuthContext';
import { HistoryLogTable } from './components/HistoryLogTable';

export function App() {
  const { isAuthenticated, isLoading: authLoading, user, logout } = useAuth();
  
  const [activeTab, setActiveTab] = useState<'dashboard' | 'master-plan' | 'all-modules' | 'modules' | 'bom' | 'procurement' | 'report' | 'master-library' | 'quotations' | 'history'>('master-plan');
  const [searchQuery, setSearchQuery] = useState('');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [activeProjectId, setActiveProjectId] = useState<string>('proj-1');
  const [isLoading, setIsLoading] = useState(true);

  if (authLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div></div>;
  }

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  // Ensure LEVEL_1 user cannot access dashboard or history
  if (user?.role === 'LEVEL_1' && (activeTab === 'dashboard' || activeTab === 'history')) {
    setActiveTab('master-plan');
  }

  // Data state (replaces Dexie useLiveQuery)
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [allModules, setAllModules] = useState<ModuleItem[]>([]);
  const [allParts, setAllParts] = useState<BomPartItem[]>([]);
  const [allMasterTasks, setAllMasterTasks] = useState<MasterPlanTaskItem[]>([]);

  // Modal states
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<ProjectItem | null>(null);
  const [isPartModalOpen, setIsPartModalOpen] = useState(false);
  const [editingPart, setEditingPart] = useState<BomPartItem | null>(null);
  const [defaultPartModuleId, setDefaultPartModuleId] = useState<string | undefined>(undefined);
  const [isModuleModalOpen, setIsModuleModalOpen] = useState(false);
  const [editingModule, setEditingModule] = useState<ModuleItem | null>(null);
  const [isMasterTaskModalOpen, setIsMasterTaskModalOpen] = useState(false);
  const [editingMasterTask, setEditingMasterTask] = useState<MasterPlanTaskItem | null>(null);
  const [isActualModalOpen, setIsActualModalOpen] = useState(false);
  const [actualTask, setActualTask] = useState<MasterPlanTaskItem | null>(null);
  const [clickedDateIso, setClickedDateIso] = useState<string>('');
  const [isExportImportOpen, setIsExportImportOpen] = useState(false);

  // Sync dark mode
  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDarkMode);
  }, [isDarkMode]);

  // ─── Load All Data from API ────────────────────────────────
  const loadAll = useCallback(async (showLoading = true) => {
    try {
      if (showLoading) setIsLoading(true);
      const [proj, mods, pts, tasks] = await Promise.all([
        projectsApi.getAll(),
        modulesApi.getAll(),
        partsApi.getAll(),
        masterTasksApi.getAll(),
      ]);
      setProjects(proj);
      setAllModules(mods);
      setAllParts(pts);
      setAllMasterTasks(tasks);
      if (proj.length > 0 && !proj.find((p: ProjectItem) => p.id === activeProjectId)) {
        setActiveProjectId(proj[0].id);
      }
    } catch (err) {
      console.error('Failed to load data from API:', err);
    } finally {
      if (showLoading) setIsLoading(false);
    }
  }, [activeProjectId]);

  useEffect(() => { 
    loadAll(true); 
    
    // Auto-refresh background polling every 5 seconds
    const intervalId = setInterval(() => {
      loadAll(false);
    }, 5000);

    return () => clearInterval(intervalId);
  }, [loadAll]);

  const activeProject = projects.find(p => p.id === activeProjectId) || projects[0];

  const projectModules = useMemo(() => allModules.filter(m => m.projectId === activeProjectId), [allModules, activeProjectId]);
  const projectParts = useMemo(() => allParts.filter(p => p.projectId === activeProjectId), [allParts, activeProjectId]);
  const projectMasterTasks = useMemo(() => allMasterTasks.filter(t => t.projectId === activeProjectId), [allMasterTasks, activeProjectId]);

  const costSummary = useMemo(() => calculateProjectCostSummary(projectModules, projectParts), [projectModules, projectParts]);

  // Handle shifts from gantt view
  const handleSaveProject = async (data: Partial<ProjectItem>) => {
    if (data.id) {
      const updated = await projectsApi.update(data.id, data);
      setProjects(prev => prev.map(p => p.id === updated.id ? updated : p));
    } else {
      const created = await projectsApi.create({ ...data, status: 'Active' });
      setProjects(prev => [...prev, created]);
      setActiveProjectId(created.id);
    }
  };

  // ─── Module CRUD ──────────────────────────────────────────
  const handleSaveModule = async (data: Partial<ModuleItem>) => {
    if (data.id) {
      const updated = await modulesApi.update(data.id, data);
      setAllModules(prev => prev.map(m => m.id === updated.id ? updated : m));
    } else {
      const created = await modulesApi.create({ ...data, projectId: activeProjectId, status: 'Active' });
      setAllModules(prev => [...prev, created]);
    }
  };

  const handleDeleteModule = async (id: string) => {
    if (!confirm('ต้องการลบ Module นี้หรือไม่?')) return;
    await modulesApi.delete(id);
    setAllModules(prev => prev.filter(m => m.id !== id));
  };

  // ─── Part CRUD ────────────────────────────────────────────
  const handleSavePart = async (data: Partial<BomPartItem>) => {
    const totalAmount = (data.qty || 1) * (data.unitPrice || 0);
    if (data.id) {
      const updated = await partsApi.update(data.id, { ...data, totalAmount });
      setAllParts(prev => prev.map(p => p.id === updated.id ? updated : p));
    } else {
      const created = await partsApi.create({
        ...data,
        projectId: activeProjectId,
        moduleId: data.moduleId || projectModules[0]?.id,
        totalAmount,
        targetTotalAmount: (data.qty || 1) * (data.targetUnitPrice || data.unitPrice || 0),
        status: data.status || 'Planned',
        workflowStage: data.workflowStage || '2. BOM Part List',
      });
      setAllParts(prev => [...prev, created]);
    }
  };

  const handleUpdatePartStatus = async (id: string, status: PartStatus, extra?: any) => {
    const updated = await partsApi.update(id, { status, ...extra });
    setAllParts(prev => prev.map(p => p.id === updated.id ? updated : p));
  };

  const handleDeletePart = async (id: string) => {
    if (!confirm('ต้องการลบ Part นี้หรือไม่?')) return;
    await partsApi.delete(id);
    setAllParts(prev => prev.filter(p => p.id !== id));
  };

  const handleImportParts = async (importedParts: Partial<BomPartItem>[]) => {
    const formatted = importedParts.map((p, idx) => ({
      ...p,
      projectId: activeProjectId,
      moduleId: p.moduleId || projectModules[0]?.id,
      totalAmount: (p.qty || 1) * (p.unitPrice || 0),
      targetTotalAmount: (p.qty || 1) * (p.targetUnitPrice || p.unitPrice || 0),
      status: p.status || 'Planned',
      workflowStage: p.workflowStage || '2. BOM Part List',
    }));
    await partsApi.bulkImport(formatted);
    const updated = await partsApi.getAll(activeProjectId);
    setAllParts(prev => [...prev.filter(p => p.projectId !== activeProjectId), ...updated]);
  };

  // ─── Master Task CRUD ─────────────────────────────────────
  const [pendingShiftedTasks, setPendingShiftedTasks] = useState<MasterPlanTaskItem[]>([]);

  const handleSaveMasterTask = async (data: Partial<MasterPlanTaskItem>) => {
    let savedTask: MasterPlanTaskItem;
    if (data.id) {
      savedTask = await masterTasksApi.update(data.id, data);
      setAllMasterTasks(prev => prev.map(t => t.id === savedTask.id ? savedTask : t));
    } else {
      savedTask = await masterTasksApi.create({ ...data, projectId: activeProjectId, status: data.status || 'Pending' });
      setAllMasterTasks(prev => [...prev, savedTask]);
    }

    // Apply any pending shifted tasks (auto WBS shifting)
    if (pendingShiftedTasks.length > 0) {
      try {
        const updatedBatch = await masterTasksApi.updateBatch(pendingShiftedTasks);
        setAllMasterTasks(prev => {
          const map = new Map(updatedBatch.map((t: any) => [t.id, t]));
          return prev.map(t => map.has(t.id) ? map.get(t.id) : t);
        });
      } catch (err) {
        console.error("Failed to apply WBS shift batch update", err);
      }
      setPendingShiftedTasks([]);
    }
  };

  const handleInsertTask = (baseTask: MasterPlanTaskItem, mode: 'below' | 'sub') => {
    let newWbs = '';
    let newParentId: string | undefined = undefined;
    const shiftedTasks: MasterPlanTaskItem[] = [];

    // Basic numerical wbs check
    const isNum = (str: string) => !isNaN(Number(str));

    if (mode === 'sub') {
      // Add Sub Task under a Main Task
      newParentId = baseTask.id;
      const subTasks = projectMasterTasks.filter(t => t.parentId === baseTask.id);
      if (subTasks.length > 0) {
        const lastSub = subTasks[subTasks.length - 1];
        const parts = lastSub.wbs.split('.');
        if (parts.length >= 2 && isNum(parts[1])) {
          newWbs = `${parts[0]}.${Number(parts[1]) + 1}`;
        } else {
          newWbs = `${baseTask.wbs}.1`;
        }
      } else {
        newWbs = `${baseTask.wbs}.1`;
      }
    } else if (mode === 'below') {
      // Insert Below
      newParentId = baseTask.parentId;
      const parts = baseTask.wbs.split('.');
      
      if (!baseTask.parentId) {
        // Main Task
        if (parts.length > 0 && isNum(parts[0])) {
          const baseNum = Number(parts[0]);
          newWbs = `${baseNum + 1}.0`;
          
          // Shift all Main Tasks >= baseNum + 1
          projectMasterTasks.forEach(t => {
            const tParts = t.wbs.split('.');
            if (tParts.length > 0 && isNum(tParts[0])) {
              const tNum = Number(tParts[0]);
              if (tNum >= baseNum + 1) {
                const shiftedWbs = `${tNum + 1}${tParts.slice(1).length > 0 ? '.' + tParts.slice(1).join('.') : ''}`;
                shiftedTasks.push({ ...t, wbs: shiftedWbs });
              }
            }
          });
        }
      } else {
        // Sub Task
        if (parts.length >= 2 && isNum(parts[1])) {
          const baseSubNum = Number(parts[1]);
          newWbs = `${parts[0]}.${baseSubNum + 1}`;
          
          // Shift all Sub Tasks in the SAME parent >= baseSubNum + 1
          projectMasterTasks.filter(t => t.parentId === baseTask.parentId).forEach(t => {
            const tParts = t.wbs.split('.');
            if (tParts.length >= 2 && isNum(tParts[1])) {
              const tSubNum = Number(tParts[1]);
              if (tSubNum >= baseSubNum + 1) {
                const shiftedWbs = `${tParts[0]}.${tSubNum + 1}`;
                shiftedTasks.push({ ...t, wbs: shiftedWbs });
              }
            }
          });
        }
      }
    }

    setPendingShiftedTasks(shiftedTasks);
    setEditingMasterTask({
      wbs: newWbs || '',
      parentId: newParentId,
      stageName: baseTask.stageName, // copy stage
      title: '',
      planStartDate: baseTask.planStartDate,
      planEndDate: baseTask.planEndDate,
    } as any);
    setIsMasterTaskModalOpen(true);
  };

  const handleUpdateTaskDates = async (id: string, dates: any) => {
    const updated = await masterTasksApi.update(id, dates);
    setAllMasterTasks(prev => prev.map(t => t.id === updated.id ? updated : t));
  };

  const handleToggleCellActualDate = async (task: MasterPlanTaskItem, dateIso: string) => {
    const isAdding = !(task.actualDates || []).includes(dateIso);
    const tasksToUpdate = [task];

    if (!task.parentId) {
      const subTasks = projectMasterTasks.filter(t => t.parentId === task.id);
      tasksToUpdate.push(...subTasks);
    }

    const updatedTasksPayload = tasksToUpdate.map(t => {
      const current = t.actualDates || [];
      const updatedDates = isAdding 
        ? (current.includes(dateIso) ? current : [...current, dateIso].sort())
        : current.filter(d => d !== dateIso);
      
      return {
        ...t,
        actualDates: updatedDates,
        actualStartDate: updatedDates[0] || '',
        actualEndDate: updatedDates[updatedDates.length - 1] || '',
        status: updatedDates.length > 0 ? 'In Progress' : 'Pending',
      };
    });

    try {
      const updatedBatch = await masterTasksApi.updateBatch(updatedTasksPayload);
      setAllMasterTasks(prev => {
        const map = new Map(updatedBatch.map((t: any) => [t.id, t]));
        return prev.map(t => map.has(t.id) ? map.get(t.id) : t);
      });
    } catch (err) {
      console.error('Failed to toggle actual date', err);
    }
  };

  const handleUpdateCellRange = async (task: MasterPlanTaskItem, isoDates: string[], isAdding: boolean) => {
    const tasksToUpdate = [task];
    if (!task.parentId) {
      const subTasks = projectMasterTasks.filter(t => t.parentId === task.id);
      tasksToUpdate.push(...subTasks);
    }

    const updatedTasksPayload = tasksToUpdate.map(t => {
      const current = new Set(t.actualDates || []);
      isoDates.forEach(d => isAdding ? current.add(d) : current.delete(d));
      const updatedDates = Array.from(current).sort();
      return {
        ...t,
        actualDates: updatedDates,
        actualStartDate: updatedDates[0] || '',
        actualEndDate: updatedDates[updatedDates.length - 1] || '',
        status: updatedDates.length > 0 ? 'In Progress' : 'Pending',
      };
    });

    try {
      const updatedBatch = await masterTasksApi.updateBatch(updatedTasksPayload);
      setAllMasterTasks(prev => {
        const map = new Map(updatedBatch.map((t: any) => [t.id, t]));
        return prev.map(t => map.has(t.id) ? map.get(t.id) : t);
      });
    } catch (err) {}
  };

  const handleSaveActualCompletion = async (id: string, data: any) => {
    const task = projectMasterTasks.find(t => t.id === id);
    if (!task) return;

    const tasksToUpdate = [{ ...task, ...data }];
    if (!task.parentId) {
      const subTasks = projectMasterTasks.filter(t => t.parentId === task.id);
      subTasks.forEach(sub => {
        // data contains actual dates and progress
        tasksToUpdate.push({ ...sub, ...data });
      });
    }

    try {
      const updatedBatch = await masterTasksApi.updateBatch(tasksToUpdate);
      setAllMasterTasks(prev => {
        const map = new Map(updatedBatch.map((t: any) => [t.id, t]));
        return prev.map(t => map.has(t.id) ? map.get(t.id) : t);
      });
    } catch (err) {}
  };

  const handleClearActualCompletion = async (id: string) => {
    const task = projectMasterTasks.find(t => t.id === id);
    if (!task) return;

    const clearData = { actualStartDate: '', actualEndDate: '', actualDates: [], progressPct: 0, status: 'Pending' };
    const tasksToUpdate = [{ ...task, ...clearData }];
    
    if (!task.parentId) {
      const subTasks = projectMasterTasks.filter(t => t.parentId === task.id);
      subTasks.forEach(sub => tasksToUpdate.push({ ...sub, ...clearData }));
    }

    try {
      const updatedBatch = await masterTasksApi.updateBatch(tasksToUpdate);
      setAllMasterTasks(prev => {
        const map = new Map(updatedBatch.map((t: any) => [t.id, t]));
        return prev.map(t => map.has(t.id) ? map.get(t.id) : t);
      });
    } catch (err) {}
  };

  const handleDeleteMasterTask = async (id: string) => {
    await masterTasksApi.delete(id);
    setAllMasterTasks(prev => prev.filter(t => t.id !== id));
  };

  // ─── Reset ────────────────────────────────────────────────
  const handleResetData = async () => {
    if (confirm('คืนค่าข้อมูลเป็นตัวอย่างเดิม? (ต้องรัน seed ที่ backend)')) {
      alert('กรุณารันคำสั่ง: npm run db:seed ที่โฟลเดอร์ backend แล้วรีเฟรชหน้าเว็บครับ');
    }
  };

  // ─── Project Actions ──────────────────────────────────────
  const handleEditProject = (project: ProjectItem) => {
    setEditingProject(project);
    setIsProjectModalOpen(true);
  };

  const handleDeleteProject = async (id: string) => {
    if (window.confirm('คุณแน่ใจหรือไม่ว่าต้องการลบโปรเจกต์นี้? ข้อมูลทั้งหมดในโปรเจกต์จะถูกลบถาวร!')) {
      try {
        await projectsApi.delete(id);
        setProjects(prev => prev.filter(p => p.id !== id));
        if (activeProjectId === id) {
          const remaining = projects.filter(p => p.id !== id);
          if (remaining.length > 0) {
            setActiveProjectId(remaining[0].id);
          } else {
            setActiveProjectId('');
          }
        }
      } catch (error) {
        console.error('Error deleting project:', error);
        alert('เกิดข้อผิดพลาดในการลบโปรเจกต์');
      }
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="text-center">
          <div className="w-12 h-12 rounded-full border-4 border-red-600 border-t-transparent animate-spin mx-auto mb-4"></div>
          <p className="font-black text-slate-700 dark:text-slate-300 text-sm">กำลังโหลดข้อมูลจาก Backend...</p>
          <p className="text-xs text-slate-400 mt-1">WARSGATE BOM API</p>
        </div>
      </div>
    );
  }

  const handleSaveDailyNote = async (taskId: string, dateIso: string, note: string) => {
    const task = projectMasterTasks.find(t => t.id === taskId);
    if (!task) return;

    const tasksToUpdate = [task];
    if (!task.parentId) {
      const subTasks = projectMasterTasks.filter(t => t.parentId === task.id);
      tasksToUpdate.push(...subTasks);
    }

    const updatedTasksPayload = tasksToUpdate.map(t => {
      const currentNotes = t.dailyNotes ? { ...t.dailyNotes } : {};
      if (note.trim()) {
        currentNotes[dateIso] = note.trim();
      } else {
        delete currentNotes[dateIso];
      }
      return { ...t, dailyNotes: currentNotes };
    });

    try {
      const updatedBatch = await masterTasksApi.updateBatch(updatedTasksPayload);
      setAllMasterTasks(prev => {
        const map = new Map(updatedBatch.map((t: any) => [t.id, t]));
        return prev.map(t => map.has(t.id) ? map.get(t.id) : t);
      });
    } catch (err) {
      console.error('Failed to save daily note', err);
    }
  };

  return (
    <div className="flex h-screen print:h-auto overflow-hidden print:overflow-visible bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 font-sans transition-colors duration-200">
      <Sidebar 
        activeTab={activeTab} 
        onTabChange={setActiveTab} 
        projects={projects}
        activeProjectId={activeProjectId}
        setActiveProjectId={setActiveProjectId}
        onOpenAddProject={() => { setEditingProject(null); setIsProjectModalOpen(true); }}
        onOpenAddPart={() => { setEditingPart(null); setIsPartModalOpen(true); }}
        onOpenAddModule={() => { setEditingModule(null); setIsModuleModalOpen(true); }}
        onOpenExportImport={() => setIsExportImportOpen(true)}
        onResetData={handleResetData}
        totalItems={projectParts.length}
        totalModules={projectModules.length}
        isDarkMode={isDarkMode}
        setIsDarkMode={setIsDarkMode}
        isMobileOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
        userRole={user?.role === 'LEVEL_2' ? 'OWNER' : 'ENGINEER'}
        setUserRole={() => {}} // No longer manually toggleable
        onEditProject={handleEditProject}
        onDeleteProject={handleDeleteProject}
      />

      <div className="flex-1 flex flex-col h-screen print:h-auto overflow-y-auto print:overflow-visible">
        <TopNavbar
          activeProject={activeProject}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          totalCost={costSummary.totalProjectCost}
          totalItems={projectParts.length}
          onOpenMobileSidebar={() => setIsMobileSidebarOpen(true)}
        />

        <main className="flex-1 p-4 sm:p-6 max-w-7xl w-full mx-auto">
          {activeTab === 'dashboard' && (
            (user?.role === 'LEVEL_2' ? 'OWNER' : 'ENGINEER') === 'OWNER' ? (
              <Dashboard summary={costSummary} modules={projectModules} onSelectModuleTab={() => setActiveTab('modules')} onSelectBomTab={() => setActiveTab('bom')} isDarkMode={isDarkMode} />
            ) : (
              <ExecutiveAuthOverlay onUnlock={() => {}} onSwitchToEngineer={() => setActiveTab('all-modules')} />
            )
          )}

          {activeTab === 'master-plan' && (
            <MasterPlanGanttView
              project={activeProject}
              modules={projectModules}
              parts={projectParts}
              masterTasks={projectMasterTasks}
              onOpenAddTask={() => {
                setEditingMasterTask(null);
                setPendingShiftedTasks([]);
                setIsMasterTaskModalOpen(true);
              }}
              onOpenEditTask={(t) => {
                setEditingMasterTask(t);
                setPendingShiftedTasks([]);
                setIsMasterTaskModalOpen(true);
              }}
              onDeleteTask={handleDeleteMasterTask}
              onInsertTask={handleInsertTask}
              onUpdateTaskDates={handleUpdateTaskDates}
              onOpenActualCompletionPopup={(t, d) => { setActualTask(t); setClickedDateIso(d); setIsActualModalOpen(true); }}
              onToggleCellActualDate={handleToggleCellActualDate}
              onUpdateCellRange={handleUpdateCellRange}
              onSaveDailyNote={handleSaveDailyNote}
            />
          )}

          {activeTab === 'all-modules' && (
            <AllModulesView
              modules={projectModules}
              parts={projectParts}
              onSelectModuleForDetail={() => setActiveTab('modules')}
              onOpenAddModule={() => { setEditingModule(null); setIsModuleModalOpen(true); }}
              onOpenEditModule={(m) => { setEditingModule(m); setIsModuleModalOpen(true); }}
              onOpenAddPartToModule={(modId) => { setEditingPart(null); setDefaultPartModuleId(modId); setIsPartModalOpen(true); }}
              onDeleteModule={handleDeleteModule}
            />
          )}

          {activeTab === 'modules' && (
            <ModuleList
              modules={projectModules}
              parts={projectParts}
              onAddPartToModule={(modId) => { setEditingPart(null); setDefaultPartModuleId(modId); setIsPartModalOpen(true); }}
              onEditModule={(m) => { setEditingModule(m); setIsModuleModalOpen(true); }}
              onDeleteModule={handleDeleteModule}
              onEditPart={(p) => { setEditingPart(p); setIsPartModalOpen(true); }}
            />
          )}

          {activeTab === 'bom' && (
            <BomTable
              parts={projectParts}
              modules={projectModules}
              onAddPart={() => { setEditingPart(null); setIsPartModalOpen(true); }}
              onEditPart={(p) => { setEditingPart(p); setIsPartModalOpen(true); }}
              onDeletePart={handleDeletePart}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
            />
          )}

          {activeTab === 'procurement' && (
            <ProcurementView
              parts={projectParts}
              modules={projectModules}
              onUpdatePartStatus={handleUpdatePartStatus}
              onEditPart={(p) => { setEditingPart(p); setIsPartModalOpen(true); }}
            />
          )}

          {activeTab === 'quotations' && (
            <QuotationsView projectId={activeProjectId} />
          )}

          {activeTab === 'history' && (
            <HistoryLogTable />
          )}

          {activeTab === 'report' && (
            <CostSummaryReport summary={costSummary} modules={projectModules} />
          )}

          {activeTab === 'master-library' && (
            <MasterPartLibrary />
          )}
        </main>

        <footer className="bg-white/80 dark:bg-slate-900/60 border-t border-slate-200 dark:border-slate-800/80 py-3 text-center text-xs text-slate-500 print:hidden mt-auto">
          <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row justify-between items-center gap-2">
            <div>
              <span className="font-bold text-slate-700 dark:text-slate-300">WARSGATE AUTOMATION</span>
              <span className="ml-2">&copy; 2026 - Multi-Project Mechanical & Electrical BOM System</span>
            </div>
            <span className="text-emerald-600 dark:text-emerald-400 font-mono font-bold flex items-center text-[11px]">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5 animate-pulse"></span>
              Backend API Connected ✓
            </span>
          </div>
        </footer>
      </div>

      {/* Modals */}
      <ProjectModal isOpen={isProjectModalOpen} onClose={() => setIsProjectModalOpen(false)} onSave={handleSaveProject} initialProject={editingProject} />
      <MasterTaskModal isOpen={isMasterTaskModalOpen} onClose={() => setIsMasterTaskModalOpen(false)} onSave={handleSaveMasterTask} onDelete={handleDeleteMasterTask} initialTask={editingMasterTask} projectId={activeProjectId} allTasks={projectMasterTasks} />
      <ActualCompletionModal isOpen={isActualModalOpen} onClose={() => setIsActualModalOpen(false)} onSave={handleSaveActualCompletion} onClear={handleClearActualCompletion} task={actualTask} clickedDateIso={clickedDateIso} />
      <PartModal isOpen={isPartModalOpen} onClose={() => setIsPartModalOpen(false)} onSave={handleSavePart} initialPart={editingPart} modules={projectModules} defaultModuleId={defaultPartModuleId} />
      <ModuleModal isOpen={isModuleModalOpen} onClose={() => setIsModuleModalOpen(false)} onSave={handleSaveModule} initialModule={editingModule} />
      <ExportImportModal isOpen={isExportImportOpen} onClose={() => setIsExportImportOpen(false)} parts={projectParts} modules={projectModules} onImportParts={handleImportParts} />
    </div>
  );
}

export default App;
