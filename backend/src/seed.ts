import prisma from './prisma';
import bcrypt from 'bcryptjs';

async function seedExactProjects() {
  console.log('Seeding 2 requested projects: PRJ-527 & PRJ-107...');

  // 0. Ensure users exist
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

  // 1. Delete all other projects and their data
  await prisma.part.deleteMany({});
  await prisma.masterTask.deleteMany({});
  await prisma.module.deleteMany({});
  await prisma.quotation.deleteMany({});
  await prisma.project.deleteMany({});

  // 2. Create PRJ-527: Tracking ability Line ADC
  const prj527 = await prisma.project.create({
    data: {
      id: 'proj-527',
      code: 'PRJ-527',
      runningNumber: 527,
      name: 'Tracking ability Line ADC',
      customer: 'บริษัท พีเอ็นพี เทคโนโลยี เกรท จำกัด',
      customerId: '001',
      dwgNo: 'ADC-2608-001',
      targetBudget: 1244713.60,
      description: 'โครงการ PLC Control Board (Ethernet IP) & Tracking ability Line ADC (PO: 2607001 / QT-2607-001)',
      status: 'Active',
      startDate: '2026-08-01',
      targetDeliveryDate: '2026-09-30',
      poDate: '2026-07-20',
      contactPerson: 'Mr. Patama (คุณปัทมะ จินดาพงษ์)',
    }
  });

  // Modules for PRJ-527
  const mod527_1 = await prisma.module.create({
    data: {
      id: 'mod-527-1',
      projectId: prj527.id,
      code: 'MOD-ADC-PLC',
      name: 'PLC Control Board & Ethernet IP',
      dwgNo: 'ADC-MOD-001',
      description: 'Main PLC Control Board CJ1W-EIP21 & Ethernet Communication',
      targetBudget: 750000,
      responsibleEngineer: 'Jeerawat',
      moduleType: 'EE_ONLY',
      status: 'Active',
    }
  });

  const mod527_2 = await prisma.module.create({
    data: {
      id: 'mod-527-2',
      projectId: prj527.id,
      code: 'MOD-ADC-SUBBOX',
      name: 'Sub PLC Box & Accessories',
      dwgNo: 'ADC-MOD-002',
      description: 'Sub PLC Box 6 Set, Power Supply, Module Link & Cable Link',
      targetBudget: 160000,
      responsibleEngineer: 'Jeerawat',
      moduleType: 'EE_ONLY',
      status: 'Active',
    }
  });

  const mod527_3 = await prisma.module.create({
    data: {
      id: 'mod-527-3',
      projectId: prj527.id,
      code: 'MOD-ADC-SERVER',
      name: 'Rack PC Center & Data Center',
      dwgNo: 'ADC-MOD-003',
      description: 'Cisco Hub, 12U Rack Server, Control Box & Industrial PC',
      targetBudget: 285000,
      responsibleEngineer: 'Jeerawat',
      moduleType: 'BOTH',
      status: 'Active',
    }
  });

  const mod527_4 = await prisma.module.create({
    data: {
      id: 'mod-527-4',
      projectId: prj527.id,
      code: 'MOD-ADC-STRUCT',
      name: 'Structure Support & Profiles',
      dwgNo: 'ADC-MOD-004',
      description: 'Aluminum Profile Structures and Mounting Supports',
      targetBudget: 49713.60,
      responsibleEngineer: 'Jeerawat',
      moduleType: 'MC_ONLY',
      status: 'Active',
    }
  });

  // 6 Parts for PRJ-527 (Exact from Delivery Note / Line ADC PDF)
  const parts527 = [
    {
      id: 'part-527-1',
      projectId: prj527.id,
      moduleId: mod527_1.id,
      itemNo: 1,
      dwgNo: 'ADC-2608-001-01',
      partName: 'PLC Control Board (Ethernet IP)',
      typeSpec: 'Part: CJ1W-EIP21 | Brand: OMRON (Line ADC)',
      category: 'EE',
      partType: 'Standard Part',
      qty: 21,
      unit: 'EA',
      maker: 'OMRON',
      supplier: 'Omron Dealer',
      targetUnitPrice: 35040,
      targetTotalAmount: 735840,
      unitPrice: 35040,
      totalAmount: 735840,
      poNumber: 'PO-2607001',
      orderDate: '2026-08-05',
      receiveDate: '',
      storeLocation: 'Line ADC Area',
      status: 'Ordered',
      workflowStage: '3. Procurement (STD,FEB)',
      remarks: '21 Boards for Line ADC Tracking'
    },
    {
      id: 'part-527-2',
      projectId: prj527.id,
      moduleId: mod527_2.id,
      itemNo: 2,
      dwgNo: 'ADC-2608-001-02',
      partName: 'Sub PLC Box + Accessories (6 SET)',
      typeSpec: 'CJ1W-PA202, CJ1W-IC101, CJ1W-II101, CS1W-CN223 2M (OMRON)',
      category: 'EE',
      partType: 'Standard Part',
      qty: 6,
      unit: 'SET',
      maker: 'OMRON',
      supplier: 'Omron Dealer',
      targetUnitPrice: 26000,
      targetTotalAmount: 156000,
      unitPrice: 26000,
      totalAmount: 156000,
      poNumber: 'PO-2607001',
      orderDate: '',
      receiveDate: '',
      storeLocation: 'Line ADC Sub Station',
      status: 'Planned',
      workflowStage: '2. BOM Part List',
      remarks: 'Sub PLC Boxes 6 sets'
    },
    {
      id: 'part-527-3',
      projectId: prj527.id,
      moduleId: mod527_3.id,
      itemNo: 3,
      dwgNo: 'ADC-2608-001-03',
      partName: 'Rack PC Center',
      typeSpec: 'Cisco CBS110-24T-EU Hub + Server Rack 12U ACR-12U-W APOLLO',
      category: 'EE',
      partType: 'Standard Part',
      qty: 1,
      unit: 'EA',
      maker: 'CISCO / APOLLO',
      supplier: 'IT Network Supply',
      targetUnitPrice: 12000,
      targetTotalAmount: 12000,
      unitPrice: 12000,
      totalAmount: 12000,
      poNumber: 'PO-2607001',
      orderDate: '',
      receiveDate: '',
      storeLocation: 'IT Server Room',
      status: 'Planned',
      workflowStage: '2. BOM Part List',
      remarks: 'Network & Rack Center'
    },
    {
      id: 'part-527-4',
      projectId: prj527.id,
      moduleId: mod527_3.id,
      itemNo: 4,
      dwgNo: 'ADC-2608-001-04',
      partName: 'PLC Data Center Line (1 SET)',
      typeSpec: 'BOX CE-01 TEMCO, CJ1W-PA202, CJ1W-CPU12, CJ1W-211, CP30-B 5A',
      category: 'EE',
      partType: 'Standard Part',
      qty: 1,
      unit: 'SET',
      maker: 'OMRON / FUJI / TEMCO',
      supplier: 'Omron Dealer',
      targetUnitPrice: 150000,
      targetTotalAmount: 150000,
      unitPrice: 150000,
      totalAmount: 150000,
      poNumber: 'PO-2607001',
      orderDate: '',
      receiveDate: '',
      storeLocation: 'Central PLC Cabinet',
      status: 'Planned',
      workflowStage: '2. BOM Part List',
      remarks: 'Main Data Center PLC Unit'
    },
    {
      id: 'part-527-5',
      projectId: prj527.id,
      moduleId: mod527_4.id,
      itemNo: 5,
      dwgNo: 'ADC-2608-001-05',
      partName: 'Structure Support',
      typeSpec: 'Aluminium Profile (LOCAL)',
      category: 'MC',
      partType: 'Feb Part',
      qty: 1,
      unit: 'SET',
      maker: 'LOCAL',
      supplier: 'Aluminium Fab Shop',
      targetUnitPrice: 20000,
      targetTotalAmount: 20000,
      unitPrice: 20000,
      totalAmount: 20000,
      poNumber: 'PO-2607001',
      orderDate: '',
      receiveDate: '',
      storeLocation: 'Line ADC Assembly Zone',
      status: 'Planned',
      workflowStage: '2. BOM Part List',
      remarks: 'Mounting & Stand Structure'
    },
    {
      id: 'part-527-6',
      projectId: prj527.id,
      moduleId: mod527_3.id,
      itemNo: 6,
      dwgNo: 'ADC-2608-001-06',
      partName: 'PC Center Industrial Workstation',
      typeSpec: 'PC WG-93342286-SO26008123 + UPS ZIRCON AX 1000VA + Keyboard MK120',
      category: 'EE',
      partType: 'Standard Part',
      qty: 1,
      unit: 'SET',
      maker: 'WARSGATE / ZIRCON / LOGITECH',
      supplier: 'IT Network Supply',
      targetUnitPrice: 123000,
      targetTotalAmount: 123000,
      unitPrice: 123000,
      totalAmount: 123000,
      poNumber: 'PO-2607001',
      orderDate: '',
      receiveDate: '',
      storeLocation: 'Control Room Line ADC',
      status: 'Planned',
      workflowStage: '2. BOM Part List',
      remarks: 'Line ADC Tracking Master PC'
    }
  ];

  for (const part of parts527) {
    await prisma.part.create({ data: part as any });
  }

  // 3. Create PRJ-107: Auto Packing LM1
  const prj107 = await prisma.project.create({
    data: {
      id: 'proj-107',
      code: 'PRJ-107',
      runningNumber: 107,
      name: 'Auto Packing LM1',
      customer: 'Thai Sekisui Foam Company Limited.',
      customerId: '002',
      dwgNo: 'LM1-TSF-001',
      targetBudget: 3545600,
      description: 'TSF1-LM1_Auto pack machine: Stacker Foam, Open Bag & Palletizer (QT-25690709 / CAP250095)',
      status: 'Active',
      startDate: '2026-06-25',
      targetDeliveryDate: '2026-10-31',
      poDate: '2026-07-09',
      contactPerson: 'Alongkorn@thaisekisui.co.th (Phone: 088-223-308)',
    }
  });

  // Modules for PRJ-107
  const mod107_1 = await prisma.module.create({
    data: {
      id: 'mod-107-1',
      projectId: prj107.id,
      code: 'MOD-LM1-STK',
      name: 'Station Stacker Foam (STF-10P)',
      dwgNo: 'LM1-MOD-001',
      description: 'Load work and stack foam sheets automatically (STF-10P)',
      targetBudget: 765394,
      responsibleEngineer: 'Jeerawat',
      moduleType: 'BOTH',
      status: 'Active',
    }
  });

  const mod107_2 = await prisma.module.create({
    data: {
      id: 'mod-107-2',
      projectId: prj107.id,
      code: 'MOD-LM1-OPB',
      name: 'Station Open Bag & Insert Foam (OPB-10P)',
      dwgNo: 'LM1-MOD-002',
      description: 'Open bag to push stacked foam into bag and load out (OPB-10P)',
      targetBudget: 650215,
      responsibleEngineer: 'Jeerawat',
      moduleType: 'BOTH',
      status: 'Active',
    }
  });

  const mod107_3 = await prisma.module.create({
    data: {
      id: 'mod-107-3',
      projectId: prj107.id,
      code: 'MOD-LM1-PLK',
      name: 'Station Pallet Stacker Foam (PLK-04P)',
      dwgNo: 'LM1-MOD-003',
      description: 'Palletizer stacker foam one pack at a time onto pallet (PLK-04P)',
      targetBudget: 690391,
      responsibleEngineer: 'Jeerawat',
      moduleType: 'BOTH',
      status: 'Active',
    }
  });

  const mod107_4 = await prisma.module.create({
    data: {
      id: 'mod-107-4',
      projectId: prj107.id,
      code: 'MOD-LM1-CTRL',
      name: 'Control Box System & Automation',
      dwgNo: 'LM1-MOD-004',
      description: 'Main PLC, Inverters, Servo Drivers and Electrical Control Cabinet',
      targetBudget: 312000,
      responsibleEngineer: 'Jeerawat',
      moduleType: 'EE_ONLY',
      status: 'Active',
    }
  });

  // 2 Parts for PRJ-107 (Exact matching 2 pending parts)
  const parts107 = [
    {
      id: 'part-107-1',
      projectId: prj107.id,
      moduleId: mod107_1.id,
      itemNo: 1,
      dwgNo: 'LM1-STF-001-A',
      partName: 'Standard & Fabrication Part - Station Stacker Foam',
      typeSpec: 'STF-10P Mechanical & Pneumatic Components',
      category: 'MC',
      partType: 'Standard Part',
      qty: 1,
      unit: 'SET',
      maker: 'Warsgate / Standard',
      supplier: 'Standard Supply',
      targetUnitPrice: 475394,
      targetTotalAmount: 475394,
      unitPrice: 475394,
      totalAmount: 475394,
      poNumber: '',
      orderDate: '',
      receiveDate: '',
      storeLocation: '',
      status: 'Planned',
      workflowStage: '2. BOM Part List',
      remarks: 'Station 1 Stacker Foam Parts (Pending Order)'
    },
    {
      id: 'part-107-2',
      projectId: prj107.id,
      moduleId: mod107_2.id,
      itemNo: 2,
      dwgNo: 'LM1-OPB-001-A',
      partName: 'Standard & Fabrication Part - Station Open Bag & Insert',
      typeSpec: 'OPB-10P Inserter Cylinder & Suction Cup Unit',
      category: 'MC',
      partType: 'Standard Part',
      qty: 1,
      unit: 'SET',
      maker: 'Warsgate / Standard',
      supplier: 'Standard Supply',
      targetUnitPrice: 400215,
      targetTotalAmount: 400215,
      unitPrice: 400215,
      totalAmount: 400215,
      poNumber: '',
      orderDate: '',
      receiveDate: '',
      storeLocation: '',
      status: 'Planned',
      workflowStage: '2. BOM Part List',
      remarks: 'Station 2 Open Bag & Insert Foam Parts (Pending Order)'
    }
  ];

  for (const part of parts107) {
    await prisma.part.create({ data: part as any });
  }

  // 4. Master tasks for both projects (9 stages)
  const taskTemplates = [
    { wbs: '1.0', stageName: '1. Design (DS,EE,PG)', title: '1. ออกแบบกลไก ไฟฟ้า และโปรแกรม (DS/EE/PG)', responsible: 'Jeerawat & Team', planStart: '2026-07-01', planEnd: '2026-07-20', actualStart: '2026-07-01', actualEnd: '2026-07-18', progress: 100, status: 'Completed', color: 'bg-blue-600' },
    { wbs: '2.0', stageName: '2. BOM Part List', title: '2. ถอดแบบ & สรุปรายการชิ้นส่วน BOM Part List', responsible: 'BOM Engineer', planStart: '2026-07-21', planEnd: '2026-07-31', actualStart: '2026-07-20', actualEnd: '2026-07-30', progress: 100, status: 'Completed', color: 'bg-indigo-600' },
    { wbs: '3.0', stageName: '3. Procurement (STD,FEB)', title: '3. สั่งซื้อชิ้นส่วนมาตรฐาน (STD) & สั่งแปรรูป (FEB)', responsible: 'Purchasing & Vendor', planStart: '2026-08-01', planEnd: '2026-08-25', actualStart: '2026-08-01', actualEnd: '', progress: 60, status: 'In Progress', color: 'bg-amber-600' },
    { wbs: '4.0', stageName: '4. Assembly', title: '4. ประกอบโครงสร้างกลไก & เดินสายไฟตู้คอนโทรล', responsible: 'Assembly Technicians', planStart: '2026-08-26', planEnd: '2026-09-15', actualStart: '', actualEnd: '', progress: 0, status: 'Pending', color: 'bg-sky-600' },
    { wbs: '5.0', stageName: '5. Testing', title: '5. ปรับตั้ง & ทดสอบระบบ (Testing & Commissioning)', responsible: 'Jeerawat (Lead Engineer)', planStart: '2026-09-16', planEnd: '2026-09-25', actualStart: '', actualEnd: '', progress: 0, status: 'Pending', color: 'bg-purple-600' },
    { wbs: '6.0', stageName: '6. BuyOff', title: '6. ตรวจสอบและตรวจรับเครื่องจักรกับลูกค้า (BuyOff)', responsible: 'Project Lead & Customer', planStart: '2026-09-26', planEnd: '2026-09-28', actualStart: '', actualEnd: '', progress: 0, status: 'Pending', color: 'bg-emerald-600' },
    { wbs: '7.0', stageName: '7. Packing', title: '7. แพ็คเกจจิ้ง & จัดเตรียมขนส่ง (Packing)', responsible: 'Logistics Team', planStart: '2026-09-29', planEnd: '2026-09-30', actualStart: '', actualEnd: '', progress: 0, status: 'Pending', color: 'bg-teal-600' },
    { wbs: '8.0', stageName: '8. Install & Service', title: '8. ติดตั้ง & ส่งมอบ ณ โรงงานลูกค้า (On-Site Install)', responsible: 'Field Engineers', planStart: '2026-10-01', planEnd: '2026-10-15', actualStart: '', actualEnd: '', progress: 0, status: 'Pending', color: 'bg-rose-600' },
    { wbs: '9.0', stageName: '9. Others', title: '9. สรุปเอกสารส่งมอบ & ปิดโครงการ (Handover)', responsible: 'Project Manager', planStart: '2026-10-16', planEnd: '2026-10-20', actualStart: '', actualEnd: '', progress: 0, status: 'Pending', color: 'bg-slate-600' },
  ];

  for (const proj of [prj527, prj107]) {
    for (const t of taskTemplates) {
      const taskId = `mt-${proj.id}-${t.wbs.replace('.', '_')}`;
      await prisma.masterTask.create({
        data: {
          id: taskId,
          projectId: proj.id,
          wbs: t.wbs,
          stageName: t.stageName as any,
          title: t.title,
          responsible: t.responsible,
          planStartDate: t.planStart,
          planEndDate: t.planEnd,
          actualStartDate: t.actualStart,
          actualEndDate: t.actualEnd,
          actualDates: '[]',
          dailyNotes: '{}',
          progressPct: t.progress,
          status: t.status,
          color: t.color,
        }
      });
    }
  }

  console.log('Done! Verified projects:');
  const projs = await prisma.project.findMany({ include: { parts: true, modules: true } });
  for (const p of projs) {
    console.log(`- [${p.code}] ${p.name}: ${p.modules.length} modules, ${p.parts.length} parts (pending: ${p.parts.filter((x: any) => x.status === 'Planned').length})`);
  }

  await prisma.$disconnect();
}

seedExactProjects().catch(async (e) => {
  console.error('Error seeding:', e);
  await prisma.$disconnect();
  process.exit(1);
});
