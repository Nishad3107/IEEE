import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { pool } from './db.js';
import { requireAuth, requireRole } from './auth.js';

const app = express();
const port = Number(process.env.PORT || 5000);
const allowedRoles = new Set(['STUDENT', 'GUIDE', 'COORDINATOR']);
const currentFile = fileURLToPath(import.meta.url);
const uploadDirectory = path.resolve(path.dirname(currentFile), '../uploads');
fs.mkdirSync(uploadDirectory, { recursive: true });

const upload = multer({
  dest: uploadDirectory,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, callback) => callback(null, file.mimetype === 'application/pdf')
});

if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET must be configured');

app.use(cors({ origin: process.env.CLIENT_ORIGIN || 'http://localhost:3000' }));
app.use(express.json());
app.use('/uploads', express.static(uploadDirectory));

app.get('/api/health', async (_req, res) => {
  try {
    await pool.query('SELECT 1');
    return res.json({ success: true, database: 'connected' });
  } catch {
    return res.status(503).json({ success: false, database: 'unavailable' });
  }
});

app.post('/api/auth/login', async (req, res, next) => {
  try {
    const email = String(req.body.email || '').trim().toLowerCase();
    const password = String(req.body.password || '');
    const role = String(req.body.role || '').trim().toUpperCase();

    if (!email || !password || !allowedRoles.has(role)) {
      return res.status(400).json({ success: false, message: 'Email, password, and a valid role are required' });
    }

    const { rows } = await pool.query(
      `SELECT u.id, u.email, u.first_name, u.last_name, ur.role::text AS role, u.password_hash
       FROM users u JOIN user_roles ur ON ur.user_id = u.id
       WHERE u.email = $1 AND ur.role = $2::user_role AND u.is_active = TRUE`,
      [email, role]
    );
    const user = rows[0];
    const validPassword = user ? await bcrypt.compare(password, user.password_hash) : false;

    if (!user || !validPassword) {
      return res.status(401).json({ success: false, message: 'Invalid email, password, or role' });
    }

    const token = jwt.sign(
      { sub: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '1d' }
    );

    return res.json({
      success: true,
      token,
      user: { id: user.id, email: user.email, fullName: `${user.first_name} ${user.last_name}`, role: user.role }
    });
  } catch (error) {
    return next(error);
  }
});

app.get('/api/auth/me', requireAuth, async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT u.id, u.email, u.first_name, u.last_name, ur.role::text AS role
       FROM users u JOIN user_roles ur ON ur.user_id = u.id
       WHERE u.id = $1 AND ur.role = $2::user_role AND u.is_active = TRUE`,
      [req.user.sub, req.user.role]
    );
    if (!rows[0]) return res.status(404).json({ success: false, message: 'User not found' });
    return res.json({ success: true, user: { ...rows[0], fullName: `${rows[0].first_name} ${rows[0].last_name}` } });
  } catch (error) {
    return next(error);
  }
});

app.get('/api/guides', requireAuth, async (_req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT u.id, CONCAT(u.first_name, ' ', u.last_name) AS name, gp.department,
              gp.specialization, gp.max_project_load, gp.current_project_load
       FROM users u JOIN guide_profiles gp ON gp.user_id = u.id
       WHERE u.is_active = TRUE AND gp.is_available = TRUE ORDER BY name`
    );
    return res.json({ success: true, guides: rows });
  } catch (error) {
    return next(error);
  }
});

app.get('/api/projects', requireAuth, async (req, res, next) => {
  try {
    const params = [];
    const conditions = [];
    if (req.user.role === 'STUDENT') {
      params.push(req.user.sub);
      conditions.push(`EXISTS (SELECT 1 FROM project_members pm WHERE pm.project_id = p.id AND pm.student_id = $${params.length} AND pm.status = 'ACTIVE')`);
    }
    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const { rows } = await pool.query(
      `SELECT p.id, p.title, p.status, p.department,
              COALESCE(CONCAT(g.first_name, ' ', g.last_name), 'Unassigned') AS guide,
              COUNT(pm.student_id)::int AS member_count
       FROM projects p
       LEFT JOIN guide_allocations ga ON ga.project_id = p.id AND ga.allocation_status = 'ALLOCATED'
       LEFT JOIN users g ON g.id = ga.guide_id
       LEFT JOIN project_members pm ON pm.project_id = p.id AND pm.status = 'ACTIVE'
       ${where} GROUP BY p.id, g.first_name, g.last_name ORDER BY p.created_at DESC`,
      params
    );
    return res.json({ success: true, projects: rows });
  } catch (error) {
    return next(error);
  }
});

