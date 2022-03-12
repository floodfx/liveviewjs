import { SessionData } from "express-session";
import { BaseLiveView, LiveViewMountParams, LiveViewTemplate } from ".";
import { html } from "..";
import { HttpLiveViewSocket, LiveViewSocket } from "../socket/live_socket";
import { LiveViewContext } from "./live_view";

describe("test basic component", () => {

  it("mount returns context", () => {
    const component = new LiveViewComponent();
    const socket = new HttpLiveViewSocket("id", {foo: ""});
    component.mount({_csrf_token:"foo", _mounts: -1}, {}, socket);
    expect(socket.context.foo).toEqual("bar");
  });

  it("default handleParams does not change context", async() => {
    const component = new LiveViewComponent();
    const socket = new HttpLiveViewSocket("id", {foo: ""});
    component.mount({_csrf_token:"foo", _mounts: -1}, {}, socket);
    await component.handleParams({foo: "baz"}, "", socket);
    expect(socket.context.foo).toEqual("bar");
  });

  it("render returns context view", async() => {
    const component = new LiveViewComponent();
    const socket = new HttpLiveViewSocket("id", {foo: ""});
    component.mount({_csrf_token:"foo", _mounts: -1}, {}, socket);
    await component.handleParams({foo: "baz"}, "", socket);
    const view = await component.render(socket.context);
    expect(view.toString()).toEqual("<div>bar</div>");
  });

})


interface Ctx extends LiveViewContext {
  foo: string
}

class LiveViewComponent extends BaseLiveView<Ctx, {}> {

  mount(params: LiveViewMountParams, session: Partial<SessionData>, socket: LiveViewSocket<Ctx>) {
    socket.assign({foo: "bar"})
  }

  render(ctx: Ctx): LiveViewTemplate {
    return html`<div>${ctx.foo}</div>`;
  }

}
