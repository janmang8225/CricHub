import crypto from "crypto";
export function withCache(seconds) {
    return (_req, res, next) => {
        res.setHeader("Cache-Control", `public, max-age=${seconds}`);
        next();
    };
}
export function withETag(req, res, body) {
    const etag = crypto
        .createHash("sha1")
        .update(JSON.stringify(body))
        .digest("hex");
    if (req.headers["if-none-match"] === etag) {
        res.status(304).end();
        return true;
    }
    res.setHeader("ETag", etag);
    return false;
}
//# sourceMappingURL=cache.middleware.js.map