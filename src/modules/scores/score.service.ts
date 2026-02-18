// score.service.ts
import db from "../../config/db.js";
import { emitBatsmanChange, emitBowlerChange } from "../../websocket/websocket.emitters.js";

export async function initScoresService(matchId: string) {
  // match must exist and have toss completed
  const matchRes = await db.query(
    "SELECT team_a_id, team_b_id, status, toss_winner_team_id, toss_decision FROM matches WHERE id=$1",
    [matchId]
  );
  if (matchRes.rowCount === 0) throw new Error("Match not found");

  const { team_a_id, team_b_id, toss_winner_team_id, toss_decision } = matchRes.rows[0];
  if (!team_a_id || !team_b_id) {
    throw new Error("Both teams must be set before initializing scores");
  }

  if (!toss_winner_team_id || !toss_decision) {
    throw new Error("Toss must be completed before initializing scores");
  }

  // prevent double init
  const existing = await db.query(
    "SELECT 1 FROM scores WHERE match_id=$1",
    [matchId]
  );

  if (existing.rowCount !== null && existing.rowCount > 0) {
    throw new Error("Scores already initialized");
  }

  // Determine which team bats first
  const firstBattingTeamId =
    toss_decision === "BAT"
      ? toss_winner_team_id
      : (team_a_id === toss_winner_team_id ? team_b_id : team_a_id);

  // Create ONLY ONE row for the team batting first in innings 1
  await db.query(
    `INSERT INTO scores (match_id, team_id, innings)
     VALUES ($1, $2, 1)`,
    [matchId, firstBattingTeamId]
  );

  return { message: "Scores initialized" };
}

export async function updateScoreService(
  matchId: string,
  teamId: string,
  runs?: number,
  wickets?: number,
  overs?: number,
  actor?: { userId: string; role: string }
) {
  if (!actor) throw new Error("Unauthorized");

  if (
    (runs !== undefined && (typeof runs !== "number" || runs < 0)) ||
    (wickets !== undefined && (typeof wickets !== "number" || wickets < 0)) ||
    (overs !== undefined && (typeof overs !== "number" || overs < 0))
  ) {
    throw new Error("Invalid score values");
  }

  await db.query("BEGIN");

  try {
    // match must be LIVE
    const m = await db.query(
      "SELECT status FROM matches WHERE id=$1",
      [matchId]
    );
    
    if ((m.rowCount ?? 0) === 0) {
      const err: any = new Error("Match not found");
      err.statusCode = 404;
      throw err;
    }

    // STEP 87-88: Completed match is read-only
    if (m.rows[0].status === 'COMPLETED') {
      const err: any = new Error("Cannot update scores for completed match");
      err.statusCode = 403;
      throw err;
    }

    if (m.rows[0].status !== "LIVE") {
      throw new Error("Cannot update score unless match is LIVE");
    }

    // team must belong to match
    const belongs = await db.query(
      `
      SELECT 1 FROM scores
      WHERE match_id=$1 AND team_id=$2
      `,
      [matchId, teamId]
    );
    if (belongs.rowCount === 0) {
      throw new Error("Team does not belong to this match");
    }

    // permission check (ADMIN OR assigned SCORER OR match CREATOR)
    const perm = await db.query(
      `
      SELECT 1
      FROM scores s
      LEFT JOIN match_scorers ms
        ON ms.match_id = s.match_id
        AND ms.user_id = $2
        AND ms.is_active = true
      LEFT JOIN matches m
        ON m.id = s.match_id
      WHERE s.match_id = $1
        AND (
          $3 = 'ADMIN'
          OR ($3 = 'SCORER' AND ms.user_id IS NOT NULL)
          OR ($3 = 'CREATOR' AND m.created_by = $2)
        )
      LIMIT 1
      `,
      [matchId, actor.userId, actor.role]
    );

    if ((perm.rowCount ?? 0) === 0) {
      throw new Error("Forbidden");
    }

    const result = await db.query(
      `
      UPDATE scores
      SET
        runs = COALESCE($3, runs),
        wickets = COALESCE($4, wickets),
        overs = COALESCE($5, overs),
        updated_at = now()
      WHERE match_id=$1 AND team_id=$2
      RETURNING *
      `,
      [matchId, teamId, runs, wickets, overs]
    );

    await db.query("COMMIT");
    return result.rows[0];
  } catch (e) {
    await db.query("ROLLBACK");
    throw e;
  }

}

