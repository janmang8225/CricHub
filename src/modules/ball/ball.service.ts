import db from "../../config/db.js";
import {
  emitBallAdded,
  emitScoreUpdate,
  emitWicket,
  emitOverComplete,
  emitInningsEnd,
  emitMatchComplete,
  emitMilestone,
  emitPartnershipUpdate
} from "../../websocket/websocket.emitters.js";

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
    
    // STEP 87: Match completed → read-only
    if (match.status === 'COMPLETED') {
      throw new Error("Cannot update scores for completed match");
    }

    // only ADMIN or SCORER (assigned) or CREATOR (own matches) allowed
    if (!actor) throw new Error("Unauthenticated");
    if (actor.role !== "ADMIN") {
      if (actor.role === "CREATOR") {
        // Check if creator owns this match
        const ownerCheck = await db.query(
          `SELECT 1 FROM matches WHERE id=$1 AND created_by=$2`,
          [matchId, actor.userId]
        );
        if (ownerCheck.rowCount === 0) {
          throw new Error("Not authorized: You can only add balls to matches you created");
        }
      } else if (actor.role === "SCORER") {
        // Check if scorer is assigned to this match
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
      } else {
        throw new Error("Not authorized");
      }
    }

    // get innings
    const scoreRes = await db.query(
      `SELECT MAX(innings) AS innings FROM scores WHERE match_id=$1 LIMIT 1`,
      [matchId]
    ); // added MAX(innings) (extra check)

    const currentInnings = scoreRes.rows[0].innings;
    if (!currentInnings) throw new Error("Scores not initialized");
    ball.innings = currentInnings;
    // if (ball.innings !== currentInnings) {
    //   throw new Error("Invalid innings");
    // }

    // change1: auto calculate
    // ============ AUTO-CALCULATE OVER AND BALL NUMBER ============
    
    const lastBallRes = await db.query(
      `SELECT over, ball, is_wide, is_no_ball
       FROM balls
       WHERE match_id=$1 AND innings=$2
       ORDER BY created_at DESC, over DESC, ball DESC
       LIMIT 1`,
      [matchId, currentInnings]
    );

    let currentOver = 1;
    let currentBall = 1;

    if (lastBallRes.rowCount === 0) {
      // First ball of innings
      currentOver = 1;
      currentBall = 1;
    } else {
      const lastBall = lastBallRes.rows[0];
      
      // Check if last ball was legal
      const wasLegal = !lastBall.is_wide && !lastBall.is_no_ball;

      if (wasLegal) {
        // Last ball was legal, increment ball number
        if (lastBall.ball === 6) {
          // Over completed, move to next over
          currentOver = lastBall.over + 1;
          currentBall = 1;
        } else {
          // Continue in same over
          currentOver = lastBall.over;
          currentBall = lastBall.ball + 1;
        }
      } else {
        // Last ball was wide/no-ball, keep same over and ball number
        currentOver = lastBall.over;
        currentBall = lastBall.ball;
      }
    }
    // Set auto-calculated over and ball
    ball.over = currentOver;
    ball.ball = currentBall;
    ball.innings = currentInnings;
    // change1 ends (again it starts below)


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
    
    // ball.dismissedPlayerId = null
    if (!ball.isWicket) {
      ball.dismissedPlayerId = null;
    }

    // ball.isWide = false
    // ball.isNoBall = false
    // ball.isBye = false
    // ball.isLegBye = false
    // ball.isPenalty = false

    // ball.isFreeHit = false
    
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
    if (!striker_id || !non_striker_id) {
      throw new Error("Both striker and non-striker must be set. Please set next batsman.");
    }
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
      throw new Error(`Bowler not set for over ${ball.over}`);
    }

    const bowlerId = bowlerRes.rows[0].bowler_id;
    ball.bowlerId = bowlerId;
    // --- CONTINUE PATCH ---

    // change1 (starts from here, in parts)
    // ============ TYPE VALIDATIONS ============
    
    if (typeof ball.runsOffBat !== 'number' || ball.runsOffBat < 0) {
      throw new Error("Invalid runs off bat");
    }
    if (typeof ball.extraRuns !== 'number' || ball.extraRuns < 0) {
      throw new Error("Invalid extra runs");
    }
    if (typeof ball.isWide !== 'boolean') throw new Error("Invalid isWide");
    if (typeof ball.isNoBall !== 'boolean') throw new Error("Invalid isNoBall");
    if (typeof ball.isBye !== 'boolean') throw new Error("Invalid isBye");
    if (typeof ball.isLegBye !== 'boolean') throw new Error("Invalid isLegBye");
    if (typeof ball.isPenalty !== 'boolean') throw new Error("Invalid isPenalty");
    if (typeof ball.isFreeHit !== 'boolean') throw new Error("Invalid isFreeHit");
    if (typeof ball.isWicket !== 'boolean') throw new Error("Invalid isWicket");
    
    if (ball.boundary && !['FOUR', 'SIX'].includes(ball.boundary)) {
      throw new Error("Invalid boundary type");
    }

    // ============ INSERT BALL ============
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

    // ============ STEP 23: UPDATE TEAM SCORE (RUNS, WICKETS) ============    
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

    // ============ STEP 24: UPDATE TEAM OVERS ============
    
    // Count total legal balls for this innings
    const legalBallsRes = await db.query(
      `SELECT COUNT(*) as legal_balls
       FROM balls
       WHERE match_id=$1 AND innings=$2 AND is_wide=false AND is_no_ball=false`,
      [matchId, currentInnings]
    );

    const legalBalls = parseInt(legalBallsRes.rows[0].legal_balls);
    const overs = Math.floor(legalBalls / 6);
    const balls = legalBalls % 6;
    const oversDecimal = overs + (balls / 10);

    await db.query(
      `UPDATE scores
       SET overs = $1
       WHERE match_id=$2 AND team_id=$3`,
      [oversDecimal, matchId, battingTeamId]
    );

    // ============ STEP 25: UPDATE STRIKER BATTING STATS ============
    
    await db.query(
      `UPDATE match_batting_stats
       SET runs = runs + $1,
           balls = balls + $2,
           fours = fours + $3,
           sixes = sixes + $4
       WHERE match_id=$5 AND player_id=$6`,
      [
        ball.runsOffBat,
        (ball.isWide || ball.isNoBall) ? 0 : 1, // Only count legal deliveries
        ball.boundary === 'FOUR' ? 1 : 0,
        ball.boundary === 'SIX' ? 1 : 0,
        matchId,
        ball.strikerId
      ]
    );

    // ============ STEP 26: UPDATE BOWLER BOWLING STATS ============
    
    await db.query(
      `UPDATE match_bowling_stats
       SET balls = balls + $1,
           runs_conceded = runs_conceded + $2,
           wickets = wickets + $3,
           wides = wides + $4,
           no_balls = no_balls + $5
       WHERE match_id=$6 AND player_id=$7`,
      [
        (ball.isWide || ball.isNoBall) ? 0 : 1, // Only legal deliveries count
        totalRuns, // All runs conceded (including extras)
        ball.isWicket ? 1 : 0,
        ball.isWide ? 1 : 0,
        ball.isNoBall ? 1 : 0,
        matchId,
        ball.bowlerId
      ]
    );

    // ============ STEP 27: UPDATE PARTNERSHIP STATS ============
    
    // Check if partnership exists for current pair
    const partnershipRes = await db.query(
      `SELECT * FROM partnerships
       WHERE match_id=$1 AND innings=$2
         AND ((batter1_id=$3 AND batter2_id=$4) OR (batter1_id=$4 AND batter2_id=$3))
         AND end_over IS NULL`,
      [matchId, currentInnings, ball.strikerId, ball.nonStrikerId]
    );

    if (partnershipRes.rowCount === 0) {
      // Create new partnership
      await db.query(
        `INSERT INTO partnerships 
         (match_id, innings, batter1_id, batter2_id, runs, balls, start_over, start_ball)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          matchId,
          currentInnings,
          ball.strikerId,
          ball.nonStrikerId,
          ball.runsOffBat, // Only runs off bat count for partnership
          (ball.isWide || ball.isNoBall) ? 0 : 1,
          ball.over,
          ball.ball
        ]
      );
    } else {
      // Update existing partnership
      await db.query(
        `UPDATE partnerships
         SET runs = runs + $1,
             balls = balls + $2
         WHERE match_id=$3 AND innings=$4
           AND ((batter1_id=$5 AND batter2_id=$6) OR (batter1_id=$6 AND batter2_id=$5))
           AND end_over IS NULL`,
        [
          ball.runsOffBat,
          (ball.isWide || ball.isNoBall) ? 0 : 1,
          matchId,
          currentInnings,
          ball.strikerId,
          ball.nonStrikerId
        ]
      );
    }

    // critical (***)
    // ============ STEP 32-44: WICKET HANDLING ============
    
    if (ball.isWicket) {
      if (!ball.wicket || !ball.dismissedPlayerId) {
        throw new Error("Wicket type and dismissed player required");
      }

      // Validate wicket type
      const validWicketTypes = ['BOWLED', 'CAUGHT', 'LBW', 'RUN_OUT', 'STUMPED', 'HIT_WICKET', 'OBSTRUCTING_FIELD', 'TIMED_OUT', 'RETIRED_OUT'];
      if (!validWicketTypes.includes(ball.wicket)) {
        throw new Error("Invalid wicket type");
      }

      // Validate dismissed player is one of the batsmen
      if (ball.dismissedPlayerId !== ball.strikerId && ball.dismissedPlayerId !== ball.nonStrikerId) {
        throw new Error("Dismissed player must be either striker or non-striker");
      }

      // For RUN_OUT, survivingBatsmanPosition is required
      if (ball.wicket === 'RUN_OUT') {
        if (!ball.survivingBatsmanPosition || !['STRIKER', 'NON_STRIKER'].includes(ball.survivingBatsmanPosition)) {
          throw new Error("survivingBatsmanPosition (STRIKER or NON_STRIKER) required for run-out");
        }
      }

      // STEP 33: Mark dismissed player as out in batting stats
      await db.query(
        `UPDATE match_batting_stats
         SET is_out = true
         WHERE match_id=$1 AND player_id=$2`,
        [matchId, ball.dismissedPlayerId]
      );

      // STEP 35: Insert fall of wickets
      const currentScoreRes = await db.query(
        `SELECT runs, wickets FROM scores WHERE match_id=$1 AND team_id=$2`,
        [matchId, battingTeamId]
      );
      const currentScore = currentScoreRes.rows[0];

      await db.query(
        `INSERT INTO fall_of_wickets 
         (match_id, innings, wicket_number, runs_at_fall, over, ball, dismissed_player_id, wicket)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          matchId,
          currentInnings,
          currentScore.wickets, // Current wicket number (already incremented in step 23)
          currentScore.runs,
          ball.over,
          ball.ball,
          ball.dismissedPlayerId,
          ball.wicket
        ]
      );

      // STEP 36: If fielder involved, insert dismissal_fielders
      if (ball.fielderId && ['CAUGHT', 'RUN_OUT', 'STUMPED'].includes(ball.wicket)) {
        let fielderRole;
        if (ball.wicket === 'CAUGHT') fielderRole = 'CATCH';
        else if (ball.wicket === 'STUMPED') fielderRole = 'STUMPING';
        else if (ball.wicket === 'RUN_OUT') {
          fielderRole = ball.isDirectRunOut ? 'DIRECT_RUN_OUT' : 'RUN_OUT_ASSIST';
        }

        if (fielderRole) {
          await db.query(
            `INSERT INTO dismissal_fielders 
             (match_id, innings, over, ball, fielder_id, role)
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [matchId, currentInnings, ball.over, ball.ball, ball.fielderId, fielderRole]
          );
        }
      }

      // STEP 37: End current partnership
      await db.query(
        `UPDATE partnerships
         SET end_over = $1,
             end_ball = $2,
             ended_reason = 'WICKET'
         WHERE match_id=$3 AND innings=$4
           AND ((batter1_id=$5 AND batter2_id=$6) OR (batter1_id=$6 AND batter2_id=$5))
           AND end_over IS NULL`,
        [
          ball.over,
          ball.ball,
          matchId,
          currentInnings,
          ball.strikerId,
          ball.nonStrikerId
        ]
      );

      // STEP 38-42: Update batting_state based on wicket type
      
      if (ball.wicket === 'RUN_OUT') {
        // For RUN_OUT: Use scorer's specified position
        const survivingBatsmanId = ball.dismissedPlayerId === ball.strikerId 
          ? ball.nonStrikerId 
          : ball.strikerId;

        if (ball.survivingBatsmanPosition === 'STRIKER') {
          // Surviving batsman on striker end, new batsman on non-striker end
          await db.query(
            `UPDATE batting_state
             SET striker_id = $1,
                 non_striker_id = NULL,
                 updated_at = now()
             WHERE match_id=$2 AND innings=$3`,
            [survivingBatsmanId, matchId, currentInnings]
          );
        } else {
          // Surviving batsman on non-striker end, new batsman on striker end
          await db.query(
            `UPDATE batting_state
             SET striker_id = NULL,
                 non_striker_id = $1,
                 updated_at = now()
             WHERE match_id=$2 AND innings=$3`,
            [survivingBatsmanId, matchId, currentInnings]
          );
        }
      } else {
        // For all other wickets: dismissed player is striker
        // Non-striker remains, new batsman becomes striker
        await db.query(
          `UPDATE batting_state
           SET striker_id = NULL,
               updated_at = now()
           WHERE match_id=$1 AND innings=$2`,
          [matchId, currentInnings]
        );
      }

      // Note: Scorer must call POST /matches/:id/next-batsman to set the new batsman
      // Steps 40-44 happen when setNextBatsmanService is called
    }

    // ============ STEP 28-31: STRIKE ROTATION (for non-wicket balls) ============
    if (!ball.isWicket) {
      let shouldSwap = false;

      // Count legal balls in current over
      const overBallsRes = await db.query(
        `SELECT COUNT(*) as legal_balls
         FROM balls
         WHERE match_id=$1 AND innings=$2 AND over=$3 
           AND is_wide=false AND is_no_ball=false`,
        [matchId, currentInnings, ball.over]
      );
      
      const legalBallsInOver = parseInt(overBallsRes.rows[0].legal_balls);

      // STEP 45-48: End of over (6 legal balls completed)
      if (legalBallsInOver === 6 && !ball.isWide && !ball.isNoBall) {
        shouldSwap = true; // Always swap at end of over
      } else {
        // STEP 28-30: Mid-over rotation based on runs
        const runsForRotation = ball.runsOffBat; // Only runs off bat count for rotation
        
        if (runsForRotation % 2 === 1) {
          // Odd runs (1, 3, 5) → swap
          shouldSwap = true;
        } else {
          // Even runs (0, 2, 4, 6) or boundary -> no swap
          shouldSwap = false;
        }
      }

      /*
        alternate for shouldSwap is there, which do not
        call DB query every ball, simple flow control, 
        but we don't use that below we prefer
        accuracy > performance here. 
        current code handles edge case over unlimited
        extras, etc. and derives OVER data directly from
        DB, so we keep this.

        alternate for this code will be at bottom
        (same for step 45-46 too)
      */

      // STEP 31: Update batting_state if swap needed
      if (shouldSwap) {
        await db.query(
          `UPDATE batting_state
           SET striker_id = $1,
               non_striker_id = $2,
               updated_at = now()
           WHERE match_id=$3 AND innings=$4`,
          [ball.nonStrikerId, ball.strikerId, matchId, currentInnings]
        );
      }
    }

    // ============ STEP 45-46: OVER COMPLETION - CREATE OVER SUMMARY ============
    
    // Check if over is complete (6 legal balls)
    if (!ball.isWicket) { 
      // Only check for non-wicket balls (wickets don't complete overs automatically)
      const overBallsRes = await db.query(
        `SELECT COUNT(*) as legal_balls
         FROM balls
         WHERE match_id=$1 AND innings=$2 AND over=$3 
           AND is_wide=false AND is_no_ball=false`,
        [matchId, currentInnings, ball.over]
      );
      
      const legalBallsInOver = parseInt(overBallsRes.rows[0].legal_balls);

      // STEP 46: Create over summary when over is complete
      if (legalBallsInOver === 6) {
        // Calculate runs, wickets, extras for this over
        const overStatsRes = await db.query(
          `SELECT 
             SUM(runs_off_bat + extra_runs) as runs,
             COUNT(CASE WHEN is_wicket = true THEN 1 END) as wickets,
             SUM(extra_runs) as extras
           FROM balls
           WHERE match_id=$1 AND innings=$2 AND over=$3`,
          [matchId, currentInnings, ball.over]
        );

        const overStats = overStatsRes.rows[0];

        await db.query(
          `INSERT INTO over_summary 
           (match_id, innings, over, runs, wickets, extras, completed_at)
           VALUES ($1, $2, $3, $4, $5, $6, now())
           ON CONFLICT (match_id, innings, over) DO NOTHING`,
          [
            matchId,
            currentInnings,
            ball.over,
            parseInt(overStats.runs) || 0,
            parseInt(overStats.wickets) || 0,
            parseInt(overStats.extras) || 0
          ]
        ); // added 'on conflict do nothing line'
      }
    }


    // ============ STEP 53-56 + 72-76: CHECK INNINGS END CONDITIONS ============
    
    let inningsEnded = false;
    let inningsEndReason = '';
    let matchCompleted = false;
    let matchResult: any = null;

    // Get current score
    const currentScoreRes = await db.query(
      `SELECT runs, wickets, overs FROM scores 
       WHERE match_id=$1 AND team_id=$2`,
      [matchId, battingTeamId]
    );
    const currentScore = currentScoreRes.rows[0];

    // STEP 53: Check if 10 wickets fallen (all out)
    if (currentScore.wickets >= 10) {
      inningsEnded = true;
      inningsEndReason = 'ALL_OUT';
    }

    // STEP 54: Check if maximum overs completed
    if (!inningsEnded) {
      const maxOvers = match.max_overs;
      if (currentScore.overs >= maxOvers) {
        inningsEnded = true;
        inningsEndReason = 'OVERS_COMPLETED';
      }
    }

    // STEP 55 + (72-73): Check if target chased (2nd innings only)
    if (!inningsEnded && currentInnings === 2) {
      const target = match.target_score;
      if (target && currentScore.runs >= target) {
        inningsEnded = true;
        inningsEndReason = 'TARGET_CHASED';
        matchCompleted = true; // Match ends when target is chased
      }
    }

    // STEP 74-75: If 2nd innings ends without chasing target
    if (inningsEnded && currentInnings === 2 && !matchCompleted) {
      matchCompleted = true; // 2nd innings ended, match is complete
    }

    // ============ STEP 57-61: INNINGS END ACTIONS ============
    
    if (inningsEnded) {
      // STEP 57: Create final over summary if not already created
      const overSummaryExists = await db.query(
        `SELECT 1 FROM over_summary 
         WHERE match_id=$1 AND innings=$2 AND over=$3`,
        [matchId, currentInnings, ball.over]
      );

      if (overSummaryExists.rowCount === 0) {
        const overStatsRes = await db.query(
          `SELECT 
             SUM(runs_off_bat + extra_runs) as runs,
             COUNT(CASE WHEN is_wicket = true THEN 1 END) as wickets,
             SUM(extra_runs) as extras
           FROM balls
           WHERE match_id=$1 AND innings=$2 AND over=$3`,
          [matchId, currentInnings, ball.over]
        );

        const overStats = overStatsRes.rows[0];

        if (overStats.runs) {
          await db.query(
            `INSERT INTO over_summary 
             (match_id, innings, over, runs, wickets, extras, completed_at)
             VALUES ($1, $2, $3, $4, $5, $6, now())`,
            [
              matchId,
              currentInnings,
              ball.over,
              parseInt(overStats.runs) || 0,
              parseInt(overStats.wickets) || 0,
              parseInt(overStats.extras) || 0
            ]
          );
        }
      }

      // STEP 58: End final partnership
      await db.query(
        `UPDATE partnerships
         SET end_over = $1,
             end_ball = $2,
             ended_reason = 'INNINGS_END'
         WHERE match_id=$3 AND innings=$4 AND end_over IS NULL`,
        [ball.over, ball.ball, matchId, currentInnings]
      );

      // STEP 60-61: Calculate and set target (1st innings only)
      if (currentInnings === 1) {
        const target = currentScore.runs + 1;
        
        await db.query(
          `UPDATE matches
           SET target_score = $1
           WHERE id = $2`,
          [target, matchId]
        );
      }
    }

    // ============ STEP 77-82: MATCH COMPLETION ============

    if (matchCompleted) {
      // Get both teams' scores
      const bothScoresRes = await db.query(
        `SELECT team_id, runs, wickets, innings 
         FROM scores 
         WHERE match_id=$1
         ORDER BY innings, team_id`,
        [matchId]
      );

      const scores = bothScoresRes.rows;
      // debug
      console.log(scores);
      console.log();

      // Simple: Find innings 1 and innings 2 scores (only 2 rows total)
      const firstInningsScore = scores.find(s => s.innings === 1);
      const secondInningsScore = scores.find(s => s.innings === 2);

      // debug
      console.log('First innings:', firstInningsScore);
      console.log('Second innings:', secondInningsScore);

      if (!firstInningsScore || !secondInningsScore) {
        throw new Error("Missing innings data");
      }

      // Determine which team batted first
      const firstInningsBattingTeamId =
        match.toss_decision === "BAT"
          ? match.toss_winner_team_id
          : (match.team_a_id === match.toss_winner_team_id
              ? match.team_b_id
              : match.team_a_id);

      const secondInningsBattingTeamId =
        firstInningsBattingTeamId === match.team_a_id
          ? match.team_b_id
          : match.team_a_id;

      // Get runs directly from the innings scores
      const firstInningsRuns = firstInningsScore.runs || 0;
      const secondInningsRuns = secondInningsScore.runs || 0;
      const secondInningsWickets = secondInningsScore.wickets || 0;

      let winnerTeamId = null;
      let resultMethod = null;
      let resultMargin = 0;
      let result = 'WIN';

      // debug
      console.log();
      console.log('First innings runs:', firstInningsRuns);
      console.log('Second innings runs:', secondInningsRuns);
      // STEP 76 + 78-82: Determine winner and result
      if (secondInningsRuns > firstInningsRuns) {
        // Team batting second won by wickets
        winnerTeamId = secondInningsBattingTeamId;
        resultMethod = 'WICKETS';
        resultMargin = 10 - secondInningsWickets; // Wickets remaining
      } else if (secondInningsRuns < firstInningsRuns) {
        // Team batting first won by runs
        winnerTeamId = firstInningsBattingTeamId;
        resultMethod = 'RUNS';
        resultMargin = firstInningsRuns - secondInningsRuns;
      } else {
        // Scores are tied (debug - fix 1 (changed 'TIE' to 'DRAW'))
        // result type: ('WIN','DRAW')
        // result method type: ('RUNS','WICKETS','TIE','NO_RESULT')
        result = 'DRAW';
        resultMethod = 'TIE';
        winnerTeamId = null;
        resultMargin = 0;
      }

      // debug
      console.log();
      console.log(result);
      console.log(resultMethod);
      console.log(winnerTeamId);
      console.log();

      // STEP 77-82: Update match with result
      await db.query(
        `UPDATE matches
         SET status = 'COMPLETED',
             result = $1,
             winner_team_id = $2,
             result_method = $3,
             result_margin = $4
         WHERE id = $5`,
        [result, winnerTeamId, resultMethod, resultMargin, matchId]
      );

      matchResult = {
        result,
        winnerTeamId,
        resultMethod,
        resultMargin
      };
    }


    // ============ STEP 84-85: CHECK AND RECORD PLAYER MILESTONES ============
    // Check batting milestones (50, 100, 150, etc.)
    const battingMilestones = [50, 100, 150, 200, 250, 300];
    
    for (const milestone of battingMilestones) {
      // Check if striker just reached this milestone
      const strikerStatsRes = await db.query(
        `SELECT runs FROM match_batting_stats
         WHERE match_id=$1 AND player_id=$2`,
        [matchId, ball.strikerId]
      );
      
      if (strikerStatsRes?.rowCount && 
        typeof strikerStatsRes.rowCount === "number" && 
        strikerStatsRes.rowCount > 0) {
        const strikerRuns = strikerStatsRes.rows[0].runs;
        
        // Check if player just crossed milestone (current runs >= milestone, previous runs < milestone)
        if (strikerRuns >= milestone) {
          // Check if milestone already recorded
          const existingMilestone = await db.query(
            `SELECT milestone_value FROM player_milestones
             WHERE match_id=$1 AND innings=$2 AND player_id=$3 
               AND milestone_type='RUNS'
             ORDER BY milestone_value DESC
             LIMIT 1`,
            [matchId, currentInnings, ball.strikerId]
          );
          
          if (existingMilestone.rowCount === 0) {
            // No milestone exists, check if they just reached it this ball
            const previousRuns = strikerRuns - ball.runsOffBat;
            
            if (previousRuns < milestone) {
              await db.query(
                `INSERT INTO player_milestones 
                 (match_id, innings, player_id, milestone_type, milestone_value, achieved_over, achieved_ball)
                 VALUES ($1, $2, $3, 'RUNS', $4, $5, $6)`,
                [matchId, currentInnings, ball.strikerId, milestone, ball.over, ball.ball]
              );
              // runs milestone emit
              emitMilestone(matchId, ball.strikerId, 'RUNS', milestone, ball.over, ball.ball);
              
            }
          } else {
            // Milestone exists, check if we need to update to higher milestone
            const currentMilestoneValue = existingMilestone.rows[0].milestone_value;
            const previousRuns = strikerRuns - ball.runsOffBat;
            
            // Only update if player just crossed this milestone and it's higher than existing
            if (previousRuns < milestone && milestone > currentMilestoneValue) {
              await db.query(
                `UPDATE player_milestones
                 SET milestone_value = $1,
                     achieved_over = $2,
                     achieved_ball = $3
                 WHERE match_id=$4 AND innings=$5 AND player_id=$6 
                   AND milestone_type='RUNS'`,
                [milestone, ball.over, ball.ball, matchId, currentInnings, ball.strikerId]
              );
              // runs milestone emit
              emitMilestone(matchId, ball.strikerId, 'RUNS', milestone, ball.over, ball.ball);

            }
          }
        }
      }
    }

    // Check bowling milestones (wickets: 3, 5, 10)
    const bowlingMilestones = [3, 5, 10];
    
    for (const milestone of bowlingMilestones) {
      const bowlerStatsRes = await db.query(
        `SELECT wickets FROM match_bowling_stats
         WHERE match_id=$1 AND player_id=$2`,
        [matchId, ball.bowlerId]
      );
      
      if (bowlerStatsRes?.rowCount && 
        typeof bowlerStatsRes.rowCount === "number" && 
        bowlerStatsRes.rowCount > 0) {
        const bowlerWickets = bowlerStatsRes.rows[0].wickets;
        
        if (bowlerWickets >= milestone) {
          const existingMilestone = await db.query(
            `SELECT milestone_value FROM player_milestones
             WHERE match_id=$1 AND innings=$2 AND player_id=$3 
               AND milestone_type='WICKETS'
             ORDER BY milestone_value DESC
             LIMIT 1`,
            [matchId, currentInnings, ball.bowlerId]
          );
          
          if (existingMilestone.rowCount === 0) {
            // No milestone exists, check if they just reached it (only if this ball was a wicket)
            const previousWickets = ball.isWicket ? bowlerWickets - 1 : bowlerWickets;
            
            if (previousWickets < milestone && ball.isWicket) {
              await db.query(
                `INSERT INTO player_milestones 
                 (match_id, innings, player_id, milestone_type, milestone_value, achieved_over, achieved_ball)
                 VALUES ($1, $2, $3, 'WICKETS', $4, $5, $6)`,
                [matchId, currentInnings, ball.bowlerId, milestone, ball.over, ball.ball]
              );
              // wicket milestone emit
              emitMilestone(matchId, ball.bowlerId, 'WICKETS', milestone, ball.over, ball.ball);

            }
          } else {
            // Milestone exists, check if we need to update to higher milestone
            const currentMilestoneValue = existingMilestone.rows[0].milestone_value;
            const previousWickets = ball.isWicket ? bowlerWickets - 1 : bowlerWickets;
            
            // Only update if bowler just crossed this milestone and it's higher than existing
            if (previousWickets < milestone && milestone > currentMilestoneValue && ball.isWicket) {
              await db.query(
                `UPDATE player_milestones
                 SET milestone_value = $1,
                     achieved_over = $2,
                     achieved_ball = $3
                 WHERE match_id=$4 AND innings=$5 AND player_id=$6 
                   AND milestone_type='WICKETS'`,
                [milestone, ball.over, ball.ball, matchId, currentInnings, ball.bowlerId]
              );
              // wicket milestone emit
              emitMilestone(matchId, ball.bowlerId, 'WICKETS', milestone, ball.over, ball.ball);

            }
          }
        }
      }
    }

    // Check for hat-trick (3 wickets in 3 consecutive balls)
    if (ball.isWicket) {
      // Get last 3 balls by this bowler
      const last3BallsRes = await db.query(
        `SELECT is_wicket, over, ball
         FROM balls
         WHERE match_id=$1 AND innings=$2 AND bowler_id=$3
         ORDER BY over DESC, ball DESC
         LIMIT 3`,
        [matchId, currentInnings, ball.bowlerId]
      );
      
      if (last3BallsRes.rowCount === 3) {
        const allWickets = last3BallsRes.rows.every(b => b.is_wicket === true);
        
        if (allWickets) {
          // Check if hat-trick already recorded for this player in this innings
          // const existingHatTrick = await db.query(
          //   `SELECT 1 FROM player_milestones
          //    WHERE match_id=$1 AND innings=$2 AND player_id=$3 
          //      AND milestone_type='HAT_TRICK'
          //      AND achieved_over=$4 AND achieved_ball=$5`,
          //   [matchId, currentInnings, ball.bowlerId, ball.over, ball.ball]
          // );
          const existingHatTrick = await db.query(
            `SELECT 1 FROM player_milestones
             WHERE match_id=$1 AND innings=$2 AND player_id=$3 
               AND milestone_type='HAT_TRICK'`,
            [matchId, currentInnings, ball.bowlerId]
          );
          
          if (existingHatTrick.rowCount === 0) {
            await db.query(
              `INSERT INTO player_milestones 
               (match_id, innings, player_id, milestone_type, milestone_value, achieved_over, achieved_ball)
               VALUES ($1, $2, $3, 'HAT_TRICK', 3, $4, $5)`,
              [matchId, currentInnings, ball.bowlerId, ball.over, ball.ball]
            );
            // hat-trick milestone emit
            emitMilestone(matchId, ball.bowlerId, 'HAT_TRICK', 3, ball.over, ball.ball);

          } // changed: null -> 3
        }
      }
    }





    await db.query("COMMIT");





    // ============ WEBSOCKET EMISSIONS (AFTER SUCCESSFUL COMMIT) ============

    // Emit ball added event
    emitBallAdded(
      matchId,
      currentInnings,
      ball.over,
      ball.ball,
      ball.runsOffBat,
      ball.extraRuns,
      ball.isWicket,
      ball.boundary,
      ball.isWide,
      ball.isNoBall
    );

    // Get updated stats for WebSocket broadcast
    // const strikerStatsRes = await db.query(
    //   `SELECT runs, balls, fours, sixes FROM match_batting_stats
    //    WHERE match_id=$1 AND player_id=$2`,
    //   [matchId, ball.strikerId]
    // );
    // const nonStrikerStatsRes = await db.query(
    //   `SELECT runs, balls, fours, sixes FROM match_batting_stats
    //    WHERE match_id=$1 AND player_id=$2`,
    //   [matchId, ball.nonStrikerId]
    // );

    // change2 (fix for above - get updated stats)
    // const latestStateRes = await db.query(
    //   `SELECT striker_id, non_striker_id
    //   FROM batting_state
    //   WHERE match_id=$1 AND innings=$2`,
    //   [matchId, currentInnings]
    // );

    // const latestStrikerId = latestStateRes.rows[0].striker_id;
    // const latestNonStrikerId = latestStateRes.rows[0].non_striker_id;
    // const strikerStatsRes = await db.query(
    //   `SELECT runs, balls, fours, sixes FROM match_batting_stats
    //   WHERE match_id=$1 AND player_id=$2`,
    //   [matchId, latestStrikerId]
    // );
    // const nonStrikerStatsRes = await db.query(
    //   `SELECT runs, balls, fours, sixes FROM match_batting_stats
    //   WHERE match_id=$1 AND player_id=$2`,
    //   [matchId, latestNonStrikerId]
    // );

    // // bowler stats (same as prev; not above)
    // const bowlerStatsRes = await db.query(
    //   `SELECT balls, runs_conceded, wickets FROM match_bowling_stats
    //    WHERE match_id=$1 AND player_id=$2`,
    //   [matchId, ball.bowlerId]
    // );

    // const strikerStats = strikerStatsRes.rows[0];
    // const nonStrikerStats = nonStrikerStatsRes.rows[0];
    // const bowlerStats = bowlerStatsRes.rows[0];


    // change2 - better than previous
    const latestStateRes = await db.query(
      `SELECT striker_id, non_striker_id
      FROM batting_state
      WHERE match_id=$1 AND innings=$2`,
      [matchId, currentInnings]
    );

    const latestStrikerId = latestStateRes.rows[0]?.striker_id ?? null;
    const latestNonStrikerId = latestStateRes.rows[0]?.non_striker_id ?? null;

    const strikerStatsRes = latestStrikerId
      ? await db.query(
          `SELECT runs, balls, fours, sixes
          FROM match_batting_stats
          WHERE match_id=$1 AND player_id=$2`,
          [matchId, latestStrikerId]
        )
      : { rows: [] };

    const nonStrikerStatsRes = latestNonStrikerId
      ? await db.query(
          `SELECT runs, balls, fours, sixes
          FROM match_batting_stats
          WHERE match_id=$1 AND player_id=$2`,
          [matchId, latestNonStrikerId]
        )
      : { rows: [] };

    const bowlerStatsRes = await db.query(
      `SELECT balls, runs_conceded, wickets
      FROM match_bowling_stats
      WHERE match_id=$1 AND player_id=$2`,
      [matchId, ball.bowlerId]
    );

    const strikerStats = strikerStatsRes.rows[0] ?? {
      runs: 0,
      balls: 0,
      fours: 0,
      sixes: 0,
    };

    const nonStrikerStats = nonStrikerStatsRes.rows[0] ?? {
      runs: 0,
      balls: 0,
      fours: 0,
      sixes: 0,
    };

    const bowlerStats = bowlerStatsRes.rows[0] ?? {
      balls: 0,
      runs_conceded: 0,
      wickets: 0,
    };

    
    // Emit score update
    // emitScoreUpdate(
    //   matchId,
    //   battingTeamId,
    //   currentScore.runs,
    //   currentScore.wickets,
    //   oversDecimal,
    //   {
    //     id: ball.strikerId,
    //     runs: strikerStats.runs,
    //     balls: strikerStats.balls,
    //     fours: strikerStats.fours,
    //     sixes: strikerStats.sixes,
    //   },
    //   {
    //     id: ball.nonStrikerId,
    //     runs: nonStrikerStats.runs,
    //     balls: nonStrikerStats.balls,
    //     fours: nonStrikerStats.fours,
    //     sixes: nonStrikerStats.sixes,
    //   },
    //   {
    //     id: ball.bowlerId,
    //     balls: bowlerStats.balls,
    //     runsConceded: bowlerStats.runs_conceded,
    //     wickets: bowlerStats.wickets,
    //   }
    // );

    // change2 - updated-emit
    // emitScoreUpdate(
    //   matchId,
    //   battingTeamId,
    //   currentScore.runs,
    //   currentScore.wickets,
    //   oversDecimal,
    //   {
    //     id: latestStrikerId,
    //     runs: strikerStatsRes.rows[0].runs,
    //     balls: strikerStatsRes.rows[0].balls,
    //     fours: strikerStatsRes.rows[0].fours,
    //     sixes: strikerStatsRes.rows[0].sixes,
    //   },
    //   {
    //     id: latestNonStrikerId,
    //     runs: nonStrikerStatsRes.rows[0].runs,
    //     balls: nonStrikerStatsRes.rows[0].balls,
    //     fours: nonStrikerStatsRes.rows[0].fours,
    //     sixes: nonStrikerStatsRes.rows[0].sixes,
    //   },
    //   {
    //     id: ball.bowlerId,
    //     balls: bowlerStats.balls,
    //     runsConceded: bowlerStats.runs_conceded,
    //     wickets: bowlerStats.wickets,
    //   }
    // );

    // change2 - new
    emitScoreUpdate(
      matchId,
      battingTeamId,
      currentScore.runs,
      currentScore.wickets,
      oversDecimal,
      {
        id: latestStrikerId,
        runs: strikerStats.runs,
        balls: strikerStats.balls,
        fours: strikerStats.fours,
        sixes: strikerStats.sixes,
      },
      {
        id: latestNonStrikerId,
        runs: nonStrikerStats.runs,
        balls: nonStrikerStats.balls,
        fours: nonStrikerStats.fours,
        sixes: nonStrikerStats.sixes,
      },
      {
        id: ball.bowlerId,
        balls: bowlerStats.balls,
        runsConceded: bowlerStats.runs_conceded,
        wickets: bowlerStats.wickets,
      }
    );


    // Emit wicket event if wicket fell
    if (ball.isWicket) {
      emitWicket(
        matchId,
        ball.wicket,
        ball.dismissedPlayerId,
        currentScore.wickets,
        currentScore.runs,
        ball.over,
        ball.ball
      );
    }


    // Emit over complete event if over just completed
    const legalBallsInOverCheck = await db.query(
      `SELECT COUNT(*) as legal_balls
       FROM balls
       WHERE match_id=$1 AND innings=$2 AND over=$3 
         AND is_wide=false AND is_no_ball=false`,
      [matchId, currentInnings, ball.over]
    );



    if (parseInt(legalBallsInOverCheck.rows[0].legal_balls) === 6) {
      const overSummaryRes = await db.query(
        `SELECT runs, wickets, extras FROM over_summary
         WHERE match_id=$1 AND innings=$2 AND over=$3`,
        [matchId, currentInnings, ball.over]
      );
      
      // if ( (overSummaryRes.rowCount ?? 0) > 0 ) {
      if (overSummaryRes.rowCount!==null && overSummaryRes.rowCount > 0) {
        const summary = overSummaryRes.rows[0];
        emitOverComplete(
          matchId,
          currentInnings,
          ball.over,
          summary.runs,
          summary.wickets,
          summary.extras
        );
      }
    }

    // Emit innings end event if innings ended
    if (inningsEnded) {
      emitInningsEnd(
        matchId,
        currentInnings,
        inningsEndReason,
        match.target_score
      );
    }

    // Emit match complete event if match completed
    if (matchCompleted && matchResult) {
      emitMatchComplete(
        matchId,
        matchResult.result,
        matchResult.winnerTeamId,
        matchResult.resultMethod,
        matchResult.resultMargin
      );
    }

    // Emit partnership update (get current partnership)
    const currentPartnershipRes = await db.query(
      `SELECT runs, balls FROM partnerships
       WHERE match_id=$1 AND innings=$2
         AND ((batter1_id=$3 AND batter2_id=$4) OR (batter1_id=$4 AND batter2_id=$3))
         AND end_over IS NULL`,
      [matchId, currentInnings, ball.strikerId, ball.nonStrikerId]
    );
    
    if (currentPartnershipRes.rowCount!=null && currentPartnershipRes.rowCount > 0 && !ball.isWicket) {
      const partnership = currentPartnershipRes.rows[0];
      emitPartnershipUpdate(
        matchId,
        ball.strikerId,
        ball.nonStrikerId,
        partnership.runs,
        partnership.balls
      );
    }


    // log - (temporary: only to debug)
    console.log(striker_id)
    console.log(strikerStats)
    // console.log(strikerStatsRes)
    console.log()
    console.log(non_striker_id)
    console.log(nonStrikerStats)
    // console.log(nonStrikerStatsRes)
    console.log("- - - - -")
    console.log()


    return {
      message: "Ball added",
      over: ball.over,
      ball: ball.ball,
      inningsEnded: inningsEnded,
      inningsEndReason: inningsEndReason || null,
      matchCompleted: matchCompleted,
      matchResult: matchResult
    };
    
  } catch (e) {
    await db.query("ROLLBACK");
    throw e;
  }

}


