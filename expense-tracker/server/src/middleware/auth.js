import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';

export function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const token = authHeader.slice(7);
  if (!config.jwtSecret) {
    return res.status(500).json({ error: 'Auth not configured' });
  }

  try {
    const decoded = jwt.verify(token, config.jwtSecret);
    req.user = { userId: decoded.userId, email: decoded.email };
    next();
  } catch {
    return res.status(401).json({ error: 'Unauthorized' });
  }
}
