import { Router, Request, Response } from 'express';
import prisma from '../prisma';

const router = Router();

// GET all master tasks (optionally filter by projectId)
router.get('/', async (req: Request, res: Response) => {
  try {
    const { projectId } = req.query;
    const tasks = await prisma.masterTask.findMany({
      where: projectId ? { projectId: String(projectId) } : undefined,
      orderBy: { wbs: 'asc' },
    });
    // Parse actualDates JSON string back to array
    const parsed = tasks.map(t => ({
      ...t,
      actualDates: JSON.parse(t.actualDates || '[]'),
      dailyNotes: JSON.parse(t.dailyNotes || '{}'),
    }));
    res.json(parsed);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch master tasks' });
  }
});

// GET single task
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const task = await prisma.masterTask.findUnique({ where: { id: req.params.id } });
    if (!task) return res.status(404).json({ error: 'Task not found' });
    res.json({ ...task, actualDates: JSON.parse(task.actualDates || '[]'), dailyNotes: JSON.parse(task.dailyNotes || '{}') });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch task' });
  }
});

// POST create task
router.post('/', async (req: Request, res: Response) => {
  try {
    const { actualDates, dailyNotes, ...rest } = req.body;
    const task = await prisma.masterTask.create({
      data: { ...rest, actualDates: JSON.stringify(actualDates || []), dailyNotes: JSON.stringify(dailyNotes || {}) },
    });
    res.status(201).json({ ...task, actualDates: JSON.parse(task.actualDates), dailyNotes: JSON.parse(task.dailyNotes) });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create task' });
  }
});

// PUT update task batch
router.put('/batch', async (req: Request, res: Response) => {
  try {
    const tasksToUpdate: any[] = req.body.tasks;
    if (!tasksToUpdate || !Array.isArray(tasksToUpdate)) {
      return res.status(400).json({ error: 'Invalid payload' });
    }

    const updatedTasks = await prisma.$transaction(
      tasksToUpdate.map(t => {
        const { id, createdAt, updatedAt, project, actualDates, dailyNotes, ...rest } = t;
        return prisma.masterTask.update({
          where: { id: t.id },
          data: { ...rest, actualDates: JSON.stringify(actualDates || []), dailyNotes: JSON.stringify(dailyNotes || {}) },
        });
      })
    );

    res.json(updatedTasks.map(t => ({ ...t, actualDates: JSON.parse(t.actualDates), dailyNotes: JSON.parse(t.dailyNotes) })));
  } catch (err) {
    res.status(500).json({ error: 'Failed to update tasks in batch' });
  }
});

// PUT update task
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id, createdAt, updatedAt, project, actualDates, dailyNotes, ...rest } = req.body;
    const task = await prisma.masterTask.update({
      where: { id: req.params.id },
      data: { ...rest, actualDates: JSON.stringify(actualDates || []), dailyNotes: JSON.stringify(dailyNotes || {}) },
    });
    res.json({ ...task, actualDates: JSON.parse(task.actualDates), dailyNotes: JSON.parse(task.dailyNotes) });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update task' });
  }
});

// DELETE task
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    await prisma.masterTask.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete task' });
  }
});

export default router;
