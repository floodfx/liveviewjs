import html from "../server/templates";
import { BaseLiveViewComponent, LiveViewExternalEventListener, LiveViewInternalEventListener, LiveViewSocket } from "../server/types";
import { numberToCurrency } from "./utils";
import { sendInternalMessage } from "../server/socket/message_router";

// generate a random number between min and max
const random = (min: number, max: number): () => number => {
  return () => Math.floor(Math.random() * (max - min + 1)) + min;
}

const randomSalesAmount = random(100, 1000);
const randomNewOrders = random(5, 20);
const randomSatisfaction = random(95, 100);


export interface SalesDashboardContext {
  newOrders: number;
  salesAmount: number;
  satisfaction: number;
}

export class SalesDashboardLiveViewComponent extends BaseLiveViewComponent<SalesDashboardContext, unknown> implements
  LiveViewExternalEventListener<SalesDashboardContext, "refresh", any>,
  LiveViewInternalEventListener<SalesDashboardContext, "tick">
{

  mount(params: any, session: any, socket: LiveViewSocket<SalesDashboardContext>): SalesDashboardContext {
    if (socket.connected) {
      // TODO clean up interval on unmount
      const intervalId = setInterval(() => {
        sendInternalMessage(socket, this, "tick");
      }, 1000);
    }
    return {
      ...generateSalesDashboardContext()
    }
  };

  render(context: SalesDashboardContext) {
    return html`
    <h1>Sales Dashboard</h1>
    <div id="dashboard">
      <div class="stats">
        <div class="stat">
          <span class="value">
            ${context.newOrders}
          </span>
          <span class="name">
            New Orders
          </span>
        </div>
        <div class="stat">
          <span class="value">
            ${numberToCurrency(context.salesAmount)}
          </span>
          <span class="name">
            Sales Amount
          </span>
        </div>
        <div class="stat">
          <span class="value">
            ${context.satisfaction}
          </span>
          <span class="name">
            Satisfaction
          </span>
        </div>
      </div>
      <button phx-click="refresh">
        <img src="images/refresh.svg" />
        Refresh
      </button>
    </div>
    `
  }

  handleEvent(event: "refresh", params: any, socket: any): SalesDashboardContext {
    return {
      ...generateSalesDashboardContext()
    }
  }

  handleInfo(event: "tick", socket: LiveViewSocket<SalesDashboardContext>): SalesDashboardContext {
    return {
      ...generateSalesDashboardContext()
    }
  }

}

function generateSalesDashboardContext(): SalesDashboardContext {
  return {
    newOrders: randomNewOrders(),
    salesAmount: randomSalesAmount(),
    satisfaction: randomSatisfaction()
  }
}




