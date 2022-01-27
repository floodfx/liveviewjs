import { LiveViewServer } from '../server';
import { LiveViewRouter } from '../server/types';
import { AutocompleteLiveViewComponent } from './autocomplete/component';
import { LicenseLiveViewComponent } from './license_liveview';
import { LightLiveViewComponent } from './light_liveview';
import { SearchLiveViewComponent } from './live-search/component';
import { PaginateLiveViewComponent } from './pagination/component';
import { SalesDashboardLiveViewComponent } from './sales_dashboard_liveview';
import { ServersLiveViewComponent } from './servers/component';
import { SortLiveViewComponent } from './sorting/component';

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
  "/light": new LightLiveViewComponent(),
  "/paginate": new PaginateLiveViewComponent(),
  "/sort": new SortLiveViewComponent(),
}

// register all routes
lvServer.registerLiveViewRoutes(router)

// register single route
lvServer.registerLiveViewRoute("/servers", new ServersLiveViewComponent())

// start server
lvServer.start();
