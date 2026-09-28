import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

const prisma = new PrismaClient();

async function runBackup() {
  const rootDir = path.resolve(__dirname, '../../../');
  const backupDir = path.join(rootDir, 'backups');

  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  const now = new Date();
  const pad = (n: number) => n.toString().padStart(2, '0');
  const timestamp = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;

  console.log(`========================================`);
  console.log(`🚀 Starting Database Backup: ${timestamp}`);
  console.log(`Backup Directory: ${backupDir}`);
  console.log(`========================================`);

  // 1. Safe SQLite binary copy (.db)
  const dbSource = path.join(rootDir, 'backend/prisma/dev.db');
  const dbDest = path.join(backupDir, `dev_backup_${timestamp}.db`);
  try {
    execSync(`sqlite3 "${dbSource}" ".backup '${dbDest}'"`);
    console.log(`✅ [1/3] SQLite Binary Backup created: ${path.basename(dbDest)}`);
  } catch (err) {
    // Fallback to fs copy if sqlite3 CLI is unavailable
    fs.copyFileSync(dbSource, dbDest);
    console.log(`✅ [1/3] SQLite Binary Backup copied (fs): ${path.basename(dbDest)}`);
  }

  // 2. SQL Dump (.sql)
  const sqlDest = path.join(backupDir, `dev_backup_${timestamp}.sql`);
  try {
    execSync(`sqlite3 "${dbSource}" .dump > "${sqlDest}"`);
    console.log(`✅ [2/3] SQL Dump generated: ${path.basename(sqlDest)}`);
  } catch (err) {
    console.warn(`⚠️ [2/3] Could not create SQL dump via sqlite3 CLI:`, err);
  }

  // 3. Structured JSON Dump (.json)
  console.log(`⏳ [3/3] Exporting structured JSON data from Prisma...`);
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

  const jsonDest = path.join(backupDir, `dev_backup_${timestamp}.json`);
  fs.writeFileSync(jsonDest, JSON.stringify(jsonExport, null, 2), 'utf-8');
  console.log(`✅ [3/3] JSON Data Export generated: ${path.basename(jsonDest)}`);

  console.log(`\n📊 Backup Summary:`);
  console.log(`- Projects:       ${projects.length}`);
  console.log(`- Modules:        ${modules.length}`);
  console.log(`- Parts (BOM):    ${parts.length}`);
  console.log(`- Master Tasks:   ${masterTasks.length}`);
  console.log(`- Master Parts:   ${masterParts.length}`);
  console.log(`- Quotations:     ${quotations.length}`);
  console.log(`- Users:          ${users.length}`);
  console.log(`- Audit Logs:     ${auditLogs.length}`);
  console.log(`- System Settings:${systemSettings.length}`);
  console.log(`\n🎉 Backup completed successfully!`);

  await prisma.$disconnect();
}

runBackup().catch((error) => {
  console.error('❌ Backup failed:', error);
  process.exit(1);
});
