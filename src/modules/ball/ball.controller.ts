import type { NextFunction, Request, Response } from "express";
import { submitBallService } from "./ball.service.js";

export async function submitBall(req: Request, res: Response, next: NextFunction) {
  try {
    const matchId = req.params.id;
    const actor = (req as Request & { user: any }).user; // idk, but it works (same in innings.controller.ts)
    const ball = req.body;

    await submitBallService(matchId, actor, ball);

    res.status(201).json({ message: "Ball added" });
  } catch (e) {
    next(e);
  }
}
