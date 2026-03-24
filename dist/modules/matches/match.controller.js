import { createMatchService, listMatchesService, getMatchService, setPlayingXIService, getPlayingXIService, listMyMatchesService } from "./match.service.js";
import { assignScorerService, unassignScorerService, startMatchService, completeMatchService, } from "./match.service.js";
export async function assignScorer(req, res, next) {
    try {
        const matchId = req.params.id;
        const { userId } = req.body;
        const user = req.user;
        if (!matchId || !userId) {
            return res.status(400).json({ message: "matchId and userId required" });
        }
        const result = await assignScorerService(matchId, userId, user.userId, user.role, user.userId);
        res.status(201).json(result);
    }
    catch (e) {
        next(e);
    }
}
export async function unassignScorer(req, res, next) {
    try {
        const { id: matchId, userId } = req.params;
        const user = req.user;
        if (!matchId || !userId) {
            return res.status(400).json({ message: "matchId and userId required" });
        }
        const result = await unassignScorerService(matchId, userId, user.role, user.userId);
        res.json(result);
    }
    catch (e) {
        next(e);
    }
}
// changw2 (added venue)
export async function createMatch(req, res, next) {
    try {
        const { teamAId, teamBId, startTime, maxOvers, venue } = req.body;
        const user = req.user;
        if (!maxOvers || maxOvers <= 0) {
            return res.status(400).json({ message: "Valid maxOvers is required" });
        }
        // Validate venue length if provided
        if (venue && venue.length > 200) {
            return res.status(400).json({ message: "Venue name too long (max 200 characters)" });
        }
        const match = await createMatchService(teamAId, teamBId, startTime, maxOvers, user.userId, venue);
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
// change2
export async function getPlayingXI(req, res, next) {
    try {
        if (!req.params.id) {
            return res.status(400).json({ error: 'match id required' });
        }
        const matchId = req.params.id;
        const playingXI = await getPlayingXIService(matchId);
        res.json(playingXI);
    }
    catch (e) {
        next(e);
    }
}
// change1
export async function setPlayingXI(req, res, next) {
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
    }
    catch (e) {
        next(e);
    }
}
// change2
export async function listMyMatches(req, res, next) {
    try {
        const user = req.user;
        const page = Math.max(parseInt(req.query.page) || 1, 1);
        const limit = Math.min(parseInt(req.query.limit) || 10, 50);
        const matches = await listMyMatchesService(user.userId, user.role, page, limit);
        res.json({
            page,
            limit,
            data: matches,
        });
    }
    catch (e) {
        next(e);
    }
}
//# sourceMappingURL=match.controller.js.map