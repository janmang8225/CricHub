import type { Request, Response, NextFunction } from "express";
import { signupUser, loginUser } from "./auth.service.js";

export async function signup(req: Request, res: Response, next: NextFunction) {
  try {
    console.log("req signup")
    const token = await signupUser(req.body.email, req.body.password, req.body.role);
    res.json({ token });
    console.log("req done signup")
  } catch (e) {
    next(e);
  }
}

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const token = await loginUser(req.body.email, req.body.password);
    res.json({ token });
  } catch (e) {
    next(e);
  }
}
