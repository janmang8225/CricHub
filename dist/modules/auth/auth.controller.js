import { signupUser, loginUser } from "./auth.service.js";
export async function signup(req, res, next) {
    try {
        console.log("req signup");
        const token = await signupUser(req.body.email, req.body.password);
        res.json({ token });
        console.log("req done signup");
    }
    catch (e) {
        next(e);
    }
}
export async function login(req, res, next) {
    try {
        const token = await loginUser(req.body.email, req.body.password);
        res.json({ token });
    }
    catch (e) {
        next(e);
    }
}
//# sourceMappingURL=auth.controller.js.map