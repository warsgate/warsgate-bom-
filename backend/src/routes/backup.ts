import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

const router = Router();
const prisma = new PrismaClient();

// Helper to locate directories reliably across environments (Local ts-node, local node dist, Render Linux container)
function getBackupDirectory(): string {
  // Check if root /backups exists
  const candidates = [
    path.resolve(process.cwd(), '../backups'),
    path.resolve(process.cwd(), 'backups'),
    path.resolve(__dirname, '../../../backups'),
    path.resolve(__dirname, '../../backups'),
  ];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }

  // If none exist yet, try candidate 0 (parent backups if in backend dir) or candidate 1
  const defaultDir = fs.existsSync(path.resolve(process.cwd(), '../package.json'))
    ? path.resolve(process.cwd(), '../backups')
    : path.resolve(process.cwd(), 'backups');

  if (!fs.existsSync(defaultDir)) {
    fs.mkdirSync(defaultDir, { recursive: true });
  }
  return defaultDir;
}

function getDatabaseSourcePath(): string {
  // Check common locations
  const candidates = [
    path.resolve(process.cwd(), 'prisma/dev.db'),
    path.resolve(process.cwd(), 'dev.db'),
    path.resolve(__dirname, '../prisma/dev.db'),
    path.resolve(__dirname, '../../prisma/dev.db'),
    path.resolve(__dirname, '../../../backend/prisma/dev.db'),
  ];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }

  return path.resolve(process.cwd(), 'prisma/dev.db');
}

// ─── Core Backup Generator Handler ───────────────────────────
async function executeBackup(_req: Request, res: Response) {
  try {
    const backupDir = getBackupDirectory();
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    const now = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');
    const timestamp = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;

    // 1. SQLite binary copy (.db)
    const dbSource = getDatabaseSourcePath();
    const dbFileName = `dev_backup_${timestamp}.db`;
    const dbDest = path.join(backupDir, dbFileName);

    let binaryBackupSuccess = false;
    if (fs.existsSync(dbSource)) {
      try {
        execSync(`sqlite3 "${dbSource}" ".backup '${dbDest}'"`);
        binaryBackupSuccess = true;
      } catch {
        try {
          fs.copyFileSync(dbSource, dbDest);
          binaryBackupSuccess = true;
        } catch (copyErr) {
          console.warn('Failed fs copy fallback for SQLite DB:', copyErr);
        }
      }
    }

    // 2. SQL Dump (.sql)
    const sqlFileName = `dev_backup_${timestamp}.sql`;
    const sqlDest = path.join(backupDir, sqlFileName);
    let sqlDumpSuccess = false;
    if (fs.existsSync(dbSource)) {
      try {
        execSync(`sqlite3 "${dbSource}" .dump > "${sqlDest}"`);
        sqlDumpSuccess = true;
      } catch (err) {
        console.warn('Could not generate SQL dump via sqlite3:', err);
      }
    }

    // 3. Structured JSON Dump (.json)
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
        databaseSource: dbSource,
        hasBinaryDb: binaryBackupSuccess,
        hasSqlDump: sqlDumpSuccess,
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
        db: binaryBackupSuccess ? dbFileName : null,
        sql: sqlDumpSuccess ? sqlFileName : null,
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
}

// ─── List Backups Handler ────────────────────────────────────
function listBackupsHandler(_req: Request, res: Response) {
  try {
    const backupDir = getBackupDirectory();
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

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
    return res.status(500).json({
      success: false,
      error: error?.message || 'Failed to list backups',
    });
  }
}

// ─── Download Backup File Handler ─────────────────────────────
function downloadBackupHandler(req: Request, res: Response) {
  try {
    const backupDir = getBackupDirectory();
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
}

// ─── Route Mappings ───────────────────────────────────────────
// Trigger backup
router.post('/', executeBackup);
router.post('/create', executeBackup);

// List backups (supports both GET / and GET /list)
router.get('/', listBackupsHandler);
router.get('/list', listBackupsHandler);

// Download file
router.get('/download/:filename', downloadBackupHandler);

export default router;