/*
should swap alternate:
if (!ball.isWicket) {
  let shouldSwap = false;
  const isLegalBall = !ball.isWide && !ball.isNoBall;

  // Check if this ball completes the over (6th legal ball)
  if (isLegalBall && ball.ball === 6) {
    shouldSwap = true; // End of over swap
  } else {
    // Mid-over rotation based on runs
    const runsForRotation = ball.runsOffBat;
    
    if (runsForRotation % 2 === 1) {
      shouldSwap = true; // Odd runs
    }
  }

  // STEP 31: Update batting_state if swap needed
  if (shouldSwap) {
    await db.query(
      `UPDATE batting_state
        SET striker_id = $1,
            non_striker_id = $2,
            updated_at = now()
        WHERE match_id=$3 AND innings=$4`,
      [ball.nonStrikerId, ball.strikerId, matchId, currentInnings]
    );
  }
}

// ============ STEP 45-46: OVER COMPLETION - CREATE OVER SUMMARY ============

const isLegalBall = !ball.isWide && !ball.isNoBall;

if (isLegalBall && ball.ball === 6) {
  // Over completed, create summary
  const overStatsRes = await db.query(
    `SELECT 
        SUM(runs_off_bat + extra_runs) as runs,
        COUNT(CASE WHEN is_wicket = true THEN 1 END) as wickets,
        SUM(extra_runs) as extras
      FROM balls
      WHERE match_id=$1 AND innings=$2 AND over=$3`,
    [matchId, currentInnings, ball.over]
  );

  const overStats = overStatsRes.rows[0];

  await db.query(
    `INSERT INTO over_summary 
      (match_id, innings, over, runs, wickets, extras, completed_at)
      VALUES ($1, $2, $3, $4, $5, $6, now())
      ON CONFLICT (match_id, innings, over) DO NOTHING`,
    [
      matchId,
      currentInnings,
      ball.over,
      parseInt(overStats.runs) || 0,
      parseInt(overStats.wickets) || 0,
      parseInt(overStats.extras) || 0
    ]
  );
}

*/




