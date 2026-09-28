# WARSGATE BOM System - Database Backups

โฟลเดอร์นี้ใช้สำหรับเก็บไฟล์สำรองข้อมูล (Database Backups) ทั้งหมดของระบบ

### รูปแบบไฟล์สำรอง:
1. **`.db` (SQLite Binary Database)**: ไฟล์ฐานข้อมูลจริง สามารถนำไปวางแทนที่ `backend/prisma/dev.db` ได้ทันทีเมื่อต้องการ Restore แบบสมบูรณ์
2. **`.sql` (SQL Dump)**: คำสั่ง SQL ทั้งหมด (Schema + Data) เหมาะสำหรับการตรวจสอบ หรือนำเข้าเครื่องมือฐานข้อมูลอื่นๆ
3. **`.json` (Structured JSON Export)**: ข้อมูลในรูปแบบ JSON จัดกลุ่มตาม Table (Projects, Modules, Parts, MasterTasks, Users, etc.) อ่านง่ายและนำไปใช้ต่อได้หลากหลาย

### วิธีการรัน Backup ด้วยตนเอง:
เปิด Terminal แล้วรันคำสั่ง:
```bash
cd backend
npm run db:backup
```
ระบบจะสร้างไฟล์สำรองชุดใหม่พร้อมประทับเวลา (Timestamp) ให้อัตโนมัติในโฟลเดอร์ `backups/` นี้
