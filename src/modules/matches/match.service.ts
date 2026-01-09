// match.service.ts
import db from "../../config/db.js";

export async function createMatchService(
  teamAId: string,
  teamBId: string,
  startTime: string,
  createdBy: string
) {
  const result = await db.query(
    `
    INSERT INTO matches (team_a_id, team_b_id, start_time, created_by)
    VALUES ($1, $2, $3, $4)
    RETURNING *
    `,
    [teamAId, teamBId, startTime, createdBy]
  );
  return result.rows[0];
}

export async function listMatchesService(page: number, limit: number) {
  const offset = (page-1)*limit;
  
  const result = await db.query(
    `SELECT * FROM matches ORDER BY created_at DESC LIMIT $1 OFFSET $2`,
    [limit, offset]
  );
  return result.rows;
}

export async function getMatchService(id: string) {
  const result = await db.query(
    `SELECT * FROM matches WHERE id = $1`,
    [id]
  );
  return result.rows[0];
}

export async function assignScorerService(
  matchId: string,
  userId: string,
  assignedBy: string
) {
  // match exists
  const match = await db.query(
    "SELECT id FROM matches WHERE id=$1",
    [matchId]
  );
  if ((match.rowCount ?? 0) === 0) {
    throw new Error("Match not found");
  }

  // user exists + role SCORER
  const user = await db.query(
    "SELECT id, role FROM users WHERE id=$1",
    [userId]
  );
  if ((user.rowCount ?? 0) === 0) {
    throw new Error("User not found");
  }
  if (user.rows[0].role !== "SCORER") {
    throw new Error("User is not a scorer");
  }

  // upsert scorer assignment
  await db.query(
    `
    INSERT INTO match_scorers (match_id, user_id, assigned_by, is_active)
    VALUES ($1, $2, $3, true)
    ON CONFLICT (match_id, user_id)
    DO UPDATE SET is_active = true, assigned_at = now()
    `,
    [matchId, userId, assignedBy]
  );

  return { message: "Scorer assigned" };
}

export async function unassignScorerService(
  matchId: string,
  userId: string
) {
  const result = await db.query(
    `
    UPDATE match_scorers
    SET is_active = false
    WHERE match_id=$1 AND user_id=$2 AND is_active=true
    `,
    [matchId, userId]
  );

  if ((result.rowCount ?? 0) === 0) {
    throw new Error("Active scorer assignment not found");
  }

  return { message: "Scorer unassigned" };
}


export async function startMatchService(matchId: string) {
  const match = await db.query(
    `SELECT status, team_a_id, team_b_id FROM matches WHERE id=$1`,
    [matchId]
  );
  if ((match.rowCount ?? 0) === 0) {
    throw new Error("Match not found");
  }
  const m = match.rows[0];
  if (m.status !== "CREATED") {
    const err: any = new Error("Match must be in CREATED state to start");
    err.statusCode = 409;
    throw err;
  }
  if (!m.team_a_id || !m.team_b_id) {
    const err: any = new Error("Both teams must be present to start the match");
    err.statusCode = 409;
    throw err;
  }
  await db.query(
    `UPDATE matches SET status='LIVE' WHERE id=$1`,
    [matchId]
  );
}

export async function completeMatchService(matchId: string) {
  const match = await db.query(
    `SELECT status FROM matches WHERE id=$1`,
    [matchId]
  );
  if ((match.rowCount ?? 0) === 0) {
    throw new Error("Match not found");
  }
  if (match.rows[0].status !== "LIVE") {
    const err: any = new Error("Match must be LIVE to complete");
    err.statusCode = 409;
    throw err;
  }
  await db.query(
    `UPDATE matches SET status='COMPLETED' WHERE id=$1`,
    [matchId]
  );
}