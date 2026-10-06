import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { pool } from './db.js';

const app = express();
const port = Number(process.env.PORT || 5000);

if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET must be configured');
}

app.use(cors({ origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173' }));
app.use(express.json());

const allowedRoles = new Set(['STUDENT', 'GUIDE', 'COORDINATOR']);

app.get('/api/health', (_req, res) => {
  res.json({ success: true, message: 'API is running' });
});

app.post('/api/auth/login', async (req, res, next) => {
  try {
    const email = String(req.body.email || '').trim().toLowerCase();
    const password = String(req.body.password || '');
    const role = String(req.body.role || '').trim().toUpperCase();

    if (!email || !password || !allowedRoles.has(role)) {
      return res.status(400).json({
        success: false,
        message: 'Email, password, and a valid role are required'
      });
    }

    const { rows } = await pool.query(
      `SELECT id, email, full_name, role, password_hash
       FROM users
       WHERE email = $1 AND role = $2 AND is_active = TRUE`,
      [email, role]
    );

    const user = rows[0];
    const passwordMatches = user
      ? await bcrypt.compare(password, user.password_hash)
      : false;

    // Do not reveal whether the email or password was incorrect.
    if (!user || !passwordMatches) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email, password, or role'
      });
    }

    const token = jwt.sign(
      { sub: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '1d' }
    );

    return res.json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        role: user.role
      }
    });
  } catch (error) {
    return next(error);
  }
});

app.use((error, _req, res, _next) => {
  console.error(error);
  res.status(500).json({ success: false, message: 'Internal server error' });
});

app.listen(port, () => {
  console.log(`API listening on http://localhost:${port}`);
});
