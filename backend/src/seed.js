import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { pool } from './db.js';

const passwordHash = await bcrypt.hash('Password123!', 12);
const client = await pool.connect();

try {
  await client.query('BEGIN');
  const users = [
    { email: 'student@projecttrack.local', firstName: 'Aarav', lastName: 'Sharma', role: 'STUDENT', universityId: '2021CSE042' },
    { email: 'guide@projecttrack.local', firstName: 'Priya', lastName: 'Mehta', role: 'GUIDE', universityId: 'EMP-G-001' },
    { email: 'coordinator@projecttrack.local', firstName: 'Anita', lastName: 'Kapoor', role: 'COORDINATOR', universityId: 'EMP-C-001' },
  ];

  for (const user of users) {
    const result = await client.query(
      `INSERT INTO users (university_id, email, password_hash, first_name, last_name)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash
       RETURNING id`,
      [user.universityId, user.email, passwordHash, user.firstName, user.lastName]
    );
    await client.query(`INSERT INTO user_roles (user_id, role) VALUES ($1, $2::user_role) ON CONFLICT DO NOTHING`, [result.rows[0].id, user.role]);
    if (user.role === 'STUDENT') await client.query(`INSERT INTO student_profiles (user_id, roll_number, department) VALUES ($1, $2, 'Computer Science') ON CONFLICT (user_id) DO NOTHING`, [result.rows[0].id, user.universityId]);
    if (user.role === 'GUIDE') await client.query(`INSERT INTO guide_profiles (user_id, employee_id, department, designation) VALUES ($1, $2, 'Computer Science', 'Assistant Professor') ON CONFLICT (user_id) DO NOTHING`, [result.rows[0].id, user.universityId]);
  }
  await client.query('COMMIT');
  console.log('Seed complete. Password for all seed users: Password123!');
} catch (error) {
  await client.query('ROLLBACK');
  console.error(error);
  process.exitCode = 1;
} finally {
  client.release();
  await pool.end();
}
