import { createPlayerService, getPlayersService } from "./player.service.js";
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
//# sourceMappingURL=player.controller.js.map