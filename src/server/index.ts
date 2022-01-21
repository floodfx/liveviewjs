import "reflect-metadata";
import path from "path"
import express, { Application, Request, Response } from 'express'
import { createExpressServer } from 'routing-controllers';
import { Server as HTTPServer } from 'http';
import { router } from "./live/router";
import jwt from "jsonwebtoken";
import session, {MemoryStore} from "express-session";
import { nanoid } from "nanoid";
import { wsServer } from "./socket/websocket_server";

// pull in websocket server to listen for events
wsServer

// TODO replace me with your own secret
export const SIGNING_SECRET = "blah_secret";
export const sessionStore = new MemoryStore();

const publicPath = path.join(__dirname, "..", "dist", "client");
const viewsPath = path.join(__dirname, "..", "src", "server", "views");


const app: Application = createExpressServer({
  controllers: [path.join(__dirname, '/controllers/*controller.js')]
})

app.set('view engine', 'ejs');
app.set("views", viewsPath)
const server = new HTTPServer(app);

app.use(express.static(publicPath))

// configure session storage
app.use(session({
  secret: SIGNING_SECRET,
  resave: false,
  rolling: true,
  saveUninitialized: true,
  cookie: {secure: process.env.NODE_ENV === "production"},
  store: sessionStore,
}))
// extend / define session interface
declare module 'express-session' {
  interface SessionData {
      csrfToken: string;
  }
}

// register each route path to the component to be rendered
Object.keys(router).forEach(key => {
  app.get(key, (req: Request, res: Response) => {
    // console.log("req.path", req.path)

    // render the component
    const component = router[key];
    const ctx = component.mount({}, {}, {});
    const view = component.render(ctx);

    // lookup / gen csrf token for this session
    if(!req.session.csrfToken) {
      req.session.csrfToken = nanoid();
    }

    // render the view with all the data
    res.render("index", {
      page_title: "Live View",
      csrf_meta_tag: req.session.csrfToken,
      liveViewId: nanoid(), // new LiveViewId per HTTP requess?
      session: jwt.sign(JSON.stringify(req.session), SIGNING_SECRET),
      statics: jwt.sign(JSON.stringify(view.statics), SIGNING_SECRET),
      inner_content: view.toString()
    })

  })
})

const port: number = 3002

server.listen(port, function () {
  console.log(`App is listening on port ${port} !`)
})

