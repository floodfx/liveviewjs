import {
  BaseLiveView,
  html,
  LiveViewMountParams,
  LiveViewSocket,
  SessionData,
} from "liveviewjs";
import { numberToCurrency } from "../utils";

// generate a random number between min and max
const random = (min: number, max: number): (() => number) => {
  return () => Math.floor(Math.random() * (max - min + 1)) + min;
};

const randomSalesAmount = random(100, 1000);
const randomNewOrders = random(5, 20);
const randomSatisfaction = random(95, 100);

interface Context {
  newOrders: number;
  salesAmount: number;
  satisfaction: number;
}

type Events =
  | { type: "refresh" }

type Info =
  | { type: "tick" }

export class SalesDashboardLiveView extends BaseLiveView<Context, Events, Info> {
  mount(params: LiveViewMountParams, session: Partial<SessionData>, socket: LiveViewSocket<Context>) {
    if (socket.connected) {
      socket.repeat(() => {
        socket.send({type: "tick"});
      }, 1000);
    }
    socket.assign(generateSalesDashboardContext());
  }

  render(context: Context) {
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

  handleEvent(event: Events, socket: LiveViewSocket<Context>) {
    socket.assign(generateSalesDashboardContext());
  }

  handleInfo(info: Info, socket: LiveViewSocket<Context>) {
    socket.assign(generateSalesDashboardContext());
  }
}

function generateSalesDashboardContext(): Context {
  return {
    newOrders: randomNewOrders(),
    salesAmount: randomSalesAmount(),
    satisfaction: randomSatisfaction(),
  };
}
