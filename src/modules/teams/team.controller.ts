import type { Request, Response, NextFunction } from "express";
import {
  createTeamService,
  getTeamsService,
  getPlayersByTeamService,
  addPlayerToTeamService,
  deactivatePlayerFromTeamService,
} from "./team.service.js";
import { withETag } from "../../middlewares/cache.middleware.js";

export async function createTeam(req: Request, res: Response, next: NextFunction) {
  try {
    const team = await createTeamService(req.body.name);
    res.status(201).json(team);
  } catch (e) {
    next(e);
  }
}

export async function getTeams(req: Request, res: Response, next: NextFunction) {
  try {
    const teams = await getTeamsService();
    res.json(teams);
  } catch (e) {
    next(e);
  }
}

export async function getPlayersByTeam(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { teamId } = req.params;
    if (!teamId) {
      return res.status(400).json({ error: 'teamId is required' });
    }
    const players = await getPlayersByTeamService(teamId);
    if (withETag(req, res, players)) return;
    res.json(players);
  } catch (e) {
    next(e);
  }
}


export async function addPlayerToTeam(req: Request, res: Response, next: NextFunction) {
  try {
    const { teamId, playerId } = req.params;
    if (!teamId || !playerId) {
      return res.status(400).json({ error: 'teamId and playerId are required' });
    }
    const result = await addPlayerToTeamService(teamId, playerId);
    res.status(201).json(result);
  } catch (e) {
    next(e);
  }
}

export async function deactivatePlayerFromTeam(req: Request, res: Response, next: NextFunction) {
  try {
    const { teamId, playerId } = req.params;
    if (!teamId || !playerId) {
      return res.status(400).json({ error: 'teamId and playerId are required' });
    }
    const result = await deactivatePlayerFromTeamService(teamId, playerId);
    res.json(result);
  } catch (e) {
    next(e);
  }
}
