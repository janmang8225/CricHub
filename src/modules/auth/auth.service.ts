import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import db from "../../config/db.js";
import { env } from "../../config/env.js";

export async function signupUser(email: string, password: string) {
  const hash = await bcrypt.hash(password, 10);

  const result = await db.query(
    `INSERT INTO users (email, password_hash, role)
     VALUES ($1, $2, 'USER')
     RETURNING id`,
    [email, hash]
  );

  return jwt.sign(
    { userId: result.rows[0].id, role: result.rows[0].role },
    env.JWT_SECRET
  );
}

export async function loginUser(email: string, password: string) {
  const result = await db.query(
    `SELECT id, password_hash, role FROM users WHERE email=$1`,
    [email]
  );

  if (result.rowCount === 0) throw new Error("Invalid credentials");

  const user = result.rows[0];
  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) throw new Error("Invalid credentials");

  return jwt.sign(
    { userId: user.id, role: user.role },
    env.JWT_SECRET
  );
}
