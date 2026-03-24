// match.service.ts
import db from "../../config/db.js";
import { emitMatchComplete } from "../../websocket/websocket.emitters.js";
// change2 (added venue)
export async function createMatchService(teamAId, teamBId, startTime, maxOvers, createdBy, venue) {
    const result = await db.query(`
    INSERT INTO matches (team_a_id, team_b_id, start_time, max_overs, created_by, venue)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING *
    `, [teamAId, teamBId, startTime, maxOvers, createdBy, venue || null]);
    return result.rows[0];
}
// export async function listMatchesService(page: number, limit: number) {
//   const offset = (page-1)*limit;
//   const result = await db.query(
//     `SELECT * FROM matches ORDER BY created_at DESC LIMIT $1 OFFSET $2`,
//     [limit, offset]
//   );
//   return result.rows;
// }
export async function listMatchesService(page, limit) {
    const offset = (page - 1) * limit;
    // combined query = 3 joins
    const result = await db.query(`SELECT 
      m.*,
      -- Team A details
      ta.id as team_a_id,
      ta.name as team_a_name,
      s1.runs as team_a_runs,
      s1.wickets as team_a_wickets,
      s1.overs as team_a_overs,
      -- Team B details
      tb.id as team_b_id,
      tb.name as team_b_name,
      s2.runs as team_b_runs,
      s2.wickets as team_b_wickets,
      s2.overs as team_b_overs
    FROM matches m
    LEFT JOIN teams ta ON m.team_a_id = ta.id
    LEFT JOIN teams tb ON m.team_b_id = tb.id
    LEFT JOIN scores s1 ON m.id = s1.match_id AND s1.team_id = m.team_a_id
    LEFT JOIN scores s2 ON m.id = s2.match_id AND s2.team_id = m.team_b_id
    ORDER BY m.created_at DESC 
    LIMIT $1 OFFSET $2`, [limit, offset]);
    return result.rows;
}
// export async function getMatchService(id: string) {
//   const result = await db.query(
//     `SELECT * FROM matches WHERE id = $1`,
//     [id]
//   );
//   return result.rows[0];
// }
export async function getMatchService(id) {
    const result = await db.query(`SELECT 
      m.*,
      -- Team A details
      ta.id as team_a_id,
      ta.name as team_a_name,
      s1.runs as team_a_runs,
      s1.wickets as team_a_wickets,
      s1.overs as team_a_overs,
      -- Team B details
      tb.id as team_b_id,
      tb.name as team_b_name,
      s2.runs as team_b_runs,
      s2.wickets as team_b_wickets,
      s2.overs as team_b_overs
    FROM matches m
    LEFT JOIN teams ta ON m.team_a_id = ta.id
    LEFT JOIN teams tb ON m.team_b_id = tb.id
    LEFT JOIN scores s1 ON m.id = s1.match_id AND s1.team_id = m.team_a_id
    LEFT JOIN scores s2 ON m.id = s2.match_id AND s2.team_id = m.team_b_id
    WHERE m.id = $1`, [id]);
    return result.rows[0];
}
export async function assignScorerService(matchId, userId, assignedBy, actorRole, actorUserId) {
    // match exists
    const match = await db.query("SELECT id, created_by FROM matches WHERE id=$1", [matchId]);
    if ((match.rowCount ?? 0) === 0) {
        throw new Error("Match not found");
    }
    // Ownership check for CREATOR role
    if (actorRole === "CREATOR" && match.rows[0].created_by !== actorUserId) {
        const err = new Error("You can only assign scorers to matches you created");
        err.statusCode = 403;
        throw err;
    }
    // user exists + role SCORER
    const user = await db.query("SELECT id, role FROM users WHERE id=$1", [userId]);
    if ((user.rowCount ?? 0) === 0) {
        throw new Error("User not found");
    }
    if (user.rows[0].role !== "SCORER") {
        throw new Error("User is not a scorer");
    }
    // upsert scorer assignment
    await db.query(`
    INSERT INTO match_scorers (match_id, user_id, assigned_by, is_active)
    VALUES ($1, $2, $3, true)
    ON CONFLICT (match_id, user_id)
    DO UPDATE SET is_active = true, assigned_at = now()
    `, [matchId, userId, assignedBy]);
    return { message: "Scorer assigned" };
}
export async function unassignScorerService(matchId, userId, actorRole, actorUserId) {
    // Check match exists and get creator
    const match = await db.query("SELECT id, created_by FROM matches WHERE id=$1", [matchId]);
    if ((match.rowCount ?? 0) === 0) {
        throw new Error("Match not found");
    }
    // Ownership check for CREATOR role
    if (actorRole === "CREATOR" && match.rows[0].created_by !== actorUserId) {
        const err = new Error("You can only unassign scorers from matches you created");
        err.statusCode = 403;
        throw err;
    }
    const result = await db.query(`
    UPDATE match_scorers
    SET is_active = false
    WHERE match_id=$1 AND user_id=$2 AND is_active=true
    `, [matchId, userId]);
    if ((result.rowCount ?? 0) === 0) {
        throw new Error("Active scorer assignment not found");
    }
    return { message: "Scorer unassigned" };
}
export async function startMatchService(matchId) {
    const match = await db.query(`SELECT status, team_a_id, team_b_id FROM matches WHERE id=$1`, [matchId]);
    if ((match.rowCount ?? 0) === 0) {
        throw new Error("Match not found");
    }
    const m = match.rows[0];
    if (m.status !== "CREATED") {
        const err = new Error("Match must be in CREATED state to start");
        err.statusCode = 409;
        throw err;
    }
    if (!m.team_a_id || !m.team_b_id) {
        const err = new Error("Both teams must be present to start the match");
        err.statusCode = 409;
        throw err;
    }
    await db.query(`UPDATE matches SET status='LIVE' WHERE id=$1`, [matchId]);
}
export async function completeMatchService(matchId) {
    await db.query("BEGIN");
    try {
        const match = await db.query(`SELECT status, team_a_id, team_b_id, toss_winner_team_id, toss_decision 
       FROM matches WHERE id=$1`, [matchId]);
        if (match.rowCount === 0) {
            throw new Error("Match not found");
        }
        const m = match.rows[0];
        if (m.status !== "LIVE") {
            const err = new Error("Match must be LIVE to complete");
            err.statusCode = 409;
            throw err;
        }
        // Get both teams' scores
        const bothScoresRes = await db.query(`SELECT team_id, runs, wickets, innings 
       FROM scores 
       WHERE match_id=$1
       ORDER BY innings, team_id`, [matchId]);
        const scores = bothScoresRes.rows;
        if (scores.length < 2) {
            throw new Error("Both teams must have scores to complete match");
        }
        // Find scores for each team and innings
        const teamAScore1 = scores.find(s => s.team_id === m.team_a_id && s.innings === 1);
        const teamBScore1 = scores.find(s => s.team_id === m.team_b_id && s.innings === 1);
        const teamAScore2 = scores.find(s => s.team_id === m.team_a_id && s.innings === 2);
        const teamBScore2 = scores.find(s => s.team_id === m.team_b_id && s.innings === 2);
        // Determine which team batted first
        const firstInningsBattingTeamId = m.toss_decision === "BAT"
            ? m.toss_winner_team_id
            : (m.team_a_id === m.toss_winner_team_id
                ? m.team_b_id
                : m.team_a_id);
        const secondInningsBattingTeamId = firstInningsBattingTeamId === m.team_a_id
            ? m.team_b_id
            : m.team_a_id;
        // Get runs for each team
        const firstInningsRuns = firstInningsBattingTeamId === m.team_a_id
            ? teamAScore1?.runs || 0
            : teamBScore1?.runs || 0;
        const secondInningsRuns = secondInningsBattingTeamId === m.team_a_id
            ? (teamAScore2?.runs || 0)
            : (teamBScore2?.runs || 0);
        const secondInningsWickets = secondInningsBattingTeamId === m.team_a_id
            ? (teamAScore2?.wickets || 0)
            : (teamBScore2?.wickets || 0);
        let winnerTeamId = null;
        let resultMethod = null;
        let resultMargin = 0;
        let result = 'WIN';
        // Determine winner and result
        if (secondInningsRuns > firstInningsRuns) {
            // Team batting second won by wickets
            winnerTeamId = secondInningsBattingTeamId;
            resultMethod = 'WICKETS';
            resultMargin = 10 - secondInningsWickets;
        }
        else if (secondInningsRuns < firstInningsRuns) {
            // Team batting first won by runs
            winnerTeamId = firstInningsBattingTeamId;
            resultMethod = 'RUNS';
            resultMargin = firstInningsRuns - secondInningsRuns;
        }
        else {
            // Tie
            result = 'TIE';
            resultMethod = 'TIE';
            winnerTeamId = null;
            resultMargin = 0;
        }
        await db.query(`UPDATE matches
       SET status = 'COMPLETED',
           result = $1,
           winner_team_id = $2,
           result_method = $3,
           result_margin = $4
       WHERE id = $5`, [result, winnerTeamId, resultMethod, resultMargin, matchId]);
        await db.query("COMMIT");
        emitMatchComplete(matchId, result, winnerTeamId, resultMethod, resultMargin);
        return {
            result,
            winnerTeamId,
            resultMethod,
            resultMargin
        };
    }
    catch (e) {
        await db.query("ROLLBACK");
        throw e;
    }
}
// change2
export async function getPlayingXIService(matchId) {
    const result = await db.query(`SELECT 
      mxi.team_id,
      t.name as team_name,
      mxi.player_id,
      p.name as player_name,
      mxi.is_captain,
      mxi.is_vice_captain,
      mxi.is_wicket_keeper,
      mxi.is_substitute,
      p.is_batsman,
      p.is_bowler,
      p.is_wicket_keeper as player_is_keeper
    FROM match_playing_xi mxi
    JOIN teams t ON mxi.team_id = t.id
    JOIN players p ON mxi.player_id = p.id
    WHERE mxi.match_id = $1
    ORDER BY mxi.team_id, mxi.is_captain DESC, mxi.is_vice_captain DESC`, [matchId]);
    if (result.rowCount === 0) {
        return { teamA: null, teamB: null };
    }
    const rows = result.rows;
    const teamAId = rows[0].team_id;
    const teamBId = rows.find(r => r.team_id !== teamAId)?.team_id;
    const teamAPlayers = rows.filter(r => r.team_id === teamAId).map(r => ({
        id: r.player_id,
        name: r.player_name,
        isCaptain: r.is_captain,
        isViceCaptain: r.is_vice_captain,
        isWicketKeeper: r.is_wicket_keeper,
        isSubstitute: r.is_substitute,
        isBatsman: r.is_batsman,
        isBowler: r.is_bowler,
    }));
    const teamBPlayers = teamBId ? rows.filter(r => r.team_id === teamBId).map(r => ({
        id: r.player_id,
        name: r.player_name,
        isCaptain: r.is_captain,
        isViceCaptain: r.is_vice_captain,
        isWicketKeeper: r.is_wicket_keeper,
        isSubstitute: r.is_substitute,
        isBatsman: r.is_batsman,
        isBowler: r.is_bowler,
    })) : [];
    return {
        teamA: {
            id: teamAId,
            name: rows[0].team_name,
            players: teamAPlayers,
        },
        teamB: teamBId ? {
            id: teamBId,
            name: rows.find(r => r.team_id === teamBId).team_name,
            players: teamBPlayers,
        } : null,
    };
}
// change1
export async function setPlayingXIService(matchId, teamId, players) {
    await db.query("BEGIN");
    try {
        // Validate match exists and belongs to team
        const match = await db.query(`SELECT team_a_id, team_b_id FROM matches WHERE id = $1`, [matchId]);
        if (match.rowCount === 0) {
            throw new Error("Match not found");
        }
        const m = match.rows[0];
        if (teamId !== m.team_a_id && teamId !== m.team_b_id) {
            throw new Error("Team not part of this match");
        }
        // Validate exactly one captain, one vice-captain, one wicket-keeper
        const captains = players.filter(p => p.isCaptain);
        const viceCaptains = players.filter(p => p.isViceCaptain);
        const keepers = players.filter(p => p.isWicketKeeper);
        if (captains.length !== 1) {
            throw new Error("Exactly one captain required");
        }
        if (viceCaptains.length !== 1) {
            throw new Error("Exactly one vice-captain required");
        }
        if (keepers.length !== 1) {
            throw new Error("Exactly one wicket-keeper required");
        }
        // Validate all players belong to the team
        const playerIds = players.map(p => p.playerId);
        const teamPlayers = await db.query(`SELECT player_id FROM team_players 
       WHERE team_id = $1 AND player_id = ANY($2) AND is_active = true`, [teamId, playerIds]);
        if (teamPlayers.rowCount !== 11) {
            throw new Error("All players must belong to the team and be active");
        }
        // Delete existing playing XI for this match-team combo
        await db.query(`DELETE FROM match_playing_xi WHERE match_id = $1 AND team_id = $2`, [matchId, teamId]);
        // Insert all 11 players
        for (const p of players) {
            await db.query(`INSERT INTO match_playing_xi 
         (match_id, team_id, player_id, is_captain, is_vice_captain, is_wicket_keeper, is_substitute)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`, [matchId, teamId, p.playerId, p.isCaptain, p.isViceCaptain, p.isWicketKeeper, p.isSubstitute]);
        }
        await db.query("COMMIT");
    }
    catch (e) {
        await db.query("ROLLBACK");
        throw e;
    }
}
// response format for get-playing-xi
/*
{
  "teamA": {
    "id": "uuid",
    "name": "Team A",
    "players": [
      {
        "id": "uuid",
        "name": "Player Name",
        "isCaptain": true,
        "isViceCaptain": false,
        "isWicketKeeper": false,
        "isSubstitute": false,
        "isBatsman": true,
        "isBowler": false
      }
    ]
  },
  "teamB": { same }
}
*/
// change2
export async function listMyMatchesService(userId, role, page, limit) {
    const offset = (page - 1) * limit;
    let whereClause = '';
    let params = [limit, offset];
    if (role === 'CREATOR') {
        // CREATOR can only see their own matches
        whereClause = 'WHERE m.created_by = $3';
        params.push(userId);
    }
    // ADMIN sees all matches (no WHERE clause)
    const result = await db.query(`SELECT 
      m.*,
      -- Team A details
      ta.id as team_a_id,
      ta.name as team_a_name,
      s1.runs as team_a_runs,
      s1.wickets as team_a_wickets,
      s1.overs as team_a_overs,
      -- Team B details
      tb.id as team_b_id,
      tb.name as team_b_name,
      s2.runs as team_b_runs,
      s2.wickets as team_b_wickets,
      s2.overs as team_b_overs
    FROM matches m
    LEFT JOIN teams ta ON m.team_a_id = ta.id
    LEFT JOIN teams tb ON m.team_b_id = tb.id
    LEFT JOIN scores s1 ON m.id = s1.match_id AND s1.team_id = m.team_a_id
    LEFT JOIN scores s2 ON m.id = s2.match_id AND s2.team_id = m.team_b_id
    ${whereClause}
    ORDER BY m.created_at DESC 
    LIMIT $1 OFFSET $2`, params);
    return result.rows;
}
//# sourceMappingURL=match.service.js.map