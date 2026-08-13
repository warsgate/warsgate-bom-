import Dexie, { Table } from 'dexie';
import { BomPartItem, MasterPlanTaskItem, ModuleItem, ProjectItem } from '../types/bom';

export class BomDatabase extends Dexie {
  projects!: Table<ProjectItem>;
  modules!: Table<ModuleItem>;
  parts!: Table<BomPartItem>;
  masterTasks!: Table<MasterPlanTaskItem>;

  constructor() {
    super('MechanicalBomDB');
    this.version(4).stores({
      projects: 'id, code, name, customer, status',
      modules: 'id, projectId, code, name, status',
      parts: 'id, projectId, itemNo, dwgNo, category, partType, moduleId, maker, supplier, status, poNumber',
      masterTasks: 'id, projectId, wbs, stageName, status'
    });
  }
}

export const db = new BomDatabase();

// Initial Seed Projects
export const initialProjects: ProjectItem[] = [
  {
    id: 'proj-1',
    code: 'PRJ-001',
    name: 'Camera Vision Box Control System',
    customer: 'Maxwell (Camera Vision 1) Keyence',
    dwgNo: '073007-000-000-A',
    targetBudget: 122000,
    description: 'Control Box, Power Supply & Keyence Camera Vision 1 Assembly',
    status: 'Active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'proj-2',
    code: 'PRJ-002',
    name: 'Automated Pick & Place Gantry Robot',
    customer: 'Western Digital (Thailand)',
    dwgNo: '084012-000-000-B',
    targetBudget: 250000,
    description: 'High-speed 3-Axis Servo Gantry Robot & Safety Fencing Unit',
    status: 'Active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
];

// Initial Seed Modules
export const initialModules: ModuleItem[] = [
  {
    id: 'mod-1',
    projectId: 'proj-1',
    code: 'MOD-BOX-CTRL',
    name: 'Main Box Control Unit',
    dwgNo: '073007-000-000-A',
    description: 'Main Control Enclosure Panel & Power Management',
    targetBudget: 45000,
    responsibleEngineer: 'Jeerawat',
    moduleType: 'BOTH',
    status: 'Active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'mod-2',
    projectId: 'proj-1',
    code: 'MOD-STD-P1',
    name: 'Stand Profile & Mounting Structure',
    dwgNo: '073007-010-000-A',
    description: 'Aluminum Profile Frame, Base Plate & Leveling Foot',
    targetBudget: 35000,
    responsibleEngineer: 'Jeerawat',
    moduleType: 'MC_ONLY',
    status: 'Active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'mod-3',
    projectId: 'proj-1',
    code: 'MOD-VSN-KEYENCE',
    name: 'Keyence Vision Camera Station',
    dwgNo: '073007-020-000-A',
    description: 'Keyence Camera Unit, High-Flex Cables & Lighting Bracket',
    targetBudget: 42000,
    responsibleEngineer: 'Anusorn (EE Lead)',
    moduleType: 'EE_ONLY',
    status: 'Active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'mod-201',
    projectId: 'proj-2',
    code: 'MOD-GANTRY-ROBOT',
    name: '3-Axis Gantry Linear Servo Unit',
    dwgNo: '084012-010-000-B',
    description: 'Linear Servo Actuators, Gripper Mechanism & Cable Carriers',
    targetBudget: 160000,
    responsibleEngineer: 'Wichai (Robot Lead)',
    moduleType: 'BOTH',
    status: 'Active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'mod-202',
    projectId: 'proj-2',
    code: 'MOD-SAFETY-FENCE',
    name: 'Safety Interlock Guard Fence',
    dwgNo: '084012-020-000-B',
    description: 'Acrylic Guarding, Aluminum Frames & Safety Door Interlocks',
    targetBudget: 90000,
    responsibleEngineer: 'Jeerawat',
    moduleType: 'MC_ONLY',
    status: 'Active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
];

// Initial Master Tasks with Real Dates
export const initialMasterTasks: MasterPlanTaskItem[] = [
  {
    id: 'mt-1',
    projectId: 'proj-1',
    wbs: '1.0',
    stageName: '1. Design (DS,EE,PG)',
    title: '1. ออกแบบกลไก ไฟฟ้า และโปรแกรม (DS/EE/PG)',
    responsible: 'Jeerawat & Team',
    planStartDate: '2026-02-01',
    planEndDate: '2026-02-14',
    actualStartDate: '2026-02-01',
    actualEndDate: '2026-02-13',
    progressPct: 100,
    status: 'Completed',
    color: 'bg-blue-600',
  },
  {
    id: 'mt-2',
    projectId: 'proj-1',
    wbs: '2.0',
    stageName: '2. BOM Part List',
    title: '2. ถอดแบบ & สรุปรายการชิ้นส่วน BOM Part List',
    responsible: 'BOM Engineer',
    planStartDate: '2026-02-15',
    planEndDate: '2026-02-21',
    actualStartDate: '2026-02-14',
    actualEndDate: '2026-02-20',
    progressPct: 100,
    status: 'Completed',
    color: 'bg-indigo-600',
  },
  {
    id: 'mt-3',
    projectId: 'proj-1',
    wbs: '3.0',
    stageName: '3. Procurement (STD,FEB)',
    title: '3. สั่งซื้อชิ้นส่วนมาตรฐาน (STD) & สั่งแปรรูป (FEB)',
    responsible: 'Purchasing & Mizumi/Omron',
    planStartDate: '2026-02-22',
    planEndDate: '2026-03-15',
    actualStartDate: '2026-02-21',
    actualEndDate: '2026-03-18',
    progressPct: 85,
    status: 'In Progress',
    color: 'bg-amber-600',
  },
  {
    id: 'mt-4',
    projectId: 'proj-1',
    wbs: '4.0',
    stageName: '4. Assembly',
    title: '4. ประกอบโครงสร้างกลไก & เดินสายไฟตู้คอนโทรล',
    responsible: 'Assembly Technicians',
    planStartDate: '2026-03-16',
    planEndDate: '2026-03-28',
    actualStartDate: '2026-03-19',
    actualEndDate: '2026-03-30',
    progressPct: 40,
    status: 'In Progress',
    color: 'bg-sky-600',
  },
  {
    id: 'mt-5',
    projectId: 'proj-1',
    wbs: '5.0',
    stageName: '5. Testing',
    title: '5. ปรับตั้ง & ทดสอบระบบกล้อง Keyence Vision',
    responsible: 'Anusorn (Vision Engineer)',
    planStartDate: '2026-03-29',
    planEndDate: '2026-04-05',
    actualStartDate: '',
    actualEndDate: '',
    progressPct: 0,
    status: 'Pending',
    color: 'bg-purple-600',
  },
  {
    id: 'mt-6',
    projectId: 'proj-1',
    wbs: '6.0',
    stageName: '6. BuyOff',
    title: '6. ตรวจสอบและตรวจรับเครื่องจักรกับลูกค้า (BuyOff)',
    responsible: 'Project Lead & Maxwell Team',
    planStartDate: '2026-04-06',
    planEndDate: '2026-04-08',
    actualStartDate: '',
    actualEndDate: '',
    progressPct: 0,
    status: 'Pending',
    color: 'bg-emerald-600',
  },
  {
    id: 'mt-7',
    projectId: 'proj-1',
    wbs: '7.0',
    stageName: '7. Packing',
    title: '7. แพ็คเกจจิ้ง & จัดเตรียมขนส่ง (Packing)',
    responsible: 'Logistics',
    planStartDate: '2026-04-09',
    planEndDate: '2026-04-10',
    actualStartDate: '',
    actualEndDate: '',
    progressPct: 0,
    status: 'Pending',
    color: 'bg-teal-600',
  },
  {
    id: 'mt-8',
    projectId: 'proj-1',
    wbs: '8.0',
    stageName: '8. Install & Service',
    title: '8. ติดตั้ง & ส่งมอบ ณ โรงงานลูกค้า (On-Site Install)',
    responsible: 'Field Engineers',
    planStartDate: '2026-04-11',
    planEndDate: '2026-04-17',
    actualStartDate: '',
    actualEndDate: '',
    progressPct: 0,
    status: 'Pending',
    color: 'bg-rose-600',
  },
  {
    id: 'mt-9',
    projectId: 'proj-1',
    wbs: '9.0',
    stageName: '9. Others',
    title: '9. สรุปเอกสารส่งมอบ & ปิดโครงการ (Handover)',
    responsible: 'Project Manager',
    planStartDate: '2026-04-18',
    planEndDate: '2026-04-20',
    actualStartDate: '',
    actualEndDate: '',
    progressPct: 0,
    status: 'Pending',
    color: 'bg-slate-600',
  }
];

// Initial Seed Parts
export const initialParts: BomPartItem[] = [
  {
    id: 'p-1',
    projectId: 'proj-1',
    itemNo: 1,
    dwgNo: '073007-000-000-A',
    partName: 'Main Enclosure Box (Steel Steel 600x800x250)',
    typeSpec: 'Denco DA-09 / Rittal IP66',
    category: 'MC',
    partType: 'Standard Part',
    moduleId: 'mod-1',
    qty: 1,
    unit: 'SET',
    ctrlSpare: '',
    maker: 'Denco',
    supplier: 'Denco Direct',
    targetUnitPrice: 8500.00,
    targetTotalAmount: 8500.00,
    unitPrice: 8500.00,
    totalAmount: 8500.00,
    poNumber: 'PO-2026-001',
    orderDate: '2026-07-20',
    receiveDate: '2026-07-25',
    storeLocation: 'Store Shelf A-01',
    remarks: 'Main Box Structure',
    status: 'Received',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'p-2',
    projectId: 'proj-1',
    itemNo: 2,
    dwgNo: '073007-000-000-A',
    partName: 'CP30 Circuit Breaker 2P 3A',
    typeSpec: 'CP30 2P 3A',
    category: 'EE',
    partType: 'Standard Part',
    moduleId: 'mod-1',
    qty: 1,
    unit: 'EA',
    ctrlSpare: '',
    maker: 'Mitsubishi',
    supplier: 'Mizumi',
    targetUnitPrice: 1000.00,
    targetTotalAmount: 1000.00,
    unitPrice: 1000.00,
    totalAmount: 1000.00,
    poNumber: 'PO-2026-002',
    orderDate: '2026-07-21',
    receiveDate: '2026-07-26',
    storeLocation: 'Store Shelf B-04',
    remarks: 'EST: 1871.00',
    status: 'Received',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
];

export async function initSeedData() {
  const projectCount = await db.projects.count();
  if (projectCount === 0) {
    await db.projects.bulkAdd(initialProjects);
  }
  const moduleCount = await db.modules.count();
  if (moduleCount === 0) {
    await db.modules.bulkAdd(initialModules);
  }
  const taskCount = await db.masterTasks.count();
  if (taskCount === 0) {
    await db.masterTasks.bulkAdd(initialMasterTasks);
  }
  const partCount = await db.parts.count();
  if (partCount === 0) {
    await db.parts.bulkAdd(initialParts);
  }
}

export async function resetToDefaultSeed() {
  await db.projects.clear();
  await db.modules.clear();
  await db.masterTasks.clear();
  await db.parts.clear();
  await db.projects.bulkAdd(initialProjects);
  await db.modules.bulkAdd(initialModules);
  await db.masterTasks.bulkAdd(initialMasterTasks);
  await db.parts.bulkAdd(initialParts);
}
