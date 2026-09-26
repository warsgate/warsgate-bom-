import { Router, Request, Response } from 'express';
import prisma from '../prisma';

const router = Router();

// GET all projects with summary of parts for Accounting integration
router.get('/projects-with-bom', async (_req: Request, res: Response) => {
  try {
    const projects = await prisma.project.findMany({
      include: {
        modules: {
          select: { id: true, code: true, name: true }
        },
        parts: {
          orderBy: { itemNo: 'asc' }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const summary = projects.map(p => {
      const totalEstimatedCost = p.parts.reduce((sum, item) => sum + (item.totalAmount || (item.unitPrice * item.qty) || (item.targetUnitPrice * item.qty) || 0), 0);
      const suppliers = Array.from(new Set(p.parts.map(x => x.supplier || x.maker).filter(Boolean)));
      
      return {
        id: p.id,
        code: p.code,
        name: p.name,
        customer: p.customer,
        customerId: p.customerId,
        dwgNo: p.dwgNo,
        targetBudget: p.targetBudget,
        status: p.status,
        totalPartsCount: p.parts.length,
        totalEstimatedCost,
        suppliers,
        parts: p.parts,
        modules: p.modules,
        updatedAt: p.updatedAt
      };
    });

    res.json(summary);
  } catch (err: any) {
    console.error('Integration Error fetching projects:', err);
    res.status(500).json({ error: 'Failed to fetch BOM projects for accounting', details: err.message });
  }
});

// GET single project parts for Accounting
router.get('/projects/:id/parts', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const project = await prisma.project.findFirst({
      where: {
        OR: [
          { id },
          { code: id }
        ]
      },
      include: {
        parts: {
          orderBy: { itemNo: 'asc' }
        },
        modules: true
      }
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    res.json({
      project: {
        id: project.id,
        code: project.code,
        name: project.name,
        customer: project.customer,
        dwgNo: project.dwgNo,
      },
      parts: project.parts,
      modules: project.modules
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch project parts', details: err.message });
  }
});

// POST sync quotation reference back to BOM
router.post('/sync-quotation', async (req: Request, res: Response) => {
  try {
    const { projectId, quotationNo, customerPoNo, grandTotal, status } = req.body;
    
    if (!projectId) {
      return res.status(400).json({ error: 'projectId is required' });
    }

    const project = await prisma.project.findFirst({
      where: {
        OR: [
          { id: projectId },
          { code: projectId }
        ]
      }
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Update project description or targetBudget if needed
    const updated = await prisma.project.update({
      where: { id: project.id },
      data: {
        status: status || 'Quotation Sent',
        poDate: customerPoNo ? new Date().toISOString().split('T')[0] : project.poDate
      }
    });

    res.json({ success: true, message: `Quotation ${quotationNo} synced to project ${project.code}`, project: updated });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to sync quotation', details: err.message });
  }
});

// POST sync PO to BOM parts (Mark parts as ordered with PO number)
router.post('/sync-po', async (req: Request, res: Response) => {
  try {
    const { partIds, poNumber, supplier, orderDate } = req.body;
    
    if (!partIds || !Array.isArray(partIds) || partIds.length === 0) {
      return res.status(400).json({ error: 'partIds array is required' });
    }

    const dateStr = orderDate || new Date().toISOString().split('T')[0];

    const updatedParts = await prisma.part.updateMany({
      where: {
        id: { in: partIds }
      },
      data: {
        poNumber: poNumber || '',
        orderDate: dateStr,
        status: 'Ordered',
        workflowStage: '3. Procurement (STD,FEB)'
      }
    });

    res.json({
      success: true,
      message: `Updated ${updatedParts.count} parts with PO ${poNumber}`,
      count: updatedParts.count
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to sync PO to BOM parts', details: err.message });
  }
});

export default router;
