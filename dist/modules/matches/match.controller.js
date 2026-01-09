import { createMatchService, listMatchesService, getMatchService } from "./match.service.js";
import { assignScorerService, unassignScorerService, startMatchService, completeMatchService, } from "./match.service.js";
export async function assignScorer(req, res, next) {
    try {
        const matchId = req.params.id;
        const { userId } = req.body;
        const admin = req.user;
        if (!matchId || !userId) {
            return res.status(400).json({ message: "matchId and userId required" });
        }
        const result = await assignScorerService(matchId, userId, admin.userId);
        res.status(201).json(result);
    }
    catch (e) {
        next(e);
    }
}
export async function unassignScorer(req, res, next) {
    try {
        const { id: matchId, userId } = req.params;
        if (!matchId || !userId) {
            return res.status(400).json({ message: "matchId and userId required" });
        }
        const result = await unassignScorerService(matchId, userId);
        res.json(result);
    }
    catch (e) {
        next(e);
    }
}
export async function createMatch(req, res, next) {
    try {
        const { teamAId, teamBId, startTime } = req.body;
        const user = req.user;
        const match = await createMatchService(teamAId, teamBId, startTime, user.userId);
        res.status(201).json(match);
    }
    catch (e) {
        next(e);
    }
}
export async function listMatches(req, res, next) {
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
        const page = Math.max(parseInt(req.query.page) || 1, 1);
        const limit = Math.min(parseInt(req.query.limit) || 10, 50);
        const matches = await listMatchesService(page, limit);
        res.json({
            page,
            limit,
            data: matches,
        });
    }
    catch (e) {
        next(e);
    }
    //   call it like this:
    //   /matches ->                  page 1, 10 items
    //   /matches?page=2 ->           page 2, 10 items
    //   /matches?page=1&limit=20 ->  page 1, 20 items
}
export async function getMatch(req, res, next) {
    try {
        if (!req.params.id) {
            return res.status(400).json({ error: 'match id required' });
        }
        const match = await getMatchService(req.params.id);
        res.json(match);
    }
    catch (e) {
        next(e);
    }
}
export async function startMatchController(req, res, next) {
    try {
        if (!req.params.id) {
            return res.status(400).json({ error: 'match id required' });
        }
        const matchId = req.params.id;
        await startMatchService(matchId);
        res.json({ message: "Match started" });
    }
    catch (err) {
        next(err);
    }
}
export async function completeMatchController(req, res, next) {
    try {
        if (!req.params.id) {
            return res.status(400).json({ error: 'match id required' });
        }
        const matchId = req.params.id;
        await completeMatchService(matchId);
        res.json({ message: "Match completed" });
    }
    catch (err) {
        next(err);
    }
}
//# sourceMappingURL=match.controller.js.map