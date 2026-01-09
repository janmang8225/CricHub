// src/modules/users/user.routes.ts
import { Router } from "express";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { requireRole } from "../../middlewares/role.middleware.js";
import { getUsers, updateUserRole } from "./user.controller.js";

const router = Router();

// only admin can promote roles
router.patch(
  "/users/:id/role",
  authMiddleware,
  requireRole(["ADMIN"]),
  updateUserRole
);

router.get(
  "/users",
  authMiddleware,
  requireRole(["ADMIN"]),
  getUsers
);

export default router;
