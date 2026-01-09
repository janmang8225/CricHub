import type{ Request, Response, NextFunction } from "express";

export function errorMiddleware(
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  res.status(400).json({
    message: err.message || "Something went wrong",
  });
}
