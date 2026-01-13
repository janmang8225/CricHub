// match.controller.ts
import type { Request, Response, NextFunction } from "express";
import { createMatchService, listMatchesService, getMatchService, setPlayingXIService } from "./match.service.js";
import {
  assignScorerService,
  unassignScorerService,
  startMatchService,
  completeMatchService,
} from "./match.service.js";

export async function assignScorer(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const matchId = req.params.id;
    const { userId } = req.body;
    const admin = (req as any).user;

    if (!matchId || !userId) {
      return res.status(400).json({ message: "matchId and userId required" });
    }

    const result = await assignScorerService(
      matchId,
      userId,
      admin.userId
    );

    res.status(201).json(result);
  } catch (e) {
    next(e);
  }
}

export async function unassignScorer(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { id: matchId, userId } = req.params;

    if (!matchId || !userId) {
      return res.status(400).json({ message: "matchId and userId required" });
    }

    const result = await unassignScorerService(matchId, userId);
    res.json(result);
  } catch (e) {
    next(e);
  }
}

export async function createMatch(req: Request, res: Response, next: NextFunction) {
  try {
    const { teamAId, teamBId, startTime, maxOvers } = req.body;
    const user = (req as any).user;
    if (!maxOvers || maxOvers <= 0) {
      return res.status(400).json({ message: "Valid maxOvers is required" });
    }
    const match = await createMatchService(teamAId, teamBId, startTime, maxOvers, user.userId);
    res.status(201).json(match);
  } catch (e) {
    next(e);
  }
}

export async function listMatches(req: Request, res: Response, next: NextFunction) {
  
  // OLD CODE (before pagination)
  // try {
  //   const matches = await listMatchesService();
  //   res.json(matches);
  // } catch (e) {
  //   next(e);
  // }
  // END OF OLD CODE

  // NEW CODE (implemented pagination)
  try {
    const page = Math.max(parseInt(req.query.page as string) || 1, 1);
    const limit = Math.min(parseInt(req.query.limit as string) || 10, 50);

    const matches = await listMatchesService(page, limit);

    res.json({
      page,
      limit,
      data: matches,
    });
  } catch (e) {
    next(e);
  }

  //   call it like this:
  //   /matches ->                  page 1, 10 items
  //   /matches?page=2 ->           page 2, 10 items
  //   /matches?page=1&limit=20 ->  page 1, 20 items
}

export async function getMatch(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.params.id) {
      return res.status(400).json({ error: 'match id required' });
    }
    const match = await getMatchService(req.params.id);
    res.json(match);
  } catch (e) {
    next(e);
  }
}

export async function startMatchController(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.params.id) {
      return res.status(400).json({ error: 'match id required' });
    }
    const matchId = req.params.id;
    await startMatchService(matchId);
    res.json({ message: "Match started" });
  } catch (err) {
    next(err);
  }
}

export async function completeMatchController(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.params.id) {
      return res.status(400).json({ error: 'match id required' });
    }
    const matchId = req.params.id;
    await completeMatchService(matchId);
    res.json({ message: "Match completed" });
  } catch (err) {
    next(err);
  }
}

// change1
export async function setPlayingXI(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.params.id) {
      return res.status(400).json({ error: 'match id required' });
    }
    const matchId = req.params.id;
    const { teamId, players } = req.body;
    
    // Type validation
    if (!teamId || !Array.isArray(players) || players.length !== 11) {
      return res.status(400).json({ message: "teamId and 11 players required" });
    }
    
    // Validate each player object
    for (const p of players) {
      if (!p.playerId || typeof p.playerId !== 'string') {
        return res.status(400).json({ message: "Invalid player data" });
      }
      if (typeof p.isCaptain !== 'boolean' || typeof p.isViceCaptain !== 'boolean' || 
          typeof p.isWicketKeeper !== 'boolean' || typeof p.isSubstitute !== 'boolean') {
        return res.status(400).json({ message: "Invalid player role flags" });
      }
    }
    
    await setPlayingXIService(matchId, teamId, players);
    res.status(201).json({ message: "Playing XI set" });
  } catch (e) {
    next(e);
  }
}