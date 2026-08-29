import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { database, User } from '../db/database.js';

const JWT_SECRET = process.env.JWT_SECRET || 'skillbridge-super-secret-jwt-key-2026';

export interface AuthPayload {
  userId: string;
  email: string;
  role: 'LEARNER' | 'TRAINER' | 'ADMIN';
  name: string;
}

export class AuthService {
  public static generateToken(user: User): string {
    const payload: AuthPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      name: user.name
    };
    return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
  }

  public static verifyToken(token: string): AuthPayload | null {
    try {
      return jwt.verify(token, JWT_SECRET) as AuthPayload;
    } catch {
      return null;
    }
  }

  public static sanitizeUser(user: User) {
    const { passwordHash: _, ...safeUser } = user;
    return safeUser;
  }
}
