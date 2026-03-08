/**
 * @swagger
 * tags:
 *   name: Teams
 *   description: Team management endpoints
 */
export {};
/**
 * @swagger
 * /teams:
 *   post:
 *     summary: Create a new team
 *     tags: [Teams]
 *     security:
 *       - bearerAuth: []
 *     description: Create a new team. Requires ADMIN or CREATOR role.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateTeamRequest'
 *           example:
 *             name: "Mumbai Indians"
 *     responses:
 *       201:
 *         description: Team created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Team'
 *             example:
 *               id: 1
 *               name: "Mumbai Indians"
 *               createdAt: "2026-02-18T10:00:00Z"
 *               updatedAt: "2026-02-18T10:00:00Z"
 *       400:
 *         description: Invalid request data
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin or Creator access required
 *
 *   get:
 *     summary: Get all teams
 *     tags: [Teams]
 *     security:
 *       - bearerAuth: []
 *     description: Retrieve all teams. Requires authentication.
 *     responses:
 *       200:
 *         description: List of teams retrieved successfully
 *         headers:
 *           Cache-Control:
 *             description: Caching header
 *             schema:
 *               type: string
 *               example: "public, max-age=300"
 *           ETag:
 *             description: Entity tag for caching
 *             schema:
 *               type: string
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Team'
 *       401:
 *         description: Unauthorized
 *
 * @swagger
 * /teams/{teamId}/players:
 *   get:
 *     summary: Get players in a team
 *     tags: [Teams]
 *     security:
 *       - bearerAuth: []
 *     description: Retrieved all players in a specific team. Response is cached.
 *     parameters:
 *       - in: path
 *         name: teamId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Team ID
 *         example: 1
 *     responses:
 *       200:
 *         description: Team players retrieved successfully
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
 *                 $ref: '#/components/schemas/Player'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Team not found
 *
 * @swagger
 * /teams/{teamId}/players/{playerId}:
 *   post:
 *     summary: Add player to team
 *     tags: [Teams]
 *     security:
 *       - bearerAuth: []
 *     description: Add a player to a team. Requires ADMIN or CREATOR role.
 *     parameters:
 *       - in: path
 *         name: teamId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Team ID
 *         example: 1
 *       - in: path
 *         name: playerId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Player ID
 *         example: 5
 *     responses:
 *       200:
 *         description: Player added to team successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *             example:
 *               success: true
 *               message: "Player added to team successfully"
 *       400:
 *         description: Invalid request data
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin or Creator access required
 *       404:
 *         description: Team or player not found
 *
 * @swagger
 * /teams/{teamId}/players/{playerId}/deactivate:
 *   patch:
 *     summary: Remove player from team
 *     tags: [Teams]
 *     security:
 *       - bearerAuth: []
 *     description: Remove a player from a team. Requires ADMIN or CREATOR role.
 *     parameters:
 *       - in: path
 *         name: teamId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Team ID
 *         example: 1
 *       - in: path
 *         name: playerId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Player ID
 *         example: 5
 *     responses:
 *       200:
 *         description: Player removed from team successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *             example:
 *               success: true
 *               message: "Player removed from team successfully"
 *       400:
 *         description: Invalid request data
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin or Creator access required
 *       404:
 *         description: Team or player not found
 */
//# sourceMappingURL=teams.d.ts.map