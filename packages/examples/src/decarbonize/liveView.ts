import {
  AnyLiveContext,
  BaseLiveView,
  html,
  LiveViewMeta,
  LiveViewMountParams,
  LiveViewSocket,
  SessionData,
} from "liveviewjs";
import { CalculatorLiveComponent } from "./liveComponent";

export class DecarbonizeLiveView extends BaseLiveView {
  mount(params: LiveViewMountParams, session: Partial<SessionData>, socket: LiveViewSocket<AnyLiveContext>): void {
    socket.pageTitle("Decarbonize Calculator");
  }

  async render(context: AnyLiveContext, meta: LiveViewMeta) {
    // use the live_component helper to render a `LiveComponent`
    const { live_component } = meta;
    return html`
      <h1>Decarbonize Calculator</h1>
      <div>
        ${await live_component(new CalculatorLiveComponent(), {
          vehicle1: "gas",
          spaceHeating: "gas",
          gridElectricity: "grid",
          id: 1,
        })}
      </div>
    `;
  }
}