export async function getScoreService(matchId: string) {
  const result = await db.query(
    `
    SELECT team_id, runs, wickets, overs, innings
    FROM scores
    WHERE match_id=$1
    ORDER BY innings DESC
    `,
    [matchId]
  ); // check (updated is_batting with innings)
  return result.rows;
}

export async function getCurrentInningService(matchId: string) {
  const result = await db.query(
    `SELECT team_id, MAX(innings) AS innings 
     FROM scores 
     WHERE match_id=$1
     GROUP BY team_id`,
    [matchId]
  );

  // return array of { team_id, innings }
  return result.rows;
}



export async function startMatchService(
  matchId: string,
  tossWinnerTeamId: string,
  tossDecision: "BAT" | "BOWL"
) {
  // match must exist + CREATED
  const m = await db.query(
    "SELECT status, team_a_id, team_b_id FROM matches WHERE id=$1",
    [matchId]
  );
  if (m.rowCount === 0) throw new Error("Match not found");
  if (m.rows[0].status !== "CREATED") throw new Error("Match not in CREATED state");

  // toss winner must be one of the teams
  if (![m.rows[0].team_a_id, m.rows[0].team_b_id].includes(tossWinnerTeamId)) {
    throw new Error("Invalid toss winner");
  }

  await db.query(
    `
    UPDATE matches
    SET
      toss_winner_team_id = $1,
      toss_decision = $2,
      status = 'LIVE'
    WHERE id = $3
    `,
    [tossWinnerTeamId, tossDecision, matchId]
  );
}


export async function getBattingStateService(matchId: string) {
  /* ---------------- Match + toss validation ---------------- */
  const matchRes = await db.query(
    `
    SELECT team_a_id, team_b_id,
           toss_winner_team_id, toss_decision,
           status
    FROM matches
    WHERE id=$1
    `,
    [matchId]
  );

  if (matchRes.rowCount === 0) throw new Error("Match not found");

  const match = matchRes.rows[0];
  if (match.status !== "LIVE") throw new Error("Match not live");

  if (!match.toss_winner_team_id || !match.toss_decision) {
    throw new Error("Toss not completed");
  }

  /* ---------------- Current innings ---------------- */
  const inningRes = await db.query(
    `
    SELECT MAX(innings) AS innings
    FROM scores
    WHERE match_id=$1
    `,
    [matchId]
  );

  const innings = inningRes.rows[0].innings;
  if (!innings) throw new Error("Scores not initialized");

  /* ---------------- Batting / bowling team ---------------- */
  const battingTeamId =
    innings === 1
      ? (match.toss_decision === "BAT"
          ? match.toss_winner_team_id
          : (match.team_a_id === match.toss_winner_team_id
              ? match.team_b_id
              : match.team_a_id))
      : (match.toss_decision === "BAT"
          ? (match.team_a_id === match.toss_winner_team_id
              ? match.team_b_id
              : match.team_a_id)
          : match.toss_winner_team_id);

  const bowlingTeamId =
    battingTeamId === match.team_a_id
      ? match.team_b_id
      : match.team_a_id;

  /* ---------------- Last ball ---------------- */
  const lastBallRes = await db.query(
    `
    SELECT striker_id, non_striker_id, over, ball, is_wicket
    FROM balls
    WHERE match_id=$1 AND innings=$2
    ORDER BY over DESC, ball DESC
    LIMIT 1
    `,
    [matchId, innings]
  );

  let strikerId: string | null = null;
  let nonStrikerId: string | null = null;
  let currentOver = 0;
  let nextBall = 1;

  if (lastBallRes.rowCount === 0) {
    /* -------- Opening batsmen -------- */
    const openers = await db.query(
      `
      SELECT p.id
      FROM team_players tp
      JOIN players p ON p.id = tp.player_id
      WHERE tp.team_id=$1 AND tp.is_active=true
      ORDER BY tp.joined_at
      LIMIT 2
      `,
      [battingTeamId]
    );

    if(openers.rowCount == null || openers.rowCount<2) {
      throw new Error("Not enough players to bat");
    }
    // if (openers.rowCount < 2) {
    //   throw new Error("Not enough players to bat");
    // }

    strikerId = openers.rows[0].id;
    nonStrikerId = openers.rows[1].id;
  } else {
    const last = lastBallRes.rows[0];
    strikerId = last.striker_id;
    nonStrikerId = last.non_striker_id;
    currentOver = last.over;
    nextBall = last.ball + 1;

    if (nextBall > 6) {
      nextBall = 1;
      currentOver += 1;
      // end of over → swap
      [strikerId, nonStrikerId] = [nonStrikerId, strikerId];
    }
  }

  /* ---------------- Remaining batsmen ---------------- */
  const remainingRes = await db.query(
    `
    SELECT p.id
    FROM team_players tp
    JOIN players p ON p.id = tp.player_id
    WHERE tp.team_id=$1
      AND tp.is_active=true
      AND p.id NOT IN (
        SELECT dismissed_player_id
        FROM balls
        WHERE match_id=$2 AND innings=$3 AND dismissed_player_id IS NOT NULL
      )
    `,
    [battingTeamId, matchId, innings]
  );

  return {
    innings,
    battingTeamId,
    bowlingTeamId,
    strikerId,
    nonStrikerId,
    nextBatsmen: remainingRes.rows.map(r => r.id),
    currentOver,
    nextBall
  };
}

