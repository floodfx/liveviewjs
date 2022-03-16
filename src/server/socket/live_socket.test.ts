import { SessionData } from "express-session";
import { html } from "..";
import { BaseLiveView, LiveView, LiveViewContext, LiveViewMountParams, LiveViewTemplate } from "../component";
import { HttpLiveViewSocket, LiveViewSocket, WsLiveViewSocket } from "./live_socket";

describe("test LiveViewSocket", () => {
  let socket;
  let component: LiveView<LiveViewContext, unknown>;
  let pageTitleCallback: jest.Mock<any, any>;
  let pushEventCallback = jest.fn();
  let pushRedirectCallback = jest.fn();
  let pushPatchCallback = jest.fn();
  let putFlashCallback = jest.fn();
  let repeatCallback = jest.fn();
  let sendCallback = jest.fn();
  let subscribeCallback = jest.fn();

  beforeEach(() => {
    component = new TestLiveView();
    pageTitleCallback = jest.fn();
    pushEventCallback = jest.fn();
    pushPatchCallback = jest.fn();
    pushRedirectCallback = jest.fn();
    putFlashCallback = jest.fn();
    repeatCallback = jest.fn();
    sendCallback = jest.fn();
    subscribeCallback = jest.fn();
    socket = new WsLiveViewSocket<TestLVContext>(
      "id",
      pageTitleCallback,
      pushEventCallback,
      pushPatchCallback,
      pushRedirectCallback,
      putFlashCallback,
      sendCallback,
      repeatCallback,
      subscribeCallback
    );
  });

  it("http mount returns context", () => {
    const socket = new HttpLiveViewSocket<TestLVContext>("id");
    component.mount({ _csrf_token: "csrf", _mounts: -1 }, {}, socket);
    expect(socket.context.foo).toEqual("bar");
  });

  it("http default handleParams does NOT change context", async () => {
    const socket = new HttpLiveViewSocket<TestLVContext>("id");
    component.mount({ _csrf_token: "csrf", _mounts: -1 }, {}, socket);
    await component.handleParams({ foo: "baz" }, "", socket);
    expect(socket.context.foo).toEqual("bar");
  });

  it("http render returns context view", async () => {
    const socket = new HttpLiveViewSocket<TestLVContext>("id");
    component.mount({ _csrf_token: "csrf", _mounts: -1 }, {}, socket);
    await component.handleParams({ foo: "baz" }, "", socket);
    expect(socket.context.foo).toEqual("bar");
    const view = await component.render(socket.context, { csrfToken: "csrf", live_component: jest.fn() });
    expect(view.toString()).toEqual("<div>bar</div>");
  });

  it("ws mount returns context", async () => {
    const socket = new WsLiveViewSocket<TestLVContext>(
      "id",
      pageTitleCallback,
      pushEventCallback,
      pushPatchCallback,
      pushRedirectCallback,
      putFlashCallback,
      sendCallback,
      repeatCallback,
      subscribeCallback
    );
    await component.mount({ _csrf_token: "csrf", _mounts: -1 }, {}, socket);
    expect(socket.context.foo).toEqual("bar");
  });

  it("calls all callbacks", async () => {
    component = new TestLVPushAndSend();
    const socket = new WsLiveViewSocket<TestLVPushAndSendContext>(
      "id",
      pageTitleCallback,
      pushEventCallback,
      pushPatchCallback,
      pushRedirectCallback,
      putFlashCallback,
      sendCallback,
      repeatCallback,
      subscribeCallback
    );
    component.mount({ _csrf_token: "csrf", _mounts: -1 }, {}, socket);

    expect(pageTitleCallback).toHaveBeenCalledTimes(1);
    expect(pushEventCallback).toHaveBeenCalledTimes(1);
    expect(pushPatchCallback).toHaveBeenCalledTimes(3);
    expect(pushRedirectCallback).toHaveBeenCalledTimes(3);
    expect(putFlashCallback).toHaveBeenCalledTimes(1);
    expect(repeatCallback).toHaveBeenCalledTimes(1);
    expect(sendCallback).toHaveBeenCalledTimes(1);
    expect(subscribeCallback).toHaveBeenCalledTimes(1);
  });

  it("tempAssign works to clear assigns", () => {
    const socket = new WsLiveViewSocket<TestLVContext>(
      "id",
      pageTitleCallback,
      pushEventCallback,
      pushPatchCallback,
      pushRedirectCallback,
      putFlashCallback,
      sendCallback,
      repeatCallback,
      subscribeCallback
    );
    component.mount({ _csrf_token: "csrf", _mounts: -1 }, {}, socket);
    socket.assign({ foo: "bar" });
    socket.tempAssign({ foo: "" });
    expect(socket.context.foo).toEqual("bar");
    socket.updateContextWithTempAssigns();
    expect(socket.context.foo).toEqual("");
  });
});

interface TestLVContext extends LiveViewContext {
  foo: string;
}

class TestLiveView extends BaseLiveView<TestLVContext, {}> {
  mount(params: LiveViewMountParams, session: Partial<SessionData>, socket: LiveViewSocket<TestLVContext>) {
    socket.assign({ foo: "bar" });
  }

  render(ctx: TestLVContext): LiveViewTemplate {
    return html`<div>${ctx.foo}</div>`;
  }
}

interface TestLVPushAndSendContext extends LiveViewContext {
  foo: string;
}

class TestLVPushAndSend extends BaseLiveView<TestLVPushAndSendContext, {}> {
  mount(params: LiveViewMountParams, session: Partial<SessionData>, socket: LiveViewSocket<TestLVPushAndSendContext>) {
    socket.pageTitle("new page title");
    socket.pushEvent("event", { data: "blah" });
    socket.pushPatch("path");
    socket.pushPatch("path", { param: 1 });
    socket.pushPatch("path", { param: 1 }, true);
    socket.pushRedirect("/new/path");
    socket.pushRedirect("/new/path", { param: 1 });
    socket.pushRedirect("/new/path", { param: 1 }, true);
    socket.putFlash("info", "Helpful message");
    socket.repeat(() => {}, 1000);
    socket.send("my_event");
    socket.subscribe("topic");
  }

  render(ctx: TestLVPushAndSendContext): LiveViewTemplate {
    return html`<div>${ctx.foo}</div>`;
  }
}