// request body for different cases
/*

1. regular ball (no wicket)
{
  "innings": 1,
  "over": 1,
  "ball": 1,
  "runsOffBat": 4,
  "extraRuns": 0,
  "isWide": false,
  "isNoBall": false,
  "isBye": false,
  "isLegBye": false,
  "isPenalty": false,
  "boundary": "FOUR",
  "isFreeHit": false,
  "isWicket": false,
  "notes": "Cover drive"
}

--------------------------

2. wicket ball (wicket: caught)
{
  "innings": 1,
  "over": 3,
  "ball": 4,
  "runsOffBat": 0,
  "extraRuns": 0,
  "isWide": false,
  "isNoBall": false,
  "isBye": false,
  "isLegBye": false,
  "isPenalty": false,
  "boundary": null,
  "isFreeHit": false,
  "isWicket": true,
  "wicket": "CAUGHT",
  "dismissedPlayerId": "uuid-of-striker",
  "fielderId": "uuid-of-fielder",
  "notes": "Great catch at mid-off"
}

--------------------------------

3. wicket ball (wicket: run-out)
{
  "innings": 1,
  "over": 5,
  "ball": 2,
  "runsOffBat": 1,
  "extraRuns": 0,
  "isWide": false,
  "isNoBall": false,
  "isBye": false,
  "isLegBye": false,
  "isPenalty": false,
  "boundary": null,
  "isFreeHit": false,
  "isWicket": true,
  "wicket": "RUN_OUT",
  "dismissedPlayerId": "uuid-of-dismissed-player",
  "survivingBatsmanPosition": "STRIKER",
  "fielderId": "uuid-of-fielder",
  "isDirectRunOut": true,
  "notes": "Direct hit from mid-on"
}

---------------------------------

*/