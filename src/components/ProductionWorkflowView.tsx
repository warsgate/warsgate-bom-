import React, { useState, useMemo } from 'react';
import { 
  CheckCircle2, 
  Clock, 
  ArrowRight, 
  Layers, 
  User, 
  Truck, 
  Wrench, 
  Zap, 
  Play,
  ChevronRight,
  PackageCheck,
  Building,
  Settings,
  Plus
} from 'lucide-react';
import { BomPartItem, MachineWorkflowStage, ModuleItem, ProjectItem } from '../types/bom';
import { formatCurrency } from '../utils/costCalculator';

interface ProductionWorkflowViewProps {
  project?: ProjectItem;
  modules: ModuleItem[];
  parts: BomPartItem[];
  onUpdatePartStage: (partId: string, stage: MachineWorkflowStage) => void;
  onEditPart: (part: BomPartItem) => void;
}

const WORKFLOW_STAGES: { id: MachineWorkflowStage; title: string; stepNum: number; color: string }[] = [
  { id: '1. Design (DS,EE,PG)', title: '1. Design (DS,EE,PG)', stepNum: 1, color: 'bg-blue-600' },
  { id: '2. BOM Part List', title: '2. BOM Part List', stepNum: 2, color: 'bg-indigo-600' },
  { id: '3. Procurement (STD,FEB)', title: '3. สั่งซื้อของ (STD/FEB)', stepNum: 3, color: 'bg-amber-600' },
  { id: '4. Assembly', title: '4. ประกอบเครื่อง', stepNum: 4, color: 'bg-sky-600' },
  { id: '5. Testing', title: '5. ปรับตั้ง & ทดสอบ', stepNum: 5, color: 'bg-purple-600' },
  { id: '6. BuyOff', title: '6. ตรวจรับ (BuyOff)', stepNum: 6, color: 'bg-emerald-600' },
  { id: '7. Packing', title: '7. แพ็คเกจจิ้ง (Packing)', stepNum: 7, color: 'bg-teal-600' },
  { id: '8. Install & Service', title: '8. ติดตั้ง & ส่งมอบ', stepNum: 8, color: 'bg-rose-600' },
  { id: '9. Others', title: '9. อื่น ๆ (Others)', stepNum: 9, color: 'bg-slate-600' },
];

