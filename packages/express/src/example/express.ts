import express, { NextFunction, Request, Response } from "express";
import session, { MemoryStore } from "express-session";
import { LiveViewRouter } from "liveviewjs";

// declare flash object is added to session data in express-session middleware
declare module "express-session" {
  interface SessionData {
    flash: any;
  }
}

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

export function logRequests(router: LiveViewRouter): (req: Request, res: Response, next: NextFunction) => void {
  return async (req: Request, res: Response, next: NextFunction) => {
    const isLiveView = router.hasOwnProperty(req.path);
    console.log(`${req.method} ${isLiveView ? "LiveView" : ""} ${req.url} - ${new Date().toISOString()}`);
    next();
  };
}
