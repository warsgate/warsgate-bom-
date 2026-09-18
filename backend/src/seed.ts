import prisma from './prisma';
import bcrypt from 'bcryptjs';

async function seed() {
  console.log('🌱 Seeding database...');

  // 0. Create default users
  const adminHash = await bcrypt.hash('admin', 10);
  const engineerHash = await bcrypt.hash('admin123', 10);

  await prisma.user.upsert({
    where: { username: 'admin' },
    update: { password: adminHash },
    create: {
      username: 'admin',
      password: adminHash,
      role: 'LEVEL_2',
      name: 'Executive Admin',
    },
  });

  await prisma.user.upsert({
    where: { username: 'engineer' },
    update: { password: engineerHash },
    create: {
      username: 'engineer',
      password: engineerHash,
      role: 'LEVEL_1',
      name: 'Lead Engineer',
    },
  });
  console.log('✅ Users seeded (admin / engineer)');

  // 1. Projects
  const projects = [
    {
      id: 'proj-1',
      code: 'PRJ-001',
      name: 'Camera Vision Box Control System',
      customer: 'Maxwell (Camera Vision 1) Keyence',
      dwgNo: '073007-000-000-A',
      targetBudget: 122000,
      description: 'Control Box, Power Supply & Keyence Camera Vision 1 Assembly',
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
      description: 'Electrical & Automation Packaging Line System',
      status: 'Active',
    },
  ];

  for (const proj of projects) {
    const existing = await prisma.project.findFirst({
      where: {
        OR: [{ id: proj.id }, { code: proj.code }],
      },
    });

    if (existing) {
      await prisma.project.update({
        where: { id: existing.id },
        data: {
          code: proj.code,
          name: proj.name,
          customer: proj.customer,
          dwgNo: proj.dwgNo,
          targetBudget: proj.targetBudget,
          description: proj.description,
          status: proj.status,
        },
      });
    } else {
      await prisma.project.create({
        data: proj,
      });
    }
  }
  console.log('✅ Projects seeded (PRJ-001, PRJ-002, B0007)');

  // 2. Modules
  const modules = [
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
    {
      id: 'mod-301',
      projectId: 'proj-3',
      code: 'MOD-AUTO-PACK-EE',
      name: 'EE Auto Pack Electrical Station',
      dwgNo: 'B0007-010-000-A',
      description: 'High Speed Packaging Line Sensors & PLC Distribution',
      targetBudget: 180000,
      responsibleEngineer: 'Nattawat',
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

  for (const mod of modules) {
    await prisma.module.upsert({
      where: { id: mod.id },
      update: {
        projectId: mod.projectId,
        code: mod.code,
        name: mod.name,
        dwgNo: mod.dwgNo,
        description: mod.description,
        targetBudget: mod.targetBudget,
        responsibleEngineer: mod.responsibleEngineer,
        moduleType: mod.moduleType,
        status: mod.status,
      },
      create: mod,
    });
  }
  console.log('✅ Modules seeded');

  // 3. Sample parts
  const parts = [
    {
      id: 'p-1',
      projectId: 'proj-1',
      moduleId: 'mod-1',
      itemNo: 1,
      dwgNo: '073007-000-000-A',
      partName: 'Main Enclosure Box (Steel 600x800x250)',
      typeSpec: 'Denco DA-09 / Rittal IP66',
      category: 'MC',
      partType: 'Standard Part',
      qty: 1,
      unit: 'SET',
      maker: 'Denco',
      supplier: 'Denco Direct',
      targetUnitPrice: 8500.0,
      targetTotalAmount: 8500.0,
      unitPrice: 8500.0,
      totalAmount: 8500.0,
      poNumber: 'PO-2026-001',
      orderDate: '2026-07-20',
      receiveDate: '2026-07-25',
      storeLocation: 'Store Shelf A-01',
      remarks: 'Main Box Structure',
      status: 'Received',
      workflowStage: '3. Procurement (STD,FEB)',
    },
    {
      id: 'p-2',
      projectId: 'proj-1',
      moduleId: 'mod-1',
      itemNo: 2,
      dwgNo: '073007-000-000-A',
      partName: 'CP30 Circuit Breaker 2P 3A',
      typeSpec: 'CP30 2P 3A',
      category: 'EE',
      partType: 'Standard Part',
      qty: 1,
      unit: 'EA',
      maker: 'Mitsubishi',
      supplier: 'Mizumi',
      targetUnitPrice: 1000.0,
      targetTotalAmount: 1000.0,
      unitPrice: 1000.0,
      totalAmount: 1000.0,
      poNumber: 'PO-2026-002',
      orderDate: '2026-07-21',
      receiveDate: '2026-07-26',
      storeLocation: 'Store Shelf B-04',
      remarks: 'EST: 1871.00',
      status: 'Received',
      workflowStage: '3. Procurement (STD,FEB)',
    },
    {
      id: 'p-201',
      projectId: 'proj-2',
      moduleId: 'mod-201',
      itemNo: 1,
      dwgNo: '084012-010-001-B',
      partName: 'AC Servo Motor 400W with Brake',
      typeSpec: 'HG-KR43B',
      category: 'EE',
      partType: 'Standard Part',
      qty: 2,
      unit: 'SET',
      maker: 'Mitsubishi Electric',
      supplier: 'Automation Direct',
      targetUnitPrice: 18500.0,
      targetTotalAmount: 37000.0,
      unitPrice: 18000.0,
      totalAmount: 36000.0,
      poNumber: 'PO-2026-042',
      orderDate: '2026-08-01',
      receiveDate: '2026-08-10',
      storeLocation: 'Store Shelf E-02',
      remarks: 'For Z & X axis',
      status: 'Received',
      workflowStage: '3. Procurement (STD,FEB)',
    },
    {
      id: 'p-301',
      projectId: 'proj-3',
      moduleId: 'mod-301',
      itemNo: 1,
      dwgNo: 'B0007-010-001-A',
      partName: 'Photoelectric Sensor Array',
      typeSpec: 'E3Z-T61 2M',
      category: 'EE',
      partType: 'Standard Part',
      qty: 6,
      unit: 'PCS',
      maker: 'Omron',
      supplier: 'Omron Dealer',
      targetUnitPrice: 1450.0,
      targetTotalAmount: 8700.0,
      unitPrice: 1400.0,
      totalAmount: 8400.0,
      poNumber: 'PO-2026-089',
      orderDate: '2026-08-15',
      receiveDate: '2026-08-22',
      storeLocation: 'Store Shelf C-01',
      remarks: 'Packaging detect',
      status: 'Received',
      workflowStage: '3. Procurement (STD,FEB)',
    },
  ];

  for (const part of parts) {
    await prisma.part.upsert({
      where: { id: part.id },
      update: part as any,
      create: part as any,
    });
  }
  console.log('✅ Parts seeded');

  // 4. Master tasks helper
  const taskTemplates = [
    { wbs: '1.0', stageName: '1. Design (DS,EE,PG)', title: '1. ออกแบบกลไก ไฟฟ้า และโปรแกรม (DS/EE/PG)', responsible: 'Jeerawat & Team', planStart: '2026-02-01', planEnd: '2026-02-14', actualStart: '2026-02-01', actualEnd: '2026-02-13', progress: 100, status: 'Completed', color: 'bg-blue-600' },
    { wbs: '2.0', stageName: '2. BOM Part List', title: '2. ถอดแบบ & สรุปรายการชิ้นส่วน BOM Part List', responsible: 'BOM Engineer', planStart: '2026-02-15', planEnd: '2026-02-21', actualStart: '2026-02-14', actualEnd: '2026-02-20', progress: 100, status: 'Completed', color: 'bg-indigo-600' },
    { wbs: '3.0', stageName: '3. Procurement (STD,FEB)', title: '3. สั่งซื้อชิ้นส่วนมาตรฐาน (STD) & สั่งแปรรูป (FEB)', responsible: 'Purchasing & Mizumi/Omron', planStart: '2026-02-22', planEnd: '2026-03-15', actualStart: '2026-02-21', actualEnd: '2026-03-18', progress: 85, status: 'In Progress', color: 'bg-amber-600' },
    { wbs: '4.0', stageName: '4. Assembly', title: '4. ประกอบโครงสร้างกลไก & เดินสายไฟตู้คอนโทรล', responsible: 'Assembly Technicians', planStart: '2026-03-16', planEnd: '2026-03-28', actualStart: '2026-03-19', actualEnd: '2026-03-30', progress: 40, status: 'In Progress', color: 'bg-sky-600' },
    { wbs: '5.0', stageName: '5. Testing', title: '5. ปรับตั้ง & ทดสอบระบบกล้อง Keyence Vision', responsible: 'Anusorn (Vision Engineer)', planStart: '2026-03-29', planEnd: '2026-04-05', actualStart: '', actualEnd: '', progress: 0, status: 'Pending', color: 'bg-purple-600' },
    { wbs: '6.0', stageName: '6. BuyOff', title: '6. ตรวจสอบและตรวจรับเครื่องจักรกับลูกค้า (BuyOff)', responsible: 'Project Lead & Team', planStart: '2026-04-06', planEnd: '2026-04-08', actualStart: '', actualEnd: '', progress: 0, status: 'Pending', color: 'bg-emerald-600' },
    { wbs: '7.0', stageName: '7. Packing', title: '7. แพ็คเกจจิ้ง & จัดเตรียมขนส่ง (Packing)', responsible: 'Logistics', planStart: '2026-04-09', planEnd: '2026-04-10', actualStart: '', actualEnd: '', progress: 0, status: 'Pending', color: 'bg-teal-600' },
    { wbs: '8.0', stageName: '8. Install & Service', title: '8. ติดตั้ง & ส่งมอบ ณ โรงงานลูกค้า (On-Site Install)', responsible: 'Field Engineers', planStart: '2026-04-11', planEnd: '2026-04-17', actualStart: '', actualEnd: '', progress: 0, status: 'Pending', color: 'bg-rose-600' },
    { wbs: '9.0', stageName: '9. Others', title: '9. สรุปเอกสารส่งมอบ & ปิดโครงการ (Handover)', responsible: 'Project Manager', planStart: '2026-04-18', planEnd: '2026-04-20', actualStart: '', actualEnd: '', progress: 0, status: 'Pending', color: 'bg-slate-600' },
  ];

  for (const proj of projects) {
    for (const t of taskTemplates) {
      const taskId = `mt-${proj.id}-${t.wbs.replace('.', '_')}`;
      await prisma.masterTask.upsert({
        where: { id: taskId },
        update: {
          projectId: proj.id,
          wbs: t.wbs,
          stageName: t.stageName,
          title: t.title,
          responsible: t.responsible,
          planStartDate: t.planStart,
          planEndDate: t.planEnd,
          actualStartDate: t.actualStart,
          actualEndDate: t.actualEnd,
          progressPct: t.progress,
          status: t.status,
          color: t.color,
        },
        create: {
          id: taskId,
          projectId: proj.id,
          wbs: t.wbs,
          stageName: t.stageName,
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
        },
      });
    }
  }
  console.log('✅ Master tasks seeded for all projects');

  console.log('\n🎉 Database seeded successfully!');
  await prisma.$disconnect();
}

seed().catch(async (e) => {
  console.error('❌ Seed failed:', e);
  await prisma.$disconnect();
  process.exit(1);
});
