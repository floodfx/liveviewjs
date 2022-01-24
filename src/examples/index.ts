import { LiveViewServer } from '../server';
import { LiveViewRouter } from '../server/types';
import { AutocompleteLiveViewComponent } from './autocomplete/component';
import { LicenseLiveViewComponent } from './license_liveview';
import { LightLiveViewComponent } from './light_liveview';
import { SearchLiveViewComponent } from './live-search/component';
import { SalesDashboardLiveViewComponent } from './sales_dashboard_liveview';

const lvServer = new LiveViewServer({
  // port: 3002,
  // rootView: "./examples/rootView.ejs",
  // viewsPath: "./examples/views",
  // support different templates?
});

export const router: LiveViewRouter = {
  "/license": new LicenseLiveViewComponent(),
  '/sales-dashboard': new SalesDashboardLiveViewComponent(),
  '/search': new SearchLiveViewComponent(),
  "/autocomplete": new AutocompleteLiveViewComponent(),
}

// register all routes
lvServer.registerLiveViewRoutes(router)

// register single route
lvServer.registerLiveViewRoute("/light", new LightLiveViewComponent())

// start server
lvServer.start();
