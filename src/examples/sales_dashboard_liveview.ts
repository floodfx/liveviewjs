import {
  BaseLiveView,
  html,
  LiveViewContext,
  LiveViewExternalEventListener,
  LiveViewInternalEventListener,
  LiveViewMountParams,
  LiveViewSocket,
  SessionData,
} from "../server";
import { numberToCurrency } from "./utils";

// generate a random number between min and max
const random = (min: number, max: number): (() => number) => {
  return () => Math.floor(Math.random() * (max - min + 1)) + min;
};

const randomSalesAmount = random(100, 1000);
const randomNewOrders = random(5, 20);
const randomSatisfaction = random(95, 100);

export interface SalesDashboardContext extends LiveViewContext {
  newOrders: number;
  salesAmount: number;
  satisfaction: number;
}

export class SalesDashboardLiveViewComponent
  extends BaseLiveView<SalesDashboardContext, unknown>
  implements
    LiveViewExternalEventListener<SalesDashboardContext, "refresh", any>,
    LiveViewInternalEventListener<SalesDashboardContext, "tick">
{
  mount(params: LiveViewMountParams, session: Partial<SessionData>, socket: LiveViewSocket<SalesDashboardContext>) {
    if (socket.connected) {
      socket.repeat(() => {
        socket.send("tick");
      }, 1000);
    }
    socket.assign(generateSalesDashboardContext());
  }

  render(context: SalesDashboardContext) {
    return html`
      <h1>Sales Dashboard</h1>
      <div id="dashboard">
        <div class="stats">
          <div class="stat">
            <span class="value"> ${context.newOrders} </span>
            <span class="name"> New Orders </span>
          </div>
          <div class="stat">
            <span class="value"> ${numberToCurrency(context.salesAmount)} </span>
            <span class="name"> Sales Amount </span>
          </div>
          <div class="stat">
            <span class="value"> ${context.satisfaction} </span>
            <span class="name"> Satisfaction </span>
          </div>
        </div>
        <button phx-click="refresh">↻ Refresh</button>
      </div>
    `;
  }

  handleEvent(event: "refresh", params: any, socket: any) {
    socket.assign(generateSalesDashboardContext());
  }

  handleInfo(event: "tick", socket: LiveViewSocket<SalesDashboardContext>) {
    socket.assign(generateSalesDashboardContext());
  }
}

function generateSalesDashboardContext(): SalesDashboardContext {
  return {
    newOrders: randomNewOrders(),
    salesAmount: randomSalesAmount(),
    satisfaction: randomSatisfaction(),
  };
}
