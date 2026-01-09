// player.service.ts
import db from "../../config/db.js";
export async function createPlayerService(name) {
    const result = await db.query("INSERT INTO players (name) VALUES ($1) RETURNING *", [name]);
    return result.rows[0];
}
export async function getPlayersService() {
    const result = await db.query("SELECT * FROM players ORDER BY created_at DESC");
    return result.rows;
}
//# sourceMappingURL=player.service.js.map