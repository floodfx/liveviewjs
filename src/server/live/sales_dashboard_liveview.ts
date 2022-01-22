import escapeHtml from "../liveview/templates";
import { LiveViewComponent, LiveViewContext, LiveViewExternalEventListener, LiveViewInternalEventListener } from "../liveview/types";
import { PhxSocket } from "../socket/types";
import { sendInternalMessage } from "../socket/websocket_server";
import { numberToCurrency } from "../utils";

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

export class SalesDashboardLiveViewComponent implements
  LiveViewComponent<SalesDashboardContext>,
  LiveViewExternalEventListener<SalesDashboardContext, "refresh", any>,
  LiveViewInternalEventListener<SalesDashboardContext, "tick">
  {

  mount(params: any, session: any, socket: PhxSocket) {
    if(socket.connected) {
      // TODO clean up interval on unmount
      const intervalId = setInterval(() => {
        sendInternalMessage(socket, this, "tick");
      }, 1000);
    }
    return {
      data: {
        ...generateSalesDashboardContext()
      }
    }
  };

  render(context: LiveViewContext<SalesDashboardContext>) {
    return escapeHtml`
    <h1>Sales Dashboard</h1>
    <div id="dashboard">
      <div class="stats">
        <div class="stat">
          <span class="value">
            ${context.data.newOrders}
          </span>
          <span class="name">
            New Orders
          </span>
        </div>
        <div class="stat">
          <span class="value">
            ${ numberToCurrency(context.data.salesAmount)}
          </span>
          <span class="name">
            Sales Amount
          </span>
        </div>
        <div class="stat">
          <span class="value">
            ${context.data.satisfaction}
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

  handleEvent(event: "refresh", params: any, socket: any): LiveViewContext<SalesDashboardContext> {
    return {
      data: {
        ...generateSalesDashboardContext()
      }
    }
  }

  handleInfo(event: "tick", socket: PhxSocket): LiveViewContext<SalesDashboardContext> {
    return {
      data: {
        ...generateSalesDashboardContext()
      }
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




