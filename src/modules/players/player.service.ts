// player.service.ts
import db from "../../config/db.js";

export async function createPlayerService(name: string) {
  const result = await db.query(
    "INSERT INTO players (name) VALUES ($1) RETURNING *",
    [name]
  );
  return result.rows[0];
}

export async function getPlayersService() {
  const result = await db.query("SELECT * FROM players ORDER BY created_at DESC");
  return result.rows;
}


// change1
export async function updatePlayerRoleService(
  playerId: string,
  isBatsman: boolean,
  isBowler: boolean,
  isWicketKeeper: boolean
) {
  const result = await db.query(
    `UPDATE players 
     SET is_batsman = $1, is_bowler = $2, is_wicket_keeper = $3
     WHERE id = $4
     RETURNING *`,
    [isBatsman, isBowler, isWicketKeeper, playerId]
  );
  
  if (result.rowCount === 0) {
    throw new Error("Player not found");
  }
  
  return result.rows[0];
}