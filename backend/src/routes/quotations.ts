import express, { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

// GET all quotations
router.get('/', async (req: Request, res: Response) => {
  try {
    const quotations = await prisma.quotation.findMany({
      include: {
        parts: true
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(quotations);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch quotations' });
  }
});

// GET single quotation
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const quotation = await prisma.quotation.findUnique({
      where: { id: req.params.id },
      include: {
        parts: true
      }
    });
    if (!quotation) {
      return res.status(404).json({ error: 'Quotation not found' });
    }
    res.json(quotation);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch quotation' });
  }
});

// CREATE quotation
router.post('/', async (req: Request, res: Response) => {
  try {
    const newQuotation = await prisma.quotation.create({
      data: req.body,
      include: {
        parts: true
      }
    });
    res.status(201).json(newQuotation);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create quotation' });
  }
});

// UPDATE quotation
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const updatedQuotation = await prisma.quotation.update({
      where: { id: req.params.id },
      data: req.body,
      include: {
        parts: true
      }
    });
    res.json(updatedQuotation);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update quotation' });
  }
});

// DELETE quotation
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    await prisma.quotation.delete({
      where: { id: req.params.id }
    });
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete quotation' });
  }
});

export default router;
