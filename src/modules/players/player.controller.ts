// player.controller.ts
import type { Request, Response, NextFunction } from "express";
import { createPlayerService, getPlayersService } from "./player.service.js";

export async function createPlayer(req: Request, res: Response, next: NextFunction) {
  try {
    const player = await createPlayerService(req.body.name);
    res.status(201).json(player);
  } catch (e) {
    next(e);
  }
}

export async function getPlayers(req: Request, res: Response, next: NextFunction) {
  try {
    const players = await getPlayersService();
    res.json(players);
  } catch (e) {
    next(e);
  }
}
