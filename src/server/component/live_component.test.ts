import { BaseLiveComponent, LiveViewTemplate } from ".";
import { html } from "..";
import { HttpLiveComponentSocket, WsLiveComponentSocket } from "./live_component";
import { LiveViewContext } from "./live_view";

describe("test BaseLiveComponent", () => {

  it("mount returns context", () => {
    const component = new TestLiveComponent();
    const socket = new HttpLiveComponentSocket<TestLVContext>("foo", {foo: ""});
    component.mount(socket);
    expect(socket.context.foo).toEqual("");
  });

  it("default update does NOT change context", async() => {
    const component = new TestLiveComponent();
    const socket = new HttpLiveComponentSocket<TestLVContext>("foo", {foo: "bar"});
    component.mount(socket);
    await component.update(socket);
    expect(socket.context.foo).toEqual("bar");
  });

  it("render returns context view", async() => {
    const component = new TestLiveComponent();
    const socket = new HttpLiveComponentSocket<TestLVContext>("foo", {foo: "bar"});
    component.mount(socket);
    await component.update(socket);
    expect(socket.context.foo).toEqual("bar");
    const view = await component.render(socket.context);
    expect(view.toString()).toEqual("<div>bar</div>");
  });

  it("handleEvent returns unchanged context", async() => {
    const component = new TestLiveComponent();
    const socket = new HttpLiveComponentSocket<TestLVContext>("foo", {foo: "bar"});
    component.mount(socket);
    await component.update(socket);
    await component.handleEvent("event", {foo: "baz"}, socket);
    expect(socket.context.foo).toEqual("bar");
    const view = await component.render(socket.context);
    expect(view.toString()).toEqual("<div>bar</div>");
  });

  it("mount returns context ws", () => {
    const component = new TestLiveComponent();
    const sendCallback = jest.fn()
    const pushCallback = jest.fn()
    const socket = new WsLiveComponentSocket<TestLVContext>("foo", {foo: ""}, sendCallback, pushCallback);
    component.mount(socket);
    expect(socket.context.foo).toEqual("");
  });

  it("default update does NOT change context ws", async() => {
    const component = new TestLiveComponent();
    const sendCallback = jest.fn()
    const pushCallback = jest.fn()
    const socket = new WsLiveComponentSocket<TestLVContext>("foo", {foo: "bar"}, sendCallback, pushCallback);
    component.mount(socket);
    await component.update(socket);
    expect(socket.context.foo).toEqual("bar");
  });

  it("render returns context view ws", async() => {
    const component = new TestLiveComponent();
    const sendCallback = jest.fn()
    const pushCallback = jest.fn()
    const socket = new WsLiveComponentSocket<TestLVContext>("foo", {foo: "bar"}, sendCallback, pushCallback);
    component.mount(socket);
    await component.update(socket);
    expect(socket.context.foo).toEqual("bar");
    const view = await component.render(socket.context);
    expect(view.toString()).toEqual("<div>bar</div>");
  });

  it("handleEvent returns unchanged context ws", async() => {
    const component = new TestLiveComponent();
    const sendCallback = jest.fn()
    const pushCallback = jest.fn()
    const socket = new WsLiveComponentSocket<TestLVContext>("foo", {foo: "bar"}, sendCallback, pushCallback);
    component.mount(socket);
    await component.update(socket);
    await component.handleEvent("event", {foo: "baz"}, socket);
    expect(socket.context.foo).toEqual("bar");
    const view = await component.render(socket.context);
    expect(view.toString()).toEqual("<div>bar</div>");
  });

})

interface TestLVContext extends LiveViewContext {
  foo: string
}

class TestLiveComponent extends BaseLiveComponent<TestLVContext> {

  render(ctx: TestLVContext): LiveViewTemplate {
    return html`<div>${ctx.foo}</div>`;
  }

}
