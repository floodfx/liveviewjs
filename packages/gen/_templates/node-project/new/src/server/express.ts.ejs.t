---
to: src/server/express.ts
---
import express, { NextFunction, Request, Response } from "express";
import session, { MemoryStore } from "express-session";
import { LiveViewRouter } from "liveviewjs";

// declare flash object is added to session data in express-session middleware
declare module "express-session" {
  interface SessionData {
    flash: any;
  }
}

/**
 * Basic express configuration for <%= h.inflection.camelize(name, false) %> which includes:
 * - static file serving
 * - express-session middleware
 *
 * @param sessionSecret a secret key used to sign session cookies
 * @returns an express application
 */
export function configureExpress(sessionSecret: string) {
  const app = express();

  // add static file serving
  app.use(express.static("public"));

  // configure express-session middleware
  app.use(
    session({
      secret: sessionSecret,
      resave: false,
      rolling: true,
      saveUninitialized: true,
      cookie: {
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
      },
      store: new MemoryStore(),
    })
  );

  return app;
}

/**
 * Express middleware that logs requests to the console including:
 * - the request method
 * - whether the request is for a LiveView route
 * - the request url
 * - the current date and time
 * @param router the LiveViewRouter used to determine if a request is for a LiveView route
 * @returns the middleware function
 */
export function logRequests(router: LiveViewRouter): (req: Request, res: Response, next: NextFunction) => void {
  return async (req: Request, res: Response, next: NextFunction) => {
    const isLiveView = router.hasOwnProperty(req.path);
    console.log(`${req.method} ${isLiveView ? "LiveView" : ""} ${req.url} - ${new Date().toISOString()}`);
    next();
  };
}

/**
 * Route that Redirects the user from the root path to the /hello path
 */
export function indexHandler(req: Request, res: Response) {
  res.redirect("/hello");
}
