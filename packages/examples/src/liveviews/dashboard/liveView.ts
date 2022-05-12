import { BaseLiveView, createLiveView, html, LiveViewMountParams, LiveViewSocket, SessionData } from "liveviewjs";
import { numberToCurrency } from "../utils";

export const dashboardLiveView = createLiveView({
  handleInfo: (info: { type: "tick" }, socket) => {
    // on tick, update random data
    socket.assign(nextRandomData());
  },

  mount: (socket) => {
    if (socket.connected) {
      // only start repeating if the socket is connected (i.e. websocket is connected)
      socket.repeat(() => {
        // send the tick event internally
        socket.sendInfo({ type: "tick" });
      }, 1000);
    }
    socket.assign(nextRandomData());
  },

  handleEvent: (events: { type: "refresh" }, socket) => {
    // on refresh, update random data
    socket.assign(nextRandomData());
  },

  render: (context: { newOrders: number; salesAmount: number; rating: number }) => {
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
  },
});

function nextRandomData() {
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
