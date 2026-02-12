import { Router } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';
import { authMiddleware } from '../middleware/auth.js';
import {
  findUserByEmail,
  createUser,
  generateUserId,
} from '../services/usersSheetService.js';

export const authRoutes = Router();

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 6;

function signToken(userId, email) {
  if (!config.jwtSecret || config.jwtSecret.length < 16) {
    throw new Error('JWT_SECRET not configured or too short (use at least 16 characters)');
  }
  return jwt.sign(
    { userId, email },
    config.jwtSecret,
    { expiresIn: '7d' }
  );
}

authRoutes.post('/signup', async (req, res, next) => {
  try {
    const { email, password } = req.body || {};
    const normalizedEmail = (email || '').trim().toLowerCase();

    if (!normalizedEmail) {
      return res.status(400).json({ error: 'Email is required' });
    }
    if (!EMAIL_REGEX.test(normalizedEmail)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }
    if (!password || typeof password !== 'string') {
      return res.status(400).json({ error: 'Password is required' });
    }
    if (password.length < MIN_PASSWORD_LENGTH) {
      return res.status(400).json({
        error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters`,
      });
    }

    const existing = await findUserByEmail(normalizedEmail);
    if (existing) {
      return res.status(409).json({ error: 'Email already in use' });
    }

    const userId = generateUserId();
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await createUser({
      userId,
      email: normalizedEmail,
      passwordHash,
    });

    const token = signToken(user.userId, user.email);
    res.status(201).json({
      token,
      user: { userId: user.userId, email: user.email },
    });
  } catch (err) {
    next(err);
  }
});

authRoutes.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body || {};
    const normalizedEmail = (email || '').trim().toLowerCase();

    if (!normalizedEmail || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await findUserByEmail(normalizedEmail);
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = signToken(user.userId, user.email);
    res.json({
      token,
      user: { userId: user.userId, email: user.email },
    });
  } catch (err) {
    next(err);
  }
});

authRoutes.get('/me', authMiddleware, (req, res) => {
  res.json({ user: req.user });
});
