import html from "../server/templates";
import { BaseLiveViewComponent, LiveViewComponent, LiveViewExternalEventListener, LiveViewSocket } from "../server/types";

export interface LightContext {
  brightness: number;
}

export type LightEvent = "on" | "off" | "up" | "down";

export class LightLiveViewComponent extends BaseLiveViewComponent<LightContext, never> implements
  LiveViewComponent<LightContext, never>,
  LiveViewExternalEventListener<LightContext, "on", any>,
  LiveViewExternalEventListener<LightContext, "off", any> {


  mount(params: any, session: any, socket: LiveViewSocket<LightContext>) {
    return { brightness: 10 };
  };

  render(context: LightContext) {
    return html`
    <div id="light">
      <h1>Front Porch Light</h1>
      <div class="meter">
        <span style="width: ${context.brightness} %>%">
          ${context.brightness}%
        </span>
      </div>

      <button phx-click="off">
        Off
      </button>

      <button phx-click="down">
        Down
      </button>

      <button phx-click="up">
        Up
      </button>

      <button phx-click="on">
        On
      </button>
    </div>
    `
  };

  handleEvent(event: LightEvent, params: any, socket: LiveViewSocket<LightContext>) {
    const ctx: LightContext = { brightness: socket.context.brightness };
    console.log("socket ctx", socket.context);
    switch (event) {
      case 'off':
        ctx.brightness = 0;
        break;
      case 'on':
        ctx.brightness = 100;
        break;
      case 'up':
        ctx.brightness = Math.min(ctx.brightness + 10, 100);
        break;
      case 'down':
        ctx.brightness = Math.max(ctx.brightness - 10, 0);
        break;
    }
    return ctx;
  }

}