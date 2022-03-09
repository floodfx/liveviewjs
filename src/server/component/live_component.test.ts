import { BaseLiveComponent, LiveViewTemplate } from ".";
import { html } from "..";
import { LiveComponentSocket } from "./live_component";

describe("test BaseLiveComponent", () => {

  it("mount returns context", () => {
    const component = new TestLiveComponent();
    let ctx = component.mount(buildTestSocket());
    expect(ctx.foo).toEqual("");
  });

  it("default update does NOT change context", async() => {
    const component = new TestLiveComponent();
    let ctx = component.mount(buildTestSocket({foo: "bar"}));
    ctx = {
      ...ctx,
      ...await component.update({foo: "baz"}, buildTestSocket(ctx))
    }
    expect(ctx.foo).toEqual("bar");
  });

  it("render returns context view", async() => {
    const component = new TestLiveComponent();
    let ctx = component.mount(buildTestSocket({foo: "bar"}));
    ctx = {
      ...ctx,
      ...await component.update({foo: "baz"}, buildTestSocket(ctx))
    }
    const view = await component.render(ctx);
    expect(view.toString()).toEqual("<div>bar</div>");
  });

  it("handleEvent returns unchanged context", async() => {
    const component = new TestLiveComponent();
    let ctx = component.mount(buildTestSocket({foo: "bar"}));
    ctx = {
      ...ctx,
      ...await component.handleEvent("event", {foo: "baz"}, buildTestSocket(ctx))
    }

    const view = await component.render(ctx);
    expect(view.toString()).toEqual("<div>bar</div>");
  });

})

function buildTestSocket(context: Ctx = {foo: ""}): LiveComponentSocket<Ctx> {
  return {
    id: "id",
    connected: false, // websocket is connected
    ws: undefined, // the websocket
    context,
    send: (event) => { },
  }
}

interface Ctx {
  foo: string
}

class TestLiveComponent extends BaseLiveComponent<Ctx> {

  render(ctx: Ctx): LiveViewTemplate {
    return html`<div>${ctx.foo}</div>`;
  }

}
