// team.service.ts
import db from "../../config/db.js";
export async function createTeamService(name) {
    const result = await db.query("INSERT INTO teams (name) VALUES ($1) RETURNING *", [name]);
    return result.rows[0];
}
export async function getTeamsService() {
    const result = await db.query("SELECT * FROM teams ORDER BY created_at DESC");
    return result.rows;
}
export async function getPlayersByTeamService(teamId) {
    const result = await db.query(`
    SELECT p.id, p.name
    FROM team_players tp
    JOIN players p ON p.id = tp.player_id
    WHERE tp.team_id = $1
      AND tp.is_active = true
    `, [teamId]);
    return result.rows;
}
export async function addPlayerToTeamService(teamId, playerId) {
    const result = await db.query(`INSERT INTO team_players (team_id, player_id)
     VALUES ($1, $2)
     RETURNING *`, [teamId, playerId]);
    return result.rows[0];
}
export async function deactivatePlayerFromTeamService(teamId, playerId) {
    const result = await db.query(`UPDATE team_players
     SET is_active = false, left_at = now()
     WHERE team_id = $1 AND player_id = $2 AND is_active = true
     RETURNING *`, [teamId, playerId]);
    return result.rows[0];
}
//# sourceMappingURL=team.service.js.map