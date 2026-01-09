import type { Request, Response, NextFunction } from "express";
import type { UserRole } from "../types/role.js";
export declare function requireRole(allowed: UserRole[]): (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
//# sourceMappingURL=role.middleware.d.ts.map