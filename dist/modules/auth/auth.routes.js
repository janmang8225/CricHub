import { Router } from "express";
import { signup, login } from "./auth.controller.js";
const router = Router();
router.post("/signup", signup);
router.post("/login", login);
export default router;
//# sourceMappingURL=auth.routes.js.map