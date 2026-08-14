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

// ─── API Routes ───────────────────────────────────────────────
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

const prisma = new PrismaClient();

// ─── Auto-import PDF Parts ─────────────────────────────────────
async function importPdfParts() {
  try {
    const filePath = path.join(__dirname, 'pdf_parts.json');
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, 'utf-8');
      const items = JSON.parse(data);
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
    }
  } catch (err) {
    console.error('Failed to auto-import PDF parts', err);
  }
}

// ─── Start Server ─────────────────────────────────────────────
app.listen(PORT, async () => {
  console.log(`🚀 WARSGATE BOM API running on port ${PORT}`);
  console.log(`🌐 CORS allowed for: ${FRONTEND_URL}`);
  console.log(`❤️  Health: http://localhost:${PORT}/health`);
  
  await importPdfParts();
});
