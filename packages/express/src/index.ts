import { NextFunction, Request, Response } from "express";
import path from "path";
import { html, HtmlSafeString, SessionData, LiveViewRouter } from "liveviewjs";
import { live_flash } from "liveviewjs";
// import { AsyncFetchLiveViewComponent } from "../../examples/src/asyncfetch";
import { routeDetails } from "./routeDetails";
import { LiveViewServer } from "./live_view_server";
import {
  AutocompleteLiveViewComponent,
  DecarbonizeLiveView,
  LicenseLiveViewComponent,
  LightLiveViewComponent,
  SearchLiveViewComponent,
  PaginateLiveViewComponent,
  SalesDashboardLiveViewComponent,
  ServersLiveViewComponent,
  SortLiveViewComponent,
  VolunteerComponent,
} from "@liveviewjs/examples";

const lvServer = new LiveViewServer({
  signingSecret: "MY_VERY_SECRET_KEY",
  // port: 3002,
  // rootView: "./examples/rootView.ejs",
  viewsPath: path.join(__dirname, "views"),
  pageTitleDefaults: {
    title: "Examples",
    suffix: " · LiveViewJS",
  },
  liveViewRootTemplate: (session: SessionData, inner_content: HtmlSafeString) => html`
    <main role="main" class="container">
      <p class="alert alert-info" role="alert" phx-click="lv:clear-flash" phx-value-key="info">
        ${live_flash(session.flash, "info")}
      </p>

      <p class="alert alert-danger" role="alert" phx-click="lv:clear-flash" phx-value-key="error">
        ${live_flash(session.flash, "error")}
      </p>

      ${inner_content}
    </main>
  `,
  middleware: [
    // debugging middleware example
    (req: Request, res: Response, next: NextFunction) => {
      console.log(`${req.method} ${req.url} - ${new Date().toISOString()}`);
      next();
    },
  ],
});

const router: LiveViewRouter = {
  "/light": new LightLiveViewComponent(),
  // sub paths also work
  "/foo/light": new LightLiveViewComponent(),
  "/license": new LicenseLiveViewComponent(),
  "/sales-dashboard": new SalesDashboardLiveViewComponent(),
  "/search": new SearchLiveViewComponent(),
  "/autocomplete": new AutocompleteLiveViewComponent(),
  "/paginate": new PaginateLiveViewComponent(),
  "/sort": new SortLiveViewComponent(),
  "/servers": new ServersLiveViewComponent(),
  "/volunteers": new VolunteerComponent(),
  // "/asyncfetch": new AsyncFetchLiveViewComponent(),
  "/decarbonize": new DecarbonizeLiveView(),
};

// register all routes
lvServer.registerLiveViewRoutes(router);

// register single route
// lvServer.registerLiveViewRoute("/volunteers", new VolunteerComponent())

// add your own routes to the express app
lvServer.expressApp.get("/", (req, res) => {
  // this one renders the index of the examples
  res.render("index.html.ejs", {
    routes: routeDetails,
  });
});

// simple example of non-LiveView route not at root
lvServer.expressApp.get("/foo", (req, res) => {
  res.send("Foo!");
});

// add error handler after all routes
lvServer.expressApp.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  // show something nice to the user...
  res.status(500).send("<h1>Uh Oh.  We had a problem loading your page</h1><div>We are working on it.</div>");
});

// start server
lvServer.start();
