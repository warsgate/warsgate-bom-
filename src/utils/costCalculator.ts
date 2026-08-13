import { 
  BomPartItem, 
  ModuleCostSummary, 
  ModuleItem, 
  ProcurementCostSummary, 
  ProjectCostSummary, 
  SupplierSummary 
} from '../types/bom';

export function calculateProcurementSummary(parts: BomPartItem[]): ProcurementCostSummary {
  let totalTargetCost = 0;
  let totalActualCost = 0;

  let pendingItemsCount = 0;
  let pendingTargetCost = 0;

  let orderedItemsCount = 0;
  let orderedActualCost = 0;

  let receivedItemsCount = 0;
  let receivedActualCost = 0;

  let completedItemsCount = 0;
  let completedActualCost = 0;

  const supplierMap = new Map<string, SupplierSummary>();

  parts.forEach(part => {
    const targetAmt = part.targetTotalAmount || (part.qty * (part.targetUnitPrice || part.unitPrice));
    const actualAmt = part.totalAmount || (part.qty * part.unitPrice);

    totalTargetCost += targetAmt;
    totalActualCost += actualAmt;

    if (part.status === 'Planned') {
      pendingItemsCount += 1;
      pendingTargetCost += targetAmt;
    } else if (part.status === 'Ordered') {
      orderedItemsCount += 1;
      orderedActualCost += actualAmt;
    } else if (part.status === 'Received') {
      receivedItemsCount += 1;
      receivedActualCost += actualAmt;
    } else if (part.status === 'Completed' || part.status === 'In Assembly') {
      completedItemsCount += 1;
      completedActualCost += actualAmt;
    }

    // Supplier metrics
    const suppName = part.supplier || 'Unspecified Supplier';
    let suppSum = supplierMap.get(suppName);
    if (!suppSum) {
      suppSum = {
        supplierName: suppName,
        totalItems: 0,
        totalItemsCount: 0,
        pendingItems: 0,
        pendingCount: 0,
        orderedItems: 0,
        orderedCount: 0,
        receivedItems: 0,
        receivedCount: 0,
        completedCount: 0,
        totalTargetCost: 0,
        totalActualCost: 0,
        totalPOAmount: 0,
        variance: 0,
      };
      supplierMap.set(suppName, suppSum);
    }

    suppSum.totalItems = (suppSum.totalItems || 0) + 1;
    suppSum.totalItemsCount = (suppSum.totalItemsCount || 0) + 1;
    suppSum.totalTargetCost = (suppSum.totalTargetCost || 0) + targetAmt;
    suppSum.totalActualCost = (suppSum.totalActualCost || 0) + actualAmt;
    suppSum.totalPOAmount = (suppSum.totalPOAmount || 0) + actualAmt;
    suppSum.variance = (suppSum.totalTargetCost || 0) - (suppSum.totalActualCost || 0);

    if (part.status === 'Planned') {
      suppSum.pendingItems = (suppSum.pendingItems || 0) + 1;
      suppSum.pendingCount = (suppSum.pendingCount || 0) + 1;
    }
    if (part.status === 'Ordered') {
      suppSum.orderedItems = (suppSum.orderedItems || 0) + 1;
      suppSum.orderedCount = (suppSum.orderedCount || 0) + 1;
    }
    if (part.status === 'Received') {
      suppSum.receivedItems = (suppSum.receivedItems || 0) + 1;
      suppSum.receivedCount = (suppSum.receivedCount || 0) + 1;
    }
    if (part.status === 'In Assembly' || part.status === 'Completed') {
      suppSum.completedCount = (suppSum.completedCount || 0) + 1;
    }
  });

  const totalVariance = totalTargetCost - totalActualCost;

  return {
    totalTargetCost,
    totalActualCost,
    totalVariance,
    isSavings: totalVariance >= 0,
    pendingItemsCount,
    pendingTargetCost,
    orderedItemsCount,
    orderedActualCost,
    receivedItemsCount,
    receivedActualCost,
    completedItemsCount,
    completedActualCost,
    supplierSummaries: Array.from(supplierMap.values()).sort((a, b) => (b.totalActualCost || 0) - (a.totalActualCost || 0)),
  };
}

export function calculateProjectCostSummary(
  modules: ModuleItem[],
  parts: BomPartItem[]
): ProjectCostSummary {
  let totalProjectCost = 0;
  let totalTargetBudget = 0;
  let totalMcCost = 0;
  let totalEeCost = 0;
  let totalStandardCost = 0;
  let totalFebCost = 0;

  let mcItemsCount = 0;
  let eeItemsCount = 0;
  let standardItemsCount = 0;
  let febItemsCount = 0;

  // Group parts by module
  const moduleSummariesMap = new Map<string, ModuleCostSummary>();

  // Initialize for all existing modules
  modules.forEach(m => {
    totalTargetBudget += m.targetBudget || 0;
    moduleSummariesMap.set(m.id, {
      moduleId: m.id,
      moduleCode: m.code,
      moduleName: m.name,
      mcStandardCost: 0,
      mcFebCost: 0,
      totalMcCost: 0,
      eeStandardCost: 0,
      eeFebCost: 0,
      totalEeCost: 0,
      totalModuleCost: 0,
      targetBudget: m.targetBudget || 0,
      itemCount: 0,
      mcItemCount: 0,
      eeItemCount: 0,
    });
  });

  // Also account for unassigned or custom modules if any
  parts.forEach(part => {
    const amount = part.totalAmount || (part.qty * part.unitPrice);
    totalProjectCost += amount;

    if (part.category === 'MC') {
      totalMcCost += amount;
      mcItemsCount += 1;
    } else {
      totalEeCost += amount;
      eeItemsCount += 1;
    }

    if (part.partType === 'Standard Part') {
      totalStandardCost += amount;
      standardItemsCount += 1;
    } else {
      totalFebCost += amount;
      febItemsCount += 1;
    }

    let summary = moduleSummariesMap.get(part.moduleId);
    if (!summary) {
      summary = {
        moduleId: part.moduleId || 'unassigned',
        moduleCode: part.moduleId || 'UNASSIGNED',
        moduleName: 'Unassigned Module',
        mcStandardCost: 0,
        mcFebCost: 0,
        totalMcCost: 0,
        eeStandardCost: 0,
        eeFebCost: 0,
        totalEeCost: 0,
        totalModuleCost: 0,
        targetBudget: 0,
        itemCount: 0,
        mcItemCount: 0,
        eeItemCount: 0,
      };
      moduleSummariesMap.set(part.moduleId || 'unassigned', summary);
    }

    summary.itemCount = (summary.itemCount || 0) + 1;
    summary.totalModuleCost += amount;

    if (part.category === 'MC') {
      summary.mcItemCount += 1;
      summary.totalMcCost += amount;
      if (part.partType === 'Standard Part') {
        summary.mcStandardCost += amount;
      } else {
        summary.mcFebCost += amount;
      }
    } else {
      summary.eeItemCount += 1;
      summary.totalEeCost += amount;
      if (part.partType === 'Standard Part') {
        summary.eeStandardCost += amount;
      } else {
        summary.eeFebCost += amount;
      }
    }
  });

  return {
    totalProjectCost,
    totalTargetBudget,
    totalMcCost,
    totalEeCost,
    totalStandardCost,
    totalFebCost,
    totalItemsCount: parts.length,
    mcItemsCount,
    eeItemsCount,
    standardItemsCount,
    febItemsCount,
    moduleSummaries: Array.from(moduleSummariesMap.values()),
  };
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('th-TH', {
    style: 'currency',
    currency: 'THB',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}
