// src/modules/users/user.controller.ts
import type{ Request, Response, NextFunction } from "express";
import { getUsersService, updateUserRoleService } from "./user.service.js";
import type{ UserRole } from "../../types/role.js";

export async function updateUserRole(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const userId = req.params.id;
    const { role } = req.body as { role?: UserRole };

    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }

    if (!role) {
      return res.status(400).json({ message: "Role is required" });
    }

    // Admin cannot promote to ADMIN
    if (!["SCORER", "USER", "PLAYER"].includes(role)) {
      return res.status(400).json({ message: "Invalid role" });
    }

    const updatedUser = await updateUserRoleService(userId, role);
    res.json(updatedUser);
  } catch (e) {
    next(e);
  }
}

export async function getUsers(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { role } = req.query as { role?: UserRole };

    // optional validation
    if (role && !["USER", "SCORER", "ADMIN", "PLAYER"].includes(role)) {
      return res.status(400).json({ message: "Invalid role filter" });
    }

    const users = await getUsersService(role);
    res.json(users);
  } catch (e) {
    next(e);
  }
}
