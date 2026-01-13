import { createPlayerService, getPlayersService, updatePlayerRoleService } from "./player.service.js";
export async function createPlayer(req, res, next) {
    try {
        const player = await createPlayerService(req.body.name);
        res.status(201).json(player);
    }
    catch (e) {
        next(e);
    }
}
export async function getPlayers(req, res, next) {
    try {
        const players = await getPlayersService();
        res.json(players);
    }
    catch (e) {
        next(e);
    }
}
// change1
export async function updatePlayerRole(req, res, next) {
    try {
        const playerId = req.params.id;
        const { isBatsman, isBowler, isWicketKeeper } = req.body;
        // Type validation
        if (typeof isBatsman !== 'boolean' || typeof isBowler !== 'boolean' || typeof isWicketKeeper !== 'boolean') {
            return res.status(400).json({ message: "Invalid role types" });
        }
        if (!playerId) {
            return res.status(400).json({ message: "Player ID is required" });
        }
        const player = await updatePlayerRoleService(playerId, isBatsman, isBowler, isWicketKeeper);
        res.json(player);
    }
    catch (e) {
        next(e);
    }
}
//# sourceMappingURL=player.controller.js.map