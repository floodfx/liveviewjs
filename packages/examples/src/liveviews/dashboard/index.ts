import { createLiveView, html } from "liveviewjs";
import { numberToCurrency } from "../utils";

/**
 * Dashboard that automatically refreshes every second or when a user hits refresh.
 */
export const dashboardLiveView = createLiveView<
  // Define LiveView Context / State
  { newOrders: number; salesAmount: number; rating: number },
  // Define LiveView External Events
  { type: "refresh" },
  // Define LiveView Internal Events
  { type: "tick" }
>({
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

  // on tick, update random data
  handleInfo: (_, socket) => socket.assign(nextRandomData()),
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
