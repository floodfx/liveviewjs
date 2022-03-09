import { SessionData } from "express-session";
import { BaseLiveViewComponent, html, LiveViewMetadata, LiveViewMountParams, LiveViewSocket } from "../../server";
import { DecarboinizeCalculator } from "./live_component";

export interface DecarbonizeContext {
}

export class DecarbonizeLiveView extends BaseLiveViewComponent<DecarbonizeContext, unknown> {

  mount(params: LiveViewMountParams, session: Partial<SessionData>, socket: LiveViewSocket<DecarbonizeContext>) {
    return {}
  };

  async render(context: DecarbonizeContext, meta: LiveViewMetadata) {
    const { } = context;
    const { live_component } = meta;
    return html`
    <h1>Decarbonize Calculator</h1>
    <div id="calc">

      ${ await live_component(new DecarboinizeCalculator(), {
        eCars: "0",
        gasCars: "0",
      }) }

      ${ await live_component(new DecarboinizeCalculator(), {
        id: "foo",
        eCars: "2",
        gasCars: "1",
      }) }

    </div>
    `
  };


}
