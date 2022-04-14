import { BaseLiveView, html, LiveViewMountParams, LiveViewSocket, SessionData } from "liveviewjs";

export interface Context {
  brightness: number;
}

export type Events =
  | { type: "on" }
  | { type: "off" }
  | { type: "up" }
  | { type: "down" }
  | { type: "key_update"; key: string };

export class LightLiveView extends BaseLiveView<Context, Events> {
  mount(params: LiveViewMountParams, session: Partial<SessionData>, socket: LiveViewSocket<Context>) {
    socket.pageTitle("Front Porch Light");
    socket.assign({ brightness: 10 });
  }

  render(context: Context) {
    const { brightness } = context;
    return html`
      <div id="light">
        <h1>Front Porch Light</h1>
        <div>
          <div>${brightness}%</div>
          <progress
            id="light_meter"
            style="width: 300px; height: 2em; opacity: ${brightness / 100}"
            value="${brightness}"
            max="100"></progress>
        </div>

        <button phx-click="off" phx-window-keydown="key_update" phx-key="ArrowLeft">⬅️ Off</button>

        <button phx-click="down" phx-window-keydown="key_update" phx-key="ArrowDown">⬇️ Down</button>

        <button phx-click="up" phx-window-keydown="key_update" phx-key="ArrowUp">⬆️ Up</button>

        <button phx-click="on" phx-window-keydown="key_update" phx-key="ArrowRight">➡️ On</button>
      </div>
    `;
  }

  handleEvent(event: Events, socket: LiveViewSocket<Context>) {
    const { brightness } = socket.context;

    let key: string = event.type;
    // if event was a key event, use the key name as the event
    if (event.type === "key_update") {
      key = event.key;
    }
    switch (key) {
      case "off":
      case "ArrowLeft":
        socket.assign({ brightness: 0 });
        break;
      case "on":
      case "ArrowRight":
        socket.assign({ brightness: 100 });
        break;
      case "up":
      case "ArrowUp":
        socket.assign({ brightness: Math.min(brightness + 10, 100) });
        break;
      case "down":
      case "ArrowDown":
        socket.assign({ brightness: Math.max(brightness - 10, 0) });
        break;
    }
  }
}