export async function setOpenersService(
  matchId: string,
  strikerId: string,
  nonStrikerId: string
) {
  if (strikerId === nonStrikerId) {
    throw new Error("Openers must be different");
  }

  // change1 (updating setOpenerService)
  await db.query("BEGIN");
  
  try {
    // Check match status
    const matchCheck = await db.query(
      `SELECT status FROM matches WHERE id=$1`,
      [matchId]
    );
    
    if (matchCheck.rowCount === 0) throw new Error("Match not found");
    
    if (matchCheck.rows[0].status === 'COMPLETED') {
      throw new Error("Cannot update completed match");
    }
    
    if (matchCheck.rows[0].status !== 'LIVE') {
      throw new Error("Match must be LIVE");
    }

    // ...
    const inningRes = await db.query(
      `SELECT MAX(innings) AS innings FROM scores WHERE match_id=$1`,
      [matchId]
    );
    const innings = inningRes.rows[0].innings;
    if (!innings) throw new Error("Scores not initialized");

    // prevent re-setting
    const exists = await db.query(
      `SELECT 1 FROM batting_state WHERE match_id=$1 AND innings=$2`,
      [matchId, innings]
    );
    if (exists.rowCount !== null && exists.rowCount > 0) {
      throw new Error("Openers already set");
    }

    // Get batting team
    const matchRes = await db.query(
      `SELECT team_a_id, team_b_id, toss_winner_team_id, toss_decision
       FROM matches WHERE id=$1`,
      [matchId]
    );
    
    if (matchRes.rowCount === 0) throw new Error("Match not found");
    
    const match = matchRes.rows[0];
    const battingTeamId =
      innings === 1
        ? (match.toss_decision === "BAT"
            ? match.toss_winner_team_id
            : (match.team_a_id === match.toss_winner_team_id
                ? match.team_b_id
                : match.team_a_id))
        : (match.toss_decision === "BAT"
            ? (match.team_a_id === match.toss_winner_team_id
                ? match.team_b_id
                : match.team_a_id)
            : match.toss_winner_team_id);

    // Validate both players belong to batting team
    const playerCheck = await db.query(
      `SELECT player_id FROM team_players 
       WHERE team_id = $1 AND player_id = ANY($2) AND is_active = true`,
      [battingTeamId, [strikerId, nonStrikerId]]
    );
    
    if (playerCheck.rowCount !== 2) {
      throw new Error("Both openers must belong to batting team and be active");
    }

    // Set batting state
    await db.query(
      `INSERT INTO batting_state (match_id, innings, striker_id, non_striker_id)
       VALUES ($1, $2, $3, $4)`,
      [matchId, innings, strikerId, nonStrikerId]
    );

    // Initialize batting stats for striker
    await db.query(
      `INSERT INTO match_batting_stats (match_id, player_id, team_id, runs, balls, fours, sixes, is_out)
       VALUES ($1, $2, $3, 0, 0, 0, 0, false)
       ON CONFLICT (match_id, player_id) DO NOTHING`,
      [matchId, strikerId, battingTeamId]
    );

    // Initialize batting stats for non-striker
    await db.query(
      `INSERT INTO match_batting_stats (match_id, player_id, team_id, runs, balls, fours, sixes, is_out)
       VALUES ($1, $2, $3, 0, 0, 0, 0, false)
       ON CONFLICT (match_id, player_id) DO NOTHING`,
      [matchId, nonStrikerId, battingTeamId]
    );

    await db.query("COMMIT");
    emitBatsmanChange(matchId, strikerId, 'STRIKER');
    emitBatsmanChange(matchId, nonStrikerId, 'NON_STRIKER');

  } catch (e) {
    await db.query("ROLLBACK");
    throw e;
  }
}

