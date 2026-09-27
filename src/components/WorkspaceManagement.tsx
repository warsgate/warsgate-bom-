import React, { useMemo, useState, useEffect } from 'react';
import { ProjectItem } from '../types/bom';
import { FolderKanban, Building2, Wallet, Calendar, Plus, Edit2, Trash2, Phone, Briefcase, Mail, ShieldCheck, ExternalLink, ArrowRight } from 'lucide-react';
import { integrationApi, AccountingContact } from '../api/client';

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
  const [accountingCustomers, setAccountingCustomers] = useState<AccountingContact[]>([]);
  const [accountingSuppliers, setAccountingSuppliers] = useState<AccountingContact[]>([]);
  const [loadingContacts, setLoadingContacts] = useState(false);
  const [activeTab, setActiveTab] = useState<'projects' | 'accounting_customers'>('projects');

  useEffect(() => {
    setLoadingContacts(true);
    integrationApi.getAccountingContacts()
      .then(res => {
        if (res?.customers) setAccountingCustomers(res.customers);
        if (res?.suppliers) setAccountingSuppliers(res.suppliers);
      })
      .catch(err => console.warn('Could not load accounting contacts in workspace:', err))
      .finally(() => setLoadingContacts(false));
  }, []);

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

      {/* Tabs */}
      <div className="flex items-center space-x-2 mb-4 border-b border-slate-200 dark:border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('projects')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'projects'
              ? 'bg-rose-600 text-white shadow-md shadow-rose-600/20'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <FolderKanban className="w-4 h-4" />
          <span>โปรเจกต์ทั้งหมด ({projects.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('accounting_customers')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'accounting_customers'
              ? 'bg-red-700 text-white shadow-md shadow-red-700/20'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Building2 className="w-4 h-4 text-red-400" />
          <span>ลูกค้าจากโปรแกรมบัญชี วอร์สเกต ({accountingCustomers.length})</span>
          <span className="px-1.5 py-0.5 text-[10px] rounded-full bg-red-100 dark:bg-red-900/60 text-red-800 dark:text-red-200 font-black">
            Live
          </span>
        </button>
      </div>

      {activeTab === 'projects' ? (
        /* Projects Table */
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
      ) : (
        /* Accounting Customers Cards */
        <div className="space-y-6">
          <div className="p-4 bg-gradient-to-r from-red-900/20 via-orange-900/10 to-transparent border border-red-200 dark:border-red-900/40 rounded-2xl flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 bg-red-600 text-white rounded-xl shadow-md">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                  เชื่อมโยงฐานข้อมูลลูกค้าจาก โปรแกรมบัญชี วอร์สเกต (Warsgate Accounting)
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  ซิงค์ตรงจากฐานข้อมูลระบบบัญชีวอร์สเกต เพื่อความถูกต้องของชื่อบริษัท เลขผู้เสียภาษี และที่อยู่ออกใบกำกับ
                </p>
              </div>
            </div>
            <button
              onClick={onOpenAddProject}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-red-600/20 flex items-center"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              สร้างโปรเจกต์ใหม่
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {accountingCustomers.map((c) => {
              const matchedProjectCount = projects.filter(p => p.customer.toLowerCase().includes(c.companyName.toLowerCase().slice(0, 10))).length;
              return (
                <div
                  key={c.id}
                  className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4 relative overflow-hidden"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-start justify-between">
                      <span className="px-2 py-0.5 text-[10px] font-black rounded-md bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300">
                        {c.type === 'CUSTOMER' ? 'ลูกค้า (CUSTOMER)' : 'คู่ค้า (SUPPLIER)'}
                      </span>
                      {c.creditDays && (
                        <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
                          เครดิต {c.creditDays} วัน
                        </span>
                      )}
                    </div>

                    <h4 className="font-black text-sm text-slate-900 dark:text-white leading-snug">
                      {c.companyName}
                    </h4>

                    <div className="text-xs space-y-1.5 text-slate-600 dark:text-slate-400">
                      {c.name && (
                        <div className="flex items-center text-slate-700 dark:text-slate-200 font-bold">
                          <span className="text-slate-400 mr-1.5">ผู้ติดต่อ:</span> {c.name}
                        </div>
                      )}
                      {c.taxId && (
                        <div className="font-mono text-[11px]">
                          <span className="text-slate-400">Tax ID:</span> {c.taxId} {c.branchCode ? `(สาขา ${c.branchCode})` : ''}
                        </div>
                      )}
                      {c.phone && (
                        <div className="flex items-center">
                          <Phone className="w-3.5 h-3.5 mr-1.5 text-slate-400 shrink-0" />
                          <span>{c.phone}</span>
                        </div>
                      )}
                      {c.email && (
                        <div className="flex items-center">
                          <Mail className="w-3.5 h-3.5 mr-1.5 text-slate-400 shrink-0" />
                          <span className="truncate">{c.email}</span>
                        </div>
                      )}
                      {c.address && (
                        <div className="text-[11px] text-slate-500 line-clamp-2 pt-1 border-t border-slate-100 dark:border-slate-800">
                          {c.address}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <span className="text-[11px] text-slate-500 font-medium">
                      {matchedProjectCount > 0 ? (
                        <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                          มี {matchedProjectCount} โปรเจกต์ในระบบ
                        </span>
                      ) : (
                        <span>ยังไม่มีโปรเจกต์</span>
                      )}
                    </span>
                    <button
                      onClick={onOpenAddProject}
                      className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-red-50 dark:hover:bg-red-950/40 text-slate-700 dark:text-slate-200 hover:text-red-600 dark:hover:text-red-400 rounded-lg text-xs font-bold transition-colors flex items-center space-x-1"
                    >
                      <span>สร้างโปรเจกต์</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

