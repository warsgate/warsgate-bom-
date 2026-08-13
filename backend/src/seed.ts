import prisma from './prisma';

async function seed() {
  console.log('🌱 Seeding database...');

  // 1. Create default project
  const project = await prisma.project.upsert({
    where: { code: 'WG-2026-001' },
    update: {},
    create: {
      id: 'proj-1',
      code: 'WG-2026-001',
      name: 'Camera Vision Check Keyence',
      customer: 'บริษัท ลูกค้า จำกัด',
      dwgNo: '073007-000-000-A',
      targetBudget: 500000,
      description: 'ระบบ Vision Check คุณภาพชิ้นส่วน',
      status: 'Active',
    },
  });
  console.log('✅ Project created:', project.code);

  // 2. Create modules
  const mod1 = await prisma.module.upsert({
    where: { id: 'mod-1' },
    update: {},
    create: {
      id: 'mod-1',
      projectId: project.id,
      code: 'MOD-MC-001',
      name: 'Main Frame Structure',
      dwgNo: '073007-001-000-A',
      targetBudget: 150000,
      responsibleEngineer: 'Jeerawat',
      moduleType: 'BOTH',
      status: 'Active',
    },
  });

  const mod2 = await prisma.module.upsert({
    where: { id: 'mod-2' },
    update: {},
    create: {
      id: 'mod-2',
      projectId: project.id,
      code: 'MOD-EE-001',
      name: 'Electrical Control Panel',
      dwgNo: '073007-002-000-A',
      targetBudget: 120000,
      responsibleEngineer: 'Nattawat',
      moduleType: 'BOTH',
      status: 'Active',
    },
  });
  console.log('✅ Modules created:', mod1.code, mod2.code);

  // 3. Create sample parts
  const parts = [
    {
      id: 'p-001',
      projectId: project.id,
      moduleId: mod1.id,
      itemNo: 1,
      dwgNo: '073007-001-001-A',
      partName: 'Frame Plate 10mm',
      typeSpec: 'SS400 t10mm',
      category: 'MC',
      partType: 'Standard Part',
      qty: 4,
      unit: 'PCS',
      maker: 'Local',
      supplier: 'Metal Shop',
      targetUnitPrice: 850,
      targetTotalAmount: 3400,
      unitPrice: 820,
      totalAmount: 3280,
      status: 'Planned',
      workflowStage: '2. BOM Part List',
    },
    {
      id: 'p-002',
      projectId: project.id,
      moduleId: mod2.id,
      itemNo: 2,
      dwgNo: '073007-002-001-A',
      partName: 'PLC Omron NX1P2',
      typeSpec: 'NX1P2-9024DT1',
      category: 'EE',
      partType: 'Standard Part',
      qty: 1,
      unit: 'EA',
      maker: 'Omron',
      supplier: 'Automation Store',
      targetUnitPrice: 28000,
      targetTotalAmount: 28000,
      unitPrice: 26500,
      totalAmount: 26500,
      status: 'Ordered',
      workflowStage: '3. Procurement (STD,FEB)',
    },
  ];

  for (const part of parts) {
    await prisma.part.upsert({
      where: { id: part.id },
      update: {},
      create: part as any,
    });
  }
  console.log('✅ Parts seeded');

  // 4. Create master tasks
  const tasks = [
    { id: 'mt-1', projectId: project.id, wbs: '1.0', stageName: '1. Design (DS,EE,PG)', title: 'ออกแบบเครื่อง (Design)', responsible: 'Jeerawat', planStartDate: '2026-02-01', planEndDate: '2026-02-14', actualStartDate: '', actualEndDate: '', actualDates: '[]', progressPct: 100, status: 'Completed' },
    { id: 'mt-2', projectId: project.id, wbs: '2.0', stageName: '2. BOM Part List', title: 'จัดทำ BOM Part List', responsible: 'Jeerawat', planStartDate: '2026-02-10', planEndDate: '2026-02-20', actualStartDate: '', actualEndDate: '', actualDates: '[]', progressPct: 80, status: 'In Progress' },
    { id: 'mt-3', projectId: project.id, wbs: '3.0', stageName: '3. Procurement (STD,FEB)', title: 'สั่งซื้อของ (Procurement)', responsible: 'Procurement', planStartDate: '2026-02-15', planEndDate: '2026-03-10', actualStartDate: '', actualEndDate: '', actualDates: '[]', progressPct: 30, status: 'In Progress' },
    { id: 'mt-4', projectId: project.id, wbs: '4.0', stageName: '4. Assembly', title: 'ประกอบเครื่อง (Assembly)', responsible: 'Technician', planStartDate: '2026-03-11', planEndDate: '2026-03-28', actualStartDate: '', actualEndDate: '', actualDates: '[]', progressPct: 0, status: 'Pending' },
    { id: 'mt-5', projectId: project.id, wbs: '5.0', stageName: '5. Testing', title: 'ทดสอบระบบ (Testing)', responsible: 'Jeerawat', planStartDate: '2026-03-29', planEndDate: '2026-04-07', actualStartDate: '', actualEndDate: '', actualDates: '[]', progressPct: 0, status: 'Pending' },
    { id: 'mt-6', projectId: project.id, wbs: '6.0', stageName: '6. BuyOff', title: 'BuyOff / FAT', responsible: 'Jeerawat', planStartDate: '2026-04-08', planEndDate: '2026-04-10', actualStartDate: '', actualEndDate: '', actualDates: '[]', progressPct: 0, status: 'Pending' },
    { id: 'mt-7', projectId: project.id, wbs: '7.0', stageName: '7. Packing', title: 'บรรจุหีบห่อ (Packing)', responsible: 'Technician', planStartDate: '2026-04-11', planEndDate: '2026-04-13', actualStartDate: '', actualEndDate: '', actualDates: '[]', progressPct: 0, status: 'Pending' },
    { id: 'mt-8', projectId: project.id, wbs: '8.0', stageName: '8. Install & Service', title: 'ติดตั้งที่หน้างาน (Install)', responsible: 'Jeerawat', planStartDate: '2026-04-14', planEndDate: '2026-04-20', actualStartDate: '', actualEndDate: '', actualDates: '[]', progressPct: 0, status: 'Pending' },
    { id: 'mt-9', projectId: project.id, wbs: '9.0', stageName: '9. Others', title: 'เอกสาร & อื่นๆ (Documentation)', responsible: 'Admin', planStartDate: '2026-04-14', planEndDate: '2026-04-20', actualStartDate: '', actualEndDate: '', actualDates: '[]', progressPct: 0, status: 'Pending' },
  ];

  for (const task of tasks) {
    await prisma.masterTask.upsert({
      where: { id: task.id },
      update: {},
      create: task as any,
    });
  }
  console.log('✅ Master tasks seeded');

  console.log('\n🎉 Database seeded successfully!');
  await prisma.$disconnect();
}

seed().catch(async (e) => {
  console.error('❌ Seed failed:', e);
  await prisma.$disconnect();
  process.exit(1);
});
