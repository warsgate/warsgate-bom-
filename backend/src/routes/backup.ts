import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';
import multer from 'multer';

const router = Router();
const prisma = new PrismaClient();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
});

// Helper to locate directories reliably across environments (Local ts-node, local node dist, Render Linux container)
function getBackupDirectory(): string {
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

  const defaultDir = fs.existsSync(path.resolve(process.cwd(), '../package.json'))
    ? path.resolve(process.cwd(), '../backups')
    : path.resolve(process.cwd(), 'backups');

  if (!fs.existsSync(defaultDir)) {
    fs.mkdirSync(defaultDir, { recursive: true });
  }
  return defaultDir;
}

function getDatabaseSourcePath(): string {
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

// ─── Safety Auto-Snapshot Creator ─────────────────────────────
function createSafetyPreSnapshot(): string | null {
  try {
    const backupDir = getBackupDirectory();
    const dbSource = getDatabaseSourcePath();
    if (!fs.existsSync(dbSource)) return null;

    const now = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');
    const timestamp = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
    const presnapshotFile = path.join(backupDir, `dev_backup_presnapshot_${timestamp}.db`);

    try {
      execSync(`sqlite3 "${dbSource}" ".backup '${presnapshotFile}'"`);
    } catch {
      fs.copyFileSync(dbSource, presnapshotFile);
    }
    return path.basename(presnapshotFile);
  } catch (err) {
    console.warn('Safety presnapshot warning:', err);
    return null;
  }
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

// ─── Restore Logic: From JSON Structure ───────────────────────
async function restoreFromJson(jsonData: any) {
  const data = jsonData.data || jsonData;
  if (!data) throw new Error('Invalid JSON format: missing data payload');

  const {
    projects = [],
    modules = [],
    parts = [],
    masterTasks = [],
    masterParts = [],
    quotations = [],
  } = data;

  // Clear in safe cascade foreign-key order
  await prisma.part.deleteMany({});
  await prisma.quotation.deleteMany({});
  await prisma.masterTask.deleteMany({});
  await prisma.module.deleteMany({});
  await prisma.project.deleteMany({});
  await prisma.masterPart.deleteMany({});

  // 1. Projects
  for (const proj of projects) {
    const { id, code, runningNumber, name, customer, customerId, dwgNo, targetBudget, description, status, currentStage, startDate, targetDeliveryDate, poDate, contactPerson, createdAt, updatedAt } = proj;
    await prisma.project.create({
      data: {
        id,
        code,
        runningNumber: Number(runningNumber) || 1,
        name: name || '',
        customer: customer || '',
        customerId: customerId || '000',
        dwgNo: dwgNo || null,
        targetBudget: Number(targetBudget) || 0,
        description: description || null,
        status: status || 'Active',
        currentStage: currentStage || null,
        startDate: startDate || null,
        targetDeliveryDate: targetDeliveryDate || null,
        poDate: poDate || null,
        contactPerson: contactPerson || null,
        createdAt: createdAt ? new Date(createdAt) : undefined,
        updatedAt: updatedAt ? new Date(updatedAt) : undefined,
      },
    });
  }

  // 2. Modules
  for (const mod of modules) {
    const { id, projectId, code, name, dwgNo, description, targetBudget, responsibleEngineer, moduleType, status, currentStage, createdAt, updatedAt } = mod;
    await prisma.module.create({
      data: {
        id,
        projectId,
        code: code || '',
        name: name || '',
        dwgNo: dwgNo || null,
        description: description || null,
        targetBudget: Number(targetBudget) || 0,
        responsibleEngineer: responsibleEngineer || null,
        moduleType: moduleType || 'BOTH',
        status: status || 'Active',
        currentStage: currentStage || null,
        createdAt: createdAt ? new Date(createdAt) : undefined,
        updatedAt: updatedAt ? new Date(updatedAt) : undefined,
      },
    });
  }

  // 3. Quotations
  for (const q of quotations) {
    const { id, projectId, quotationNo, supplier, date, fileUrl, totalAmount, remarks, createdAt, updatedAt } = q;
    await prisma.quotation.create({
      data: {
        id,
        projectId,
        quotationNo: quotationNo || '',
        supplier: supplier || '',
        date: date || null,
        fileUrl: fileUrl || null,
        totalAmount: Number(totalAmount) || 0,
        remarks: remarks || '',
        createdAt: createdAt ? new Date(createdAt) : undefined,
        updatedAt: updatedAt ? new Date(updatedAt) : undefined,
      },
    });
  }

  // 4. Parts
  for (const p of parts) {
    const { id, projectId, moduleId, itemNo, dwgNo, partName, typeSpec, category, partType, qty, unit, maker, supplier, targetUnitPrice, targetTotalAmount, unitPrice, totalAmount, poNumber, storeLocation, orderDate, receiveDate, status, workflowStage, ctrlSpare, remarks, quotationId, purchaseLink, createdAt, updatedAt } = p;
    await prisma.part.create({
      data: {
        id,
        projectId,
        moduleId: moduleId || null,
        itemNo: Number(itemNo) || 1,
        dwgNo: dwgNo || '',
        partName: partName || '',
        typeSpec: typeSpec || '',
        category: category || 'MC',
        partType: partType || 'Standard Part',
        qty: Number(qty) || 1,
        unit: unit || 'EA',
        maker: maker || '',
        supplier: supplier || '',
        targetUnitPrice: Number(targetUnitPrice) || 0,
        targetTotalAmount: Number(targetTotalAmount) || 0,
        unitPrice: Number(unitPrice) || 0,
        totalAmount: Number(totalAmount) || 0,
        poNumber: poNumber || '',
        storeLocation: storeLocation || '',
        orderDate: orderDate || null,
        receiveDate: receiveDate || null,
        status: status || 'Planned',
        workflowStage: workflowStage || '2. BOM Part List',
        ctrlSpare: ctrlSpare || '',
        remarks: remarks || '',
        quotationId: quotationId || null,
        purchaseLink: purchaseLink || '',
        createdAt: createdAt ? new Date(createdAt) : undefined,
        updatedAt: updatedAt ? new Date(updatedAt) : undefined,
      },
    });
  }

  // 5. Master Tasks
  const parentTasks = masterTasks.filter((t: any) => !t.parentId);
  const subTasks = masterTasks.filter((t: any) => !!t.parentId);

  for (const task of [...parentTasks, ...subTasks]) {
    const { id, projectId, wbs, stageName, title, responsible, planStartDate, planEndDate, actualStartDate, actualEndDate, actualDates, dailyNotes, progressPct, status, color, parentId, createdAt, updatedAt } = task;
    await prisma.masterTask.create({
      data: {
        id,
        projectId,
        wbs: wbs || '',
        stageName: stageName || '',
        title: title || '',
        responsible: responsible || '',
        planStartDate: planStartDate || '',
        planEndDate: planEndDate || '',
        actualStartDate: actualStartDate || '',
        actualEndDate: actualEndDate || '',
        actualDates: typeof actualDates === 'string' ? actualDates : JSON.stringify(actualDates || []),
        dailyNotes: typeof dailyNotes === 'string' ? dailyNotes : JSON.stringify(dailyNotes || {}),
        progressPct: Number(progressPct) || 0,
        status: status || 'Pending',
        color: color || 'bg-blue-600',
        parentId: parentId || null,
        createdAt: createdAt ? new Date(createdAt) : undefined,
        updatedAt: updatedAt ? new Date(updatedAt) : undefined,
      },
    });
  }

  // 6. Master Parts
  for (const mp of masterParts) {
    const { id, partName, typeSpec, category, partType, unit, maker, supplier, unitPrice, storeLocation, description, purchaseLink, createdAt, updatedAt } = mp;
    await prisma.masterPart.create({
      data: {
        id,
        partName: partName || '',
        typeSpec: typeSpec || '',
        category: category || 'MC',
        partType: partType || 'Standard Part',
        unit: unit || 'EA',
        maker: maker || '',
        supplier: supplier || '',
        unitPrice: Number(unitPrice) || 0,
        storeLocation: storeLocation || '',
        description: description || '',
        purchaseLink: purchaseLink || '',
        createdAt: createdAt ? new Date(createdAt) : undefined,
        updatedAt: updatedAt ? new Date(updatedAt) : undefined,
      },
    });
  }

  return {
    projects: projects.length,
    modules: modules.length,
    parts: parts.length,
    masterTasks: masterTasks.length,
    masterParts: masterParts.length,
    quotations: quotations.length,
  };
}

// ─── Restore Logic: From SQLite DB File ───────────────────────
async function restoreFromSqliteDb(backupFilePath: string) {
  const dbSource = getDatabaseSourcePath();

  // Create an automatic safety snapshot before restoring
  const presnapshot = createSafetyPreSnapshot();

  // Disconnect prisma
  await prisma.$disconnect();

  // Overwrite database file with backup
  fs.copyFileSync(backupFilePath, dbSource);

  // Reconnect prisma
  await prisma.$connect();

  const [pCount, mCount, ptCount, tCount, mpCount] = await Promise.all([
    prisma.project.count(),
    prisma.module.count(),
    prisma.part.count(),
    prisma.masterTask.count(),
    prisma.masterPart.count(),
  ]);

  return {
    presnapshot,
    counts: {
      projects: pCount,
      modules: mCount,
      parts: ptCount,
      masterTasks: tCount,
      masterParts: mpCount,
    },
  };
}

// ─── POST /api/backup/restore/:filename ────────────────────────
async function restoreFileHandler(req: Request, res: Response) {
  try {
    const filename = req.params.filename;
    const safeFilename = path.basename(filename);
    const backupDir = getBackupDirectory();
    const targetFile = path.join(backupDir, safeFilename);

    if (!fs.existsSync(targetFile)) {
      return res.status(404).json({ success: false, error: 'ไม่พบไฟล์สำรองข้อมูลที่ระบุ' });
    }

    if (safeFilename.endsWith('.db')) {
      const result = await restoreFromSqliteDb(targetFile);
      return res.json({
        success: true,
        message: `กู้คืนฐานข้อมูลจาก ${safeFilename} สำเร็จเรียบร้อยแล้ว`,
        presnapshot: result.presnapshot,
        counts: result.counts,
      });
    } else if (safeFilename.endsWith('.json')) {
      createSafetyPreSnapshot();
      const content = fs.readFileSync(targetFile, 'utf-8');
      const parsed = JSON.parse(content);
      const counts = await restoreFromJson(parsed);
      return res.json({
        success: true,
        message: `กู้คืนข้อมูล JSON จาก ${safeFilename} สำเร็จเรียบร้อยแล้ว`,
        counts,
      });
    } else {
      return res.status(400).json({ success: false, error: 'รองรับการกู้คืนเฉพาะไฟล์ .db และ .json เท่านั้น' });
    }
  } catch (error: any) {
    console.error('Restore error:', error);
    return res.status(500).json({ success: false, error: 'เกิดข้อผิดพลาดในการกู้คืน: ' + (error?.message || error) });
  }
}

// ─── POST /api/backup/restore-json ────────────────────────────
async function restoreJsonPayloadHandler(req: Request, res: Response) {
  try {
    const payload = req.body;
    if (!payload) {
      return res.status(400).json({ success: false, error: 'ไม่พบข้อมูล JSON ในคำขอ' });
    }

    createSafetyPreSnapshot();
    const counts = await restoreFromJson(payload);

    return res.json({
      success: true,
      message: 'กู้คืนข้อมูลจาก JSON Payload สำเร็จเรียบร้อยแล้ว',
      counts,
    });
  } catch (error: any) {
    console.error('Restore JSON payload error:', error);
    return res.status(500).json({ success: false, error: 'เกิดข้อผิดพลาดในการกู้คืน JSON: ' + (error?.message || error) });
  }
}

// ─── POST /api/backup/upload-restore ──────────────────────────
async function uploadAndRestoreHandler(req: Request, res: Response) {
  try {
    const file = req.file;
    if (!file) {
      return res.status(400).json({ success: false, error: 'กรุณาอัปโหลดไฟล์ (.db หรือ .json)' });
    }

    const backupDir = getBackupDirectory();
    const ext = path.extname(file.originalname).toLowerCase();
    const now = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');
    const timestamp = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;

    if (ext === '.db') {
      const savedName = `dev_backup_uploaded_${timestamp}.db`;
      const targetPath = path.join(backupDir, savedName);
      fs.writeFileSync(targetPath, file.buffer);

      const result = await restoreFromSqliteDb(targetPath);
      return res.json({
        success: true,
        message: `อัปโหลดและกู้คืนฐานข้อมูล SQLite (${file.originalname}) สำเร็จ`,
        presnapshot: result.presnapshot,
        counts: result.counts,
      });
    } else if (ext === '.json') {
      const savedName = `dev_backup_uploaded_${timestamp}.json`;
      const targetPath = path.join(backupDir, savedName);
      fs.writeFileSync(targetPath, file.buffer);

      createSafetyPreSnapshot();
      const content = file.buffer.toString('utf-8');
      const parsed = JSON.parse(content);
      const counts = await restoreFromJson(parsed);

      return res.json({
        success: true,
        message: `อัปโหลดและกู้คืนข้อมูล JSON (${file.originalname}) สำเร็จ`,
        counts,
      });
    } else {
      return res.status(400).json({ success: false, error: 'รองรับการกู้คืนเฉพาะไฟล์นามสกุล .db และ .json เท่านั้น' });
    }
  } catch (error: any) {
    console.error('Upload restore error:', error);
    return res.status(500).json({ success: false, error: 'เกิดข้อผิดพลาดในการอัปโหลดกู้คืน: ' + (error?.message || error) });
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

// Restore endpoints
router.post('/restore/:filename', restoreFileHandler);
router.post('/restore-json', restoreJsonPayloadHandler);
router.post('/upload-restore', upload.single('file'), uploadAndRestoreHandler);

export default router;
