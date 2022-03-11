import { SessionData } from "express-session";
import { BaseLiveView, html, LiveViewContext, LiveViewExternalEventListener, LiveViewMeta, LiveViewMountParams, LiveViewSocket } from "../../server";
import { DecarboinizeCalculator } from "./live_component";

export interface DecarbonizeContext {
}

export class DecarbonizeLiveView extends BaseLiveView<LiveViewContext, unknown>
 implements LiveViewExternalEventListener<LiveViewContext, "clicked", never>
{

  mount(params: LiveViewMountParams, session: Partial<SessionData>, socket: LiveViewSocket<LiveViewContext>): void {
    socket.pageTitle("Decarbonize Calculator");
  }

  handleEvent(event: "clicked", params: never, socket: LiveViewSocket<LiveViewContext>) {
    console.log(socket.context)
    socket.pushEvent("updateChart", {...socket.context})
  }

  async render(context: DecarbonizeContext, meta: LiveViewMeta) {
    const { live_component } = meta;
    return html`
    <h1>Decarbonize Calculator</h1>
    <div>

      ${ await live_component(new DecarboinizeCalculator(), {
        vehicle1: "gas",
        spaceHeating: "gas",
        gridElectricity: "grid",
        id: "some string or number",
      }) }

      <div phx-click="clicked" phx-hook="Chart" id="chart">
        <h3>Click me</h3>
      </div>

    </div>
    `
  };


}
