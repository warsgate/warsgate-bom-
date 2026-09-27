import { BomPartItem, ModuleItem } from '../types/bom';

export type ValidationSeverity = 'critical' | 'warning' | 'info' | 'suggestion';
export type ValidationCategory = 'accessories' | 'drawing' | 'cost' | 'leadtime' | 'alternative';

export interface AiValidationIssue {
  id: string;
  category: ValidationCategory;
  severity: ValidationSeverity;
  title: string;
  description: string;
  recommendation: string;
  affectedPartIds: string[];
  affectedParts?: BomPartItem[];
  suggestedAction?: string;
  potentialSavingsEstimate?: string;
}

export interface AiBomAnalysisResult {
  healthScore: number; // 0 - 100
  totalChecks: number;
  criticalCount: number;
  warningCount: number;
  suggestionCount: number;
  issues: AiValidationIssue[];
  summary: {
    totalParts: number;
    febPartsCount: number;
    standardPartsCount: number;
    unpricedPartsCount: number;
    missingDwgCount: number;
    estimatedCost: number;
  };
}

/**
 * AI Engineering Assistant Validation Engine
 * Analyzes mechanical and electrical automation BOM for completeness, missing accessories,
 * drawing assignment, cost anomalies, lead-time risks, and alternative maker substitutions.
 */
