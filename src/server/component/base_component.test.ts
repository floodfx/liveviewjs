import { SessionData } from "express-session";
import { LiveViewComponentManager } from "../socket/component_manager";
import { html } from "../templates";
import { BaseLiveViewComponent } from "./base_component";
import { LiveViewMountParams, LiveViewSocket } from "./types";

describe("test base component", () => {
  it("set csrf token correctly", () => {
    const component = new LiveViewComponent();
    const cm = new LiveViewComponentManager(component, "MY_VERY_SECRET_KEY");
    const csrf = "MY_CSRF_TOKEN";
    cm.csrfToken = csrf;
    expect(component.csrfToken()).toBe(csrf);
  });

  it("runs pushPatch correctly", () => {
    const component = new LiveViewComponent();
    const cm = new LiveViewComponentManager(component, "MY_VERY_SECRET_KEY");
    component.pushPatch(buildTestSocket(), { to: { path: "/test", params: {} } });
    // TODO check if the patch was sent to the socket
  });

  it("warns if component not connected to component manager", () => {
    const component = new LiveViewComponent();
    component.pushPatch(buildTestSocket(), { to: { path: "/test", params: {} } });
    // TODO check if the patch was sent to the socket
  });

})

function buildTestSocket(): LiveViewSocket<unknown> {
  return {
    id: "topic",
    connected: false, // websocket is connected
    ws: undefined, // the websocket
    context: {},
    sendInternal: (event) => { },
    repeat: (fn, intervalMillis) => { },
    pageTitle: (newPageTitle) => { },
  }
}


class LiveViewComponent extends BaseLiveViewComponent<{}, {}> {

  mount(params: LiveViewMountParams, session: Partial<SessionData>, socket: LiveViewSocket<{}>): {} {
    return {}
  }

  render() {
    return html`<div>test</div>`;
  }

}
