import { WebLiveViewHandler } from "./src/webLiveViewHandler";
import { createLiveView, html } from "@liveviewjs/core";

const CounterLV = createLiveView({
  mount: (socket) => {
    socket.assign({ count: 10 });
  },
  render: (context) => {
    return html`
      <div class="card">
        <h1>⚡ LiveViewJS Counter</h1>
        <div class="count-display">${context.count}</div>
        <button phx-click="inc">+ Increment</button>
      </div>
    `;
  },
  handleEvent: (event, socket) => {
    if (event.type === "inc") {
      socket.assign({ count: socket.context.count + 1 });
    }
  },
});

const handler = new WebLiveViewHandler({
  router: {
    "/": CounterLV,
    "/counter": CounterLV,
  },
});

console.log("🚀 LiveViewJS dev server running at http://localhost:3000");
Bun.serve(handler.bun({ port: 3000 }));
