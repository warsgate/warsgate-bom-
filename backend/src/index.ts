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

// ─── Start Server ─────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`🚀 WARSGATE BOM API running on port ${PORT}`);
  console.log(`🌐 CORS allowed for: ${FRONTEND_URL}`);
  console.log(`❤️  Health: http://localhost:${PORT}/health`);
});
