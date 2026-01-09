import { submitBallService } from "./ball.service.js";
export async function submitBall(req, res, next) {
    try {
        const matchId = req.params.id;
        const actor = req.user; // idk, but it works (same in innings.controller.ts)
        const ball = req.body;
        await submitBallService(matchId, actor, ball);
        res.status(201).json({ message: "Ball added" });
    }
    catch (e) {
        next(e);
    }
}
//# sourceMappingURL=ball.controller.js.map