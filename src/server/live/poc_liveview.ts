import escapeHtml from "../liveview/templates";
import { LiveViewComponent, LiveViewContext, LiveViewExternalEventListener } from "../liveview/types";

export interface LightContext {
  brightness: number;
}

export type PocEvent = "on" | "off" | "up" | "down";

const _db: { [key: string]: LightContext } = {};

export class POCLiveViewComponent implements
  LiveViewComponent<LightContext>,
  LiveViewExternalEventListener<LightContext, "on">,
  LiveViewExternalEventListener<LightContext, "off"> {


  mount(params: any, session: any, socket: any) {
    // store this somewhere durable
    const ctx: LightContext = { brightness: 10 };
    _db[socket.id] = ctx;
    return { data: ctx };
  };

  render(context: LiveViewContext<LightContext>) {
    return escapeHtml`
    <div id="light">
      <h1>Front Porch Light</h1>
      <div class="meter">
        <span style="width: ${context.data.brightness} %>%">
          ${context.data.brightness}%
        </span>
      </div>

      <button phx-click="off" onClick="turnOff()">
        Off
      </button>

      <button phx-click="down" onClick="turnDown()">
        Down
      </button>

      <button phx-click="up" onClick="turnUp()">
        Up
      </button>

      <button phx-click="on" onClick="turnOn()">
        On
      </button>
    </div>
    `
  };

  handleEvent(event: PocEvent, params: any, socket: any) {
    const ctx = _db[socket.id];
    console.log("event:", event, socket, ctx);
    switch (event) {
      case 'off':
        console.log('off');
        ctx.brightness = 0;
        break;
      case 'on':
        console.log('on');
        ctx.brightness = 100;
        break;
      case 'up':
        console.log('up');
        ctx.brightness = Math.min(ctx.brightness + 10, 100);
        break;
      case 'down':
        console.log('down');
        ctx.brightness = Math.max(ctx.brightness - 10, 0);
        break;
    }
    _db[socket.id] = ctx;
    return { data: ctx };
  }

}