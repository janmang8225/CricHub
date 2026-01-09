import type{ Request, Response, NextFunction } from "express";
import type{ UserRole } from "../types/role.js";

export function requireRole(allowed: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user;

    if (!user || !user.role) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (!allowed.includes(user.role)) {
      return res.status(403).json({ message: "Forbidden" });
    }

    next();
  };
}
