import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { database, User } from '../db/database.js';
import { AuthService } from '../services/authService.js';
import { authenticate, AuthenticatedRequest } from '../middleware/authMiddleware.js';

export const authRouter = Router();

// Register
authRouter.post('/register', (req: Request, res: Response) => {
  const { name, email, password, role, department, organization, targetRoleId } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Name, email, and password are required.' });
  }

  const db = database.db;
  const existingUser = db.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (existingUser) {
    return res.status(409).json({ error: 'An account with this email already exists.' });
  }

  // Prevent unauthorized public admin registration
  let assignedRole: 'LEARNER' | 'TRAINER' | 'ADMIN' = 'LEARNER';
  if (role === 'TRAINER') {
    assignedRole = 'TRAINER';
  } else if (role === 'ADMIN') {
    if (req.body.adminSecret !== 'sih2026-admin-key') {
      return res.status(403).json({ error: 'Unauthorized: Public registration as ADMIN requires admin token.' });
    }
    assignedRole = 'ADMIN';
  }

  const salt = bcrypt.genSaltSync(10);
  const passwordHash = bcrypt.hashSync(password, salt);
  const now = new Date().toISOString();

  const newUser: User = {
    id: `usr-${Date.now()}`,
    name,
    email: email.toLowerCase(),
    passwordHash,
    role: assignedRole,
    department: department || 'Engineering',
    organization: organization || 'National Digital Academy',
    profileImage: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}`,
    targetRoleId: targetRoleId || 'role-cloud-dev',
    isActive: true,
    createdAt: now,
    updatedAt: now
  };

  db.users.push(newUser);

  // Add welcome notification
  db.notifications.push({
    id: `notif-${Date.now()}`,
    userId: newUser.id,
    title: 'Welcome to SkillBridge',
    message: 'Explore courses, calibrate your target role, and complete assessments to earn verifiable certifications.',
    type: 'SYSTEM',
    isRead: false,
    createdAt: now
  });

  database.save();

  const token = AuthService.generateToken(newUser);
  return res.status(201).json({
    message: 'User registered successfully',
    token,
    user: AuthService.sanitizeUser(newUser)
  });
});

// Login
authRouter.post('/login', (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  const db = database.db;
  const user = db.users.find(u => u.email.toLowerCase() === email.toLowerCase());

  if (!user) {
    return res.status(401).json({ error: 'Invalid email or password.' });
  }

  if (!user.isActive) {
    return res.status(403).json({ error: 'Account is deactivated. Please contact your organization administrator.' });
  }

  const isMatch = bcrypt.compareSync(password, user.passwordHash);
  if (!isMatch) {
    return res.status(401).json({ error: 'Invalid email or password.' });
  }

  const token = AuthService.generateToken(user);
  return res.json({
    message: 'Login successful',
    token,
    user: AuthService.sanitizeUser(user)
  });
});

// Get Current User
authRouter.get('/me', authenticate, (req: AuthenticatedRequest, res: Response) => {
  const user = database.db.users.find(u => u.id === req.user?.userId);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  return res.json({
    user: AuthService.sanitizeUser(user)
  });
});

// Logout
authRouter.post('/logout', authenticate, (_req: AuthenticatedRequest, res: Response) => {
  return res.json({ message: 'Logged out successfully' });
});

// Reset Demo Data (Helper for judges and testing)
authRouter.post('/reset-demo', (_req: Request, res: Response) => {
  database.resetToSeed();
  return res.json({ message: 'Database successfully re-seeded with demo data.' });
});
