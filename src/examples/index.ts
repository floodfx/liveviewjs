import path from 'path';
import { LiveViewServer } from '../server';
import { LiveViewRouter } from '../server/component/types';
import { AutocompleteLiveViewComponent } from './autocomplete/component';
import { LicenseLiveViewComponent } from './license_liveview';
import { LightLiveViewComponent } from './light_liveview';
import { SearchLiveViewComponent } from './live-search/component';
import { PaginateLiveViewComponent } from './pagination/component';
import { SalesDashboardLiveViewComponent } from './sales_dashboard_liveview';
import { ServersLiveViewComponent } from './servers/component';
import { SortLiveViewComponent } from './sorting/component';
import { routeDetails } from './routeDetails';
import { VolunteerComponent } from './volunteers/component';

const lvServer = new LiveViewServer({
  signingSecret: "MY_VERY_SECRET_KEY",
  // port: 3002,
  // rootView: "./examples/rootView.ejs",
  viewsPath: path.join(__dirname, "views"),
});


const router: LiveViewRouter = {
  "/light": new LightLiveViewComponent(),
  "/license": new LicenseLiveViewComponent(),
  '/sales-dashboard': new SalesDashboardLiveViewComponent(),
  '/search': new SearchLiveViewComponent(),
  "/autocomplete": new AutocompleteLiveViewComponent(),
  "/paginate": new PaginateLiveViewComponent(),
  "/sort": new SortLiveViewComponent(),
  '/servers': new ServersLiveViewComponent(),
  "/volunteers": new VolunteerComponent()
}

// register all routes
lvServer.registerLiveViewRoutes(router)

// register single route
// lvServer.registerLiveViewRoute("/volunteers", new VolunteerComponent())

// add your own routes to the express app
lvServer.expressApp.get("/", (req, res) => {

  // this one renders the index of the examples
  res.render("index.html.ejs", {
    routes: Object.keys(router).map(path => {
      return routeDetails.find(route => route.path === path)
    })
  });
})

// start server
lvServer.start();

