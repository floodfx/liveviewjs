import { SessionData } from "express-session";
import { LiveViewTemplate } from ".";
import { html } from "../templates";
import { BaseLiveViewComponent } from "./base_component";
import { LiveViewMountParams, LiveViewSocket } from "./types";

describe("test basic component", () => {

  it("mount returns context", () => {
    const component = new LiveViewComponent();
    const ctx = component.mount({_csrf_token:"foo", _mounts: -1}, {}, buildTestSocket());
    expect(ctx.foo).toEqual("bar");
  });

  it("default handleParams does not change context", async() => {
    const component = new LiveViewComponent();
    let ctx = component.mount({_csrf_token:"foo", _mounts: -1}, {}, buildTestSocket());
    ctx = await component.handleParams({foo: "baz"}, "", buildTestSocket(ctx));
    expect(ctx.foo).toEqual("bar");
  });

  it("render returns context view", async() => {
    const component = new LiveViewComponent();
    let ctx = component.mount({_csrf_token:"foo", _mounts: -1}, {}, buildTestSocket());
    ctx = await component.handleParams({foo: "baz"}, "", buildTestSocket(ctx));
    const view = await component.render(ctx);
    expect(view.toString()).toEqual("<div>bar</div>");
  });

})

function buildTestSocket(context: Ctx = {foo: ""}): LiveViewSocket<Ctx> {
  return {
    id: "topic",
    connected: false, // websocket is connected
    ws: undefined, // the websocket
    context,
    sendInternal: (event) => { },
    repeat: (fn, intervalMillis) => { },
    pageTitle: (newPageTitle) => { },
    pushPatch: (params) => { },
    subscribe: (topic) => { },
  }
}

interface Ctx {
  foo: string
}

class LiveViewComponent extends BaseLiveViewComponent<Ctx, {}> {

  mount(params: LiveViewMountParams, session: Partial<SessionData>, socket: LiveViewSocket<Ctx>): Ctx {
    return {foo: "bar"}
  }

  render(ctx: Ctx): LiveViewTemplate {
    return html`<div>${ctx.foo}</div>`;
  }

}