export async function setNextBatsmanService(
  matchId: string,
  newBatsmanId: string
) {
  
  // change1
  await db.query("BEGIN");
  
  try {
    // Check match status
    const matchCheck = await db.query(
      `SELECT status FROM matches WHERE id=$1`,
      [matchId]
    );
    
    if (matchCheck.rowCount === 0) throw new Error("Match not found");
    
    if (matchCheck.rows[0].status === 'COMPLETED') {
      throw new Error("Cannot update completed match");
    }
    
    if (matchCheck.rows[0].status !== 'LIVE') {
      throw new Error("Match must be LIVE");
    }

    // ...
    const inningRes = await db.query(
      `SELECT MAX(innings) AS innings FROM scores WHERE match_id=$1`,
      [matchId]
    );
    const innings = inningRes.rows[0].innings;
    if (!innings) throw new Error("Invalid innings");

    // Get batting team
    const matchRes = await db.query(
      `SELECT team_a_id, team_b_id, toss_winner_team_id, toss_decision
       FROM matches WHERE id=$1`,
      [matchId]
    );
    
    if (matchRes.rowCount === 0) throw new Error("Match not found");
    
    const match = matchRes.rows[0];
    const battingTeamId =
      innings === 1
        ? (match.toss_decision === "BAT"
            ? match.toss_winner_team_id
            : (match.team_a_id === match.toss_winner_team_id
                ? match.team_b_id
                : match.team_a_id))
        : (match.toss_decision === "BAT"
            ? (match.team_a_id === match.toss_winner_team_id
                ? match.team_b_id
                : match.team_a_id)
            : match.toss_winner_team_id);

    // Validate new batsman belongs to batting team
    const playerCheck = await db.query(
      `SELECT 1 FROM team_players 
       WHERE team_id = $1 AND player_id = $2 AND is_active = true`,
      [battingTeamId, newBatsmanId]
    );
    
    if (playerCheck.rowCount === 0) {
      throw new Error("New batsman must belong to batting team and be active");
    }

    // replace striker only (dismissed batsman)
    await db.query(
      `UPDATE batting_state
       SET striker_id = $1, updated_at = now()
       WHERE match_id=$2 AND innings=$3`,
      [newBatsmanId, matchId, innings]
    );

    // Initialize batting stats for new batsman
    await db.query(
      `INSERT INTO match_batting_stats (match_id, player_id, team_id, runs, balls, fours, sixes, is_out)
       VALUES ($1, $2, $3, 0, 0, 0, 0, false)
       ON CONFLICT (match_id, player_id) DO NOTHING`,
      [matchId, newBatsmanId, battingTeamId]
    );

    await db.query("COMMIT");
    emitBatsmanChange(matchId, newBatsmanId, 'STRIKER');
  } catch (e) {
    await db.query("ROLLBACK");
    throw e;
  }
}

