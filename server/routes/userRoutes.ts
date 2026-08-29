import { Router, Response } from 'express';
import { database } from '../db/database.js';
import { AuthService } from '../services/authService.js';
import { authenticate, AuthenticatedRequest } from '../middleware/authMiddleware.js';

export const userRouter = Router();

// Get profile
userRouter.get('/me', authenticate, (req: AuthenticatedRequest, res: Response) => {
  const db = database.db;
  const user = db.users.find(u => u.id === req.user?.userId);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  const targetRole = db.targetRoles.find(r => r.id === user.targetRoleId);
  const enrollmentsCount = db.enrollments.filter(e => e.userId === user.id).length;
  const completedCount = db.enrollments.filter(e => e.userId === user.id && e.status === 'COMPLETED').length;
  const certificatesCount = db.certificates.filter(c => c.userId === user.id).length;

  return res.json({
    user: AuthService.sanitizeUser(user),
    targetRole,
    stats: {
      enrollmentsCount,
      completedCount,
      certificatesCount
    }
  });
});

// Update profile
userRouter.put('/me', authenticate, (req: AuthenticatedRequest, res: Response) => {
  const { name, department, organization, profileImage } = req.body;
  const db = database.db;
  const user = db.users.find(u => u.id === req.user?.userId);

  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  if (name) user.name = name;
  if (department) user.department = department;
  if (organization) user.organization = organization;
  if (profileImage) user.profileImage = profileImage;
  user.updatedAt = new Date().toISOString();

  database.save();

  return res.json({
    message: 'Profile updated successfully',
    user: AuthService.sanitizeUser(user)
  });
});

// Update Target Role (Critical for SIH Step 4-5 demo)
userRouter.put('/me/target-role', authenticate, (req: AuthenticatedRequest, res: Response) => {
  const { targetRoleId } = req.body;
  if (!targetRoleId) {
    return res.status(400).json({ error: 'targetRoleId is required' });
  }

  const db = database.db;
  const role = db.targetRoles.find(r => r.id === targetRoleId);
  if (!role) {
    return res.status(404).json({ error: 'Target role not found' });
  }

  const user = db.users.find(u => u.id === req.user?.userId);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  user.targetRoleId = targetRoleId;
  user.updatedAt = new Date().toISOString();

  // Add notification
  db.notifications.push({
    id: `notif-${Date.now()}`,
    userId: user.id,
    title: `Target Role Updated: ${role.name}`,
    message: `Your competency targets and skill gap recommendations have been recalculated for ${role.name}.`,
    type: 'RECOMMENDATION',
    isRead: false,
    createdAt: new Date().toISOString()
  });

  database.save();

  return res.json({
    message: `Target role updated to ${role.name}`,
    targetRole: role,
    user: AuthService.sanitizeUser(user)
  });
});

// Get all Target Roles
userRouter.get('/target-roles', (_req, res: Response) => {
  const db = database.db;
  return res.json({
    targetRoles: db.targetRoles
  });
});

// Get Notifications
userRouter.get('/notifications', authenticate, (req: AuthenticatedRequest, res: Response) => {
  const db = database.db;
  const userNotifs = db.notifications
    .filter(n => n.userId === req.user?.userId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const unreadCount = userNotifs.filter(n => !n.isRead).length;

  return res.json({
    notifications: userNotifs,
    unreadCount
  });
});

// Mark all notifications as read
userRouter.put('/notifications/read-all', authenticate, (req: AuthenticatedRequest, res: Response) => {
  const db = database.db;
  db.notifications.forEach(n => {
    if (n.userId === req.user?.userId) {
      n.isRead = true;
    }
  });

  database.save();
  return res.json({ message: 'All notifications marked as read' });
});

// Mark single notification read
userRouter.put('/notifications/:id/read', authenticate, (req: AuthenticatedRequest, res: Response) => {
  const db = database.db;
  const notif = db.notifications.find(n => n.id === req.params.id && n.userId === req.user?.userId);
  if (notif) {
    notif.isRead = true;
    database.save();
  }
  return res.json({ message: 'Notification marked as read' });
});
