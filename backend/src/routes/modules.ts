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
    const module = await prisma.module.create({ data: req.body });
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
