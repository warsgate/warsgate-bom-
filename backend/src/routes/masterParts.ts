import { Router, Request, Response } from 'express';
import prisma from '../prisma';

const router = Router();

// GET all master parts
router.get('/', async (req: Request, res: Response) => {
  try {
    const masterParts = await prisma.masterPart.findMany({ orderBy: { partName: 'asc' } });
    res.json(masterParts);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch master parts' });
  }
});

// GET single master part
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const part = await prisma.masterPart.findUnique({ where: { id: req.params.id } });
    if (!part) return res.status(404).json({ error: 'Master part not found' });
    res.json(part);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch master part' });
  }
});

// POST create master part
router.post('/', async (req: Request, res: Response) => {
  try {
    const part = await prisma.masterPart.create({ data: req.body });
    res.status(201).json(part);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create master part' });
  }
});

// PUT update master part
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id, createdAt, updatedAt, ...data } = req.body;
    const part = await prisma.masterPart.update({ where: { id: req.params.id }, data });
    res.json(part);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update master part' });
  }
});

// POST sync from existing BOM parts
router.post('/sync', async (req: Request, res: Response) => {
  try {
    // ดึง Part ทั้งหมดจาก BOM ปัจจุบัน
    const existingParts = await prisma.part.findMany({
      select: {
        partName: true,
        typeSpec: true,
        category: true,
        partType: true,
        unit: true,
        maker: true,
        supplier: true,
        unitPrice: true,
        storeLocation: true,
        purchaseLink: true,
      }
    });

    // กรองเอาเฉพาะที่ไม่ซ้ำ (อิงจาก partName + typeSpec)
    const uniquePartsMap = new Map();
    existingParts.forEach(p => {
      const key = `${p.partName}-${p.typeSpec}`;
      if (!uniquePartsMap.has(key)) {
        uniquePartsMap.set(key, p);
      }
    });

    // ดึง MasterPart ที่มีอยู่แล้วเพื่อกันไม่ให้เพิ่มซ้ำ
    const currentMasters = await prisma.masterPart.findMany();
    const currentMasterKeys = new Set(currentMasters.map(m => `${m.partName}-${m.typeSpec}`));

    // คัดกรองตัวที่จะเพิ่มใหม่
    const partsToInsert = Array.from(uniquePartsMap.values()).filter(p => {
      return !currentMasterKeys.has(`${p.partName}-${p.typeSpec}`);
    });

    if (partsToInsert.length > 0) {
      await prisma.masterPart.createMany({
        data: partsToInsert
      });
    }

    res.json({ success: true, count: partsToInsert.length });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to sync master parts' });
  }
});

// DELETE master part
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    await prisma.masterPart.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete master part' });
  }
});

export default router;
