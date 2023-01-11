import { createLiveView, html } from "liveviewjs";
import { numberToCurrency } from "../utils";

const intervalRefs: { [key: string]: NodeJS.Timer[] } = {};

/**
 * Dashboard that automatically refreshes every second or when a user hits refresh.
 */
export const dashboardLiveView = createLiveView<
  // Define LiveView Context / State
  { newOrders: number; salesAmount: number; rating: number; refreshes: number },
  // Define LiveView External Events
  { type: "refresh" },
  // Define LiveView Internal Events
  { type: "tick" }
>({
  mount: (socket) => {
    if (socket.connected) {
      // only start repeating if the socket is connected (i.e. websocket is connected)
      const infoInterval = setInterval(() => {
        // send the tick event internally
        socket.sendInfo({ type: "tick" });
      }, 1000);
      intervalRefs[socket.id] = [infoInterval];
    }
    socket.assign({ ...nextRandomData(), refreshes: 0 });
  },

  // on tick, update random data
  handleInfo: (info, socket) => {
    const { refreshes } = socket.context;
    if (refreshes % 5 === 0) {
      socket.pushEvent({ type: "refresh", refreshes });
    }
    socket.assign({ ...nextRandomData(), refreshes: socket.context.refreshes + 1 });
  },
  // on refresh, update random data
  handleEvent: (_, socket) => socket.assign(nextRandomData()),

  render: (context) => {
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

  shutdown: (id, context) => {
    // clear the interval when the LiveView is shut down
    intervalRefs[id].forEach((interval) => clearInterval(interval));
  },
});

// generate a random set of data
function nextRandomData() {
  return {
    newOrders: randomNewOrders(),
    salesAmount: randomSalesAmount(),
    rating: randomRating(),
  };
}

// display star emojis given a rating
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

// generate a random number between min and max
const random = (min: number, max: number): (() => number) => {
  return () => Math.floor(Math.random() * (max - min + 1)) + min;
};

const randomSalesAmount = random(100, 1000);
const randomNewOrders = random(5, 20);
const randomRating = random(1, 5);