export async function setBowlerService(
  matchId: string,
  over: number,
  bowlerId: string
) {
  // change1
  await db.query("BEGIN");

  try {
    // Check match status
    const matchCheck = await db.query(
      `SELECT status FROM matches WHERE id=$1`,
      [matchId]
    );
    
    if (matchCheck.rowCount === 0) throw new Error("Match not found");
    
    if (matchCheck.rows[0].status === 'COMPLETED') {
      throw new Error("Cannot update completed match");
    }
    
    if (matchCheck.rows[0].status !== 'LIVE') {
      throw new Error("Match must be LIVE");
    }

    // ...
    // get match + innings
    const matchRes = await db.query(
      `SELECT m.team_a_id, m.team_b_id,
              m.toss_winner_team_id, m.toss_decision,
              m.status,
              COALESCE(MAX(s.innings), 1) as innings
       FROM matches m
       LEFT JOIN scores s ON s.match_id = m.id
       WHERE m.id=$1
       GROUP BY m.id`,
      [matchId]
    );

    if (matchRes.rowCount === 0) throw new Error("Match not found");
    const m = matchRes.rows[0];

    if (m.status !== "LIVE") throw new Error("Match not live");

    // derive batting / bowling team
    const battingTeamId =
      m.innings === 1
        ? (m.toss_decision === "BAT"
            ? m.toss_winner_team_id
            : (m.team_a_id === m.toss_winner_team_id
                ? m.team_b_id
                : m.team_a_id))
        : (m.toss_decision === "BAT"
            ? (m.team_a_id === m.toss_winner_team_id
                ? m.team_b_id
                : m.team_a_id)
            : m.toss_winner_team_id);

    const bowlingTeamId =
      battingTeamId === m.team_a_id ? m.team_b_id : m.team_a_id;

    // validate bowler belongs to bowling team
    const player = await db.query(
      `SELECT 1 FROM team_players WHERE player_id=$1 AND team_id=$2 AND is_active=true`,
      [bowlerId, bowlingTeamId]
    );
    if (player.rowCount === 0) {
      throw new Error("Bowler not from bowling team or not active");
    }

    // prevent overwrite
    const exists = await db.query(
      `SELECT 1 FROM over_state
       WHERE match_id=$1 AND innings=$2 AND over=$3`,
      [matchId, m.innings, over]
    );
    if (exists.rowCount !== null && exists.rowCount > 0) {
      throw new Error("Bowler already set for this over");
    }

    // insert over_state
    await db.query(
      `INSERT INTO over_state (match_id, innings, over, bowler_id)
       VALUES ($1,$2,$3,$4)`,
      [matchId, m.innings, over, bowlerId]
    );

    // Initialize bowling stats for bowler
    await db.query(
      `INSERT INTO match_bowling_stats (match_id, player_id, team_id, balls, runs_conceded, wickets, wides, no_balls)
       VALUES ($1, $2, $3, 0, 0, 0, 0, 0)
       ON CONFLICT (match_id, player_id) DO NOTHING`,
      [matchId, bowlerId, bowlingTeamId]
    );

    await db.query("COMMIT");
    emitBowlerChange(matchId, bowlerId, over);
    
  } catch (e) {
    await db.query("ROLLBACK");
    throw e;
  }
}

export async function updateStrikeService(
  matchId: string,
  strikerId: string,
  nonStrikerId: string
) {
  if (strikerId === nonStrikerId) {
    throw new Error("Striker and non-striker must be different");
  }

  await db.query("BEGIN");

  try {
    // Check match status
    const matchCheck = await db.query(
      `SELECT status FROM matches WHERE id=$1`,
      [matchId]
    );
    
    if (matchCheck.rowCount === 0) throw new Error("Match not found");
    
    if (matchCheck.rows[0].status === 'COMPLETED') {
      throw new Error("Cannot update completed match");
    }
    
    if (matchCheck.rows[0].status !== 'LIVE') {
      throw new Error("Match must be LIVE");
    }

    // ...
    const inningRes = await db.query(
      `SELECT MAX(innings) AS innings FROM scores WHERE match_id=$1`,
      [matchId]
    );
    const innings = inningRes.rows[0].innings;
    if (!innings) throw new Error("Scores not initialized");

    // update batting_state with new striker/non-striker
    const res = await db.query(
      `
      UPDATE batting_state
      SET striker_id = $1,
          non_striker_id = $2,
          updated_at = now()
      WHERE match_id=$3 AND innings=$4
      RETURNING *
      `,
      [strikerId, nonStrikerId, matchId, innings]
    );

    if (res.rowCount === 0) {
      throw new Error("Batting state not found for this innings");
    }

    await db.query("COMMIT");
    return res.rows[0];
  } catch (e) {
    await db.query("ROLLBACK");
    throw e;
  }

}


