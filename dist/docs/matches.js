/**
 * @swagger
 * tags:
 *   name: Matches
 *   description: Match management and live scoring endpoints
 */
export {};
/**
 * @swagger
 * /matches:
 *   post:
 *     summary: Create a new match
 *     tags: [Matches]
 *     security:
 *       - bearerAuth: []
 *     description: Create a new cricket match. Requires ADMIN or CREATOR role.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateMatchRequest'
 *           example:
 *             teamAId: 1
 *             teamBId: 2
 *             format: "T20"
 *     responses:
 *       201:
 *         description: Match created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Match'
 *       400:
 *         description: Invalid request data
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin or Creator access required
 *
 *   get:
 *     summary: Get all matches
 *     tags: [Matches]
 *     security: []
 *     description: |
 *       Retrieve all matches. Public endpoint with rate limiting (60 requests/minute) and caching.
 *
 *       **Rate Limit:** 60 requests per minute per IP
 *
 *       **Cache:** Response cached with ETag support
 *     responses:
 *       200:
 *         description: List of matches retrieved successfully
 *         headers:
 *           X-RateLimit-Limit:
 *             description: Rate limit maximum requests
 *             schema:
 *               type: integer
 *               example: 60
 *           X-RateLimit-Remaining:
 *             description: Rate limit remaining requests
 *             schema:
 *               type: integer
 *               example: 59
 *           X-RateLimit-Reset:
 *             description: Rate limit reset time
 *             schema:
 *               type: integer
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
 *                 $ref: '#/components/schemas/Match'
 *       429:
 *         description: Rate limit exceeded
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               message: "Too many requests, please try again later"
 *               statusCode: 429
 *
 * @swagger
 * /matches/{id}:
 *   get:
 *     summary: Get specific match
 *     tags: [Matches]
 *     security: []
 *     description: |
 *       Retrieve a specific match by ID. Public endpoint with rate limiting and caching.
 *
 *       **Rate Limit:** 60 requests per minute per IP
 *
 *       **Cache:** Response cached with ETag support
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
 *         description: Match retrieved successfully
 *         headers:
 *           X-RateLimit-Limit:
 *             description: Rate limit maximum requests
 *             schema:
 *               type: integer
 *           X-RateLimit-Remaining:
 *             description: Rate limit remaining requests
 *             schema:
 *               type: integer
 *           X-RateLimit-Reset:
 *             description: Rate limit reset time
 *             schema:
 *               type: integer
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
 *               $ref: '#/components/schemas/Match'
 *       404:
 *         description: Match not found
 *       429:
 *         description: Rate limit exceeded
 *
 * @swagger
 * /matches/{id}/scorers:
 *   post:
 *     summary: Assign scorer to match
 *     tags: [Matches]
 *     security:
 *       - bearerAuth: []
 *     description: Assign a scorer to a match. Requires ADMIN or CREATOR role.
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
 *               userId:
 *                 type: integer
 *                 description: User ID to assign as scorer
 *             required:
 *               - userId
 *           example:
 *             userId: 5
 *     responses:
 *       200:
 *         description: Scorer assigned successfully
 *       400:
 *         description: Invalid request data
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin or Creator access required
 *       404:
 *         description: Match or user not found
 *
 * @swagger
 * /matches/{id}/scorers/{userId}/deactivate:
 *   patch:
 *     summary: Unassign scorer from match
 *     tags: [Matches]
 *     security:
 *       - bearerAuth: []
 *     description: Remove a scorer from a match. Requires ADMIN or CREATOR role.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Match ID
 *         example: 1
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *         description: User ID to unassign
 *         example: 5
 *     responses:
 *       200:
 *         description: Scorer unassigned successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin or Creator access required
 *       404:
 *         description: Match or scorer not found
 *
 * @swagger
 * /matches/{id}/playing-xi:
 *   post:
 *     summary: Set playing XI for teams
 *     tags: [Matches]
 *     security:
 *       - bearerAuth: []
 *     description: Set the playing XI (11 players) for both teams. Requires ADMIN or CREATOR role.
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
 *               teamAPlayingXI:
 *                 $ref: '#/components/schemas/PlayingXI'
 *               teamBPlayingXI:
 *                 $ref: '#/components/schemas/PlayingXI'
 *             required:
 *               - teamAPlayingXI
 *               - teamBPlayingXI
 *           example:
 *             teamAPlayingXI:
 *               teamId: 1
 *               playerIds: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]
 *             teamBPlayingXI:
 *               teamId: 2
 *               playerIds: [12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22]
 *     responses:
 *       200:
 *         description: Playing XI set successfully
 *       400:
 *         description: Invalid request data (must have exactly 11 players per team)
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin or Creator access required
 *       404:
 *         description: Match not found
 *
 * @swagger
 * /matches/{id}/balls:
 *   post:
 *     summary: Submit ball data
 *     tags: [Matches]
 *     security:
 *       - bearerAuth: []
 *     description: Submit ball-by-ball data for live scoring. Requires authentication.
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
 *                 maximum: 6
 *                 description: Runs scored on this ball
 *               extras:
 *                 type: integer
 *                 minimum: 0
 *                 description: Extra runs (wides, no-balls, byes, leg-byes)
 *               isWicket:
 *                 type: boolean
 *                 description: Whether a wicket fell on this ball
 *               ballType:
 *                 type: string
 *                 enum: ["NORMAL", "WIDE", "NO_BALL", "BYE", "LEG_BYE"]
 *                 description: Type of ball bowled
 *             required:
 *               - runs
 *               - ballType
 *           example:
 *             runs: 4
 *             extras: 0
 *             isWicket: false
 *             ballType: "NORMAL"
 *     responses:
 *       201:
 *         description: Ball data submitted successfully
 *       400:
 *         description: Invalid ball data
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Match not found
 *
 * @swagger
 * /matches/{id}/innings/switch:
 *   post:
 *     summary: Switch innings
 *     tags: [Matches]
 *     security:
 *       - bearerAuth: []
 *     description: Switch from first innings to second innings. Requires ADMIN, SCORER, or CREATOR role.
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
 *         description: Innings switched successfully
 *       400:
 *         description: Cannot switch innings at this time
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin, Scorer, or Creator access required
 *       404:
 *         description: Match not found
 */
//# sourceMappingURL=matches.js.map