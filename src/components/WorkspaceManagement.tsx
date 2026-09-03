import React, { useMemo } from 'react';
import { ProjectItem } from '../types/bom';
import { FolderKanban, Building2, Wallet, Calendar, Plus, Edit2, Trash2, Phone, Briefcase } from 'lucide-react';

interface WorkspaceManagementProps {
  projects: ProjectItem[];
  onOpenAddProject: () => void;
  onEditProject: (project: ProjectItem) => void;
  onDeleteProject: (projectId: string) => void;
}

export const WorkspaceManagement: React.FC<WorkspaceManagementProps> = ({
  projects,
  onOpenAddProject,
  onEditProject,
  onDeleteProject,
}) => {
  const uniqueCompanies = useMemo(() => {
    const companies = new Set(projects.map(p => p.customer.trim().toLowerCase()).filter(Boolean));
    return companies.size;
  }, [projects]);

  const totalBudget = useMemo(() => {
    return projects.reduce((sum, p) => sum + (p.targetBudget || 0), 0);
  }, [projects]);

  return (
    <div className="h-full flex flex-col p-6 animate-in fade-in duration-300">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center">
            <Briefcase className="w-7 h-7 mr-3 text-rose-500" />
            Workspace Management (จัดการโปรเจกต์และลูกค้า)
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 ml-10 text-sm">
            ดูภาพรวมของบริษัทลูกค้าทั้งหมด ยอดขาย และวันที่ได้รับ PO
          </p>
        </div>
        <button
          onClick={onOpenAddProject}
          className="mt-4 sm:mt-0 px-5 py-2.5 bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 text-white rounded-xl font-bold shadow-lg shadow-rose-500/30 transition-all flex items-center transform hover:-translate-y-0.5"
        >
          <Plus className="w-5 h-5 mr-2" />
          สร้าง Workspace ใหม่
        </button>
      </div>

      {/* Summary Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center">
          <div className="w-14 h-14 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mr-5">
            <Building2 className="w-7 h-7 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider mb-1">ลูกค้าทั้งหมด (บริษัท)</p>
            <p className="text-3xl font-black text-slate-900 dark:text-white">{uniqueCompanies}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center">
          <div className="w-14 h-14 rounded-full bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center mr-5">
            <FolderKanban className="w-7 h-7 text-rose-600 dark:text-rose-400" />
          </div>
          <div>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider mb-1">โปรเจกต์ทั้งหมด</p>
            <p className="text-3xl font-black text-slate-900 dark:text-white">{projects.length}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center">
          <div className="w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mr-5">
            <Wallet className="w-7 h-7 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider mb-1">ยอดรวมทั้งหมด (Budget)</p>
            <p className="text-3xl font-black text-slate-900 dark:text-white">฿{totalBudget.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
          </div>
        </div>
      </div>

      {/* Projects Table */}
      <div className="flex-1 bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col">
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left whitespace-nowrap text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800/60 sticky top-0 z-10 border-b-2 border-slate-200 dark:border-slate-700">
              <tr className="divide-x divide-slate-200 dark:divide-slate-700">
                <th className="px-4 py-3 font-black text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider min-w-[150px]">โปรเจกต์</th>
                <th className="px-4 py-3 font-black text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider min-w-[180px]">บริษัทลูกค้า</th>
                <th className="px-4 py-3 font-black text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider text-right whitespace-nowrap min-w-[130px]">ยอดเงิน (Budget)</th>
                <th className="px-4 py-3 font-black text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider text-center whitespace-nowrap min-w-[120px]">วันรับ PO</th>
                <th className="px-4 py-3 font-black text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider min-w-[140px]">ข้อมูลผู้ติดต่อ</th>
                <th className="px-4 py-3 font-black text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider text-center whitespace-nowrap min-w-[110px]">สถานะ</th>
                <th className="px-4 py-3 font-black text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider text-center whitespace-nowrap w-24">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
              {projects.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-slate-500 font-bold">
                    ยังไม่มีข้อมูลโปรเจกต์
                  </td>
                </tr>
              ) : (
                projects.map((p) => (
                  <tr key={p.id} className="divide-x divide-slate-100 dark:divide-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-black text-slate-900 dark:text-white">{p.code}</div>
                      <div className="text-xs font-bold text-slate-500 dark:text-slate-400">{p.name}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center">
                        <Building2 className="w-4 h-4 mr-2 text-slate-400" />
                        <span className="font-bold text-slate-700 dark:text-slate-300">{p.customer}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <span className="font-bold text-emerald-600 dark:text-emerald-400">
                        ฿{(p.targetBudget || 0).toLocaleString()}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center whitespace-nowrap">
                      {p.poDate ? (
                        <div className="flex items-center text-slate-600 dark:text-slate-300">
                          <Calendar className="w-4 h-4 mr-2 text-slate-400" />
                          <span className="font-semibold">{new Date(p.poDate).toLocaleDateString('th-TH')}</span>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic text-xs">ยังไม่ระบุ</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {p.contactPerson ? (
                        <div className="flex items-center text-slate-600 dark:text-slate-300">
                          <Phone className="w-4 h-4 mr-2 text-slate-400" />
                          <span className="font-semibold">{p.contactPerson}</span>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic text-xs">ยังไม่ระบุ</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-black ${
                        p.status === 'Completed' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                        p.status === 'On Hold' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                        'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                      }`}>
                        {p.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center space-x-2">
                        <button
                          onClick={() => onEditProject(p)}
                          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                          title="แก้ไขโปรเจกต์"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onDeleteProject(p.id)}
                          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                          title="ลบโปรเจกต์"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
