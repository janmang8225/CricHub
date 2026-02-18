import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import type{ UserRole } from "../types/role.js";

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;

  if (!header) {
    return res.status(401).json({ message: "No token" });
  }

  const token = header.split(" ")[1];
  if (!token) {
    return res.status(401).json({ message: "Invalid token format" });
  }

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as {
      userId?: string;
      role?: UserRole;
    };

    if (!decoded.userId || !decoded.role) {
      return res.status(401).json({ message: "Invalid token payload" });
    }

    (req as any).user = {
      userId: decoded.userId,
      role: decoded.role
    };
    next();
  } catch {
    return res.status(401).json({ message: "Invalid token" });
  }
}
