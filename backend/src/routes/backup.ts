import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

const router = Router();
const prisma = new PrismaClient();

// Get the root backups directory
const rootDir = path.resolve(__dirname, '../../../');
const backupDir = path.join(rootDir, 'backups');

function ensureBackupDir() {
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }
}

// ─── POST /api/backup: Trigger a full backup ──────────────────
router.post('/', async (_req: Request, res: Response) => {
  try {
    ensureBackupDir();

    const now = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');
    const timestamp = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;

    // 1. Safe SQLite binary copy (.db)
    const dbSource = path.join(rootDir, 'backend/prisma/dev.db');
    const dbFileName = `dev_backup_${timestamp}.db`;
    const dbDest = path.join(backupDir, dbFileName);

    try {
      execSync(`sqlite3 "${dbSource}" ".backup '${dbDest}'"`);
    } catch {
      // Fallback
      fs.copyFileSync(dbSource, dbDest);
    }

    // 2. SQL Dump (.sql)
    const sqlFileName = `dev_backup_${timestamp}.sql`;
    const sqlDest = path.join(backupDir, sqlFileName);
    try {
      execSync(`sqlite3 "${dbSource}" .dump > "${sqlDest}"`);
    } catch (err) {
      console.warn('Could not generate SQL dump:', err);
    }

    // 3. JSON Dump (.json)
    const [
      projects,
      modules,
      parts,
      masterTasks,
      masterParts,
      quotations,
      users,
      auditLogs,
      systemSettings,
    ] = await Promise.all([
      prisma.project.findMany(),
      prisma.module.findMany(),
      prisma.part.findMany(),
      prisma.masterTask.findMany(),
      prisma.masterPart.findMany(),
      prisma.quotation.findMany(),
      prisma.user.findMany({
        select: {
          id: true,
          username: true,
          role: true,
          name: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      prisma.auditLog.findMany(),
      prisma.systemSetting.findMany(),
    ]);

    const jsonExport = {
      metadata: {
        timestamp: now.toISOString(),
        backupVersion: '1.0',
        system: 'WARSGATE BOM System',
        counts: {
          projects: projects.length,
          modules: modules.length,
          parts: parts.length,
          masterTasks: masterTasks.length,
          masterParts: masterParts.length,
          quotations: quotations.length,
          users: users.length,
          auditLogs: auditLogs.length,
          systemSettings: systemSettings.length,
        },
      },
      data: {
        projects,
        modules,
        parts,
        masterTasks,
        masterParts,
        quotations,
        users,
        auditLogs,
        systemSettings,
      },
    };

    const jsonFileName = `dev_backup_${timestamp}.json`;
    const jsonDest = path.join(backupDir, jsonFileName);
    fs.writeFileSync(jsonDest, JSON.stringify(jsonExport, null, 2), 'utf-8');

    return res.json({
      success: true,
      message: 'สำรองฐานข้อมูลสำเร็จเรียบร้อยแล้ว',
      timestamp,
      backupDir,
      files: {
        db: dbFileName,
        sql: sqlFileName,
        json: jsonFileName,
      },
      counts: jsonExport.metadata.counts,
    });
  } catch (error: any) {
    console.error('Database backup error:', error);
    return res.status(500).json({
      success: false,
      error: 'เกิดข้อผิดพลาดในการสำรองฐานข้อมูล: ' + (error?.message || error),
    });
  }
});

// ─── GET /api/backup/list: List all available backups ──────────
router.get('/list', (_req: Request, res: Response) => {
  try {
    ensureBackupDir();

    const files = fs.readdirSync(backupDir);
    const backups = files
      .filter((file) => file.startsWith('dev_backup_') && (file.endsWith('.db') || file.endsWith('.sql') || file.endsWith('.json')))
      .map((file) => {
        const filePath = path.join(backupDir, file);
        const stats = fs.statSync(filePath);
        const ext = path.extname(file).replace('.', '');
        return {
          filename: file,
          sizeBytes: stats.size,
          sizeFormatted: `${(stats.size / 1024).toFixed(1)} KB`,
          createdAt: stats.mtime,
          type: ext,
        };
      })
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    return res.json({
      success: true,
      backupDir,
      backups,
    });
  } catch (error: any) {
    return res.status(500).json({ error: error?.message || 'Failed to list backups' });
  }
});

// ─── GET /api/backup/download/:filename: Download a backup file ─
router.get('/download/:filename', (req: Request, res: Response) => {
  try {
    const filename = req.params.filename;

    // Security check: prevent directory traversal
    const safeFilename = path.basename(filename);
    const targetFile = path.join(backupDir, safeFilename);

    if (!fs.existsSync(targetFile)) {
      return res.status(404).json({ error: 'File not found' });
    }

    return res.download(targetFile, safeFilename);
  } catch (error: any) {
    return res.status(500).json({ error: error?.message || 'Download failed' });
  }
});

export default router;
