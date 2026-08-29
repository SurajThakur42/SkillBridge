import { Request, Response, NextFunction } from 'express';
import { AuthService, AuthPayload } from '../services/authService.js';
import { database } from '../db/database.js';

export interface AuthenticatedRequest extends Request {
  user?: AuthPayload;
}

export function authenticate(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: Missing or invalid token header.' });
  }

  const token = authHeader.split(' ')[1];
  const payload = AuthService.verifyToken(token);

  if (!payload) {
    return res.status(401).json({ error: 'Unauthorized: Token expired or invalid signature.' });
  }

  // Check if user is active in DB
  const user = database.db.users.find(u => u.id === payload.userId);
  if (!user || !user.isActive) {
    return res.status(403).json({ error: 'Forbidden: Account inactive or removed.' });
  }

  req.user = payload;
  next();
}

export function requireRole(...allowedRoles: Array<'LEARNER' | 'TRAINER' | 'ADMIN'>) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized: Authentication required.' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ 
        error: `Forbidden: Access restricted to roles: [${allowedRoles.join(', ')}]. Your role is ${req.user.role}.` 
      });
    }

    next();
  };
}
