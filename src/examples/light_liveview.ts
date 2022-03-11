import { SessionData } from "express-session";
import { LiveView, LiveViewContext, LiveViewExternalEventListener, LiveViewMountParams, LiveViewSocket } from "../server";
import { BaseLiveView } from "../server/component/base_live_view";
import { html } from "../server/templates";

export interface LightContext extends LiveViewContext {
  brightness: number;
}

export type LightEvent = "on" | "off" | "up" | "down" | "key_update";

export class LightLiveViewComponent extends BaseLiveView<LightContext, never> implements
  LiveView<LightContext, never>,
  LiveViewExternalEventListener<LightContext, LightEvent, { key: string }> {


  mount(params: LiveViewMountParams, session: Partial<SessionData>, socket: LiveViewSocket<LightContext>) {
    socket.pageTitle("Front Porch Light");
    socket.assign({brightness: 10})
  };

  render(context: LightContext) {
    const { brightness } = context;
    return html`
    <div id="light">
      <h1>Front Porch Light</h1>
      <div>
       <div>${brightness}%</div>
       <progress id="light_meter" style="width: 300px; height: 2em; opacity: ${brightness / 100}" value="${brightness}" max="100"></progress>
      </div>

      <button phx-click="off" phx-window-keydown="key_update" phx-key="ArrowLeft">
        ⬅️ Off
      </button>

      <button phx-click="down" phx-window-keydown="key_update" phx-key="ArrowDown">
        ⬇️ Down
      </button>

      <button phx-click="up" phx-window-keydown="key_update" phx-key="ArrowUp">
        ⬆️ Up
      </button>

      <button phx-click="on" phx-window-keydown="key_update" phx-key="ArrowRight">
        ➡️ On
      </button>
    </div>
    `
  };

  handleEvent(event: LightEvent, params: { key: string }, socket: LiveViewSocket<LightContext>) {
    const ctx: LightContext = { brightness: socket.context.brightness };
    // map key_update to arrow keys
    const lightEvent = event === "key_update" ? params.key : event;
    switch (lightEvent) {
      case 'off':
      case 'ArrowLeft':
        socket.assign({brightness: 0});
        break;
      case 'on':
      case 'ArrowRight':
        socket.assign({brightness: 100});
        break;
      case 'up':
      case 'ArrowUp':
        socket.assign({brightness: Math.min(ctx.brightness + 10, 100)});
        break;
      case 'down':
      case 'ArrowDown':
        socket.assign({brightness: Math.max(ctx.brightness - 10, 0)});
        break;
    }

  }

}