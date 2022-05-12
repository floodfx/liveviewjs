import { createLiveView, html } from "liveviewjs";

const counterLiveView = createLiveView({
  mount: (socket) => {
    // init state, set count to 0
    socket.assign({ count: 0 });
  },
  handleEvent: (event: { type: "increment" } | { type: "decrement" }, socket) => {
    // handle increment and decrement events
    const { count } = socket.context;
    switch (event.type) {
      case "increment":
        socket.assign({ count: count + 1 });
        break;
      case "decrement":
        socket.assign({ count: count - 1 });
        break;
    }
  },
  render: async (context: { count: number }) => {
    // render the view based on the state
    const { count } = context;
    return html`
      <div>
        <h1>Count is: ${count}</h1>
        <button phx-click="decrement">-</button>
        <button phx-click="increment">+</button>
      </div>
    `;
  },
});
