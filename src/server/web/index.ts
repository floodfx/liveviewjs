import "reflect-metadata";
import path from "path"
import express, { Request, Response } from 'express'
// import { router } from "../../../examples/router";
import jwt from "jsonwebtoken";
import session, {MemoryStore} from "express-session";
import { nanoid } from "nanoid";
import { PhxSocket } from "../socket/types";
import { Server } from "http";


const app = express();

// TODO replace me with your own secret
export const SIGNING_SECRET = "blah_secret";
export const sessionStore = new MemoryStore();

const publicPath = path.join(__dirname, "..", "dist", "client");
const viewsPath = path.join(__dirname, "..", "src", "server", "views");

app.set('view engine', 'ejs');
app.set("views", viewsPath)
// const server = new Server(app);

app.use((req: Request, res: Response, next: Function) => {
  console.log("req.url", req.url);
  // console.log("req.path", req.path);
  next();
});

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

// console.log("router", router);

// register each route path to the component to be rendered
// Object.keys(router).forEach(key => {
//   console.log("register route", key);
//   app.get(key, (req: Request, res: Response) => {
//     console.log("key", key);
//      // new LiveViewId per HTTP requess?
//     const liveViewId = nanoid();
//     const phxSocket: PhxSocket = {
//       id: liveViewId,
//       connected: false, // http request
//     }

//     // render the component
//     const component = router[key];
//     const ctx = component.mount({}, {}, phxSocket);
//     const view = component.render(ctx);

//     // lookup / gen csrf token for this session
//     if(!req.session.csrfToken) {
//       req.session.csrfToken = nanoid();
//     }

//     // render the view with all the data
//     res.render("index", {
//       page_title: "Live View",
//       csrf_meta_tag: req.session.csrfToken,
//       liveViewId,
//       session: jwt.sign(JSON.stringify(req.session), SIGNING_SECRET),
//       statics: jwt.sign(JSON.stringify(view.statics), SIGNING_SECRET),
//       inner_content: view.toString()
//     })

//   })
// })

export {app};

// const port: number = 3002

// server.listen(port, function () {
//   console.log(`App is listening on port ${port} !`)
// })

