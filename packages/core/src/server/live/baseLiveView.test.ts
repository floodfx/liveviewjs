import { BaseLiveView, LiveViewMountParams, LiveViewTemplate } from ".";
import { html } from "..";
import { SessionData } from "../session";
import { HttpLiveViewSocket, LiveViewSocket } from "../socket";

describe("test basic component", () => {
  it("mount returns context", () => {
    const component = new LiveViewComponent();
    const socket = new HttpLiveViewSocket<Ctx>("id");
    component.mount(socket, {}, { _csrf_token: "foo", _mounts: -1 });
    expect(socket.context.foo).toEqual("bar");
  });

  it("default handleParams does not change context", async () => {
    const component = new LiveViewComponent();
    const socket = new HttpLiveViewSocket<Ctx>("id");
    component.mount(socket, {}, { _csrf_token: "foo", _mounts: -1 });
    await component.handleParams(new URL("http://example.com/?foo=baz"), socket);
    expect(socket.context.foo).toEqual("bar");
  });

  it("render returns context view", async () => {
    const component = new LiveViewComponent();
    const socket = new HttpLiveViewSocket<Ctx>("id");
    component.mount(socket, {}, { _csrf_token: "foo", _mounts: -1 });
    await component.handleParams(new URL("http://example.com/?foo=baz"), socket);
    const view = await component.render(socket.context);
    expect(view.toString()).toEqual("<div>bar</div>");
  });
});

interface Ctx {
  foo: string;
}

class LiveViewComponent extends BaseLiveView<Ctx> {
  mount(socket: LiveViewSocket<Ctx>, session: Partial<SessionData>, params: LiveViewMountParams) {
    socket.assign({ foo: "bar" });
  }

  render(ctx: Ctx): LiveViewTemplate {
    return html`<div>${ctx.foo}</div>`;
  }
}
