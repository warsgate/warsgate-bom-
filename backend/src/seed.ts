import prisma from './prisma';
import bcrypt from 'bcryptjs';

async function seed() {
  console.log('🌱 Seeding database...');

  // ── 0. Users ─────────────────────────────────────────────────
  const adminHash = await bcrypt.hash('admin', 10);
  const engineerHash = await bcrypt.hash('admin123', 10);

  await prisma.user.upsert({
    where: { username: 'admin' },
    update: { password: adminHash },
    create: { username: 'admin', password: adminHash, role: 'LEVEL_2', name: 'Executive Admin' },
  });
  await prisma.user.upsert({
    where: { username: 'engineer' },
    update: { password: engineerHash },
    create: { username: 'engineer', password: engineerHash, role: 'LEVEL_1', name: 'Lead Engineer' },
  });
  console.log('✅ Users seeded');

  // ── 1. Projects (ข้อมูลจริงจากเอกสาร) ───────────────────────
  const projectsData = [
    {
      id: 'proj-1',
      code: 'PRJ-001',
      name: 'Camera Vision Box Control System',
      customer: 'Maxwell ( Camera Vision 1 ) Keyence',
      dwgNo: '073007-000-000-A',
      targetBudget: 122000,
      description: 'Control Box, Power Supply & Keyence Camera Vision 1 Assembly (DWG: 073007)',
      status: 'Active',
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
    },
    {
      id: 'proj-3',
      code: 'B0007',
      name: 'EE AUTO PACK Control System',
      customer: 'Auto Pack Automation',
      dwgNo: 'B0007-000-000-A',
      targetBudget: 350000,
      description: 'Electrical & Automation Packaging Line Control System',
      status: 'Active',
    },
  ];

  for (const proj of projectsData) {
    const existing = await prisma.project.findFirst({
      where: { OR: [{ id: proj.id }, { code: proj.code }] },
    });
    if (existing) {
      await prisma.project.update({ where: { id: existing.id }, data: proj });
    } else {
      await prisma.project.create({ data: proj });
    }
  }
  console.log('✅ Projects seeded: PRJ-001, PRJ-002, B0007');

  // ── 2. Modules (ข้อมูลจริงจาก Excel) ───────────────────────
  const modulesData = [
    // PRJ-001 modules
    {
      id: 'mod-1',
      projectId: 'proj-1',
      code: 'MOD-BOX-CTRL',
      name: 'Main Box Control Unit',
      dwgNo: '073007-000-000-A',
      description: 'Main Control Enclosure Panel, PLC & Power Management',
      targetBudget: 45000,
      responsibleEngineer: 'Jeerawat',
      moduleType: 'BOTH',
      status: 'Active',
    },
    {
      id: 'mod-2',
      projectId: 'proj-1',
      code: 'MOD-KEYENCE-VIS',
      name: 'Vision & Controller Interface',
      dwgNo: '073007-900-000-A',
      description: 'Keyence Vision Camera, Monitor, Mini PC & Safety Interface',
      targetBudget: 30000,
      responsibleEngineer: 'Jeerawat',
      moduleType: 'BOTH',
      status: 'Active',
    },
    // PRJ-002 modules
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
    },
    // B0007 modules
    {
      id: 'mod-301',
      projectId: 'proj-3',
      code: 'MOD-AUTO-PACK-EE',
      name: 'EE Auto Pack Electrical Station',
      dwgNo: 'B0007-010-000-A',
      description: 'Packaging Line Sensors, PLC & Electrical Distribution',
      targetBudget: 180000,
      responsibleEngineer: 'Jeerawat',
      moduleType: 'EE_ONLY',
      status: 'Active',
    },
    {
      id: 'mod-302',
      projectId: 'proj-3',
      code: 'MOD-AUTO-PACK-MC',
      name: 'Auto Pack Conveyor & Sealing Mechanism',
      dwgNo: 'B0007-020-000-A',
      description: 'Belt Drive, Pneumatics & Sealing Jaws',
      targetBudget: 170000,
      responsibleEngineer: 'Jeerawat',
      moduleType: 'MC_ONLY',
      status: 'Active',
    },
  ];

  for (const mod of modulesData) {
    await prisma.module.upsert({
      where: { id: mod.id },
      update: mod,
      create: mod,
    });
  }
  console.log('✅ Modules seeded');

  // ── 3. Parts จริงจาก WARSGATE_BOM_PartList_2026-07-30.xlsx ──
  const partsData = [
    // ── MOD-BOX-CTRL (mod-1) : EE Box items ──────────────────
    { id: 'p-001', itemNo: 1,  projectId: 'proj-1', moduleId: 'mod-1', dwgNo: '073007-000-000-A', partName: 'Box Control Enclosure',           typeSpec: 'Denco DA-09',                 category: 'MC', partType: 'Feb Part',      qty: 1,   unit: 'EA',   maker: 'Denco',     supplier: 'Denco Direct',     targetUnitPrice: 1466,    targetTotalAmount: 1466,    unitPrice: 3500,   totalAmount: 3500,   poNumber: 'PO-2026-001', storeLocation: 'Rack A-01',          status: 'Ordered',     workflowStage: '3. Procurement (STD,FEB)', remarks: 'EST Target: 1,466.00 | PO Actual: 3,500.00' },
    { id: 'p-002', itemNo: 2,  projectId: 'proj-1', moduleId: 'mod-1', dwgNo: '073007-000-000-A', partName: 'CP30 Circuit Breaker 2P 3A',       typeSpec: 'CP30 2P 3A',                  category: 'EE', partType: 'Standard Part', qty: 1,   unit: 'EA',   maker: 'Mitsubishi', supplier: 'Mizumi',           targetUnitPrice: 1871,    targetTotalAmount: 1871,    unitPrice: 1000,   totalAmount: 1000,   poNumber: 'PO-2026-002', storeLocation: 'Store Shelf E-04',   status: 'Received',    workflowStage: '3. Procurement (STD,FEB)', remarks: 'EST Target: 1,871.00 (Savings 871.00)' },
    { id: 'p-003', itemNo: 3,  projectId: 'proj-1', moduleId: 'mod-1', dwgNo: '073007-000-000-A', partName: 'CP30 Circuit Breaker 1P 1A',       typeSpec: 'CP30 1P 1A',                  category: 'EE', partType: 'Standard Part', qty: 1,   unit: 'EA',   maker: 'Mitsubishi', supplier: 'Mizumi',           targetUnitPrice: 703,     targetTotalAmount: 703,     unitPrice: 1000,   totalAmount: 1000,   poNumber: 'PO-2026-002', storeLocation: 'Store Shelf E-04',   status: 'Received',    workflowStage: '3. Procurement (STD,FEB)', remarks: 'EST Target: 703.00' },
    { id: 'p-004', itemNo: 4,  projectId: 'proj-1', moduleId: 'mod-1', dwgNo: '073007-000-000-A', partName: 'Lapp Cable 0.25 Blue',             typeSpec: 'Lapp 0.25 Bu',                category: 'EE', partType: 'Standard Part', qty: 100, unit: 'M',    maker: 'Lapp',      supplier: 'Lapp Thailand',    targetUnitPrice: 10,      targetTotalAmount: 1000,    unitPrice: 10,     totalAmount: 1000,   poNumber: 'PO-2026-003', storeLocation: 'Wire Rack W-01',     status: 'Completed',   workflowStage: '3. Procurement (STD,FEB)', remarks: 'Control wiring blue' },
    { id: 'p-005', itemNo: 5,  projectId: 'proj-1', moduleId: 'mod-1', dwgNo: '073007-000-000-A', partName: 'Lapp Cable 0.25 White',            typeSpec: 'Lapp 0.25 Wh',                category: 'EE', partType: 'Standard Part', qty: 100, unit: 'M',    maker: 'Lapp',      supplier: 'Lapp Thailand',    targetUnitPrice: 10,      targetTotalAmount: 1000,    unitPrice: 10,     totalAmount: 1000,   poNumber: 'PO-2026-003', storeLocation: 'Wire Rack W-02',     status: 'Completed',   workflowStage: '3. Procurement (STD,FEB)', remarks: 'Control wiring white' },
    { id: 'p-006', itemNo: 6,  projectId: 'proj-1', moduleId: 'mod-1', dwgNo: '073007-000-000-A', partName: 'Double Terminal Block tw30',       typeSpec: 'tw30',                        category: 'EE', partType: 'Standard Part', qty: 30,  unit: 'PACK', maker: 'Toki',      supplier: 'Mizumi',           targetUnitPrice: 35,      targetTotalAmount: 1050,    unitPrice: 35,     totalAmount: 1050,   poNumber: 'PO-2026-004', storeLocation: 'Shelf E-01',         status: 'Received',    workflowStage: '3. Procurement (STD,FEB)', remarks: '' },
    { id: 'p-007', itemNo: 7,  projectId: 'proj-1', moduleId: 'mod-1', dwgNo: '073007-000-000-A', partName: 'Terminal Cover Tw30',             typeSpec: 'Cover Tw30',                  category: 'MC', partType: 'Standard Part', qty: 1,   unit: 'EA',   maker: 'Toki',      supplier: 'Mizumi',           targetUnitPrice: 300,     targetTotalAmount: 300,     unitPrice: 300,    totalAmount: 300,    poNumber: 'PO-2026-004', storeLocation: 'Shelf E-01',         status: 'Received',    workflowStage: '3. Procurement (STD,FEB)', remarks: '' },
    { id: 'p-008', itemNo: 8,  projectId: 'proj-1', moduleId: 'mod-1', dwgNo: '073007-000-000-A', partName: 'Lapp Power Cable 2.5 Black',      typeSpec: 'Lapp 2.5 BL',                 category: 'EE', partType: 'Standard Part', qty: 100, unit: 'M',    maker: 'Lapp',      supplier: 'Lapp Thailand',    targetUnitPrice: 20,      targetTotalAmount: 2000,    unitPrice: 20,     totalAmount: 2000,   poNumber: 'PO-2026-003', storeLocation: 'Wire Rack W-03',     status: 'Completed',   workflowStage: '3. Procurement (STD,FEB)', remarks: 'Main power supply wire' },
    { id: 'p-009', itemNo: 9,  projectId: 'proj-1', moduleId: 'mod-1', dwgNo: '073007-000-000-A', partName: 'Terminal Jumper Bar Tw30',        typeSpec: 'Tw30',                        category: 'EE', partType: 'Standard Part', qty: 2,   unit: 'EA',   maker: 'Toki',      supplier: 'Mizumi',           targetUnitPrice: 150,     targetTotalAmount: 300,     unitPrice: 150,    totalAmount: 300,    poNumber: 'PO-2026-004', storeLocation: 'Shelf E-01',         status: 'Received',    workflowStage: '3. Procurement (STD,FEB)', remarks: '' },
    { id: 'p-010', itemNo: 10, projectId: 'proj-1', moduleId: 'mod-1', dwgNo: '073007-000-000-A', partName: 'Fork Terminal (หางปลาแฉก)',       typeSpec: 'Fork Lugs Set',               category: 'EE', partType: 'Standard Part', qty: 3,   unit: 'PACK', maker: 'Generic',   supplier: 'Local Store',      targetUnitPrice: 100,     targetTotalAmount: 300,     unitPrice: 100,    totalAmount: 300,    poNumber: 'PO-2026-005', storeLocation: 'Bins B-02',          status: 'Received',    workflowStage: '3. Procurement (STD,FEB)', remarks: '' },
    { id: 'p-011', itemNo: 11, projectId: 'proj-1', moduleId: 'mod-1', dwgNo: '073007-000-000-A', partName: 'Assembly Screw Set M4/M5',        typeSpec: 'Screw Pack',                  category: 'MC', partType: 'Standard Part', qty: 50,  unit: 'EA',   maker: 'Generic',   supplier: 'Mizumi',           targetUnitPrice: 2,       targetTotalAmount: 100,     unitPrice: 2,      totalAmount: 100,    poNumber: 'PO-2026-004', storeLocation: 'Fastener Bin F-12', status: 'Completed',   workflowStage: '3. Procurement (STD,FEB)', remarks: '' },
    { id: 'p-012', itemNo: 12, projectId: 'proj-1', moduleId: 'mod-1', dwgNo: '073007-000-000-A', partName: 'Stand Steel Profile Frame',       typeSpec: 'Order Custom Profile',        category: 'MC', partType: 'Feb Part',      qty: 1,   unit: 'EA',   maker: 'Custom Fab', supplier: 'Local Machine Shop', targetUnitPrice: 1600,   targetTotalAmount: 1600,    unitPrice: 2000,   totalAmount: 2000,   poNumber: 'PO-2026-006', storeLocation: 'Assembly Floor',     status: 'In Assembly', workflowStage: '4. Assembly',              remarks: 'EST Target: 1,600.00' },
    { id: 'p-013', itemNo: 13, projectId: 'proj-1', moduleId: 'mod-1', dwgNo: '073007-000-000-A', partName: 'PLC Omron CP1L-E',               typeSpec: 'CP1L-E 30IO',                 category: 'EE', partType: 'Standard Part', qty: 1,   unit: 'EA',   maker: 'Omron',     supplier: 'Omron Direct',     targetUnitPrice: 14000,   targetTotalAmount: 14000,   unitPrice: 15000,  totalAmount: 15000,  poNumber: 'PO-2026-007', storeLocation: 'Secure Store S-01',  status: 'Received',    workflowStage: '3. Procurement (STD,FEB)', remarks: 'Main Programmable Controller (EST: 14,000.00)' },
    { id: 'p-014', itemNo: 14, projectId: 'proj-1', moduleId: 'mod-1', dwgNo: '073007-000-000-A', partName: 'DC Power Supply 24V 4.2A',        typeSpec: 'MDR-100-24',                  category: 'EE', partType: 'Standard Part', qty: 1,   unit: 'EA',   maker: 'Mean Well', supplier: 'Misumi',           targetUnitPrice: 2051.61, targetTotalAmount: 2051.61, unitPrice: 2500,   totalAmount: 2500,   poNumber: 'PO-2026-008', storeLocation: 'Shelf E-02',         status: 'Received',    workflowStage: '3. Procurement (STD,FEB)', remarks: 'EST Target: 2,051.61' },
    { id: 'p-015', itemNo: 15, projectId: 'proj-1', moduleId: 'mod-1', dwgNo: '073007-000-000-A', partName: 'Cooling Fan 4 inch 220V',         typeSpec: 'Fan 4"',                      category: 'MC', partType: 'Standard Part', qty: 1,   unit: 'EA',   maker: 'Glink',     supplier: 'Shoppe',           targetUnitPrice: 139,     targetTotalAmount: 139,     unitPrice: 250,    totalAmount: 250,    poNumber: 'PO-2026-009', storeLocation: 'Shelf M-03',         status: 'Received',    workflowStage: '3. Procurement (STD,FEB)', remarks: 'EST Target: 139.00' },
    { id: 'p-016', itemNo: 16, projectId: 'proj-1', moduleId: 'mod-1', dwgNo: '073007-000-000-A', partName: 'Dust Filter Mesh 4 inch',         typeSpec: 'Filter Fan 4"',               category: 'MC', partType: 'Standard Part', qty: 2,   unit: 'EA',   maker: 'Generic',   supplier: 'Shoppe',           targetUnitPrice: 200,     targetTotalAmount: 400,     unitPrice: 200,    totalAmount: 400,    poNumber: 'PO-2026-009', storeLocation: 'Shelf M-03',         status: 'Received',    workflowStage: '3. Procurement (STD,FEB)', remarks: '' },
    { id: 'p-017', itemNo: 17, projectId: 'proj-1', moduleId: 'mod-1', dwgNo: '073007-000-000-A', partName: 'Cable Gland / Closing Seal',      typeSpec: 'KSG-150',                     category: 'MC', partType: 'Standard Part', qty: 1,   unit: 'EA',   maker: 'Misumi',    supplier: 'Misumi',           targetUnitPrice: 760.16,  targetTotalAmount: 760.16,  unitPrice: 1000,   totalAmount: 1000,   poNumber: 'PO-2026-008', storeLocation: 'Shelf M-01',         status: 'Received',    workflowStage: '3. Procurement (STD,FEB)', remarks: 'EST Target: 760.16' },
    { id: 'p-018', itemNo: 18, projectId: 'proj-1', moduleId: 'mod-1', dwgNo: '073007-000-000-A', partName: 'Main Power Plug & Socket',        typeSpec: 'Power Plug 3P',               category: 'EE', partType: 'Standard Part', qty: 1,   unit: 'EA',   maker: 'Generic',   supplier: 'Local Store',      targetUnitPrice: 500,     targetTotalAmount: 500,     unitPrice: 500,    totalAmount: 500,    poNumber: 'PO-2026-005', storeLocation: 'Bins B-05',          status: 'Received',    workflowStage: '3. Procurement (STD,FEB)', remarks: '' },
    { id: 'p-019', itemNo: 19, projectId: 'proj-1', moduleId: 'mod-1', dwgNo: '073007-000-000-A', partName: 'Enclosure Mounting Accessory Kit', typeSpec: 'Accessory',                  category: 'MC', partType: 'Feb Part',      qty: 1,   unit: 'EA',   maker: 'Denco',     supplier: 'Denco Direct',     targetUnitPrice: 5000,    targetTotalAmount: 5000,    unitPrice: 5000,   totalAmount: 5000,   poNumber: '',            storeLocation: '',                   status: 'Planned',     workflowStage: '2. BOM Part List',         remarks: 'รอออกใบสั่งซื้อ (Pending PO)' },
    // ── MOD-KEYENCE-VIS (mod-2) : Common / Keyence items ─────
    { id: 'p-020', itemNo: 20, projectId: 'proj-1', moduleId: 'mod-2', dwgNo: '073007-900-000-A', partName: 'Industrial LCD Monitor 17"',      typeSpec: 'E1415SC',                     category: 'EE', partType: 'Standard Part', qty: 1,   unit: 'EA',   maker: 'Dell',      supplier: 'Dell Direct',      targetUnitPrice: 605,     targetTotalAmount: 605,     unitPrice: 1000,   totalAmount: 1000,   poNumber: 'PO-2026-010', storeLocation: 'IT Store Rack 2',    status: 'Received',    workflowStage: '3. Procurement (STD,FEB)', remarks: 'EST Target: 605.00' },
    { id: 'p-021', itemNo: 21, projectId: 'proj-1', moduleId: 'mod-2', dwgNo: '073007-900-000-A', partName: 'Industrial Keyboard USB',         typeSpec: 'NKB-107',                     category: 'EE', partType: 'Standard Part', qty: 1,   unit: 'EA',   maker: 'Nubwo',     supplier: 'Local Store',      targetUnitPrice: 369,     targetTotalAmount: 369,     unitPrice: 700,    totalAmount: 700,    poNumber: 'PO-2026-005', storeLocation: 'IT Store Rack 1',    status: 'Received',    workflowStage: '3. Procurement (STD,FEB)', remarks: 'EST Target: 369.00' },
    { id: 'p-022', itemNo: 22, projectId: 'proj-1', moduleId: 'mod-2', dwgNo: '073007-900-000-A', partName: 'Mini Industrial PC Controller',   typeSpec: 'Optiplex 3080 mini RAM16GB 1TB', category: 'EE', partType: 'Standard Part', qty: 1, unit: 'EA', maker: 'Dell',      supplier: 'Dell Direct',      targetUnitPrice: 11430,   targetTotalAmount: 11430,   unitPrice: 17000,  totalAmount: 17000,  poNumber: 'PO-2026-010', storeLocation: '',                   status: 'Ordered',     workflowStage: '3. Procurement (STD,FEB)', remarks: 'Keyence Vision Processing Unit (EST: 11,430.00)' },
    { id: 'p-023', itemNo: 23, projectId: 'proj-1', moduleId: 'mod-2', dwgNo: '073007-900-000-A', partName: 'Safety Limit Switch',             typeSpec: 'AZ8107',                      category: 'EE', partType: 'Standard Part', qty: 1,   unit: 'EA',   maker: 'Panasonic', supplier: 'Mizumi',           targetUnitPrice: 690,     targetTotalAmount: 690,     unitPrice: 1000,   totalAmount: 1000,   poNumber: 'PO-2026-004', storeLocation: 'Shelf S-04',         status: 'Received',    workflowStage: '3. Procurement (STD,FEB)', remarks: 'EST Target: 690.00' },
    { id: 'p-024', itemNo: 24, projectId: 'proj-1', moduleId: 'mod-2', dwgNo: '073007-900-000-A', partName: 'Bracket Nakara Switch & Accessories', typeSpec: 'Bracket Set Custom',       category: 'MC', partType: 'Feb Part',      qty: 1,   unit: 'SET',  maker: 'Custom Order', supplier: 'Local Shop',      targetUnitPrice: 1200,    targetTotalAmount: 1200,    unitPrice: 1200,   totalAmount: 1200,   poNumber: 'PO-2026-011', storeLocation: 'Assembly Floor',     status: 'In Assembly', workflowStage: '4. Assembly',              remarks: 'Custom Bracket for Switch' },
    { id: 'p-025', itemNo: 25, projectId: 'proj-1', moduleId: 'mod-2', dwgNo: '073007-900-000-A', partName: 'Keyence Vision Sensor Head',      typeSpec: 'Camera Vision Sensor Unit',   category: 'EE', partType: 'Standard Part', qty: 1,   unit: 'EA',   maker: 'Keyence',   supplier: 'Keyence Thailand', targetUnitPrice: 5000,    targetTotalAmount: 5000,    unitPrice: 5000,   totalAmount: 5000,   poNumber: 'PO-2026-012', storeLocation: 'Secure Store Keyence-01', status: 'Received', workflowStage: '3. Procurement (STD,FEB)', remarks: 'High speed inspection sensor' },
  ];

  for (const part of partsData) {
    await prisma.part.upsert({
      where: { id: part.id },
      update: part as any,
      create: part as any,
    });
  }
  console.log(`✅ Parts seeded (${partsData.length} items)`);

  // ── 4. Master Tasks (9 stages per project) ───────────────────
  const taskTemplates = [
    { wbs: '1.0', stageName: '1. Design (DS,EE,PG)',       title: '1. ออกแบบกลไก ไฟฟ้า และโปรแกรม (DS/EE/PG)',              responsible: 'Jeerawat & Team',         planStart: '2026-02-01', planEnd: '2026-02-14', actualStart: '2026-02-01', actualEnd: '2026-02-13', progress: 100, status: 'Completed',   color: 'bg-blue-600'    },
    { wbs: '2.0', stageName: '2. BOM Part List',            title: '2. ถอดแบบ & สรุปรายการชิ้นส่วน BOM Part List',           responsible: 'BOM Engineer',             planStart: '2026-02-15', planEnd: '2026-02-21', actualStart: '2026-02-14', actualEnd: '2026-02-20', progress: 100, status: 'Completed',   color: 'bg-indigo-600'  },
    { wbs: '3.0', stageName: '3. Procurement (STD,FEB)',    title: '3. สั่งซื้อชิ้นส่วนมาตรฐาน (STD) & สั่งแปรรูป (FEB)',  responsible: 'Purchasing & Mizumi/Omron',planStart: '2026-02-22', planEnd: '2026-03-15', actualStart: '2026-02-21', actualEnd: '2026-03-18', progress: 85,  status: 'In Progress', color: 'bg-amber-600'   },
    { wbs: '4.0', stageName: '4. Assembly',                 title: '4. ประกอบโครงสร้างกลไก & เดินสายไฟตู้คอนโทรล',          responsible: 'Assembly Technicians',     planStart: '2026-03-16', planEnd: '2026-03-28', actualStart: '2026-03-19', actualEnd: '2026-03-30', progress: 40,  status: 'In Progress', color: 'bg-sky-600'     },
    { wbs: '5.0', stageName: '5. Testing',                  title: '5. ปรับตั้ง & ทดสอบระบบกล้อง Keyence Vision',            responsible: 'Anusorn (Vision Engineer)', planStart: '2026-03-29', planEnd: '2026-04-05', actualStart: '',           actualEnd: '',           progress: 0,   status: 'Pending',     color: 'bg-purple-600'  },
    { wbs: '6.0', stageName: '6. BuyOff',                   title: '6. ตรวจสอบและตรวจรับเครื่องจักรกับลูกค้า (BuyOff)',      responsible: 'Project Lead & Team',      planStart: '2026-04-06', planEnd: '2026-04-08', actualStart: '',           actualEnd: '',           progress: 0,   status: 'Pending',     color: 'bg-emerald-600' },
    { wbs: '7.0', stageName: '7. Packing',                  title: '7. แพ็คเกจจิ้ง & จัดเตรียมขนส่ง (Packing)',              responsible: 'Logistics',                planStart: '2026-04-09', planEnd: '2026-04-10', actualStart: '',           actualEnd: '',           progress: 0,   status: 'Pending',     color: 'bg-teal-600'    },
    { wbs: '8.0', stageName: '8. Install & Service',        title: '8. ติดตั้ง & ส่งมอบ ณ โรงงานลูกค้า (On-Site Install)',  responsible: 'Field Engineers',          planStart: '2026-04-11', planEnd: '2026-04-17', actualStart: '',           actualEnd: '',           progress: 0,   status: 'Pending',     color: 'bg-rose-600'    },
    { wbs: '9.0', stageName: '9. Others',                   title: '9. สรุปเอกสารส่งมอบ & ปิดโครงการ (Handover)',            responsible: 'Project Manager',          planStart: '2026-04-18', planEnd: '2026-04-20', actualStart: '',           actualEnd: '',           progress: 0,   status: 'Pending',     color: 'bg-slate-600'   },
  ];

  for (const proj of projectsData) {
    for (const t of taskTemplates) {
      const taskId = `mt-${proj.id}-${t.wbs.replace('.', '_')}`;
      await prisma.masterTask.upsert({
        where: { id: taskId },
        update: {
          projectId: proj.id, wbs: t.wbs, stageName: t.stageName, title: t.title,
          responsible: t.responsible, planStartDate: t.planStart, planEndDate: t.planEnd,
          actualStartDate: t.actualStart, actualEndDate: t.actualEnd,
          progressPct: t.progress, status: t.status, color: t.color,
        },
        create: {
          id: taskId, projectId: proj.id, wbs: t.wbs, stageName: t.stageName, title: t.title,
          responsible: t.responsible, planStartDate: t.planStart, planEndDate: t.planEnd,
          actualStartDate: t.actualStart, actualEndDate: t.actualEnd,
          actualDates: '[]', dailyNotes: '{}',
          progressPct: t.progress, status: t.status, color: t.color,
        },
      });
    }
  }
  console.log('✅ Master tasks seeded for all 3 projects');

  console.log('\n🎉 Database seeded successfully!');
  await prisma.$disconnect();
}

seed().catch(async (e) => {
  console.error('❌ Seed failed:', e);
  await prisma.$disconnect();
  process.exit(1);
});
