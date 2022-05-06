import { BaseLiveView, html, LiveViewMountParams, LiveViewSocket, SessionData } from "liveviewjs";
import { numberToCurrency } from "../utils";

interface Context {
  newOrders: number;
  salesAmount: number;
  rating: number;
}

type Events = { type: "refresh" };

type Info = { type: "tick" };

export class DashboardLiveView extends BaseLiveView<Context, Events, Info> {
  mount(params: LiveViewMountParams, session: Partial<SessionData>, socket: LiveViewSocket<Context>) {
    if (socket.connected) {
      // socket will be connected after websocket connetion established
      socket.repeat(() => {
        socket.sendInfo({ type: "tick" });
      }, 1000);
    }
    socket.assign(nextRandomData());
  }

  render(context: Context) {
    const { newOrders, salesAmount, rating } = context;
    return html`
      <h1>Sales Dashboard</h1>
      <hr />
      <span>🥡 New Orders</span>
      <h2>${newOrders}</h2>
      <hr />
      <span>💰 Sales Amount</span>
      <h2>${numberToCurrency(salesAmount)}</h2>
      <hr />
      <span>🌟 Rating</spa>
      <h2>${ratingToStars(rating)}</h2>

      <br />
      <br />
      <button phx-click="refresh">↻ Refresh</button>
    `;
  }

  handleEvent(event: Events, socket: LiveViewSocket<Context>) {
    socket.assign(nextRandomData());
  }

  handleInfo(info: Info, socket: LiveViewSocket<Context>) {
    socket.assign(nextRandomData());
  }
}

function ratingToStars(rating: number): string {
  const stars = [];
  let i = 0;
  for (; i < rating; i++) {
    stars.push("⭐");
  }
  for (; i < 5; i++) {
    stars.push("✩");
  }
  return stars.join("");
}

function nextRandomData(): Context {
  return {
    newOrders: randomNewOrders(),
    salesAmount: randomSalesAmount(),
    rating: randomRating(),
  };
}

// generate a random number between min and max
const random = (min: number, max: number): (() => number) => {
  return () => Math.floor(Math.random() * (max - min + 1)) + min;
};

const randomSalesAmount = random(100, 1000);
const randomNewOrders = random(5, 20);
const randomRating = random(1, 5);
