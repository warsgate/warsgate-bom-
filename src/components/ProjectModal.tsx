import React, { useState, useEffect } from 'react';
import { X, FolderKanban, Save } from 'lucide-react';
import { ProjectItem } from '../types/bom';

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
    }
  }, [initialProject, isOpen]);

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
                value={customer}
                onChange={(e) => setCustomer(e.target.value)}
                placeholder="e.g. Maxwell / Keyence"
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white font-bold focus:outline-none focus:ring-2 focus:ring-red-500"
              />
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
