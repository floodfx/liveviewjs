import { NextFunction, Request, Response } from "express";

/**
 * Sammple middleware that logs the current timestamp to the console wiht
 * the request method and url.
 */
export const logTimestamp = (req: Request, res: Response, next: NextFunction) => {
  console.log(`${req.method} ${req.url} - ${new Date().toISOString()}`);
  next();
};
