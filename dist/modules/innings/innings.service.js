// innings.service.ts
import db from "../../config/db.js";
import { emitInningsSwitch } from "../../websocket/websocket.emitters.js";
export async function switchInningsService(matchId, actor) {
    await db.query("BEGIN");
    try {
        // get match and its status
        if (!matchId)
            throw new Error("Match ID required");
        // const matchRes = await db.query(
        //   `SELECT status FROM matches WHERE id=$1`,
        //   [matchId]
        // );
        // debug - fix1
        const matchRes = await db.query(`SELECT status, team_a_id, team_b_id, toss_winner_team_id, toss_decision FROM matches WHERE id=$1`, [matchId]);
        const match = matchRes.rows[0];
        const { team_a_id, team_b_id } = match;
        if (!match) {
            throw new Error("Match not found");
        }
        // STEP 87: Cannot switch innings if match completed
        if (match.status === 'COMPLETED') {
            throw new Error("Cannot switch innings for completed match");
        }
        if (match.status !== "LIVE") {
            throw new Error("Match not live");
        }
        // only ADMIN or SCORER (assigned) or CREATOR (own matches) allowed
        if (!actor)
            throw new Error("Unauthenticated");
        if (actor.role !== "ADMIN") {
            if (actor.role === "CREATOR") {
                // Check if creator owns this match
                const ownerCheck = await db.query(`SELECT 1 FROM matches WHERE id=$1 AND created_by=$2`, [matchId, actor.userId]);
                if (ownerCheck.rowCount === 0) {
                    throw new Error("Not authorized: You can only switch innings for matches you created");
                }
            }
            else if (actor.role === "SCORER") {
                // Check if scorer is assigned to this match
                const perm = await db.query(`SELECT 1 FROM match_scorers
           WHERE match_id=$1 AND user_id=$2 AND is_active=true`, [matchId, actor.userId]);
                if (perm.rowCount === 0) {
                    throw new Error("Not authorized");
                }
            }
            else {
                throw new Error("Not authorized");
            }
        }
        // get innings
        const scoreRes = await db.query(`SELECT MAX(innings) AS innings FROM scores WHERE match_id=$1`, [matchId]);
        const innings = scoreRes.rows[0].innings;
        if (!innings) {
            throw new Error("Scores not initialized");
        }
        if (innings !== 1) {
            throw new Error("Innings already switched or invalid state");
        }
        // switching both team's innings (setting 2)
        // Determine which team bats second
        const firstBattingTeamId = match.toss_decision === "BAT"
            ? match.toss_winner_team_id
            : (team_a_id === match.toss_winner_team_id ? team_b_id : team_a_id);
        const secondBattingTeamId = firstBattingTeamId === team_a_id ? team_b_id : team_a_id;
        // Create ONLY ONE row for the team batting second in innings 2
        await db.query(`INSERT INTO scores (match_id, team_id, innings)
       VALUES ($1, $2, 2)`, [matchId, secondBattingTeamId]);
        await db.query("COMMIT");
        emitInningsSwitch(matchId, 2);
    }
    catch (e) {
        await db.query("ROLLBACK");
        throw e;
    }
}
//# sourceMappingURL=innings.service.js.map