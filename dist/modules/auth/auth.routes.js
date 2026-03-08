import { Router } from "express";
import { signup, login } from "./auth.controller.js";
import { authRateLimiter } from "../../middlewares/rateLimit.middleware.js";
const router = Router();
router.post("/signup", authRateLimiter, signup);
router.post("/login", authRateLimiter, login);
export default router;
//# sourceMappingURL=auth.routes.js.map