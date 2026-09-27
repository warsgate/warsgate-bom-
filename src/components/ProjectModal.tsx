import React, { useState, useEffect } from 'react';
import { X, FolderKanban, Save, Building2, Sparkles, CheckCircle2, ChevronDown, Check } from 'lucide-react';
import { ProjectItem } from '../types/bom';
import { integrationApi, AccountingContact } from '../api/client';
import { DEFAULT_ACCOUNTING_CUSTOMERS } from '../data/warsgateAccountingContacts';

interface ProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (project: Partial<ProjectItem>) => void;
  initialProject?: ProjectItem | null;
}

export const ProjectModal: React.FC<ProjectModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialProject,
}) => {
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [customer, setCustomer] = useState('');
  const [customerId, setCustomerId] = useState('000');
  const [targetBudget, setTargetBudget] = useState(100000);
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<'Active' | 'Completed' | 'On Hold' | 'Archived'>('Active');
  const [poDate, setPoDate] = useState('');
  const [contactPerson, setContactPerson] = useState('');

  // Warsgate Accounting Integration (Initializes with default authentic contacts)
  const [accountingContacts, setAccountingContacts] = useState<AccountingContact[]>(DEFAULT_ACCOUNTING_CUSTOMERS);
  const [selectedContactId, setSelectedContactId] = useState<string>('');
  const [loadingContacts, setLoadingContacts] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setLoadingContacts(true);
      integrationApi.getAccountingContacts()
        .then(res => {
          if (res?.customers && Array.isArray(res.customers) && res.customers.length > 0) {
            setAccountingContacts(res.customers);
          }
        })
        .catch(err => {
          console.warn('Could not load live accounting contacts, using bundled contacts:', err);
        })
        .finally(() => setLoadingContacts(false));
    }
  }, [isOpen]);

  useEffect(() => {
    if (initialProject) {
      setCode(initialProject.code || '');
      setName(initialProject.name || '');
      setCustomer(initialProject.customer || '');
      setCustomerId(initialProject.customerId || '000');
      setTargetBudget(initialProject.targetBudget || 100000);
      setDescription(initialProject.description || '');
      setStatus(initialProject.status || 'Active');
      setPoDate(initialProject.poDate || '');
      setContactPerson(initialProject.contactPerson || '');
      setSelectedContactId('');
    } else {
      setCode(`PRJ-${Math.floor(Math.random() * 899 + 100)}`);
      setName('');
      setCustomer('');
      setCustomerId('');
      setTargetBudget(150000);
      setDescription('');
      setStatus('Active');
      setPoDate('');
      setContactPerson('');
      setSelectedContactId('');
    }
  }, [initialProject, isOpen]);

  const handleSelectAccountingCustomer = (contactId: string) => {
    setSelectedContactId(contactId);
    const found = accountingContacts.find(c => c.id === contactId);
    if (!found) return;

    setCustomer(found.companyName);

    // Map customer ID
    if (found.companyName.includes('พีเอ็นพี')) {
      setCustomerId('527');
    } else if (found.companyName.includes('ไทย เซกิซุย')) {
      setCustomerId('107');
    } else if (found.companyName.includes('คูโรดา')) {
      setCustomerId('025');
    }

    const contactStr = [
      found.name,
      found.phone ? `โทร: ${found.phone}` : '',
      found.email ? `อีเมล: ${found.email}` : ''
    ].filter(Boolean).join(' | ');

    setContactPerson(contactStr);
  };

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...(initialProject ? { id: initialProject.id } : {}),
      code,
      name,
      customer,
      customerId,
      dwgNo: '', // dwgNo is auto-generated in Module, project doesn't really need it now
      targetBudget: Number(targetBudget),
      description,
      status,
      poDate,
      contactPerson,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-sm">
      <div className="glass-panel w-full max-w-lg rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center space-x-2">
            <div className="p-2 rounded-lg bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400">
              <FolderKanban className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {initialProject ? 'แก้ไขข้อมูลโปรเจกต์' : 'สร้างโปรเจกต์ใหม่ (New Project)'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">กำหนดโปรเจกต์การผลิตเครื่องจักรและเป้าหมายงบประมาณ</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          
          {/* Warsgate Accounting Quick Customer Select */}
          <div className="p-3 bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-950/40 dark:to-orange-950/20 border border-red-200 dark:border-red-800/60 rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-1.5 text-xs font-bold text-red-900 dark:text-red-300">
                <Building2 className="w-4 h-4 text-red-600 dark:text-red-400" />
                <span>ดึงข้อมูลลูกค้าจากโปรแกรมบัญชี วอร์สเกต</span>
              </div>
              <span className="text-[10px] bg-red-100 dark:bg-red-900/60 text-red-700 dark:text-red-300 px-2 py-0.5 rounded-full font-bold">
                {loadingContacts ? 'กำลังโหลด...' : `${accountingContacts.length} ลูกค้า`}
              </span>
            </div>

            <select
              value={selectedContactId}
              onChange={(e) => handleSelectAccountingCustomer(e.target.value)}
              className="w-full bg-white dark:bg-slate-900 border border-red-300 dark:border-red-700 rounded-lg px-3 py-1.5 text-xs text-slate-800 dark:text-slate-200 font-bold focus:ring-2 focus:ring-red-500 focus:outline-none"
            >
              <option value="">-- คลิกเลือกลูกค้าเพื่อกรอกอัตโนมัติ (Auto-fill) --</option>
              {accountingContacts.map(c => (
                <option key={c.id} value={c.id}>
                  🏢 {c.companyName} {c.name ? `— ผู้ติดต่อ: ${c.name}` : ''}
                </option>
              ))}
            </select>

            {/* Quick Pick Pills for instant selection */}
            <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold mr-0.5">คลิกเลือกทันที:</span>
              {accountingContacts.map((c) => {
                const isSelected = selectedContactId === c.id || customer === c.companyName;
                const shortName = c.companyName.includes('พีเอ็นพี') ? 'บ. พีเอ็นพี (527)' :
                  c.companyName.includes('คูโรดา') ? 'บ. คูโรดา (025)' :
                  c.companyName.includes('ไทย เซกิซุย') ? 'บ. ไทย เซกิซุย (107)' :
                  c.companyName.slice(0, 18);
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => handleSelectAccountingCustomer(c.id)}
                    className={`px-2 py-0.5 rounded-md text-[11px] font-bold transition-all flex items-center space-x-1 ${
                      isSelected
                        ? 'bg-red-600 text-white shadow-sm ring-1 ring-red-600'
                        : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-red-200 dark:border-red-900/40 hover:bg-red-50 dark:hover:bg-red-950/40 hover:text-red-600 dark:hover:text-red-400'
                    }`}
                  >
                    {isSelected && <Check className="w-3 h-3 mr-0.5 text-white" />}
                    <span>{shortName}</span>
                  </button>
                );
              })}
            </div>

            {selectedContactId && (() => {
              const c = accountingContacts.find(x => x.id === selectedContactId);
              if (!c) return null;
              return (
                <div className="text-[11px] text-slate-600 dark:text-slate-300 bg-white/80 dark:bg-slate-900/80 p-2.5 rounded-lg border border-red-100 dark:border-red-900/40 space-y-1">
                  <div className="flex items-center justify-between font-bold text-slate-800 dark:text-slate-100">
                    <span className="text-red-700 dark:text-red-400 flex items-center">
                      <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-500 inline" />
                      เชื่อมโยงโปรแกรมบัญชีสำเร็จ
                    </span>
                    <span>เครดิต: {c.creditDays ? `${c.creditDays} วัน` : '30 วัน'}</span>
                  </div>
                  <div><strong>เลขผู้เสียภาษี:</strong> {c.taxId || '-'} {c.branchCode ? `(สาขา: ${c.branchCode})` : ''}</div>
                  <div className="truncate"><strong>ที่อยู่:</strong> {c.address || '-'}</div>
                  {c.phone && <div><strong>โทร:</strong> {c.phone}</div>}
                </div>
              );
            })()}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                รหัสโปรเจกต์ (Project Code) <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="e.g. PRJ-001"
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                ลูกค้า (Customer) <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                list="accounting-customer-list"
                value={customer}
                onChange={(e) => {
                  setCustomer(e.target.value);
                  const matched = accountingContacts.find(c => c.companyName === e.target.value);
                  if (matched) {
                    handleSelectAccountingCustomer(matched.id);
                  }
                }}
                placeholder="e.g. Maxwell / Keyence"
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white font-bold focus:outline-none focus:ring-2 focus:ring-red-500"
              />
              <datalist id="accounting-customer-list">
                {accountingContacts.map(c => (
                  <option key={c.id} value={c.companyName}>
                    {c.companyName} {c.name ? `(${c.name})` : ''}
                  </option>
                ))}
              </datalist>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              ชื่อเครื่องจักร / โปรเจกต์ (Project Name) <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Camera Vision Inspection 1"
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white font-black placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                รหัสลูกค้า (Customer ID 3 หลัก)
              </label>
              <input
                type="text"
                maxLength={3}
                value={customerId}
                onChange={(e) => setCustomerId(e.target.value.replace(/[^0-9]/g, ''))}
                placeholder="e.g. 527"
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                งบประมาณตั้งไว้ (Target Budget ฿)
              </label>
              <input
                type="number"
                step="1000"
                value={targetBudget}
                onChange={(e) => setTargetBudget(Number(e.target.value))}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                วันที่ได้รับ PO (PO Date)
              </label>
              <input
                type="date"
                value={poDate}
                onChange={(e) => setPoDate(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                ผู้ติดต่อ (Contact Person)
              </label>
              <input
                type="text"
                value={contactPerson}
                onChange={(e) => setContactPerson(e.target.value)}
                placeholder="ชื่อ / เบอร์โทร"
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white font-bold focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Status (สถานะโปรเจกต์)</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white font-bold focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                <option value="Active">อยู่ระหว่างดำเนินการ (Active)</option>
                <option value="On Hold">ชะลอโครงการ (On Hold)</option>
                <option value="Completed">เสร็จสมบูรณ์ (Completed)</option>
                <option value="Archived">จัดเก็บประวัติ (Archived)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">รายละเอียดเพิ่มเติม</label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="คำอธิบายโปรเจกต์ขอบเขตงาน"
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              ยกเลิก
            </button>

            <button
              type="submit"
              className="px-5 py-2 rounded-xl text-xs font-black text-white bg-gradient-to-r from-red-600 via-rose-700 to-rose-900 hover:from-red-500 hover:to-rose-800 shadow-md shadow-red-600/20 transition-all flex items-center"
            >
              <Save className="w-4 h-4 mr-1.5" />
              บันทึกข้อมูลโปรเจกต์
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
