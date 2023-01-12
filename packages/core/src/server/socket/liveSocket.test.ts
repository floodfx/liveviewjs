import { html } from "..";
import { BaseLiveView, createLiveView, LiveView, LiveViewMountParams, LiveViewTemplate } from "../live";
import { SessionData } from "../session";
import { HttpLiveViewSocket, LiveViewSocket, WsLiveViewSocket } from "./liveSocket";

describe("test LiveViewSocket", () => {
  let wsSocket: WsLiveViewSocket;
  let component: LiveView;
  let pageTitleCallback: jest.Mock<any, any>;
  let pushEventCallback = jest.fn();
  let pushRedirectCallback = jest.fn();
  let pushPatchCallback = jest.fn();
  let putFlashCallback = jest.fn();
  let sendCallback = jest.fn();
  let subscribeCallback = jest.fn();
  let allowUploadCallback = jest.fn();
  let cancelUploadCallback = jest.fn();
  let consumeUploadedEntriesCallback = jest.fn();
  let uploadedEntriesCallback = jest.fn();

  beforeEach(() => {
    component = new TestLiveView();
    pageTitleCallback = jest.fn();
    pushEventCallback = jest.fn();
    pushPatchCallback = jest.fn();
    pushRedirectCallback = jest.fn();
    putFlashCallback = jest.fn();
    sendCallback = jest.fn();
    subscribeCallback = jest.fn();
    allowUploadCallback = jest.fn();
    cancelUploadCallback = jest.fn();
    consumeUploadedEntriesCallback = jest.fn();
    uploadedEntriesCallback = jest.fn();
    wsSocket = new WsLiveViewSocket(
      "id",
      new URL("http://example.com"),
      pageTitleCallback,
      pushEventCallback,
      pushPatchCallback,
      pushRedirectCallback,
      putFlashCallback,
      sendCallback,
      subscribeCallback,
      allowUploadCallback,
      cancelUploadCallback,
      consumeUploadedEntriesCallback,
      uploadedEntriesCallback
    );
  });

  it("http mount returns context", () => {
    const socket = new HttpLiveViewSocket<TestLVContext>("id", new URL("http://example.com"));
    component.mount(socket, {}, { _csrf_token: "csrf", _mounts: -1 });
    expect(socket.context.foo).toEqual("bar");
  });

  it("http default handleParams does NOT change context", async () => {
    const socket = new HttpLiveViewSocket<TestLVContext>("id", new URL("http://example.com"));
    component.mount(socket, {}, { _csrf_token: "csrf", _mounts: -1 });
    await component.handleParams(new URL("http://example.com/?foo=baz"), socket);
    expect(socket.context.foo).toEqual("bar");
  });

  it("http render returns context view", async () => {
    const url = new URL("http://example.com/?foo=baz");
    const socket = new HttpLiveViewSocket<TestLVContext>("id", url);
    component.mount(socket, {}, { _csrf_token: "csrf", _mounts: -1 });
    await component.handleParams(url, socket);
    expect(socket.context.foo).toEqual("bar");
    const view = await component.render(socket.context, {
      csrfToken: "csrf",
      live_component: jest.fn(),
      url,
      uploads: {},
    });
    expect(view.toString()).toEqual("<div>bar</div>");
  });

  it("ws mount returns context", async () => {
    await component.mount(wsSocket, {}, { _csrf_token: "csrf", _mounts: -1 });
    expect(wsSocket.context.foo).toEqual("bar");
  });

  it("calls all callbacks", async () => {
    component = new TestLVPushAndSend();

    component.mount(wsSocket, {}, { _csrf_token: "csrf", _mounts: -1 });

    expect(pageTitleCallback).toHaveBeenCalledTimes(1);
    expect(pushEventCallback).toHaveBeenCalledTimes(1);
    expect(pushPatchCallback).toHaveBeenCalledTimes(3);
    expect(pushRedirectCallback).toHaveBeenCalledTimes(3);
    expect(putFlashCallback).toHaveBeenCalledTimes(1);
    expect(sendCallback).toHaveBeenCalledTimes(2);
    expect(subscribeCallback).toHaveBeenCalledTimes(1);
    expect(allowUploadCallback).toHaveBeenCalledTimes(0);
    expect(cancelUploadCallback).toHaveBeenCalledTimes(0);
    expect(consumeUploadedEntriesCallback).toHaveBeenCalledTimes(0);
    expect(uploadedEntriesCallback).toHaveBeenCalledTimes(0);
  });

  it("tempAssign works to clear assigns", () => {
    component.mount(wsSocket, {}, { _csrf_token: "csrf", _mounts: -1 });
    wsSocket.assign({ foo: "bar" });
    wsSocket.tempAssign({ foo: "" });
    expect(wsSocket.context.foo).toEqual("bar");
    wsSocket.updateContextWithTempAssigns();
    expect(wsSocket.context.foo).toEqual("");
  });

  it("pushRedirect works in mount and handleParams in HTTP request", () => {
    const url = new URL("http://example.com");
    const socket = new HttpLiveViewSocket<TestRedirectingContext>("id", url);
    const c = new TestRedirectingLiveView();
    c.mount(socket, {}, { _csrf_token: "csrf", _mounts: -1 });
    expect(socket.redirect).toEqual({ to: "/new/path?param=mount", replace: false });
    expect(socket.context.redirectedIn).toEqual("mount");
    c.handleParams(new URL("http://example.com"), socket);
    expect(socket.redirect).toEqual({ to: "/new/path?param=handleParams", replace: true });
    expect(socket.context.redirectedIn).toEqual("handleParams");
  });

  it("allowUpload works in mount in HTTP", () => {
    const url = new URL("http://example.com");
    const socket = new HttpLiveViewSocket("id", url);
    const lv = createLiveView({
      mount: (socket) => {
        socket.allowUpload("myUploadName");
      },
      render: () => {
        return html``;
      },
    });
    lv.mount(socket, {}, { _csrf_token: "csrf", _mounts: -1 });
    expect(socket.uploadConfigs).toHaveProperty("myUploadName");
    expect(socket.uploadConfigs["myUploadName"].entries).toEqual([]);
  });

  it("upload callbacks are connected in WS", async () => {
    const lv = createLiveView({
      mount: (socket) => {
        socket.allowUpload("myUploadName");
      },
      handleEvent: async (event, socket) => {
        // call the rest of the upload callbacks
        await socket.cancelUpload("myUploadName", "myref");
        await socket.uploadedEntries("myUploadName");
        await socket.consumeUploadedEntries("myUploadName", async () => {});
      },
      render: () => {
        return html``;
      },
    });

    lv.mount(wsSocket, {}, { _csrf_token: "csrf", _mounts: -1 });
    await lv.handleEvent({ type: "foo" }, wsSocket);
    expect(allowUploadCallback).toHaveBeenCalledTimes(1);
    expect(cancelUploadCallback).toHaveBeenCalledTimes(1);
    expect(consumeUploadedEntriesCallback).toHaveBeenCalledTimes(1);
    expect(uploadedEntriesCallback).toHaveBeenCalledTimes(1);
  });
});

