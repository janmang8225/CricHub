import type{ Request, Response, NextFunction } from "express";
import crypto from "crypto";

export function withCache(seconds: number) {
  return (_req: Request, res: Response, next: NextFunction) => {
    res.setHeader("Cache-Control", `public, max-age=${seconds}`);
    next();
  };
}

export function withETag(
  req: Request,
  res: Response,
  body: any
) {
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
