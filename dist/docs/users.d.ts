/**
 * @swagger
 * tags:
 *   name: Users
 *   description: User management endpoints (Admin only)
 */
export {};
/**
 * @swagger
 * /users:
 *   get:
 *     summary: Get all users
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     description: Retrieve all users. Only accessible by ADMIN users.
 *     responses:
 *       200:
 *         description: List of users retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/User'
 *             example:
 *               - id: 1
 *                 email: "admin@example.com"
 *                 role: "ADMIN"
 *                 createdAt: "2026-02-18T10:00:00Z"
 *                 updatedAt: "2026-02-18T10:00:00Z"
 *               - id: 2
 *                 email: "user@example.com"
 *                 role: "USER"
 *                 createdAt: "2026-02-18T10:00:00Z"
 *                 updatedAt: "2026-02-18T10:00:00Z"
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - Admin access required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               message: "Admin access required"
 *               statusCode: 403
 *
 * @swagger
 * /users/{id}/role:
 *   patch:
 *     summary: Update user role
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     description: Update a user's role. Only accessible by ADMIN users.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: User ID
 *         example: 2
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               role:
 *                 $ref: '#/components/schemas/UserRole'
 *             required:
 *               - role
 *           example:
 *             role: "SCORER"
 *     responses:
 *       200:
 *         description: User role updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *             example:
 *               id: 2
 *               email: "user@example.com"
 *               role: "SCORER"
 *               updatedAt: "2026-02-18T10:30:00Z"
 *       400:
 *         description: Invalid request data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       403:
 *         description: Forbidden - Admin access required
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               message: "User not found"
 *               statusCode: 404
 */
//# sourceMappingURL=users.d.ts.map