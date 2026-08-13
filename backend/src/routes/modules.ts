import { Router, Request, Response } from 'express';
import prisma from '../prisma';

const router = Router();

// GET all modules (optionally filter by projectId)
router.get('/', async (req: Request, res: Response) => {
  try {
    const { projectId } = req.query;
    const modules = await prisma.module.findMany({
      where: projectId ? { projectId: String(projectId) } : undefined,
      orderBy: { createdAt: 'asc' },
    });
    res.json(modules);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch modules' });
  }
});

// GET single module
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const module = await prisma.module.findUnique({ where: { id: req.params.id } });
    if (!module) return res.status(404).json({ error: 'Module not found' });
    res.json(module);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch module' });
  }
});

// POST create module
router.post('/', async (req: Request, res: Response) => {
  try {
    const { projectId, dwgNo, ...rest } = req.body;
    
    // 1. Get Project info for runningNumber and customerId
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { runningNumber: true, customerId: true }
    });

    if (!project) return res.status(404).json({ error: 'Project not found' });

    // 2. Count existing modules in this project for the Main Module running number
    const moduleCount = await prisma.module.count({
      where: { projectId: projectId }
    });
    
    const projectRunningNo = String(project.runningNumber).padStart(3, '0');
    const customerIdStr = (project.customerId || '000').padStart(3, '0').slice(0, 3);
    const mainModuleNo = String(moduleCount).padStart(3, '0');
    
    // Formula: [ProjectRunning3Digits][Customer3Digits]-[MainModule3Digits]-[SubModule3Digits]-[Revision]
    // e.g. 001527-000-000-A
    const generatedDwgNo = `${projectRunningNo}${customerIdStr}-${mainModuleNo}-000-A`;

    const module = await prisma.module.create({ 
      data: {
        ...rest,
        projectId,
        dwgNo: generatedDwgNo
      } 
    });
    res.status(201).json(module);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create module' });
  }
});

// PUT update module
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id, createdAt, updatedAt, project, parts, ...data } = req.body;
    const module = await prisma.module.update({ where: { id: req.params.id }, data });
    res.json(module);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update module' });
  }
});

// DELETE module
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    await prisma.module.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete module' });
  }
});

export default router;
