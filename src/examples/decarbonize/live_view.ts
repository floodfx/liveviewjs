import { SessionData } from "express-session";
import { BaseLiveView, html, LiveViewMeta, LiveViewMountParams, LiveViewSocket } from "../../server";
import { DecarboinizeCalculator } from "./live_component";

export interface DecarbonizeContext {
}

export class DecarbonizeLiveView extends BaseLiveView<DecarbonizeContext, unknown> {

  mount(params: LiveViewMountParams, session: Partial<SessionData>, socket: LiveViewSocket<DecarbonizeContext>) {
    return {}
  };

  async render(context: DecarbonizeContext, meta: LiveViewMeta) {
    const { } = context;
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

    </div>
    `
  };


}