export function analyzeBomWithAi(parts: BomPartItem[], modules: ModuleItem[] = []): AiBomAnalysisResult {
  const issues: AiValidationIssue[] = [];

  const totalParts = parts.length;
  if (totalParts === 0) {
    return {
      healthScore: 100,
      totalChecks: 0,
      criticalCount: 0,
      warningCount: 0,
      suggestionCount: 0,
      issues: [],
      summary: {
        totalParts: 0,
        febPartsCount: 0,
        standardPartsCount: 0,
        unpricedPartsCount: 0,
        missingDwgCount: 0,
        estimatedCost: 0
      }
    };
  }

  const febParts = parts.filter(p => p.partType === 'Feb Part');
  const standardParts = parts.filter(p => p.partType === 'Standard Part');
  const totalBOMCost = parts.reduce((sum, p) => sum + (p.totalAmount || (p.qty * p.unitPrice)), 0);

  // ─────────────────────────────────────────────────────────────
  // 1. Missing Accessories & Hardware Pairing
  // ─────────────────────────────────────────────────────────────

  // 1.1 Pneumatic Cylinders vs Fittings & Speed Controllers
  const cylinderKeywords = ['cylinder', 'กระบอกลม', 'cdq2', 'mgpm', 'c96', 'cj2', 'cm2', 'air cylinder', 'dsbc', 'dsnu', 'cq2'];
  const fittingKeywords = ['fitting', 'speed controller', 'speed control', 'ข้อต่อ', 'ฟิตติ้ง', 'วาล์วปรับสปีด', 'as1', 'as2', 'kq2', 'one-touch', 'one touch', 'flow control', 'grla', 'tubing', 'สายลม'];

  const cylinderParts = parts.filter(p => {
    const text = `${p.partName} ${p.typeSpec} ${p.remarks || ''}`.toLowerCase();
    return cylinderKeywords.some(k => text.includes(k));
  });

  const fittingParts = parts.filter(p => {
    const text = `${p.partName} ${p.typeSpec} ${p.remarks || ''}`.toLowerCase();
    return fittingKeywords.some(k => text.includes(k));
  });

  const totalCylinders = cylinderParts.reduce((sum, p) => sum + (p.qty || 1), 0);
  const totalFittings = fittingParts.reduce((sum, p) => sum + (p.qty || 1), 0);

  // Each double-acting cylinder normally requires at least 2 speed controllers / fittings
  if (cylinderParts.length > 0 && totalFittings < totalCylinders * 1.5) {
    issues.push({
      id: 'missing-pneumatic-fittings',
      category: 'accessories',
      severity: 'critical',
      title: 'ตรวจพบกระบอกลมแต่ขาด Speed Controller หรือข้อต่อลม (Fittings)',
      description: `ในโปรเจกต์มีกระบอกลมรวม ${totalCylinders} ตัว แต่มีรายการวาล์วปรับรอบ (Speed Controller) หรือฟิตติ้งข้อต่อลมเพียง ${totalFittings} รายการ (มาตรฐาน 1 กระบอกลมต้องใช้ 2 ตัวเข้า-ออก)`,
      recommendation: 'เพิ่ม Speed Controller (เช่น SMC AS2201F-01-06S หรือ Festo GRLA) และสายลม Polyurethane ให้ครบตามจำนวนพอร์ตของกระบอกลม',
      affectedPartIds: cylinderParts.map(p => p.id),
      suggestedAction: 'เพิ่ม Speed Controller & Fittings'
    });
  }

  // 1.2 Motors vs Driver & Motion Cables
  const motorKeywords = ['servo motor', 'ac servo', 'stepper', 'สเต็ปมอเตอร์', 'เซอร์โวมอเตอร์', 'step motor'];
  const driverKeywords = ['driver', 'ไดรเวอร์', 'servo drive', 'servopack', 'mr-j', 'mr-je', 'asd-b', 'leadshine', 'a6', 'driver pack'];
  const cableKeywords = ['encoder cable', 'power cable', 'สายมอเตอร์', 'สายเอ็นโค้ดเดอร์', 'cable set'];

  const motorParts = parts.filter(p => {
    const text = `${p.partName} ${p.typeSpec} ${p.remarks || ''}`.toLowerCase();
    return motorKeywords.some(k => text.includes(k));
  });

  if (motorParts.length > 0) {
    const driverParts = parts.filter(p => {
      const text = `${p.partName} ${p.typeSpec} ${p.remarks || ''}`.toLowerCase();
      return driverKeywords.some(k => text.includes(k));
    });

    const cableParts = parts.filter(p => {
      const text = `${p.partName} ${p.typeSpec} ${p.remarks || ''}`.toLowerCase();
      return cableKeywords.some(k => text.includes(k));
    });

    if (driverParts.length < motorParts.length) {
      issues.push({
        id: 'missing-motor-drivers',
        category: 'accessories',
        severity: 'critical',
        title: 'ตรวจพบมอเตอร์ Servo/Stepper แต่ไม่พบชุด Driver คู่ตัว',
        description: `มีมอเตอร์ขับเคลื่อน ${motorParts.length} ตัว แต่พบ Driver ควบคุมเพียง ${driverParts.length} ตัว อาจตกหล่นการสั่งซื้อชุดไดรฟ์`,
        recommendation: 'ตรวจสอบว่าชุดมอเตอร์สั่งซื้อแบบรวม Drive ในแพ็กเกจแล้วหรือไม่ หากสั่งแยก กรุณาเพิ่มรายการ Servo Driver ให้ตรงรุ่นพิกัด Watt',
        affectedPartIds: motorParts.map(p => p.id),
        suggestedAction: 'เพิ่ม Servo/Stepper Driver'
      });
    }

    if (cableParts.length === 0) {
      issues.push({
        id: 'missing-motor-cables',
        category: 'accessories',
        severity: 'warning',
        title: 'ยังไม่มีรายการชุดสายไฟ Power / Encoder ของมอเตอร์',
        description: 'มอเตอร์ Servo และ Stepper มักต้องใช้สาย Encoder และ Power Cable เฉพาะรุ่น (ความยาว 3M, 5M, 10M)',
        recommendation: 'เพิ่มชุดสาย Encoder Cable และ Motor Power Cable พร้อมระบุความยาวที่เหมาะสมกับการเดินรางสายไฟ (Cable Carrier)',
        affectedPartIds: motorParts.map(p => p.id),
        suggestedAction: 'เพิ่มรายการสายเคเบิลมอเตอร์'
      });
    }
  }

  // 1.3 Sensors vs Mounting Brackets
  const sensorKeywords = ['sensor', 'เซนเซอร์', 'photoelectric', 'proximity', 'fiber sensor', 'e3z', 'pr12', 'pr18', 'fs-n', 'gt2'];
  const bracketKeywords = ['bracket', 'ขายึด', 'ขาจับ', 'sensor bracket', 'clamp', 'e39-l'];

  const sensorParts = parts.filter(p => {
    const text = `${p.partName} ${p.typeSpec} ${p.remarks || ''}`.toLowerCase();
    return sensorKeywords.some(k => text.includes(k));
  });

  const bracketParts = parts.filter(p => {
    const text = `${p.partName} ${p.typeSpec} ${p.remarks || ''}`.toLowerCase();
    return bracketKeywords.some(k => text.includes(k));
  });

  if (sensorParts.length >= 3 && bracketParts.length === 0) {
    issues.push({
      id: 'missing-sensor-brackets',
      category: 'accessories',
      severity: 'info',
      title: 'ตรวจพบเซนเซอร์หลายตำแหน่ง แต่ยังไม่มี Bracket ขายึดเซนเซอร์',
      description: `มีเซนเซอร์ตรวจจับรวม ${sensorParts.length} ตัว แนะนำตรวจสอบว่าเตรียมขายึดเซนเซอร์ (Standard Bracket หรือ สั่งกลึง Feb Part) ครบทุกจุดแล้วหรือไม่`,
      recommendation: 'เพิ่มรายการ Bracket สำหรับยึดหัวเซนเซอร์ หรือเพิ่มชิ้นงานสั่งกลึงยึดตำแหน่งเพื่อความแม่นยำในการตรวจจับ',
      affectedPartIds: sensorParts.map(p => p.id),
      suggestedAction: 'ตรวจสอบขายึดเซนเซอร์'
    });
  }

  // ─────────────────────────────────────────────────────────────
  // 2. Fabrication (Feb Part) & Drawing Integrity
  // ─────────────────────────────────────────────────────────────

  // 2.1 Feb Parts Missing Drawing Number
  const febWithoutDwg = febParts.filter(p => !p.dwgNo || p.dwgNo.trim() === '' || p.dwgNo === '-');
  if (febWithoutDwg.length > 0) {
    issues.push({
      id: 'feb-missing-dwg-no',
      category: 'drawing',
      severity: 'critical',
      title: `ชิ้นงานสั่งกลึง (Feb Part) ขาดเลขที่ Drawing No. (${febWithoutDwg.length} รายการ)`,
      description: 'ชิ้นงานสั่งผลิต/สั่งทำจำเป็นต้องมีเลขที่แบบ CAD (DWG No.) กำกับอย่างชัดเจนเพื่อให้ร้านกลึงผลิตและ QC ตรวจสอบขนาดได้ถูกต้อง',
      recommendation: 'กรอกรหัส Drawing No. เช่น PRJ-MC-001, DWG-FEB-01 ให้ครบทุกชิ้นงานสั่งกลึง',
      affectedPartIds: febWithoutDwg.map(p => p.id),
      suggestedAction: 'ระบุรหัส Drawing No.'
    });
  }

  // 2.2 Feb Parts Missing Material or Surface Finish in Specs
  const materialKeywords = ['ss400', 's45c', 's50c', 'al6061', 'al5052', 'al7075', 'sus304', 'sus316', 'pom', 'mc blue', 'bakelite', 'skd11', 'เหล็ก', 'อลูมิเนียม', 'สแตนเลส'];
  const finishKeywords = ['anodize', 'black oxide', 'hard chrome', 'nickel', 'รมดำ', 'ชุบ', 'powder coat', 'อบสี', 'ทำสี', 'อโนไดซ์'];

  const febMissingMaterial = febParts.filter(p => {
    const text = `${p.typeSpec} ${p.remarks || ''}`.toLowerCase();
    const hasMaterial = materialKeywords.some(m => text.includes(m));
    return !hasMaterial;
  });

  if (febMissingMaterial.length > 0) {
    issues.push({
      id: 'feb-missing-material-spec',
      category: 'drawing',
      severity: 'warning',
      title: `ชิ้นงานสั่งกลึงยังไม่ระบุชนิดวัสดุ (${febMissingMaterial.length} รายการ)`,
      description: 'พบชิ้นงานสั่งทำที่ช่อง Type/Spec ไม่ได้ระบุเกรดวัสดุ (เช่น SS400, S45C, AL6061, SUS304 หรือ POM)',
      recommendation: 'ระบุเกรดวัสดุให้ชัดเจนในช่อง Type / Spec เพื่อให้ร้านกลึงประเมินราคาและจัดหาวัตถุดิบได้ถูกต้อง',
      affectedPartIds: febMissingMaterial.map(p => p.id),
      suggestedAction: 'ระบุเกรดวัสดุ'
    });
  }

  // ─────────────────────────────────────────────────────────────
  // 3. Pricing, Commercial & Supplier Readiness
  // ─────────────────────────────────────────────────────────────

  // 3.1 Unpriced items (Unit Price = 0)
  const unpricedParts = parts.filter(p => !p.unitPrice || p.unitPrice <= 0);
  if (unpricedParts.length > 0) {
    issues.push({
      id: 'unpriced-parts-alert',
      category: 'cost',
      severity: 'critical',
      title: `มีรายการที่ราคาต่อหน่วยเป็น ฿0 (${unpricedParts.length} รายการ)`,
      description: 'รายการเหล่านี้ยังไม่ได้รับการใส่ราคา ทำให้ยอดรวมงบประมาณโครงการ (Budget Total) คลาดเคลื่อนจากความเป็นจริง',
      recommendation: 'ส่งขอราคา (RFQ) ด่วน หรือใส่ราคาเป้าหมาย (Target Unit Price) จากฐานข้อมูลคลังอะไหล่ Master Library',
      affectedPartIds: unpricedParts.map(p => p.id),
      suggestedAction: 'ใส่ราคาชิ้นส่วน'
    });
  }

  // 3.2 High-Cost Outliers (> 20% of total BOM cost)
  if (totalBOMCost > 0) {
    const highCostParts = parts.filter(p => {
      const partCost = p.totalAmount || (p.qty * p.unitPrice);
      return (partCost / totalBOMCost) > 0.20 && partCost > 20000;
    });

    if (highCostParts.length > 0) {
      issues.push({
        id: 'high-cost-outliers',
        category: 'cost',
        severity: 'info',
        title: `พบชิ้นส่วนมูลค่าสูงเกิน 20% ของต้นทุนโปรเจกต์ (${highCostParts.length} รายการ)`,
        description: 'ชิ้นส่วนเหล่านี้เป็น Cost Driver หลักของเครื่องจักร ควรตรวจสอบเงื่อนไขรับประกันและพิจารณาต่อรองส่วนลดพิเศษกับซัพพลายเออร์',
        recommendation: 'ขอใบเสนอราคาเปรียบเทียบจากตัวแทนจำหน่ายอย่างน้อย 2 ราย หรือเจรจาส่วนลด Volume Discount',
        affectedPartIds: highCostParts.map(p => p.id),
        suggestedAction: 'ตรวจสอบราคาพิเศษ'
      });
    }
  }

  // 3.3 Parts Missing Supplier
  const missingSupplierParts = parts.filter(p => !p.supplier || p.supplier.trim() === '' || p.supplier === '-');
  if (missingSupplierParts.length > 0) {
    issues.push({
      id: 'missing-supplier-name',
      category: 'cost',
      severity: 'warning',
      title: `ยังไม่ระบุร้านค้า/ผู้ขาย Supplier (${missingSupplierParts.length} รายการ)`,
      description: 'การเว้นว่างชื่อผู้ขายจะทำให้ไม่สามารถออกใบสั่งซื้อ (PO) และใบขอราคา (RFQ) แบบจัดกลุ่มตามร้านค้าได้สะดวก',
      recommendation: 'ระบุชื่อร้านค้าหรือซัพพลายเออร์ เช่น Misumi, SMC, Keyence, นัฐพงษ์, หรือระบุร้านกลึงประจำ',
      affectedPartIds: missingSupplierParts.map(p => p.id),
      suggestedAction: 'ระบุชื่อผู้ขาย'
    });
  }

  // ─────────────────────────────────────────────────────────────
  // 4. Supply Chain & Long Lead-Time Warnings
  // ─────────────────────────────────────────────────────────────
  const longLeadKeywords = [
    { key: 'servo', name: 'Servo Motor / Drive', lead: '4 - 8 สัปดาห์' },
    { key: 'plc', name: 'PLC Controller / Module', lead: '6 - 12 สัปดาห์' },
    { key: 'robot', name: 'Scara / 6-Axis Robot', lead: '8 - 14 สัปดาห์' },
    { key: 'harmonic', name: 'Harmonic Drive / Precision Gear', lead: '8 - 12 สัปดาห์' },
    { key: 'ball screw', name: 'Precision Ground Ball Screw (C3/C5)', lead: '4 - 8 สัปดาห์' },
    { key: 'vision', name: 'Machine Vision Camera & Lens', lead: '4 - 6 สัปดาห์' },
  ];

  longLeadKeywords.forEach(item => {
    const matchedParts = parts.filter(p => {
      const text = `${p.partName} ${p.typeSpec} ${p.maker || ''}`.toLowerCase();
      return text.includes(item.key);
    });

    if (matchedParts.length > 0) {
      issues.push({
        id: `lead-time-${item.key}`,
        category: 'leadtime',
        severity: 'warning',
        title: `ชิ้นส่วนเสี่ยงส่งของช้า (Long Lead-time): ${item.name}`,
        description: `ตรวจพบชิ้นส่วนประเภท ${item.name} (${matchedParts.length} รายการ) ซึ่งในท้องตลาดมีระยะเวลานำส่งเฉลี่ย ${item.lead}`,
        recommendation: `รีบสั่งซื้อล่วงหน้า (Early PO Release) ตั้งแต่ช่วงขั้นตอน BOM Part List เพื่อป้องกันเครื่องจักรประกอบล่าช้า`,
        affectedPartIds: matchedParts.map(p => p.id),
        suggestedAction: 'สั่งซื้อล่วงหน้าด่วน'
      });
    }
  });

  // ─────────────────────────────────────────────────────────────
  // 5. Cost Optimization & Alternative Maker Recommendations
  // ─────────────────────────────────────────────────────────────
  const smcParts = parts.filter(p => (p.maker || '').toLowerCase().includes('smc') || (p.typeSpec || '').toLowerCase().includes('smc'));
  if (smcParts.length >= 2) {
    issues.push({
      id: 'alt-airtac-recommendation',
      category: 'alternative',
      severity: 'suggestion',
      title: 'ข้อเสนอแนะลดต้นทุนอุปกรณ์นิวเมติกส์ (SMC ↔ AirTAC / Festo)',
      description: `พบอุปกรณ์ SMC ในรายการ ${smcParts.length} ชิ้น หากเป็นสถานีที่ไม่ใช่จุดวิกฤตความแม่นยำสูง สามารถเลือกใช้รุ่นเทียบเท่าของ AirTAC หรือ Mindman`,
      recommendation: 'พิจารณาเทียบสเปคกับ AirTAC สำหรับกระบอกลมและฟิตติ้งมาตรฐาน ช่วยลดต้นทุนลงได้ประมาณ 35% - 50%',
      affectedPartIds: smcParts.map(p => p.id),
      suggestedAction: 'เทียบสเปคประหยัดงบ',
      potentialSavingsEstimate: 'ประหยัดได้ ~35-50%'
    });
  }

  const keyenceParts = parts.filter(p => (p.maker || '').toLowerCase().includes('keyence') || (p.typeSpec || '').toLowerCase().includes('keyence'));
  if (keyenceParts.length >= 2) {
    issues.push({
      id: 'alt-sensor-recommendation',
      category: 'alternative',
      severity: 'suggestion',
      title: 'ข้อเสนอแนะทางเลือกเซนเซอร์ (Keyence ↔ Omron / Autonics)',
      description: `มีเซนเซอร์ Keyence จำนวน ${keyenceParts.length} รายการ สำหรับจุดตรวจจับ Presence/Absence ทั่วไป สามารถใช้ Omron (E3Z) หรือ Autonics ทดแทนได้`,
      recommendation: 'ใช้เซนเซอร์แบรนด์ Omron หรือ Autonics ในจุดตรวจจับมาตรฐาน เพื่อประหยัดงบประมาณและมีสต๊อกพร้อมส่งในไทย',
      affectedPartIds: keyenceParts.map(p => p.id),
      suggestedAction: 'พิจารณาแบรนด์ทางเลือก',
      potentialSavingsEstimate: 'ประหยัดได้ ~40-60%'
    });
  }

  // ─────────────────────────────────────────────────────────────
  // Attach affected parts objects for convenient UI rendering
  // ─────────────────────────────────────────────────────────────
  issues.forEach(issue => {
    issue.affectedParts = parts.filter(p => issue.affectedPartIds.includes(p.id));
  });

  // Calculate Health Score
  // Base 100
  // Deductions:
  // - critical: -15 pts each (max -50)
  // - warning: -6 pts each (max -30)
  // - suggestion/info: -2 pts each (max -10)
  const criticalCount = issues.filter(i => i.severity === 'critical').length;
  const warningCount = issues.filter(i => i.severity === 'warning').length;
  const suggestionCount = issues.filter(i => i.severity === 'suggestion' || i.severity === 'info').length;

  let score = 100;
  score -= Math.min(criticalCount * 15, 50);
  score -= Math.min(warningCount * 6, 30);
  score -= Math.min(suggestionCount * 2, 10);
  score = Math.max(10, Math.min(100, Math.round(score)));

  return {
    healthScore: score,
    totalChecks: issues.length,
    criticalCount,
    warningCount,
    suggestionCount,
    issues,
    summary: {
      totalParts,
      febPartsCount: febParts.length,
      standardPartsCount: standardParts.length,
      unpricedPartsCount: unpricedParts.length,
      missingDwgCount: febWithoutDwg.length,
      estimatedCost: totalBOMCost
    }
  };
}
