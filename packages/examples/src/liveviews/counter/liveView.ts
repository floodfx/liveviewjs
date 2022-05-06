import { BaseLiveView, html, LiveViewMeta, LiveViewMountParams, LiveViewSocket, SessionData } from "liveviewjs";

interface Context {
  count: number;
}

type Events = { type: "increment" } | { type: "decrement" };

export class CounterLiveView extends BaseLiveView<Context, Events> {
  mount(params: LiveViewMountParams, session: Partial<SessionData>, socket: LiveViewSocket<Context>): void {
    socket.assign({ count: 0 });
  }

  handleEvent(event: Events, socket: LiveViewSocket<Context>) {
    const { count } = socket.context;
    switch (event.type) {
      case "increment":
        socket.assign({ count: count + 1 });
        break;
      case "decrement":
        socket.assign({ count: count - 1 });
        break;
    }
  }

  render(context: Context, meta: LiveViewMeta) {
    const { count } = context;
    return html`
      <div>
        <h1>Count is: ${count}</h1>
        <button phx-click="decrement">-</button>
        <button phx-click="increment">+</button>
      </div>
    `;
  }
}
