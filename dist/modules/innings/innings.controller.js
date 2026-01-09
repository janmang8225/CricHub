import { switchInningsService } from "./innings.service.js";
// innings.controller.ts
export async function switchInnings(req, res, next) {
    try {
        const matchId = req.params.id;
        const actor = req.user; // did same in ball.controller.ts (idk y)
        await switchInningsService(matchId, actor);
        res.json({ message: "Innings switched" });
    }
    catch (e) {
        next(e);
    }
}
//# sourceMappingURL=innings.controller.js.map