app.post('/api/projects', requireAuth, requireRole('STUDENT', 'COORDINATOR'), async (req, res, next) => {
  const client = await pool.connect();
  try {
    const { title, department, studentIds = [], studentRollNumbers = [] } = req.body;
    const rollNumberIds = studentRollNumbers.length
      ? (await client.query('SELECT user_id FROM student_profiles WHERE roll_number = ANY($1::text[])', [studentRollNumbers])).rows.map((row) => row.user_id)
      : [];
    const memberIds = [...new Set([req.user.sub, ...studentIds, ...rollNumberIds])];
    if (!title || !department || memberIds.length > 4) return res.status(400).json({ success: false, message: 'Title, department, and up to four students are required' });
    await client.query('BEGIN');
    const project = await client.query('INSERT INTO projects (title, department, created_by, status) VALUES ($1, $2, $3, \'TEAM_FORMING\') RETURNING *', [title, department, req.user.sub]);
    for (const [index, studentId] of memberIds.entries()) {
      await client.query('INSERT INTO project_members (project_id, student_id, is_leader) VALUES ($1, $2, $3)', [project.rows[0].id, studentId, index === 0]);
    }
    await client.query('COMMIT');
    return res.status(201).json({ success: true, project: project.rows[0] });
  } catch (error) {
    await client.query('ROLLBACK');
    return next(error);
  } finally {
    client.release();
  }
});

app.post('/api/projects/:projectId/guide-preferences', requireAuth, requireRole('STUDENT', 'COORDINATOR'), async (req, res, next) => {
  const client = await pool.connect();
  try {
    const guideIds = Array.isArray(req.body.guideIds) ? [...new Set(req.body.guideIds)].slice(0, 3) : [];
    if (guideIds.length !== 3) return res.status(400).json({ success: false, message: 'Exactly three guide preferences are required' });
    await client.query('BEGIN');
    await client.query('DELETE FROM guide_preferences WHERE project_id = $1', [req.params.projectId]);
    for (const [index, guideId] of guideIds.entries()) {
      await client.query('INSERT INTO guide_preferences (project_id, guide_id, preference_rank, submitted_by) VALUES ($1, $2, $3, $4)', [req.params.projectId, guideId, index + 1, req.user.sub]);
    }
    await client.query('UPDATE projects SET status = \'GUIDE_ALLOCATION_PENDING\', updated_at = now() WHERE id = $1', [req.params.projectId]);
    await client.query('COMMIT');
    return res.status(201).json({ success: true, guideIds });
  } catch (error) {
    await client.query('ROLLBACK');
    return next(error);
  } finally {
    client.release();
  }
});

app.post('/api/reviews', requireAuth, requireRole('COORDINATOR'), async (req, res, next) => {
  try {
    const { projectId, scheduledStart, scheduledEnd, location, agenda } = req.body;
    if (!projectId || !scheduledStart || !scheduledEnd) return res.status(400).json({ success: false, message: 'Project and review times are required' });
    const { rows } = await pool.query(
      `INSERT INTO reviews (project_id, scheduled_start, scheduled_end, location, agenda, created_by)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [projectId, scheduledStart, scheduledEnd, location || null, agenda || null, req.user.sub]
    );
    return res.status(201).json({ success: true, review: rows[0] });
  } catch (error) {
    return next(error);
  }
});

app.post('/api/projects/:projectId/final-submission', requireAuth, upload.single('report'), async (req, res, next) => {
  try {
    if (!req.file || req.file.mimetype !== 'application/pdf') return res.status(400).json({ success: false, message: 'A PDF report is required' });
    const objectKey = path.basename(req.file.path);
    const document = await pool.query(
      `INSERT INTO documents (project_id, uploaded_by, document_type, file_name, object_key, file_url, mime_type, file_size_bytes)
       VALUES ($1, $2, 'FINAL_REPORT', $3, $4, $5, $6, $7) RETURNING id`,
      [req.params.projectId, req.user.sub, req.file.originalname, objectKey, `/uploads/${objectKey}`, req.file.mimetype, req.file.size]
    );
    const submission = await pool.query(
      `INSERT INTO final_submissions (project_id, final_document_id, submitted_by, status, submitted_at)
       VALUES ($1, $2, $3, 'SUBMITTED', now())
       ON CONFLICT (project_id) DO UPDATE SET final_document_id = EXCLUDED.final_document_id, status = 'SUBMITTED', submitted_at = now(), updated_at = now()
       RETURNING *`,
      [req.params.projectId, document.rows[0].id, req.user.sub]
    );
    return res.status(201).json({ success: true, submission: submission.rows[0] });
  } catch (error) {
    return next(error);
  }
});

app.get('/api/dashboard/summary', requireAuth, requireRole('COORDINATOR'), async (_req, res, next) => {
  try {
    const { rows } = await pool.query(`SELECT
      (SELECT COUNT(*)::int FROM projects) AS total_teams,
      (SELECT COUNT(*)::int FROM guide_allocations WHERE allocation_status = 'ALLOCATED') AS guides_allocated,
      (SELECT COUNT(*)::int FROM reviews WHERE status = 'SCHEDULED') AS reviews_pending,
      (SELECT COUNT(*)::int FROM final_submissions WHERE status = 'SUBMITTED') AS submissions_received`);
    return res.json({ success: true, summary: rows[0] });
  } catch (error) {
    return next(error);
  }
});

app.use((error, _req, res, _next) => {
  console.error(error);
  return res.status(500).json({ success: false, message: 'Internal server error' });
});

app.listen(port, () => console.log(`API listening on http://localhost:${port}`));
