import React, { useState, useEffect } from 'react';
import { X, Layers, Save, Wrench, Zap, Sliders } from 'lucide-react';
import { ModuleItem, ModuleScopeType } from '../types/bom';

interface ModuleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (module: Partial<ModuleItem>) => void;
  initialModule?: ModuleItem | null;
}

export const ModuleModal: React.FC<ModuleModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialModule,
}) => {
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [dwgNo, setDwgNo] = useState('');
  const [targetBudget, setTargetBudget] = useState(10000);
  const [responsibleEngineer, setResponsibleEngineer] = useState('Jeerawat');
  const [moduleType, setModuleType] = useState<ModuleScopeType>('BOTH');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<'Active' | 'Draft' | 'Completed'>('Active');

  useEffect(() => {
    if (initialModule) {
      setCode(initialModule.code || '');
      setName(initialModule.name || '');
      setDwgNo(initialModule.dwgNo || '');
      setTargetBudget(initialModule.targetBudget || 10000);
      setResponsibleEngineer(initialModule.responsibleEngineer || 'Jeerawat');
      setModuleType(initialModule.moduleType || 'BOTH');
      setDescription(initialModule.description || '');
      setStatus(initialModule.status || 'Active');
    } else {
      setCode(`MOD-${Math.floor(Math.random() * 899 + 100)}`);
      setName('');
      setDwgNo('073007-000-000-A');
      setTargetBudget(20000);
      setResponsibleEngineer('Jeerawat');
      setModuleType('BOTH');
      setDescription('');
      setStatus('Active');
    }
  }, [initialModule, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...(initialModule ? { id: initialModule.id } : {}),
      code,
      name,
      dwgNo,
      targetBudget: Number(targetBudget),
      responsibleEngineer,
      moduleType,
      description,
      status,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-sm">
      <div className="glass-panel w-full max-w-lg rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center space-x-2">
            <div className="p-2 rounded-xl bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                {initialModule ? 'แก้ไขข้อมูล Module' : 'เพิ่ม Module ใหม่'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">กำหนดรหัส ประเภทขอบเขตงาน MC/EE และงบประมาณ</p>
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
          
          {/* Module Code & DWG No */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Module Code <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="e.g. MOD-01"
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                DWG No. Reference
              </label>
              <input
                type="text"
                value={dwgNo}
                onChange={(e) => setDwgNo(e.target.value)}
                placeholder="e.g. 073007-000-000-A"
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>
          </div>

          {/* Module Name */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              ชื่อ Module (Module Name) <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Main Box Control / Vision Sensor Unit"
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white font-bold focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>

          {/* New Feature 1: Module Scope Type (เฉพาะ MC, เฉพาะ EE, หรือ ทั้งคู่) */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              ขอบเขตชิ้นส่วนใน Module (Module Category Scope) <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setModuleType('MC_ONLY')}
                className={`p-2.5 rounded-xl border text-xs font-black flex items-center justify-center space-x-1 transition-all ${
                  moduleType === 'MC_ONLY'
                    ? 'bg-red-100 dark:bg-red-950 text-red-800 dark:text-red-300 border-red-500 shadow-sm'
                    : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                }`}
              >
                <Wrench className="w-3.5 h-3.5 text-red-600" />
                <span>เฉพาะ MC</span>
              </button>

              <button
                type="button"
                onClick={() => setModuleType('EE_ONLY')}
                className={`p-2.5 rounded-xl border text-xs font-black flex items-center justify-center space-x-1 transition-all ${
                  moduleType === 'EE_ONLY'
                    ? 'bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-300 border-amber-500 shadow-sm'
                    : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                }`}
              >
                <Zap className="w-3.5 h-3.5 text-amber-600" />
                <span>เฉพาะ EE</span>
              </button>

              <button
                type="button"
                onClick={() => setModuleType('BOTH')}
                className={`p-2.5 rounded-xl border text-xs font-black flex items-center justify-center space-x-1 transition-all ${
                  moduleType === 'BOTH'
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 border-slate-900 shadow-sm'
                    : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                }`}
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>ทั้งคู่ (MC & EE)</span>
              </button>
            </div>
          </div>

          {/* Target Budget & Responsible Engineer */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Target Budget (งบประเมิน ฿)
              </label>
              <input
                type="number"
                value={targetBudget}
                onChange={(e) => setTargetBudget(Number(e.target.value))}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                วิศวกรผู้รับผิดชอบ
              </label>
              <input
                type="text"
                value={responsibleEngineer}
                onChange={(e) => setResponsibleEngineer(e.target.value)}
                placeholder="e.g. Jeerawat"
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              รายละเอียด Module (Description)
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="คำอธิบายรายละเอียดการทำงานใน Module นี้..."
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-200 dark:border-slate-800">
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
              บันทึก Module
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
