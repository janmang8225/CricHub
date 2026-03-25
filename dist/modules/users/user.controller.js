import { getUserCountByRoleService, getUsersService, updateUserRoleService } from "./user.service.js";
export async function updateUserRole(req, res, next) {
    try {
        const userId = req.params.id;
        const { role } = req.body;
        if (!userId) {
            return res.status(400).json({ message: "User ID is required" });
        }
        if (!role) {
            return res.status(400).json({ message: "Role is required" });
        }
        // Admin cannot promote to ADMIN
        if (!["SCORER", "USER", "PLAYER"].includes(role)) {
            return res.status(400).json({ message: "Invalid role" });
        }
        const updatedUser = await updateUserRoleService(userId, role);
        res.json(updatedUser);
    }
    catch (e) {
        next(e);
    }
}
export async function getUsers(req, res, next) {
    try {
        const { role } = req.query;
        // optional validation
        if (role && !["USER", "SCORER", "ADMIN", "PLAYER"].includes(role)) {
            return res.status(400).json({ message: "Invalid role filter" });
        }
        const users = await getUsersService(role);
        res.json(users);
    }
    catch (e) {
        next(e);
    }
}
// change2
export async function getUserCountByRole(req, res, next) {
    try {
        const { role } = req.query;
        if (!role || !["USER", "SCORER", "ADMIN", "CREATOR"].includes(role)) {
            return res.status(400).json({ message: "Valid role query parameter required" });
        }
        const count = await getUserCountByRoleService(role);
        res.json({ count });
    }
    catch (e) {
        next(e);
    }
}
//# sourceMappingURL=user.controller.js.map