export const ProductionWorkflowView: React.FC<ProductionWorkflowViewProps> = ({
  project,
  modules,
  parts,
  onUpdatePartStage,
  onEditPart,
}) => {
  const [selectedStageFilter, setSelectedStageFilter] = useState<string>('ALL');

  // Calculate statistics per stage
  const stageStats = useMemo(() => {
    const map: Record<string, { count: number; totalCost: number; parts: BomPartItem[] }> = {};
    WORKFLOW_STAGES.forEach(s => {
      map[s.id] = { count: 0, totalCost: 0, parts: [] };
    });

    parts.forEach(p => {
      const stage = p.workflowStage || '2. BOM Part List'; // Default to stage 2 if unassigned
      if (!map[stage]) {
        map[stage] = { count: 0, totalCost: 0, parts: [] };
      }
      map[stage].count += 1;
      map[stage].totalCost += p.totalAmount || (p.qty * p.unitPrice);
      map[stage].parts.push(p);
    });

    return map;
  }, [parts]);

  // Handle advancing a part to the next stage
  const handleAdvanceStage = (part: BomPartItem) => {
    const currentStage = part.workflowStage || '2. BOM Part List';
    const currentIndex = WORKFLOW_STAGES.findIndex(s => s.id === currentStage);
    if (currentIndex < WORKFLOW_STAGES.length - 1) {
      const nextStage = WORKFLOW_STAGES[currentIndex + 1].id;
      onUpdatePartStage(part.id, nextStage);
    }
  };

  return (
    <div className="space-y-4">
      
      {/* 1. Header Banner & Machine Building Pipeline Progress */}
      <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2">
          <div>
            <div className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-black bg-blue-100 dark:bg-blue-500/20 text-blue-800 dark:text-blue-300 mb-1">
              Machine Building Production Workflow
            </div>
            <h2 className="text-lg font-black text-slate-900 dark:text-white">
              แผนงานการผลิตเครื่องจักร 9 ขั้นตอน [{project?.code || 'PRJ'}] {project?.name}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-bold">
              ผูกข้อมูลชิ้นส่วน Part List เข้ากับลำดับขั้นตอนผลิต ปรับตั้ง และส่งมอบเครื่องจักร
            </p>
          </div>

          <div className="flex items-center space-x-2 text-xs font-bold">
            <span className="text-slate-500">ลูกค้า:</span>
            <span className="px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-900 dark:text-white font-black">
              {project?.customer || 'Maxwell'}
            </span>
          </div>
        </div>

        {/* 9-Stage Stepper Sequence Bar */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 overflow-x-auto pb-1">
          <div className="flex items-center min-w-max space-x-1 text-xs">
            {WORKFLOW_STAGES.map((s, idx) => {
              const count = stageStats[s.id]?.count || 0;
              const isSelected = selectedStageFilter === s.id;

              return (
                <React.Fragment key={s.id}>
                  <button
                    onClick={() => setSelectedStageFilter(isSelected ? 'ALL' : s.id)}
                    className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-xl border transition-all ${
                      isSelected
                        ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 border-slate-900 shadow-sm'
                        : count > 0
                        ? 'bg-slate-50 dark:bg-slate-950 border-slate-300 dark:border-slate-800 hover:bg-slate-100'
                        : 'bg-slate-50/50 dark:bg-slate-950/50 border-slate-200 dark:border-slate-800 text-slate-400'
                    }`}
                  >
                    <span className={`w-4 h-4 rounded-full text-[10px] font-black text-white flex items-center justify-center ${s.color}`}>
                      {s.stepNum}
                    </span>
                    <span className="font-bold text-[11px] whitespace-nowrap">{s.title}</span>
                    <span className={`px-1.5 py-0.2 rounded text-[10px] font-mono font-black ${
                      count > 0 ? 'bg-blue-100 text-blue-900 dark:bg-blue-950 dark:text-blue-200' : 'bg-slate-200 text-slate-600'
                    }`}>
                      {count}
                    </span>
                  </button>

                  {idx < WORKFLOW_STAGES.length - 1 && (
                    <ChevronRight className="w-3.5 h-3.5 text-slate-300 flex-shrink-0" />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>
      </div>

      {/* 2. Main 9-Stage Production Kanban & Stage Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-3 gap-4">
        {WORKFLOW_STAGES.filter(s => selectedStageFilter === 'ALL' || selectedStageFilter === s.id).map((stage) => {
          const stageData = stageStats[stage.id] || { count: 0, totalCost: 0, parts: [] };
          const stageParts = stageData.parts;

          return (
            <div
              key={stage.id}
              className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm flex flex-col justify-between"
            >
              
              {/* Stage Column Header */}
              <div className="p-3 bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className={`w-5 h-5 rounded-lg text-xs font-black text-white flex items-center justify-center ${stage.color}`}>
                    {stage.stepNum}
                  </span>
                  <h3 className="text-xs font-black text-slate-900 dark:text-white">{stage.title}</h3>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-black bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200">
                  {stageData.count} รายการ
                </span>
              </div>

              {/* Stage Parts Cards Stream */}
              <div className="p-3 space-y-2 flex-1 max-h-[480px] overflow-y-auto">
                {stageParts.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 text-xs font-medium border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-xl">
                    ไม่มีรายการ Part อยู่ในขั้นตอนนี้
                  </div>
                ) : (
                  stageParts.map((part) => {
                    const mod = modules.find(m => m.id === part.moduleId);
                    return (
                      <div
                        key={part.id}
                        className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 hover:border-blue-400 shadow-sm transition-all space-y-2 group"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="flex items-center space-x-1 mb-0.5">
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                                #{part.itemNo}
                              </span>
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-blue-50 dark:bg-blue-950 text-blue-800 dark:text-blue-300">
                                {mod?.code || 'MOD'}
                              </span>
                              <span className={`px-1.5 py-0.2 rounded text-[9px] font-black ${
                                part.category === 'MC' ? 'bg-blue-100 text-blue-800' : 'bg-amber-100 text-amber-800'
                              }`}>
                                {part.category}
                              </span>
                            </div>
                            <h4 
                              onClick={() => onEditPart(part)}
                              className="text-xs font-black text-slate-900 dark:text-white hover:text-blue-600 cursor-pointer"
                            >
                              {part.partName}
                            </h4>
                          </div>

                          <span className="text-xs font-mono font-black text-slate-900 dark:text-white">
                            {formatCurrency(part.totalAmount || (part.qty * part.unitPrice))}
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-[10px] text-slate-500 font-bold border-t border-slate-100 dark:border-slate-900 pt-1.5">
                          <span>Qty: {part.qty} {part.unit}</span>
                          <button
                            onClick={() => handleAdvanceStage(part)}
                            className="px-2 py-0.5 bg-blue-50 dark:bg-blue-950 hover:bg-blue-100 text-blue-700 dark:text-blue-400 rounded font-black text-[10px] border border-blue-200 dark:border-blue-800 flex items-center transition-all"
                            title="เลื่อนไปยังขั้นตอนถัดไป"
                          >
                            ถัดไป <ArrowRight className="w-3 h-3 ml-0.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Stage Footer Cost Summary */}
              <div className="p-2.5 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center text-xs">
                <span className="text-[10px] font-bold text-slate-500">มูลค่ารวมขั้นตอน:</span>
                <span className="font-mono font-black text-slate-900 dark:text-white">
                  {formatCurrency(stageData.totalCost)}
                </span>
              </div>

            </div>
          );
        })}
      </div>

    </div>
  );
};