// change1
export async function completeOverManuallyService(
  matchId: string,
  over: number
) {
  const inningRes = await db.query(
    `SELECT MAX(innings) AS innings FROM scores WHERE match_id=$1`,
    [matchId]
  );
  const innings = inningRes.rows[0].innings;
  if (!innings) throw new Error("Scores not initialized");

  // Check if summary already exists
  const exists = await db.query(
    `SELECT 1 FROM over_summary WHERE match_id=$1 AND innings=$2 AND over=$3`,
    [matchId, innings, over]
  );
  
  if (exists.rowCount !== null && exists.rowCount > 0) {
    throw new Error("Over summary already exists");
  }

  // Calculate stats for this over
  const overStatsRes = await db.query(
    `SELECT 
       SUM(runs_off_bat + extra_runs) as runs,
       COUNT(CASE WHEN is_wicket = true THEN 1 END) as wickets,
       SUM(extra_runs) as extras
     FROM balls
     WHERE match_id=$1 AND innings=$2 AND over=$3`,
    [matchId, innings, over]
  );

  const overStats = overStatsRes.rows[0];

  if (!overStats.runs) {
    throw new Error("No balls found for this over");
  }

  await db.query(
    `INSERT INTO over_summary 
     (match_id, innings, over, runs, wickets, extras, completed_at)
     VALUES ($1, $2, $3, $4, $5, $6, now())`,
    [
      matchId,
      innings,
      over,
      parseInt(overStats.runs) || 0,
      parseInt(overStats.wickets) || 0,
      parseInt(overStats.extras) || 0
    ]
  );
}

export async function declareInningsService(matchId: string) {
  await db.query("BEGIN");

  try {
    // Check match status
    const matchCheck = await db.query(
      `SELECT status FROM matches WHERE id=$1`,
      [matchId]
    );
    
    if (matchCheck.rowCount === 0) throw new Error("Match not found");
    
    if (matchCheck.rows[0].status === 'COMPLETED') {
      throw new Error("Cannot declare innings for completed match");
    }
    
    if (matchCheck.rows[0].status !== 'LIVE') {
      throw new Error("Match must be LIVE to declare");
    }

    // Get current innings
    const inningRes = await db.query(
      `SELECT MAX(innings) AS innings FROM scores WHERE match_id=$1`,
      [matchId]
    );
    const innings = inningRes.rows[0].innings;
    if (!innings) throw new Error("Scores not initialized");

    if (innings !== 1) {
      throw new Error("Can only declare first innings");
    }

    // Get last ball
    const lastBallRes = await db.query(
      `SELECT over, ball FROM balls
       WHERE match_id=$1 AND innings=$2
       ORDER BY created_at DESC
       LIMIT 1`,
      [matchId, innings]
    );

    if (lastBallRes.rowCount === 0) {
      throw new Error("No balls bowled yet");
    }

    const lastBall = lastBallRes.rows[0];

    // End all open partnerships
    await db.query(
      `UPDATE partnerships
       SET end_over = $1,
           end_ball = $2,
           ended_reason = 'DECLARATION'
       WHERE match_id=$3 AND innings=$4 AND end_over IS NULL`,
      [lastBall.over, lastBall.ball, matchId, innings]
    );

    // Get current score and set target
    const scoreRes = await db.query(
      `SELECT runs FROM scores WHERE match_id=$1 AND innings=$2
       ORDER BY runs DESC LIMIT 1`,
      [matchId, innings]
    );

    const target = scoreRes.rows[0].runs + 1;

    await db.query(
      `UPDATE matches SET target_score = $1 WHERE id = $2`,
      [target, matchId]
    );

    await db.query("COMMIT");
  } catch (e) {
    await db.query("ROLLBACK");
    throw e;
  }
}

