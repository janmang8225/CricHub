import type { NextFunction, Request, Response } from "express";
import { switchInningsService } from "./innings.service.js";

// innings.controller.ts
export async function switchInnings(req: Request, res: Response, next: NextFunction) {
  try {
    const matchId = req.params.id;
    const actor = (req as Request & { user: any }).user; // did same in ball.controller.ts (idk y)

    await switchInningsService(matchId, actor);

    res.json({ message: "Innings switched" });
  } catch (e) {
    next(e);
  }
}
