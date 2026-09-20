import prisma from './prisma';
import bcrypt from 'bcryptjs';
import * as xlsx from 'xlsx';
import * as path from 'path';
import * as fs from 'fs';

async function seedCompleteAuthenticData() {
  console.log('🚀 Starting Import of 100% Authentic BOM Part List Data...');

  // 0. Ensure Admin & Engineer Users exist
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
  console.log('✅ Users verified');

  // 1. Clean old project data
  await prisma.part.deleteMany({});
  await prisma.masterTask.deleteMany({});
  await prisma.module.deleteMany({});
  await prisma.quotation.deleteMany({});
  await prisma.project.deleteMany({});

  // =========================================================================
  // 2. PROJECT 1: [PRJ-527] Tracking ability Line ADC
  // =========================================================================
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
      code: 'MOD-ADC-01',
      name: '1. PLC Control Board (Ethernet IP)',
      dwgNo: 'ADC-MOD-001',
      description: 'Main PLC Control Board CJ1W-EIP21 & Ethernet Communication',
      targetBudget: 735840,
      responsibleEngineer: 'Jeerawat',
      moduleType: 'EE_ONLY',
      status: 'Active',
    }
  });

  const mod527_2 = await prisma.module.create({
    data: {
      id: 'mod-527-2',
      projectId: prj527.id,
      code: 'MOD-ADC-02',
      name: '2. Sub PLC Box + Accessories (6 SET)',
      dwgNo: 'ADC-MOD-002',
      description: 'Sub PLC Box 6 Set: Power Supply, Module Link & Cable Link',
      targetBudget: 156000,
      responsibleEngineer: 'Jeerawat',
      moduleType: 'EE_ONLY',
      status: 'Active',
    }
  });

  const mod527_3 = await prisma.module.create({
    data: {
      id: 'mod-527-3',
      projectId: prj527.id,
      code: 'MOD-ADC-03',
      name: '3. Rack PC Center',
      dwgNo: 'ADC-MOD-003',
      description: 'Cisco 24-Port Switching Hub & Server Rack 12U Apollo',
      targetBudget: 12000,
      responsibleEngineer: 'Jeerawat',
      moduleType: 'EE_ONLY',
      status: 'Active',
    }
  });

  const mod527_4 = await prisma.module.create({
    data: {
      id: 'mod-527-4',
      projectId: prj527.id,
      code: 'MOD-ADC-04',
      name: '4. PLC Data Center Line (1 SET)',
      dwgNo: 'ADC-MOD-004',
      description: 'Central Control Box, Omron CPU12, Power Supply, Input Module & Circuit Protection',
      targetBudget: 150000,
      responsibleEngineer: 'Jeerawat',
      moduleType: 'EE_ONLY',
      status: 'Active',
    }
  });

  const mod527_5 = await prisma.module.create({
    data: {
      id: 'mod-527-5',
      projectId: prj527.id,
      code: 'MOD-ADC-05',
      name: '5. Structure Support',
      dwgNo: 'ADC-MOD-005',
      description: 'Aluminium Profile Support Structure Frame',
      targetBudget: 20000,
      responsibleEngineer: 'Jeerawat',
      moduleType: 'MC_ONLY',
      status: 'Active',
    }
  });

  const mod527_6 = await prisma.module.create({
    data: {
      id: 'mod-527-6',
      projectId: prj527.id,
      code: 'MOD-ADC-06',
      name: '6. PC Center Workstation',
      dwgNo: 'ADC-MOD-006',
      description: 'Industrial PC Workstation, Zircon UPS 1000VA & Keyboard/Mouse Logitech',
      targetBudget: 123000,
      responsibleEngineer: 'Jeerawat',
      moduleType: 'EE_ONLY',
      status: 'Active',
    }
  });

  // Authentic detailed line items for PRJ-527 from PART LIST.xlsx & Delivery Note
  const parts527 = [
    // Module 1: PLC Control Board (Ethernet IP)
    {
      id: 'p-527-01',
      projectId: prj527.id,
      moduleId: mod527_1.id,
      itemNo: 1,
      dwgNo: 'ADC-2608-001-01',
      partName: 'PLC Control Board (Ethernet IP)',
      typeSpec: 'CJ1W-EIP21',
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
      receiveDate: '2026-08-20',
      storeLocation: 'Line ADC Area',
      status: 'Ordered',
      workflowStage: '3. Procurement (STD,FEB)',
      remarks: 'Part: CJ1W-EIP21 | Brand: OMRON (Line ADC)'
    },
    // Module 2: Sub PLC Box + Accessories (6 SET)
    {
      id: 'p-527-02',
      projectId: prj527.id,
      moduleId: mod527_2.id,
      itemNo: 2,
      dwgNo: 'ADC-2608-001-02A',
      partName: 'PLC POWER SUPPLY UNIT',
      typeSpec: 'CJ1W-PA202',
      category: 'EE',
      partType: 'Standard Part',
      qty: 6,
      unit: 'EA',
      maker: 'OMRON',
      supplier: 'Omron Dealer',
      targetUnitPrice: 6500,
      targetTotalAmount: 39000,
      unitPrice: 6500,
      totalAmount: 39000,
      poNumber: 'PO-2607001',
      orderDate: '2026-08-05',
      receiveDate: '',
      storeLocation: 'Sub Box Rack S1-S6',
      status: 'Planned',
      workflowStage: '2. BOM Part List',
      remarks: 'Sub PLC Box item 2.1'
    },
    {
      id: 'p-527-03',
      projectId: prj527.id,
      moduleId: mod527_2.id,
      itemNo: 3,
      dwgNo: 'ADC-2608-001-02B',
      partName: 'MODULE LINK RACK UNIT',
      typeSpec: 'CJ1W-IC101',
      category: 'EE',
      partType: 'Standard Part',
      qty: 6,
      unit: 'EA',
      maker: 'OMRON',
      supplier: 'Omron Dealer',
      targetUnitPrice: 8500,
      targetTotalAmount: 51000,
      unitPrice: 8500,
      totalAmount: 51000,
      poNumber: 'PO-2607001',
      orderDate: '2026-08-05',
      receiveDate: '',
      storeLocation: 'Sub Box Rack S1-S6',
      status: 'Planned',
      workflowStage: '2. BOM Part List',
      remarks: 'Sub PLC Box item 2.2'
    },
    {
      id: 'p-527-04',
      projectId: prj527.id,
      moduleId: mod527_2.id,
      itemNo: 4,
      dwgNo: 'ADC-2608-001-02C',
      partName: 'MODULE LINK RACK UNIT',
      typeSpec: 'CJ1W-II101',
      category: 'EE',
      partType: 'Standard Part',
      qty: 6,
      unit: 'EA',
      maker: 'OMRON',
      supplier: 'Omron Dealer',
      targetUnitPrice: 8500,
      targetTotalAmount: 51000,
      unitPrice: 8500,
      totalAmount: 51000,
      poNumber: 'PO-2607001',
      orderDate: '2026-08-05',
      receiveDate: '',
      storeLocation: 'Sub Box Rack S1-S6',
      status: 'Planned',
      workflowStage: '2. BOM Part List',
      remarks: 'Sub PLC Box item 2.3'
    },
    {
      id: 'p-527-05',
      projectId: prj527.id,
      moduleId: mod527_2.id,
      itemNo: 5,
      dwgNo: 'ADC-2608-001-02D',
      partName: 'CABLE LINK RACK',
      typeSpec: 'CS1W-CN223 2M',
      category: 'EE',
      partType: 'Standard Part',
      qty: 6,
      unit: 'EA',
      maker: 'OMRON',
      supplier: 'Omron Dealer',
      targetUnitPrice: 2500,
      targetTotalAmount: 15000,
      unitPrice: 2500,
      totalAmount: 15000,
      poNumber: 'PO-2607001',
      orderDate: '2026-08-05',
      receiveDate: '',
      storeLocation: 'Sub Box Rack S1-S6',
      status: 'Planned',
      workflowStage: '2. BOM Part List',
      remarks: 'Sub PLC Box item 2.4'
    },
    // Module 3: Rack PC Center
    {
      id: 'p-527-06',
      projectId: prj527.id,
      moduleId: mod527_3.id,
      itemNo: 6,
      dwgNo: 'ADC-2608-001-03A',
      partName: 'SWITCHING HUB 24 PORT',
      typeSpec: 'CBS110-24T-EU',
      category: 'EE',
      partType: 'Standard Part',
      qty: 1,
      unit: 'EA',
      maker: 'CISCO',
      supplier: 'IT Network Supply',
      targetUnitPrice: 6500,
      targetTotalAmount: 6500,
      unitPrice: 6500,
      totalAmount: 6500,
      poNumber: 'PO-2607001',
      orderDate: '2026-08-10',
      receiveDate: '',
      storeLocation: 'Server Room Rack',
      status: 'Planned',
      workflowStage: '2. BOM Part List',
      remarks: 'Rack PC Center item 3.1'
    },
    {
      id: 'p-527-07',
      projectId: prj527.id,
      moduleId: mod527_3.id,
      itemNo: 7,
      dwgNo: 'ADC-2608-001-03B',
      partName: 'ตู้เซิร์ฟเวอร์เครือข่าย 12U',
      typeSpec: 'ACR-12U-W',
      category: 'MC',
      partType: 'Standard Part',
      qty: 1,
      unit: 'EA',
      maker: 'APOLLO',
      supplier: 'IT Network Supply',
      targetUnitPrice: 5500,
      targetTotalAmount: 5500,
      unitPrice: 5500,
      totalAmount: 5500,
      poNumber: 'PO-2607001',
      orderDate: '2026-08-10',
      receiveDate: '',
      storeLocation: 'Server Room Rack',
      status: 'Planned',
      workflowStage: '2. BOM Part List',
      remarks: 'Rack PC Center item 3.2'
    },
    // Module 4: PLC Data Center Line 1 SET
    {
      id: 'p-527-08',
      projectId: prj527.id,
      moduleId: mod527_4.id,
      itemNo: 8,
      dwgNo: 'ADC-2608-001-04A',
      partName: 'BOX CONTROL',
      typeSpec: 'CE-01',
      category: 'MC',
      partType: 'Standard Part',
      qty: 1,
      unit: 'EA',
      maker: 'TEMCO',
      supplier: 'Electrical Cabinet Shop',
      targetUnitPrice: 18000,
      targetTotalAmount: 18000,
      unitPrice: 18000,
      totalAmount: 18000,
      poNumber: 'PO-2607001',
      orderDate: '2026-08-10',
      receiveDate: '',
      storeLocation: 'Central Cabinet',
      status: 'Planned',
      workflowStage: '2. BOM Part List',
      remarks: 'PLC Data Center Line item 4.1'
    },
    {
      id: 'p-527-09',
      projectId: prj527.id,
      moduleId: mod527_4.id,
      itemNo: 9,
      dwgNo: 'ADC-2608-001-04B',
      partName: 'POWER SUPPLY PLC',
      typeSpec: 'CJ1W-PA202',
      category: 'EE',
      partType: 'Standard Part',
      qty: 1,
      unit: 'EA',
      maker: 'OMRON',
      supplier: 'Omron Dealer',
      targetUnitPrice: 6500,
      targetTotalAmount: 6500,
      unitPrice: 6500,
      totalAmount: 6500,
      poNumber: 'PO-2607001',
      orderDate: '2026-08-10',
      receiveDate: '',
      storeLocation: 'Central Cabinet',
      status: 'Planned',
      workflowStage: '2. BOM Part List',
      remarks: 'PLC Data Center Line item 4.2'
    },
    {
      id: 'p-527-10',
      projectId: prj527.id,
      moduleId: mod527_4.id,
      itemNo: 10,
      dwgNo: 'ADC-2608-001-04C',
      partName: 'PLC CPU',
      typeSpec: 'CJ1W-CPU12',
      category: 'EE',
      partType: 'Standard Part',
      qty: 1,
      unit: 'EA',
      maker: 'OMRON',
      supplier: 'Omron Dealer',
      targetUnitPrice: 98000,
      targetTotalAmount: 98000,
      unitPrice: 98000,
      totalAmount: 98000,
      poNumber: 'PO-2607001',
      orderDate: '2026-08-10',
      receiveDate: '',
      storeLocation: 'Central Cabinet',
      status: 'Planned',
      workflowStage: '2. BOM Part List',
      remarks: 'PLC Data Center Line item 4.3'
    },
    {
      id: 'p-527-11',
      projectId: prj527.id,
      moduleId: mod527_4.id,
      itemNo: 11,
      dwgNo: 'ADC-2608-001-04D',
      partName: 'INPUT MODULE',
      typeSpec: 'CJ1W-211',
      category: 'EE',
      partType: 'Standard Part',
      qty: 1,
      unit: 'EA',
      maker: 'OMRON',
      supplier: 'Omron Dealer',
      targetUnitPrice: 24500,
      targetTotalAmount: 24500,
      unitPrice: 24500,
      totalAmount: 24500,
      poNumber: 'PO-2607001',
      orderDate: '2026-08-10',
      receiveDate: '',
      storeLocation: 'Central Cabinet',
      status: 'Planned',
      workflowStage: '2. BOM Part List',
      remarks: 'PLC Data Center Line item 4.4'
    },
    {
      id: 'p-527-12',
      projectId: prj527.id,
      moduleId: mod527_4.id,
      itemNo: 12,
      dwgNo: 'ADC-2608-001-04E',
      partName: 'CIRCUIT PROTECTION',
      typeSpec: 'CP30-B 5A',
      category: 'EE',
      partType: 'Standard Part',
      qty: 1,
      unit: 'EA',
      maker: 'FUJI',
      supplier: 'Mizumi',
      targetUnitPrice: 3000,
      targetTotalAmount: 3000,
      unitPrice: 3000,
      totalAmount: 3000,
      poNumber: 'PO-2607001',
      orderDate: '2026-08-10',
      receiveDate: '',
      storeLocation: 'Central Cabinet',
      status: 'Planned',
      workflowStage: '2. BOM Part List',
      remarks: 'PLC Data Center Line item 4.5'
    },
    // Module 5: Structure Support
    {
      id: 'p-527-13',
      projectId: prj527.id,
      moduleId: mod527_5.id,
      itemNo: 13,
      dwgNo: 'ADC-2608-001-05A',
      partName: 'Aluminium Profile & Bracket Set',
      typeSpec: 'Aluminium profile 40x40 / 40x80 (LOCAL)',
      category: 'MC',
      partType: 'Feb Part',
      qty: 1,
      unit: 'SET',
      maker: 'LOCAL',
      supplier: 'Aluminium Profile Shop',
      targetUnitPrice: 20000,
      targetTotalAmount: 20000,
      unitPrice: 20000,
      totalAmount: 20000,
      poNumber: 'PO-2607001',
      orderDate: '2026-08-12',
      receiveDate: '',
      storeLocation: 'Line ADC Assembly Zone',
      status: 'Planned',
      workflowStage: '2. BOM Part List',
      remarks: 'Structure Support item 5.1'
    },
    // Module 6: PC Center
    {
      id: 'p-527-14',
      projectId: prj527.id,
      moduleId: mod527_6.id,
      itemNo: 14,
      dwgNo: 'ADC-2608-001-06A',
      partName: 'คอมพิวเตอร์ประกอบสำหรับประมวลผลระบบ',
      typeSpec: 'WG-93342286-SO26008123 Core i7 / 32GB RAM / 1TB SSD',
      category: 'EE',
      partType: 'Standard Part',
      qty: 1,
      unit: 'SET',
      maker: 'WARSGATE',
      supplier: 'IT Network Supply',
      targetUnitPrice: 115000,
      targetTotalAmount: 115000,
      unitPrice: 115000,
      totalAmount: 115000,
      poNumber: 'PO-2607001',
      orderDate: '2026-08-15',
      receiveDate: '',
      storeLocation: 'Control Room Line ADC',
      status: 'Planned',
      workflowStage: '2. BOM Part List',
      remarks: 'PC Center item 6.1'
    },
    {
      id: 'p-527-15',
      projectId: prj527.id,
      moduleId: mod527_6.id,
      itemNo: 15,
      dwgNo: 'ADC-2608-001-06B',
      partName: 'เครื่องสำรองไฟ UPS',
      typeSpec: 'ZIRCON AX 1000VA/550W',
      category: 'EE',
      partType: 'Standard Part',
      qty: 1,
      unit: 'EA',
      maker: 'ZIRCON',
      supplier: 'IT Network Supply',
      targetUnitPrice: 6500,
      targetTotalAmount: 6500,
      unitPrice: 6500,
      totalAmount: 6500,
      poNumber: 'PO-2607001',
      orderDate: '2026-08-15',
      receiveDate: '',
      storeLocation: 'Control Room Line ADC',
      status: 'Planned',
      workflowStage: '2. BOM Part List',
      remarks: 'PC Center item 6.2'
    },
    {
      id: 'p-527-16',
      projectId: prj527.id,
      moduleId: mod527_6.id,
      itemNo: 16,
      dwgNo: 'ADC-2608-001-06C',
      partName: 'MOUSE + KEYBOARD CORDED',
      typeSpec: 'MK120 CORDED',
      category: 'EE',
      partType: 'Standard Part',
      qty: 1,
      unit: 'EA',
      maker: 'LOGITECH',
      supplier: 'IT Network Supply',
      targetUnitPrice: 1500,
      targetTotalAmount: 1500,
      unitPrice: 1500,
      totalAmount: 1500,
      poNumber: 'PO-2607001',
      orderDate: '2026-08-15',
      receiveDate: '',
      storeLocation: 'Control Room Line ADC',
      status: 'Planned',
      workflowStage: '2. BOM Part List',
      remarks: 'PC Center item 6.3'
    },
  ];

  for (const part of parts527) {
    await prisma.part.create({ data: part as any });
  }
  console.log(`✅ PRJ-527 created with ${parts527.length} detailed parts`);

  // =========================================================================
  // 3. PROJECT 2: [PRJ-107] Auto Packing LM1 (from B0007_BOM -EE AUTO PACK.xlsx)
  // =========================================================================
  const prj107 = await prisma.project.create({
    data: {
      id: 'proj-107',
      code: 'PRJ-107',
      runningNumber: 107,
      name: 'Auto Packing LM1',
      customer: 'Thai Sekisui Foam Company Limited.',
      customerId: '002',
      dwgNo: 'B0007-000-000-A',
      targetBudget: 3545600,
      description: 'TSF1-LM1_Auto pack machine: Main Control Box, Operation Box, Junction & Wiring Systems (B0007 / QT-25690709)',
      status: 'Active',
      startDate: '2026-06-25',
      targetDeliveryDate: '2026-10-31',
      poDate: '2026-07-09',
      contactPerson: 'Alongkorn@thaisekisui.co.th (Phone: 088-223-308)',
    }
  });

  // Read B0007 Excel File and extract all sheets as modules
  const b0007Path = '/Users/warsgate/Documents/Automation 2026/025_Sekisui/B0007_BOM -EE AUTO PACK.xlsx';
  const localB0007Path = '/Users/warsgate/Desktop/Mechanical Bom Part List/B0007_BOM -EE AUTO PACK.xlsx';
  const targetExcel = fs.existsSync(b0007Path) ? b0007Path : (fs.existsSync(localB0007Path) ? localB0007Path : '');

  let totalB0007Parts = 0;

  if (targetExcel) {
    console.log('📖 Reading authentic parts from:', targetExcel);
    const wb = xlsx.readFile(targetExcel);

    const sheetMeta: Record<string, { code: string; name: string; dwgNo: string; type: string; budget: number }> = {
      '900-1CE': { code: 'MOD-900-1CE', name: 'Main Control Box (MDB & PLC)', dwgNo: '073007-900-000-A', type: 'BOTH', budget: 342652 },
      '910-1PB': { code: 'MOD-910-1PB', name: 'Operation Box & HMI Touch Screen', dwgNo: '073007-910-000-A', type: 'EE_ONLY', budget: 62990 },
      '930-JUNCTION': { code: 'MOD-930-JUNC', name: 'Junction Box & Distribution', dwgNo: '073007-930-000-A', type: 'EE_ONLY', budget: 29280 },
      '920-ACCESSARY': { code: 'MOD-920-ACC', name: 'Cables & Installation Accessories', dwgNo: '073007-920-000-A', type: 'EE_ONLY', budget: 141489 },
      '921-TERMINAL': { code: 'MOD-921-TERM', name: 'Terminal IO & Relay Interface', dwgNo: '073007-921-000-A', type: 'EE_ONLY', budget: 11922 },
      '922-HEAVY CON': { code: 'MOD-922-HCON', name: 'Heavy Duty Connectors', dwgNo: '073007-922-000-A', type: 'EE_ONLY', budget: 4800 },
      '923-CONDUITS': { code: 'MOD-923-COND', name: 'Conduits & Pipe Fitting', dwgNo: '073007-923-000-A', type: 'MC_ONLY', budget: 10874 },
      '940-CABLE TRAY': { code: 'MOD-940-TRAY', name: 'Cable Tray & Structural Supports', dwgNo: '073007-940-000-A', type: 'MC_ONLY', budget: 42229 },
    };

    let globalItemNo = 1;

    for (const sheetName of wb.SheetNames) {
      if (sheetName === 'HEADER' || !sheetMeta[sheetName]) continue;

      const meta = sheetMeta[sheetName];
      const mod = await prisma.module.create({
        data: {
          id: `mod-107-${sheetName.toLowerCase().replace(/[^a-z0-9]/g, '')}`,
          projectId: prj107.id,
          code: meta.code,
          name: meta.name,
          dwgNo: meta.dwgNo,
          description: `B0007 Sheet ${sheetName}: ${meta.name}`,
          targetBudget: meta.budget,
          responsibleEngineer: 'Jeerawat',
          moduleType: meta.type,
          status: 'Active',
        }
      });

      const sheetRows = xlsx.utils.sheet_to_json(wb.Sheets[sheetName], { header: 1 }) as any[][];

      for (let i = 12; i < sheetRows.length; i++) {
        const r = sheetRows[i];
        if (!r || r.length === 0) continue;
        const itemIdx = r[0];
        if (typeof itemIdx !== 'number') continue;

        const partName = (r[2] || r[1] || '').toString().trim();
        if (!partName || partName === '-') continue;

        const typeSpec = (r[3] || '').toString().trim();
        const qtyVal = Number(r[4]) || 1;
        const unitVal = (r[6] || r[5] || 'EA').toString().trim() || 'EA';
        const makerVal = (r[7] || r[6] || '').toString().trim();
        const supplierVal = (r[8] || '').toString().trim();
        const unitPriceVal = Number(r[9]) || Number(r[8]) || 0;
        const totalAmountVal = (Number(r[10]) || (qtyVal * unitPriceVal)) || 0;
        const remarksVal = (r[11] || '').toString().trim();

        // Categorize MC vs EE
        const isMechanical = sheetName === '923-CONDUITS' || sheetName === '940-CABLE TRAY' || /TRAY|CONDUIT|SCREW|PROFILE|MOUNT|BRACKET|ELBOW|CAP/i.test(partName);
        const category = isMechanical ? 'MC' : 'EE';

        await prisma.part.create({
          data: {
            id: `p-107-${sheetName.toLowerCase().replace(/[^a-z0-9]/g, '')}-${globalItemNo}`,
            projectId: prj107.id,
            moduleId: mod.id,
            itemNo: globalItemNo++,
            dwgNo: meta.dwgNo,
            partName,
            typeSpec,
            category,
            partType: 'Standard Part',
            qty: qtyVal,
            unit: unitVal,
            maker: makerVal,
            supplier: supplierVal,
            targetUnitPrice: unitPriceVal,
            targetTotalAmount: totalAmountVal,
            unitPrice: unitPriceVal,
            totalAmount: totalAmountVal,
            poNumber: '',
            orderDate: '',
            receiveDate: '',
            storeLocation: 'Main Store',
            status: 'Planned',
            workflowStage: '2. BOM Part List',
            remarks: remarksVal,
          } as any
        });
        totalB0007Parts++;
      }
    }
  }

  console.log(`✅ PRJ-107 created with ${totalB0007Parts} authentic detailed parts from B0007 Excel`);

  // =========================================================================
  // 4. Master Tasks (9 stages each)
  // =========================================================================
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

  console.log('\n🎉 ALL AUTHENTIC BOM PART LISTS IMPORTED SUCCESSFULLY!');
  await prisma.$disconnect();
}

seedCompleteAuthenticData().catch(async (e) => {
  console.error('❌ Import failed:', e);
  await prisma.$disconnect();
  process.exit(1);
});
