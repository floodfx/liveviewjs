import escapeHtml from "../liveview/templates";
import { LiveViewComponent, LiveViewContext, LiveViewExternalEventListener } from "../liveview/types";

export interface LightContext {
  brightness: number;
}

export class POCLiveViewComponent implements
  LiveViewComponent<LightContext>,
  LiveViewExternalEventListener<LightContext, "on">,
  LiveViewExternalEventListener<LightContext, "off"> {

  mount(params: any, session: any, socket: any) {
    return { data: { brightness: 10 } };
  };

  render(context: LiveViewContext<LightContext>) {
    return escapeHtml`
    <h1>Front Porch Light</h1>
    <div id="light">
    <h1>Front Porch Light</h1>
    <div id="light">
      <div class="meter">
        <span style="width: ${context.data.brightness} %>%">
          ${context.data.brightness}%
        </span>
      </div>

      <button phx-click="off">
        <img src="images/light-off.svg">
      </button>

      <button phx-click="down">
        <img src="images/down.svg">
      </button>

      <button phx-click="up">
        <img src="images/up.svg">
      </button>

      <button phx-click="on">
        <img src="images/light-on.svg">
      </button>
    </div>
    `
  };

  handleEvent(event: "on" | "off", params: any, socket: any) {
    let brightness = 0;
    switch (event) {
      case 'off':
        console.log('off');
        brightness = 0;
        break;
      case 'on':
        console.log('on');
        brightness = 100;
        break;
    }
    return { data: { brightness: 10 } };
  }

}