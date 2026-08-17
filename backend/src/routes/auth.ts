import express, { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_for_development';

// Login
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    const user = await prisma.user.findUnique({ where: { username } });
    
    // If no users exist yet, allow creating the first admin user
    if (!user) {
      const totalUsers = await prisma.user.count();
      if (totalUsers === 0) {
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = await prisma.user.create({
          data: {
            username,
            password: hashedPassword,
            role: 'LEVEL_2', // First user is Admin
            name: 'Administrator'
          }
        });
        const token = jwt.sign(
          { id: newUser.id, username: newUser.username, role: newUser.role, name: newUser.name },
          JWT_SECRET,
          { expiresIn: '7d' }
        );
        await prisma.auditLog.create({
          data: {
            userId: newUser.id,
            action: 'REGISTER_ADMIN',
            details: 'Initial admin user created'
          }
        });
        return res.json({ token, user: { id: newUser.id, username: newUser.username, role: newUser.role, name: newUser.name } });
      }
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    // Generate JWT
    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role, name: user.name },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Log the login action
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'LOGIN',
        details: 'User logged in successfully'
      }
    });

    res.json({ token, user: { id: user.id, username: user.username, role: user.role, name: user.name } });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Register new users (Admin only)
router.post('/register', async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'Unauthorized' });
    const token = authHeader.split(' ')[1];
    
    let decoded: any;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (e) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    if (decoded.role !== 'LEVEL_2') {
      return res.status(403).json({ error: 'Forbidden. Admin access required.' });
    }

    const { username, password, role, name } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    const existingUser = await prisma.user.findUnique({ where: { username } });
    if (existingUser) {
      return res.status(400).json({ error: 'Username already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await prisma.user.create({
      data: {
        username,
        password: hashedPassword,
        role: role || 'LEVEL_1',
        name: name || username
      }
    });

    await prisma.auditLog.create({
      data: {
        userId: decoded.id,
        action: 'CREATE_USER',
        details: `Created new user: ${newUser.username} (${newUser.role})`
      }
    });

    res.json({ id: newUser.id, username: newUser.username, role: newUser.role, name: newUser.name });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all users (Admin only)
router.get('/users', async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'Unauthorized' });
    const token = authHeader.split(' ')[1];
    
    let decoded: any;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (e) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    if (decoded.role !== 'LEVEL_2') {
      return res.status(403).json({ error: 'Forbidden. Admin access required.' });
    }

    const users = await prisma.user.findMany({
      select: { id: true, username: true, name: true, role: true, createdAt: true }
    });
    res.json(users);
  } catch (err) {
    console.error('Get users error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update user (Admin only)
router.put('/users/:id', async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'Unauthorized' });
    const token = authHeader.split(' ')[1];
    
    let decoded: any;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (e) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    if (decoded.role !== 'LEVEL_2') {
      return res.status(403).json({ error: 'Forbidden. Admin access required.' });
    }

    const { id } = req.params;
    const { name, role, password } = req.body;

    const existingUser = await prisma.user.findUnique({ where: { id } });
    if (!existingUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    const dataToUpdate: any = { name, role };
    
    if (password && password.trim() !== '') {
      dataToUpdate.password = await bcrypt.hash(password, 10);
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: dataToUpdate
    });

    await prisma.auditLog.create({
      data: {
        userId: decoded.id,
        action: 'UPDATE_USER',
        details: `Updated user: ${updatedUser.username}`
      }
    });

    res.json({ id: updatedUser.id, username: updatedUser.username, role: updatedUser.role, name: updatedUser.name });
  } catch (err) {
    console.error('Update user error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete user (Admin only)
router.delete('/users/:id', async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'Unauthorized' });
    const token = authHeader.split(' ')[1];
    
    let decoded: any;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (e) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    if (decoded.role !== 'LEVEL_2') {
      return res.status(403).json({ error: 'Forbidden. Admin access required.' });
    }

    const { id } = req.params;

    if (id === decoded.id) {
      return res.status(400).json({ error: 'Cannot delete your own account while logged in' });
    }

    const userToDelete = await prisma.user.findUnique({ where: { id } });
    if (!userToDelete) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if there are any audit logs associated with this user, we might want to keep them or delete them.
    // Assuming cascading delete is configured in prisma schema for AuditLogs, or we don't delete users with logs.
    // Let's just try to delete the user.
    await prisma.user.delete({ where: { id } });

    await prisma.auditLog.create({
      data: {
        userId: decoded.id,
        action: 'DELETE_USER',
        details: `Deleted user: ${userToDelete.username}`
      }
    });

    res.json({ success: true, message: 'User deleted successfully' });
  } catch (err: any) {
    console.error('Delete user error:', err);
    // If it fails due to foreign key constraints
    if (err.code === 'P2003') {
      return res.status(400).json({ error: 'Cannot delete user because they have associated records in the database.' });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
