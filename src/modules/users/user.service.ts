import db from "../../config/db.js";
import type{ UserRole } from "../../types/role.js";

export async function updateUserRoleService(
  userId: string,
  role: UserRole
) {
  const existing = await db.query(
    "SELECT id FROM users WHERE id = $1",
    [userId]
  );

  if ((existing.rowCount ?? 0) === 0) {
    throw new Error("User not found");
  }

  const result = await db.query(
    `
    UPDATE users
    SET role = $1
    WHERE id = $2
    RETURNING id, email, role
    `,
    [role, userId]
  );

  return result.rows[0];
}

export async function getUsersService(role?: UserRole) {
  if (role) {
    const result = await db.query(
      `
      SELECT id, email, role
      FROM users
      WHERE role = $1
      ORDER BY email
      `,
      [role]
    );
    return result.rows;
  }

  // ALL users (no role filter)
  const result = await db.query(
    `
    SELECT id, email, role
    FROM users
    ORDER BY email
    `
  );

  return result.rows;
}
