/**
 * @swagger
 * tags:
 *   name: Players
 *   description: Player management endpoints
 */

/**
 * @swagger
 * /players:
 *   post:
 *     summary: Create a new player
 *     tags: [Players]
 *     security:
 *       - bearerAuth: []
 *     description: Create a new player. Requires ADMIN or CREATOR role.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreatePlayerRequest'
 *           example:
 *             name: "Virat Kohli"
 *     responses:
 *       201:
 *         description: Player created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Player'
 *             example:
 *               id: 1
 *               name: "Virat Kohli"
 *               isBatsman: false
 *               isBowler: false
 *               isWicketKeeper: false
 *               teamId: null
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
 *     summary: Get all players
 *     tags: [Players]
 *     security:
 *       - bearerAuth: []
 *     description: Retrieve all players. Requires authentication.
 *     responses:
 *       200:
 *         description: List of players retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Player'
 *             example:
 *               - id: 1
 *                 name: "Virat Kohli"
 *                 isBatsman: true
 *                 isBowler: false
 *                 isWicketKeeper: false
 *                 teamId: 1
 *                 createdAt: "2026-02-18T10:00:00Z"
 *                 updatedAt: "2026-02-18T10:00:00Z"
 *               - id: 2
 *                 name: "MS Dhoni"
 *                 isBatsman: true
 *                 isBowler: false
 *                 isWicketKeeper: true
 *                 teamId: 1
 *                 createdAt: "2026-02-18T10:00:00Z"
 *                 updatedAt: "2026-02-18T10:00:00Z"
 *       401:
 *         description: Unauthorized
 *
 * @swagger
 * /players/{id}/role:
 *   patch:
 *     summary: Update player role/skills
 *     tags: [Players]
 *     security:
 *       - bearerAuth: []
 *     description: Update a player's batting, bowling, and wicket-keeping abilities. Requires ADMIN or CREATOR role.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Player ID
 *         example: 1
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdatePlayerRoleRequest'
 *           example:
 *             isBatsman: true
 *             isBowler: false
 *             isWicketKeeper: false
 *     responses:
 *       200:
 *         description: Player role updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Player'
 *       400:
 *         description: Invalid request data
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin or Creator access required
 *       404:
 *         description: Player not found
 */
