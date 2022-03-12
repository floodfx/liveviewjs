import { SessionData } from "express-session";
import { BaseLiveView, html, LiveViewContext, LiveViewMeta, LiveViewMountParams, LiveViewSocket } from "../../server";
import { DecarboinizeCalculator } from "./live_component";

export class DecarbonizeLiveView extends BaseLiveView<LiveViewContext, unknown> {
  mount(params: LiveViewMountParams, session: Partial<SessionData>, socket: LiveViewSocket<LiveViewContext>): void {
    socket.pageTitle("Decarbonize Calculator");
  }

  async render(context: LiveViewContext, meta: LiveViewMeta) {
    const { live_component } = meta;
    return html`
      <h1>Decarbonize Calculator</h1>
      <div>
        ${await live_component(new DecarboinizeCalculator(), {
          vehicle1: "gas",
          spaceHeating: "gas",
          gridElectricity: "grid",
          id: "some string or number",
        })}
      </div>
    `;
  }
}