export async function endInningsManuallyService(
  matchId: string,
  reason: string
) {
  await db.query("BEGIN");

  try {
    const validReasons = ['TIME_LIMIT', 'WEATHER', 'OTHER'];
    if (!validReasons.includes(reason)) {
      throw new Error("Invalid reason");
    }

    // Check match status
    const matchCheck = await db.query(
      `SELECT status FROM matches WHERE id=$1`,
      [matchId]
    );
    
    if (matchCheck.rowCount === 0) throw new Error("Match not found");
    
    if (matchCheck.rows[0].status === 'COMPLETED') {
      throw new Error("Cannot end innings for completed match");
    }
    
    if (matchCheck.rows[0].status !== 'LIVE') {
      throw new Error("Match must be LIVE");
    }

    // Get current innings
    const inningRes = await db.query(
      `SELECT MAX(innings) AS innings FROM scores WHERE match_id=$1`,
      [matchId]
    );
    const innings = inningRes.rows[0].innings;
    if (!innings) throw new Error("Scores not initialized");

    // Get last ball
    const lastBallRes = await db.query(
      `SELECT over, ball FROM balls
       WHERE match_id=$1 AND innings=$2
       ORDER BY created_at DESC
       LIMIT 1`,
      [matchId, innings]
    );

    if (lastBallRes.rowCount === 0) {
      throw new Error("No balls bowled yet");
    }

    const lastBall = lastBallRes.rows[0];

    // Create final over summary if incomplete
    const overSummaryExists = await db.query(
      `SELECT 1 FROM over_summary 
       WHERE match_id=$1 AND innings=$2 AND over=$3`,
      [matchId, innings, lastBall.over]
    );

    if (overSummaryExists.rowCount === 0) {
      const overStatsRes = await db.query(
        `SELECT 
           SUM(runs_off_bat + extra_runs) as runs,
           COUNT(CASE WHEN is_wicket = true THEN 1 END) as wickets,
           SUM(extra_runs) as extras
         FROM balls
         WHERE match_id=$1 AND innings=$2 AND over=$3`,
        [matchId, innings, lastBall.over]
      );

      const overStats = overStatsRes.rows[0];

      if (overStats.runs) {
        await db.query(
          `INSERT INTO over_summary 
           (match_id, innings, over, runs, wickets, extras, completed_at)
           VALUES ($1, $2, $3, $4, $5, $6, now())`,
          [
            matchId,
            innings,
            lastBall.over,
            parseInt(overStats.runs) || 0,
            parseInt(overStats.wickets) || 0,
            parseInt(overStats.extras) || 0
          ]
        );
      }
    }

    // End all open partnerships
    await db.query(
      `UPDATE partnerships
       SET end_over = $1,
           end_ball = $2,
           ended_reason = $3
       WHERE match_id=$4 AND innings=$5 AND end_over IS NULL`,
      [lastBall.over, lastBall.ball, reason, matchId, innings]
    );

    // Set target if first innings
    if (innings === 1) {
      const scoreRes = await db.query(
        `SELECT runs FROM scores WHERE match_id=$1 AND innings=$2
         ORDER BY runs DESC LIMIT 1`,
        [matchId, innings]
      );

      const target = scoreRes.rows[0].runs + 1;

      await db.query(
        `UPDATE matches SET target_score = $1 WHERE id = $2`,
        [target, matchId]
      );
    }

    await db.query("COMMIT");
  } catch (e) {
    await db.query("ROLLBACK");
    throw e;
  }
}

export async function getMilestonesService(matchId: string) {
  const result = await db.query(
    `SELECT 
       pm.innings,
       pm.player_id,
       p.name as player_name,
       pm.milestone_type,
       pm.milestone_value,
       pm.achieved_over,
       pm.achieved_ball,
       pm.created_at
     FROM player_milestones pm
     JOIN players p ON p.id = pm.player_id
     WHERE pm.match_id = $1
     ORDER BY pm.innings, pm.created_at`,
    [matchId]
  );

  return result.rows;
}