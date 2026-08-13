import { Router, Request, Response } from 'express';
import prisma from '../prisma';

const router = Router();

// GET all projects
router.get('/', async (_req: Request, res: Response) => {
  try {
    const projects = await prisma.project.findMany({ orderBy: { createdAt: 'asc' } });
    res.json(projects);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch projects' });
  }
});

// GET single project
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const project = await prisma.project.findUnique({ where: { id: req.params.id } });
    if (!project) return res.status(404).json({ error: 'Project not found' });
    res.json(project);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch project' });
  }
});

// POST create project
router.post('/', async (req: Request, res: Response) => {
  try {
    const project = await prisma.project.create({ data: req.body });
    res.status(201).json(project);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create project' });
  }
});

// PUT update project
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id, createdAt, updatedAt, ...data } = req.body;
    const project = await prisma.project.update({ where: { id: req.params.id }, data });
    res.json(project);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update project' });
  }
});

// DELETE project
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    await prisma.project.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete project' });
  }
});

export default router;
