import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
export function authMiddleware(req, res, next) {
    const header = req.headers.authorization;
    if (!header) {
        return res.status(401).json({ message: "No token" });
    }
    const token = header.split(" ")[1];
    if (!token) {
        return res.status(401).json({ message: "Invalid token format" });
    }
    try {
        const decoded = jwt.verify(token, env.JWT_SECRET);
        if (!decoded.userId || !decoded.role) {
            return res.status(401).json({ message: "Invalid token payload" });
        }
        req.user = {
            userId: decoded.userId,
            role: decoded.role
        };
        next();
    }
    catch {
        return res.status(401).json({ message: "Invalid token" });
    }
}
//# sourceMappingURL=auth.middleware.js.map