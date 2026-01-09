export function errorMiddleware(err, _req, res, _next) {
    res.status(400).json({
        message: err.message || "Something went wrong",
    });
}
//# sourceMappingURL=error.middleware.js.map