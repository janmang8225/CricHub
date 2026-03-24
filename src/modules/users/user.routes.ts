// src/modules/users/user.routes.ts
import { Router } from "express";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { requireRole } from "../../middlewares/role.middleware.js";
import { getUserCountByRole, getUsers, updateUserRole } from "./user.controller.js";

const router = Router();

// only admin can promote roles
router.patch(
  "/users/:id/role",
  authMiddleware,
  requireRole(["ADMIN"]),
  updateUserRole
);

// change2
router.get(
  "/users/count",
  authMiddleware,
  requireRole(["ADMIN", "CREATOR"]),
  getUserCountByRole
);

router.get(
  "/users",
  authMiddleware,
  requireRole(["ADMIN"]),
  getUsers
);


export default router;
