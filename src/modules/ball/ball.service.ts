import db from "../../config/db.js";

export async function submitBallService(matchId: any, actor: any, ball: any) {
  await db.query("BEGIN");

  try {
    // get match and its status
    if (!matchId) throw new Error("Match ID required");
    const matchRes = await db.query(
      `SELECT * FROM matches WHERE id=$1`,
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
      `SELECT MAX(innings) AS innings FROM scores WHERE match_id=$1 LIMIT 1`,
      [matchId]
    ); // added MAX(innings) (extra check)

    const currentInnings = scoreRes.rows[0].innings;
    if (ball.innings !== currentInnings) {
      throw new Error("Invalid innings");
    }

    // get batting team (based on toss, innings)
    const battingTeamId =
      currentInnings === 1
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

    // if (ball.battingTeamId !== battingTeamId) {
    //   throw new Error("Wrong batting team");
    // } // IMP, commented temporary

    const bowlingTeamId =
      battingTeamId === match.team_a_id
        ? match.team_b_id
        : match.team_a_id;
    // IMP, commented temporary

    // if (ball.bowlingTeamId !== bowlingTeamId) {
    //   throw new Error("Wrong bowling team");
    // } // IMP, commented temporary

    // player validation
    // const players = await db.query(
    //   `
    //   SELECT id, team_id FROM players
    //   WHERE id IN ($1,$2,$3)
    //   `,
    //   [ball.bowlerId, ball.strikerId, ball.nonStrikerId]
    // );
    // IMP, commented temporary

    // if (players.rowCount !== 3) throw new Error("Invalid players");

    // const map = new Map(players.rows.map(p => [p.id, p.team_id]));
    // IMP, commented temporary

    // if (map.get(ball.bowlerId) !== bowlingTeamId)
    //   throw new Error("Bowler not from bowling team");
    // IMP, commented temporary

    // if (
    //   map.get(ball.strikerId) !== battingTeamId ||
    //   map.get(ball.nonStrikerId) !== battingTeamId
    // )
    //   throw new Error("Batsman not from batting team");
    // IMP, commented temporary

    // if (ball.strikerId === ball.nonStrikerId)
    //   throw new Error("Striker and non-striker cannot be same");
    // IMP, commented temporary


    // wicket validation
    // if (ball.isWicket) {
    //   if (!ball.wicket || !ball.dismissedPlayerId)
    //     throw new Error("Wicket details missing");

    //   if (map.get(ball.dismissedPlayerId) !== battingTeamId)
    //     throw new Error("Dismissed player not from batting team");
    // } else {
    //   if (ball.wicket || ball.dismissedPlayerId)
    //     throw new Error("Invalid wicket payload");
    // }
    // IMP, commented temporary

    // --- PATCHES ---

    ball.battingTeamId = battingTeamId
    ball.bowlingTeamId = bowlingTeamId
    // ball.bowlerId = "f06590f9-daf3-4ced-a3d7-4a7dae9eed1b"
    // ball.strikerId = "f06590f9-daf3-4ced-a3d7-4a7dae9eed1b"
    // ball.nonStrikerId = "f06590f9-daf3-4ced-a3d7-4a7dae9eed1b"
    // ball.dismissedPlayerId = "f06590f9-daf3-4ced-a3d7-4a7dae9eed1b"
    ball.dismissedPlayerId = null

    ball.isWide = false
    ball.isNoBall = false
    ball.isBye = false
    ball.isLegBye = false
    ball.isPenalty = false

    ball.isFreeHit = false
    
    // --- PATCHES ---

    // for strike/non-strike id
    const stateRes = await db.query(
      `
      SELECT striker_id, non_striker_id
      FROM batting_state
      WHERE match_id=$1 AND innings=$2
      `,
      [matchId, currentInnings]
    );

    if (stateRes.rowCount === 0) {
      throw new Error("Openers not set");
    }

    const { striker_id, non_striker_id } = stateRes.rows[0];
    ball.strikerId = striker_id;
    ball.nonStrikerId = non_striker_id;

    // for bowler id
    const bowlerRes = await db.query(
      `
      SELECT bowler_id
      FROM over_state
      WHERE match_id=$1 AND innings=$2 AND over=$3
      `,
      [matchId, currentInnings, ball.over]
    );

    if (bowlerRes.rowCount === 0) {
      throw new Error("Bowler not set for this over");
    }

    const bowlerId = bowlerRes.rows[0].bowler_id;
    ball.bowlerId = bowlerId;
    // --- CONTINUE PATCH ---


    console.log("adding ball")
    // ball table (new row)
    await db.query(
      `
    INSERT INTO balls (
      match_id, innings, over, ball,
      batting_team_id, bowling_team_id,
      bowler_id, striker_id, non_striker_id,
      runs_off_bat, extra_runs,
      is_wide, is_no_ball, is_bye, is_leg_bye, is_penalty,
      boundary, is_free_hit,
      is_wicket, wicket, dismissed_player_id, notes
    ) VALUES (
      $1,$2,$3,$4,$5,$6,$7,$8,$9,
      $10,$11,$12,$13,$14,$15,$16,
      $17,$18,$19,$20,$21,$22
    )
    `,
      [
        matchId, ball.innings, ball.over, ball.ball,
        ball.battingTeamId, ball.bowlingTeamId,
        ball.bowlerId, ball.strikerId, ball.nonStrikerId,
        ball.runsOffBat, ball.extraRuns,
        ball.isWide, ball.isNoBall, ball.isBye, ball.isLegBye, ball.isPenalty,
        ball.boundary, ball.isFreeHit,
        ball.isWicket, ball.wicket, ball.dismissedPlayerId, ball.notes
      ]
    );

    // update scores
    const totalRuns = ball.runsOffBat + ball.extraRuns;

    await db.query(
      `
    UPDATE scores
    SET runs = runs + $1,
        wickets = wickets + $2,
        updated_at = now()
    WHERE match_id=$3 AND team_id=$4
    `,
      [
        totalRuns,
        ball.isWicket ? 1 : 0,
        matchId,
        battingTeamId
      ]
    );

    await db.query("COMMIT");
  } catch (e) {
    await db.query("ROLLBACK");
    throw e;
  }

}
