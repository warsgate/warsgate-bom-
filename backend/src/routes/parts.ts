import { Router, Request, Response } from 'express';
import prisma from '../prisma';

const router = Router();

// GET all parts (optionally filter by projectId or moduleId)
router.get('/', async (req: Request, res: Response) => {
  try {
    const { projectId, moduleId } = req.query;
    const parts = await prisma.part.findMany({
      where: {
        ...(projectId ? { projectId: String(projectId) } : {}),
        ...(moduleId ? { moduleId: String(moduleId) } : {}),
      },
      orderBy: { itemNo: 'asc' },
    });
    res.json(parts);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch parts' });
  }
});

// GET single part
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const part = await prisma.part.findUnique({ where: { id: req.params.id } });
    if (!part) return res.status(404).json({ error: 'Part not found' });
    res.json(part);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch part' });
  }
});

// POST create part
router.post('/', async (req: Request, res: Response) => {
  try {
    const part = await prisma.part.create({ data: req.body });
    res.status(201).json(part);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create part' });
  }
});

// PUT update part
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id, createdAt, updatedAt, project, module, ...data } = req.body;
    const part = await prisma.part.update({ where: { id: req.params.id }, data });
    res.json(part);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update part' });
  }
});

// DELETE part
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    await prisma.part.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete part' });
  }
});

// POST bulk import parts
router.post('/bulk', async (req: Request, res: Response) => {
  try {
    const { parts } = req.body;
    const created = await prisma.part.createMany({ data: parts, skipDuplicates: true });
    res.status(201).json({ count: created.count });
  } catch (err) {
    res.status(500).json({ error: 'Failed to bulk import parts' });
  }
});

export default router;
