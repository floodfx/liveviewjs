import { BaseLiveComponent, LiveViewTemplate } from ".";
import { html } from "..";
import {
  createLiveComponent,
  HttpLiveComponentSocket,
  LiveComponentSocket,
  WsLiveComponentSocket,
} from "./liveComponent";

describe("test BaseLiveComponent", () => {
  it("mount returns context", () => {
    const component = new TestLiveComponent();
    const socket = new HttpLiveComponentSocket<TestLVContext>("foo", { foo: "" });
    component.mount(socket);
    expect(socket.context.foo).toEqual("");
  });

  it("mount handles empty context", () => {
    const component = new TestLiveComponent();
    const socket = new HttpLiveComponentSocket("foo", undefined as unknown as TestLVContext);
    component.mount(socket);
    expect(socket.context.foo).toEqual(undefined);
  });

  it("mount returns context using factory component", () => {
    const component = testLiveComponent;
    const socket = new HttpLiveComponentSocket<TestLVContext>("foo", { foo: "" });
    component.mount(socket);
    expect(socket.context.foo).toEqual("");
  });

  it("default update does NOT change context", async () => {
    const component = new TestLiveComponent();
    const socket = new HttpLiveComponentSocket<TestLVContext>("foo", { foo: "bar" });
    component.mount(socket);
    await component.update(socket);
    expect(socket.context.foo).toEqual("bar");
  });

  it("render returns context view", async () => {
    const component = new TestLiveComponent();
    const socket = new HttpLiveComponentSocket<TestLVContext>("foo", { foo: "bar" });
    component.mount(socket);
    await component.update(socket);
    expect(socket.context.foo).toEqual("bar");
    const view = await component.render(socket.context);
    expect(view.toString()).toEqual("<div>bar</div>");
  });

  it("mount returns context ws", () => {
    const component = new TestLiveComponent();
    const sendCallback = jest.fn();
    const pushCallback = jest.fn();
    const socket = new WsLiveComponentSocket<TestLVContext>("foo", { foo: "" }, sendCallback, pushCallback);
    component.mount(socket);
    expect(socket.context.foo).toEqual("");
  });

  it("default update does NOT change context ws", async () => {
    const component = new TestLiveComponent();
    const sendCallback = jest.fn();
    const pushCallback = jest.fn();
    const socket = new WsLiveComponentSocket<TestLVContext>("foo", { foo: "bar" }, sendCallback, pushCallback);
    component.mount(socket);
    await component.update(socket);
    expect(socket.context.foo).toEqual("bar");
  });

  it("render returns context view ws", async () => {
    const component = new TestLiveComponent();
    const sendCallback = jest.fn();
    const pushCallback = jest.fn();
    const socket = new WsLiveComponentSocket<TestLVContext>("foo", { foo: "bar" }, sendCallback, pushCallback);
    component.mount(socket);
    await component.update(socket);
    expect(socket.context.foo).toEqual("bar");
    const view = await component.render(socket.context);
    expect(view.toString()).toEqual("<div>bar</div>");
  });

  it("push and send cb works ws", async () => {
    const component = new TestLVPushAndSendComponent();
    const sendCallback = jest.fn();
    const pushCallback = jest.fn();
    const socket = new WsLiveComponentSocket<TestLVPushAndSendContext>(
      "foo",
      { foo: "bar" },
      sendCallback,
      pushCallback
    );
    component.mount(socket);
    expect(sendCallback).toHaveBeenCalledTimes(1);
    expect(pushCallback).toHaveBeenCalledTimes(1);
  });
});

interface TestLVContext {
  foo: string;
}

const testLiveComponent = createLiveComponent({
  handleEvent(event, socket) {
    // console.log("testEvent", socket.context);
  },
  render: (context: { foo: string }) => html`<div>${context.foo}</div>`,
});

class TestLiveComponent extends BaseLiveComponent<TestLVContext> {
  render(ctx: TestLVContext): LiveViewTemplate {
    return html`<div>${ctx.foo}</div>`;
  }
}

interface TestLVPushAndSendContext {
  foo: string;
}

class TestLVPushAndSendComponent extends BaseLiveComponent<TestLVPushAndSendContext> {
  mount(socket: LiveComponentSocket<TestLVPushAndSendContext>): void {
    socket.pushEvent({ type: "event", data: "blah" });
    socket.sendParentInfo({ type: "my_event" });
  }

  render(ctx: TestLVPushAndSendContext): LiveViewTemplate {
    return html`<div>${ctx.foo}</div>`;
  }
}
