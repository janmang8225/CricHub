/**
 * @swagger
 * tags:
 *   name: Scoring
 *   description: Live cricket scoring and match state management endpoints
 */
export {};
/**
 * @swagger
 * /matches/{id}/scores/init:
 *   post:
 *     summary: Initialize match scores
 *     tags: [Scoring]
 *     security:
 *       - bearerAuth: []
 *     description: Initialize scores for a match. Requires ADMIN, SCORER, or CREATOR role.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Match ID
 *         example: 1
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               battingTeamId:
 *                 type: integer
 *                 description: ID of the team that will bat first
 *             required:
 *               - battingTeamId
 *           example:
 *             battingTeamId: 1
 *     responses:
 *       201:
 *         description: Scores initialized successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Score'
 *       400:
 *         description: Invalid request data or scores already initialized
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin, Scorer, or Creator access required
 *       404:
 *         description: Match not found
 *
 * @swagger
 * /matches/{id}/scores:
 *   patch:
 *     summary: Update match score
 *     tags: [Scoring]
 *     security:
 *       - bearerAuth: []
 *     description: Update the current match score. Requires SCORER, ADMIN, or CREATOR role.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Match ID
 *         example: 1
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               runs:
 *                 type: integer
 *                 minimum: 0
 *                 description: Total runs scored
 *               wickets:
 *                 type: integer
 *                 minimum: 0
 *                 maximum: 10
 *                 description: Total wickets fallen
 *               overs:
 *                 type: number
 *                 minimum: 0
 *                 description: Overs completed
 *               balls:
 *                 type: integer
 *                 minimum: 0
 *                 description: Total balls faced
 *               extras:
 *                 type: integer
 *                 minimum: 0
 *                 description: Extra runs
 *           example:
 *             runs: 85
 *             wickets: 3
 *             overs: 12.4
 *             balls: 76
 *             extras: 8
 *     responses:
 *       200:
 *         description: Score updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Score'
 *       400:
 *         description: Invalid score data
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Scorer, Admin, or Creator access required
 *       404:
 *         description: Match not found
 *
 * @swagger
 * /matches/{id}/score:
 *   get:
 *     summary: Get current match score
 *     tags: [Scoring]
 *     security: []
 *     description: |
 *       Get the current score of a match. Public endpoint with caching.
 *
 *       **Cache:** Response cached with ETag support for better performance
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Match ID
 *         example: 1
 *     responses:
 *       200:
 *         description: Current score retrieved successfully
 *         headers:
 *           Cache-Control:
 *             description: Caching header
 *             schema:
 *               type: string
 *               example: "public, max-age=30"
 *           ETag:
 *             description: Entity tag for caching
 *             schema:
 *               type: string
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Score'
 *       404:
 *         description: Match or score not found
 *
 * @swagger
 * /matches/{id}/current-inning:
 *   get:
 *     summary: Get current innings information
 *     tags: [Scoring]
 *     security:
 *       - bearerAuth: []
 *     description: Get information about the current innings.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Match ID
 *         example: 1
 *     responses:
 *       200:
 *         description: Current innings information retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 inningsNumber:
 *                   type: integer
 *                   description: Current innings number (1 or 2)
 *                   example: 1
 *                 battingTeamId:
 *                   type: integer
 *                   description: ID of team currently batting
 *                   example: 1
 *                 bowlingTeamId:
 *                   type: integer
 *                   description: ID of team currently bowling
 *                   example: 2
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Match not found
 *
 * @swagger
 * /matches/{id}/batting-state:
 *   get:
 *     summary: Get current batting state
 *     tags: [Scoring]
 *     security:
 *       - bearerAuth: []
 *     description: Get detailed batting state including current batsmen. Requires ADMIN, SCORER, or CREATOR role.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Match ID
 *         example: 1
 *     responses:
 *       200:
 *         description: Batting state retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 striker:
 *                   type: object
 *                   properties:
 *                     playerId:
 *                       type: integer
 *                     runs:
 *                       type: integer
 *                     ballsFaced:
 *                       type: integer
 *                 nonStriker:
 *                   type: object
 *                   properties:
 *                     playerId:
 *                       type: integer
 *                     runs:
 *                       type: integer
 *                     ballsFaced:
 *                       type: integer
 *                 currentBowler:
 *                   type: object
 *                   properties:
 *                     playerId:
 *                       type: integer
 *                     oversBowled:
 *                       type: number
 *                     wicketsTaken:
 *                       type: integer
 *                     runsConceded:
 *                       type: integer
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin, Scorer, or Creator access required
 *       404:
 *         description: Match not found
 *
 * @swagger
 * /matches/{id}/openers:
 *   post:
 *     summary: Set opening batsmen
 *     tags: [Scoring]
 *     security:
 *       - bearerAuth: []
 *     description: Set the opening batsmen for the innings. Requires SCORER, ADMIN, or CREATOR role.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Match ID
 *         example: 1
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               striker:
 *                 type: integer
 *                 description: Player ID of the striker
 *               nonStriker:
 *                 type: integer
 *                 description: Player ID of the non-striker
 *             required:
 *               - striker
 *               - nonStriker
 *           example:
 *             striker: 1
 *             nonStriker: 2
 *     responses:
 *       200:
 *         description: Opening batsmen set successfully
 *       400:
 *         description: Invalid player IDs or players not in batting team
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Scorer, Admin, or Creator access required
 *       404:
 *         description: Match not found
 *
 * @swagger
 * /matches/{id}/next-batsman:
 *   post:
 *     summary: Set next batsman
 *     tags: [Scoring]
 *     security:
 *       - bearerAuth: []
 *     description: Set the next batsman when a wicket falls. Requires SCORER, ADMIN, or CREATOR role.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Match ID
 *         example: 1
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               playerId:
 *                 type: integer
 *                 description: Player ID of the next batsman
 *             required:
 *               - playerId
 *           example:
 *             playerId: 3
 *     responses:
 *       200:
 *         description: Next batsman set successfully
 *       400:
 *         description: Invalid player ID or player not available
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Scorer, Admin, or Creator access required
 *       404:
 *         description: Match not found
 *
 * @swagger
 * /matches/{id}/start:
 *   post:
 *     summary: Start the match
 *     tags: [Scoring]
 *     security:
 *       - bearerAuth: []
 *     description: Start the match officially. Requires ADMIN, SCORER, or CREATOR role.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Match ID
 *         example: 1
 *     responses:
 *       200:
 *         description: Match started successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       400:
 *         description: Match cannot be started (missing playing XI, scores not initialized, etc.)
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin, Scorer, or Creator access required
 *       404:
 *         description: Match not found
 *
 * @swagger
 * /matches/{id}/milestones:
 *   get:
 *     summary: Get match milestones
 *     tags: [Scoring]
 *     security: []
 *     description: |
 *       Get significant milestones reached in the match (centuries, half-centuries, etc.).
 *       Public endpoint with caching.
 *
 *       **Cache:** Response cached for better performance
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Match ID
 *         example: 1
 *     responses:
 *       200:
 *         description: Milestones retrieved successfully
 *         headers:
 *           Cache-Control:
 *             description: Caching header
 *             schema:
 *               type: string
 *           ETag:
 *             description: Entity tag for caching
 *             schema:
 *               type: string
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   type:
 *                     type: string
 *                     enum: ["FIFTY", "CENTURY", "HATTRICK", "FIFER"]
 *                     description: Type of milestone
 *                   playerId:
 *                     type: integer
 *                     description: Player who achieved the milestone
 *                   value:
 *                     type: integer
 *                     description: Milestone value (runs, wickets, etc.)
 *                   achievedAt:
 *                     type: string
 *                     format: "date-time"
 *                     description: When milestone was achieved
 *       404:
 *         description: Match not found
 */
//# sourceMappingURL=scores.js.map