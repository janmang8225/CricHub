import type{ Request, Response, NextFunction } from "express";
import {
  initScoresService,
  updateScoreService,
  getScoreService,
  startMatchService,
  getCurrentInningService,
  getBattingStateService,
  setOpenersService,
  setNextBatsmanService,
  setBowlerService,
  updateStrikeService
} from "./score.service.js";

export async function initScores(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.params.id) {
        return res.status(400).json({ message: "matchId is required" });
    }
    const matchId = req.params.id;
    const result = await initScoresService(matchId);
    res.status(201).json(result);
  } catch (e) {
    next(e);
  }
}

export async function updateScore(req: Request, res: Response, next: NextFunction) {
  try {
    const matchId = req.params.id;
    const { teamId, runs, wickets, overs } = req.body;

    if (!teamId) {
      return res.status(400).json({ message: "teamId is required" });
    }

    if (!matchId) {
        return res.status(400).json({ message: "matchId is required" });
    }

    const updated = await updateScoreService(matchId, teamId, runs, wickets, overs, (req as any).user);
    res.json(updated);
  } catch (e) {
    next(e);
  }
}

export async function getCurrentInning(req: Request, res: Response, next: NextFunction) {
  try {
    const matchId = req.params.id;
    if(!matchId || typeof matchId !== "string") {
      return res.status(400).json({ message: "Invalid matchId" });
    }
    const inning = await getCurrentInningService(matchId);
    res.json({ inning });
  } catch (err) {
    next(err);
  }
}


export async function getScore(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.params.id) {
        return res.status(400).json({ message: "matchId is required" });
    }
    const matchId = req.params.id;
    const score = await getScoreService(matchId);
    res.json(score);
  } catch (e) {
    next(e);
  }
}

export async function getBattingState(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const matchId = req.params.id;

    if (!matchId || typeof matchId !== "string") {
      return res.status(400).json({ message: "Invalid matchId" });
    }

    const state = await getBattingStateService(matchId);
    res.json(state);
  } catch (e) {
    next(e);
  }
}

export async function setOpeners(req: Request, res: Response, next: NextFunction) {
  try {
    const matchId = req.params.id;
    const { strikerId, nonStrikerId } = req.body;

    if (!matchId || !strikerId || !nonStrikerId) {
      return res.status(400).json({ message: "Invalid input" });
    }

    await setOpenersService(matchId, strikerId, nonStrikerId);
    res.json({ message: "Openers set" });
  } catch (e) {
    next(e);
  }
}

export async function updateStrikeController(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const matchId = req.params.id;
    const { strikerId, nonStrikerId } = req.body;

    if (!matchId || !strikerId || !nonStrikerId) {
      return res.status(400).json({ message: "Invalid input" });
    }

    await updateStrikeService(matchId, strikerId, nonStrikerId); 
    res.json({ message: "Strike updated" });
  } catch (e) {
    next(e);
  }
}


export async function setNextBatsman(req: Request, res: Response, next: NextFunction) {
  try {
    const matchId = req.params.id;
    const { newBatsmanId } = req.body;

    if (!matchId || !newBatsmanId) {
      return res.status(400).json({ message: "Invalid input" });
    }

    await setNextBatsmanService(matchId, newBatsmanId);
    res.json({ message: "Next batsman set" });
  } catch (e) {
    next(e);
  }
}

export async function setBowler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const matchId = req.params.id;
    const over = Number(req.params.over);
    const { bowlerId } = req.body;

    if (!matchId || !bowlerId || isNaN(over)) {
      return res.status(400).json({ message: "Invalid input" });
    }

    await setBowlerService(matchId, over, bowlerId);
    res.json({ message: "Bowler set for over" });
  } catch (e) {
    next(e);
  }
}

export async function startMatch(req: Request, res: Response, next: NextFunction) {
  try {
    const matchId = req.params.id;
    const { tossWinnerTeamId, tossDecision } = req.body; // BAT | BOWL

    if (!matchId || !tossWinnerTeamId || !tossDecision) {
      return res.status(400).json({ message: "tossWinnerTeamId and tossDecision required" });
    }

    await startMatchService(matchId, tossWinnerTeamId, tossDecision);
    res.json({ message: "Match started" });
  } catch (e) {
    next(e);
  }
}
