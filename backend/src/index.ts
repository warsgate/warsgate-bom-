import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import projectsRouter from './routes/projects';
import modulesRouter from './routes/modules';
import partsRouter from './routes/parts';
import masterTasksRouter from './routes/masterTasks';
import masterPartsRouter from './routes/masterParts';
import quotationsRouter from './routes/quotations';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

// ─── Middleware ───────────────────────────────────────────────
app.use(cors({
  origin: [FRONTEND_URL, 'https://*.onrender.com'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json({ limit: '10mb' }));

// ─── Health Check ─────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'WARSGATE BOM API', timestamp: new Date().toISOString() });
});

import authRouter from './routes/auth';
import auditLogsRouter from './routes/auditLogs';

// ─── API Routes ───────────────────────────────────────────────
app.use('/api/auth', authRouter);
app.use('/api/audit-logs', auditLogsRouter);
app.use('/api/projects', projectsRouter);
app.use('/api/modules', modulesRouter);
app.use('/api/parts', partsRouter);
app.use('/api/master-tasks', masterTasksRouter);
app.use('/api/master-parts', masterPartsRouter);
app.use('/api/quotations', quotationsRouter);

// ─── 404 Handler ─────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import pdfParts from './pdf_parts.json';

const prisma = new PrismaClient();

// ─── Auto-import PDF Parts ─────────────────────────────────────
async function importPdfParts() {
  try {
    const items = pdfParts;
    let inserted = 0;
    for (const item of items) {
      // Basic check if part exists
      const exists = await prisma.masterPart.findFirst({
        where: { partName: item.partName, typeSpec: item.typeSpec }
      });
      if (!exists) {
        await prisma.masterPart.create({ data: item });
        inserted++;
      }
    }
    if (inserted > 0) {
      console.log(`✅ Auto-imported ${inserted} master parts from PDF`);
    }
  } catch (err) {
    console.error('Failed to auto-import PDF parts', err);
  }
}

// ─── Cleanup Maker Links ───────────────────────────────────────
async function cleanupMakerLinks() {
  try {
    const partsWithLinks = await prisma.masterPart.findMany({
      where: {
        OR: [
          { maker: { contains: 'http' } },
          { maker: { contains: 'www.' } },
        ]
      }
    });
    if (partsWithLinks.length > 0) {
      for (const p of partsWithLinks) {
        await prisma.masterPart.update({
          where: { id: p.id },
          data: { maker: '-' } // Replace with dash or empty
        });
      }
      console.log(`✅ Cleaned up ${partsWithLinks.length} maker links in master parts`);
    }

    const bomPartsWithLinks = await prisma.part.findMany({
      where: {
        OR: [
          { maker: { contains: 'http' } },
          { maker: { contains: 'www.' } },
        ]
      }
    });
    if (bomPartsWithLinks.length > 0) {
      for (const p of bomPartsWithLinks) {
        await prisma.part.update({
          where: { id: p.id },
          data: { maker: '-' }
        });
      }
      console.log(`✅ Cleaned up ${bomPartsWithLinks.length} maker links in BOM parts`);
    }
  } catch (err) {
    console.error('Failed to cleanup maker links', err);
  }
}

// ─── Start Server ─────────────────────────────────────────────
app.listen(PORT, async () => {
  console.log(`🚀 WARSGATE BOM API running on port ${PORT}`);
  console.log(`🌐 CORS allowed for: ${FRONTEND_URL}`);
  console.log(`❤️  Health: http://localhost:${PORT}/health`);
  
  await importPdfParts();
  await cleanupMakerLinks();
});
