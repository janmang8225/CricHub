// innings.service.ts
import db from "../../config/db.js";

export async function switchInningsService(matchId: any, actor: any) {
  await db.query("BEGIN");

  // get match and its status
  if (!matchId) throw new Error("Match ID required");
  const matchRes = await db.query(
    `SELECT status FROM matches WHERE id=$1`,
    [matchId]
  );
  const match = matchRes.rows[0];
  if (!match || match.status !== "LIVE") {
    throw new Error("Match not live");
  }

  // only ADMIN or SCORER allowed
  if (!actor) throw new Error("Unauthenticated");
  if (actor.role !== "ADMIN") {
    const perm = await db.query(
      `
      SELECT 1 FROM match_scorers
      WHERE match_id=$1 AND user_id=$2 AND is_active=true
      `,
      [matchId, actor.userId]
    );
    if (perm.rowCount === 0) {
      throw new Error("Not authorized");
    }
  }

  // get innings
  const scoreRes = await db.query(
    `SELECT innings FROM scores WHERE match_id=$1 LIMIT 1`,
    [matchId]
  );
  const innings = scoreRes.rows[0].innings;
  if (innings !== 1) {
    throw new Error("Innings already switched");
  }

  // switching both team's innings (setting 2)
  await db.query(
    `UPDATE scores SET innings = 2, updated_at = now() WHERE match_id=$1`,
    [matchId]
  );

  await db.query("COMMIT");
}
