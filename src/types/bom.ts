export type CategoryType = 'MC' | 'EE';
export type PartCategoryType = 'Standard Part' | 'Feb Part';
export type PartStatus = 'Planned' | 'Ordered' | 'Received' | 'In Assembly' | 'Completed';
export type ModuleScopeType = 'MC_ONLY' | 'EE_ONLY' | 'BOTH';

export type MachineWorkflowStage = 
  | '1. Design (DS,EE,PG)'
  | '2. BOM Part List'
  | '3. Procurement (STD,FEB)'
  | '4. Assembly'
  | '5. Testing'
  | '6. BuyOff'
  | '7. Packing'
  | '8. Install & Service'
  | '9. Others';

export interface ProjectItem {
  id: string;
  code: string;
  runningNumber?: number;
  name: string;
  customer: string;
  customerId?: string;
  dwgNo: string;
  targetBudget?: number;
  description?: string;
  status: 'Active' | 'Completed' | 'On Hold' | 'Archived';
  currentStage?: MachineWorkflowStage;
  startDate?: string;
  targetDeliveryDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface QuotationItem {
  id: string;
  projectId: string;
  quotationNo: string;
  supplier: string;
  date?: string;
  fileUrl?: string;
  totalAmount: number;
  remarks?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ModuleItem {
  id: string;
  projectId?: string;
  code: string;
  name: string;
  dwgNo?: string;
  description?: string;
  targetBudget?: number;
  responsibleEngineer?: string;
  moduleType?: ModuleScopeType;
  status: 'Active' | 'Completed' | 'Draft';
  currentStage?: MachineWorkflowStage;
  createdAt: string;
  updatedAt: string;
}
export interface MasterPartItem {
  id: string;
  partName: string;
  typeSpec: string;
  category: CategoryType;
  partType: PartCategoryType;
  unit: string;
  maker: string;
  supplier: string;
  unitPrice: number;
  storeLocation: string;
  description: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface BomPartItem {
  id: string;
  projectId?: string;
  itemNo: number;
  dwgNo: string;
  partName: string;
  typeSpec: string;
  category: CategoryType;
  partType: PartCategoryType;
  moduleId: string;
  qty: number;
  unit: string;
  maker?: string;
  supplier?: string;
  targetUnitPrice?: number;
  targetTotalAmount?: number;
  unitPrice: number;
  totalAmount: number;
  poNumber?: string;
  quotationId?: string;
  storeLocation?: string;
  orderDate?: string;
  receiveDate?: string;
  status: PartStatus;
  workflowStage?: MachineWorkflowStage;
  ctrlSpare?: string | boolean;
  remarks?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MasterPlanTaskItem {
  id: string;
  projectId: string;
  wbs: string;
  stageName: MachineWorkflowStage;
  title: string;
  responsible: string;
  planStartDate: string; // YYYY-MM-DD
  planEndDate: string;   // YYYY-MM-DD
  actualStartDate?: string; // YYYY-MM-DD
  actualEndDate?: string;   // YYYY-MM-DD
  actualDates?: string[];   // Array of discrete completion dates: ['2026-02-14', '2026-02-16']
  progressPct: number;   // 0-100
  status: 'Completed' | 'In Progress' | 'Pending';
  color?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ModuleCostSummary {
  moduleId: string;
  moduleCode: string;
  moduleName: string;
  targetBudget: number;
  totalMcCost: number;
  totalEeCost: number;
  mcStandardCost: number;
  mcFebCost: number;
  eeStandardCost: number;
  eeFebCost: number;
  totalModuleCost: number;
  itemCount?: number;
  mcItemCount: number;
  eeItemCount: number;
}

export interface ProjectCostSummary {
  totalProjectCost: number;
  totalTargetBudget: number;
  totalMcCost: number;
  totalEeCost: number;
  totalStandardCost: number;
  totalFebCost: number;
  totalItemsCount: number;
  mcItemsCount: number;
  eeItemsCount: number;
  standardItemsCount: number;
  febItemsCount: number;
  moduleSummaries: ModuleCostSummary[];
}

export interface SupplierSummary {
  supplierName: string;
  totalItems?: number;
  totalItemsCount?: number;
  totalTargetCost?: number;
  totalActualCost?: number;
  variance?: number;
  totalPOAmount?: number;
  pendingItems?: number;
  pendingCount?: number;
  orderedItems?: number;
  orderedCount?: number;
  receivedItems?: number;
  receivedCount?: number;
  completedCount?: number;
}

export interface ProcurementCostSummary {
  totalTargetCost: number;
  totalActualCost: number;
  totalVariance: number;
  isSavings: boolean;
  pendingItemsCount: number;
  pendingTargetCost: number;
  orderedItemsCount: number;
  orderedActualCost: number;
  receivedItemsCount: number;
  receivedActualCost: number;
  completedItemsCount: number;
  completedActualCost?: number;
  supplierSummaries: SupplierSummary[];
}
