import express, { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import multer from 'multer';
import path from 'path';
import { uploadToGoogleDrive } from '../services/googleDriveService';

const router = express.Router();
const prisma = new PrismaClient();

const upload = multer({ 
  dest: 'uploads/',
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'));
    }
  }
});

// POST upload file to Google Drive
router.post('/upload', upload.single('file'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const file = req.file;
    const originalName = Buffer.from(file.originalname, 'latin1').toString('utf8');
    
    // Upload to Google Drive
    const driveResult = await uploadToGoogleDrive(
      file.path,
      originalName,
      file.mimetype
    );

    res.json({ 
      success: true, 
      fileId: driveResult.id,
      fileUrl: driveResult.webViewLink 
    });
  } catch (err: any) {
    console.error('File upload error:', err);
    res.status(500).json({ error: 'Failed to upload file to Google Drive', details: err.message });
  }
});

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