interface TestLVContext {
  foo: string;
}

class TestLiveView extends BaseLiveView<TestLVContext> {
  mount(socket: LiveViewSocket<TestLVContext>, session: Partial<SessionData>, params: LiveViewMountParams) {
    socket.assign({ foo: "bar" });
  }

  render(ctx: TestLVContext): LiveViewTemplate {
    return html`<div>${ctx.foo}</div>`;
  }
}

interface TestLVPushAndSendContext {
  foo: string;
}

class TestLVPushAndSend extends BaseLiveView<TestLVPushAndSendContext> {
  mount(socket: LiveViewSocket<TestLVPushAndSendContext>, session: Partial<SessionData>, params: LiveViewMountParams) {
    socket.pageTitle("new page title");
    socket.pushEvent({ type: "event", data: "blah" });
    socket.pushPatch("path");
    socket.pushPatch("path", new URLSearchParams({ param: String(1) }));
    socket.pushPatch("path", new URLSearchParams({ param: String(1) }), true);
    socket.pushRedirect("/new/path");
    socket.pushRedirect("/new/path", new URLSearchParams({ param: String(1) }));
    socket.pushRedirect("/new/path", new URLSearchParams({ param: String(1) }), true);
    socket.putFlash("info", "Helpful message");
    socket.sendInfo({ type: "my_event" });
    socket.sendInfo("my_event");
    socket.subscribe("topic");
  }

  render(ctx: TestLVPushAndSendContext): LiveViewTemplate {
    return html`<div>${ctx.foo}</div>`;
  }
}

interface TestRedirectingContext {
  redirectedIn: "mount" | "handleParams";
}

class TestRedirectingLiveView extends BaseLiveView<TestRedirectingContext> {
  mount(socket: LiveViewSocket<TestRedirectingContext>, session: Partial<SessionData>, params: LiveViewMountParams) {
    if (!socket.context.redirectedIn) {
      socket.assign({ redirectedIn: "mount" });
      socket.pushRedirect("/new/path", new URLSearchParams({ param: "mount" }), false);
    }
  }

  handleParams(url: URL, socket: LiveViewSocket<TestRedirectingContext>): void {
    if (socket.context.redirectedIn === "mount") {
      socket.assign({ redirectedIn: "handleParams" });
      socket.pushRedirect("/new/path", new URLSearchParams({ param: "handleParams" }), true);
    }
  }

  render(ctx: TestRedirectingContext): LiveViewTemplate {
    return html`<div>${ctx.redirectedIn}</div>`;
  }
}
