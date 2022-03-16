import { SessionData } from "express-session";
import { mock } from "jest-mock-extended";
import jwt from "jsonwebtoken";
import { nanoid } from "nanoid";
import { WebSocket } from "ws";
import {
  BaseLiveComponent,
  BaseLiveView,
  html,
  HtmlSafeString,
  LiveComponentSocket,
  LiveViewExternalEventListener,
  LiveViewInternalEventListener,
  LiveViewMeta,
  LiveViewMountParams,
  LiveViewSocket,
  LiveViewTemplate,
  StringPropertyValues,
} from "..";
import { LiveViewContext } from "../component";
import { PubSub } from "../pubsub/SingleProcessPubSub";
import { areContextsValueEqual, isEventHandler, isInfoHandler, LiveViewComponentManager } from "./component_manager";
import {
  PhxBlurPayload,
  PhxClickPayload,
  PhxFlash,
  PhxFocusPayload,
  PhxFormPayload,
  PhxHeartbeatIncoming,
  PhxHookPayload,
  PhxIncomingMessage,
  PhxJoinIncoming,
  PhxKeyDownPayload,
  PhxKeyUpPayload,
  PhxLivePatchIncoming,
} from "./types";

describe("test component manager", () => {
  let cmLiveView: LiveViewComponentManager;
  let cmLiveViewAndLiveComponent: LiveViewComponentManager;
  let liveViewConnectionId: string;
  let liveViewAndLiveComponentConnectionId: string;
  let ws: WebSocket;
  beforeEach(() => {
    liveViewConnectionId = nanoid();
    liveViewAndLiveComponentConnectionId = nanoid();
    ws = mock<WebSocket>();
    cmLiveView = new LiveViewComponentManager(
      new TestLiveViewComponent(),
      "my signing secret",
      liveViewConnectionId,
      ws
    );
    cmLiveViewAndLiveComponent = new LiveViewComponentManager(
      new TestLiveViewAndLiveComponent(),
      "my signing secret",
      liveViewAndLiveComponentConnectionId,
      ws
    );
  });

  afterEach(() => {
    cmLiveView.shutdown();
    cmLiveViewAndLiveComponent.shutdown();
  });

  it("handle join works for liveView", async () => {
    const spyDefaultLiveViewMeta = jest.spyOn(cmLiveView as any, "defaultLiveViewMeta");
    await cmLiveView.handleJoin(
      newPhxJoin("my csrf token", "my signing secret", { url: "http://localhost:4444/test" })
    );
    expect(ws.send).toHaveBeenCalledTimes(1);
    expect(spyDefaultLiveViewMeta).toHaveBeenCalledTimes(1);
  });

  it("handle join works for liveViewAndLiveComponent", async () => {
    const spyDefaultLiveViewMeta = jest.spyOn(cmLiveViewAndLiveComponent as any, "defaultLiveViewMeta");
    await cmLiveViewAndLiveComponent.handleJoin(
      newPhxJoin("my csrf token", "my signing secret", { url: "http://localhost:4444/test" })
    );
    expect(ws.send).toHaveBeenCalledTimes(1);
    expect(spyDefaultLiveViewMeta).toHaveBeenCalledTimes(1);
  });

  it("handle join with mismatching csrfTokens", () => {
    cmLiveView.handleJoin(
      newPhxJoin("my csrf token", "my signing secret", {
        url: "http://localhost:4444/test",
        paramCsrfOverride: "my other csrf token",
      })
    );
    expect(ws.send).toHaveBeenCalledTimes(0);
  });

  it("handle join with jwt signing error", () => {
    cmLiveView.handleJoin(
      newPhxJoin("my csrf token", "my signing secret", {
        url: "http://localhost:4444/test",
        signingSecretOverride: "my other signing secret",
      })
    );
    expect(ws.send).toHaveBeenCalledTimes(0);
  });

  it("can determine if component implements handleEvent", () => {
    expect(isEventHandler(new TestLiveViewComponent())).toBe(true);
    expect(isInfoHandler(new TestLiveViewComponent())).toBe(true);

    expect(isEventHandler(new NotEventHandlerNorInfoHandlerLiveViewComponent())).toBe(false);
    expect(isInfoHandler(new NotEventHandlerNorInfoHandlerLiveViewComponent())).toBe(false);
  });

  it("handleSubscription unknown message fails", async () => {
    const phx_unknown = [null, null, "unknown", "unknown", {}];
    // @ts-ignore - ignore type error for test
    await cmLiveView.handleSubscriptions({ type: "unknown", message: phx_unknown });
    expect(ws.send).toHaveBeenCalledTimes(0);
  });

  it("handleHB sends reply", async () => {
    const phx_hb: PhxHeartbeatIncoming = [null, "5", "phoenix", "heartbeat", {}];
    await cmLiveView.handleSubscriptions({ type: "heartbeat", message: phx_hb });
    await cmLiveView.onHeartbeat(phx_hb);
    expect(ws.send).toHaveBeenCalledTimes(2);
  });

  it("send events to LiveComponent", async () => {
    const spySendInternal = jest.spyOn(cmLiveViewAndLiveComponent as any, "sendInternal");
    const phx_click: PhxIncomingMessage<PhxClickPayload> = [
      "4",
      "6",
      "lv:phx-AAAAAAAA",
      "event",
      {
        cid: 1,
        type: "click",
        event: "eventName",
        value: { value: "eventValue" },
      },
    ];
    await cmLiveViewAndLiveComponent.handleJoin(
      newPhxJoin("my csrf token", "my signing secret", { url: "http://localhost:4444/test" })
    );
    await cmLiveViewAndLiveComponent.handleSubscriptions({ type: "event", message: phx_click });
    await cmLiveViewAndLiveComponent.onEvent(phx_click);
    // join, subscription, event
    expect(ws.send).toHaveBeenCalledTimes(3);
    expect(spySendInternal).toHaveBeenCalledTimes(2); // subscription, event
    await cmLiveViewAndLiveComponent.onEvent(phx_click);
    expect(ws.send).toHaveBeenCalledTimes(4);
  });

  it("multiple clicks for LiveComponent", async () => {
    const phx_click: PhxIncomingMessage<PhxClickPayload> = [
      "4",
      "6",
      "lv:phx-AAAAAAAA",
      "event",
      {
        cid: 1,
        type: "click",
        event: "eventName",
        value: { value: "eventValue" },
      },
    ];
    await cmLiveViewAndLiveComponent.handleJoin(
      newPhxJoin("my csrf token", "my signing secret", { url: "http://localhost:4444/test" })
    );
    await cmLiveViewAndLiveComponent.handleSubscriptions({ type: "event", message: phx_click });
    await cmLiveViewAndLiveComponent.onEvent(phx_click);
    // join, subscription, event
    expect(ws.send).toHaveBeenCalledTimes(3);
  });

  it("find LiveComponent by cid that does not exist skips event", async () => {
    const spySendInternal = jest.spyOn(cmLiveViewAndLiveComponent as any, "sendInternal");
    const phx_click: PhxIncomingMessage<PhxClickPayload> = [
      "4",
      "6",
      "lv:phx-AAAAAAAA",
      "event",
      {
        cid: 10, // not found
        type: "click",
        event: "eventName",
        value: { value: "eventValue" },
      },
    ];
    await cmLiveViewAndLiveComponent.handleJoin(
      newPhxJoin("my csrf token", "my signing secret", { url: "http://localhost:4444/test" })
    );
    await cmLiveViewAndLiveComponent.handleSubscriptions({ type: "event", message: phx_click });
    await cmLiveViewAndLiveComponent.onEvent(phx_click);
    expect(ws.send).toHaveBeenCalledTimes(1); // join
    expect(spySendInternal).toHaveBeenCalledTimes(0);
  });

  it("onEvent valid click event socket pageTitle", async () => {
    const phx_click: PhxIncomingMessage<PhxClickPayload> = [
      "4",
      "6",
      "lv:phx-AAAAAAAA",
      "event",
      {
        type: "click",
        event: "eventName",
        value: { value: "eventValue" },
      },
    ];
    await cmLiveView.handleJoin(
      newPhxJoin("my csrf token", "my signing secret", { url: "http://localhost:4444/test" })
    );
    await cmLiveView.handleSubscriptions({ type: "event", message: phx_click });
    await cmLiveView.onEvent(phx_click);
    expect(ws.send).toHaveBeenCalledTimes(3);
  });

  it("onEvent valid click event but not eventHandler", async () => {
    const c = new NotEventHandlerNorInfoHandlerLiveViewComponent();
    const cm = new LiveViewComponentManager(c, "my signing secret", liveViewConnectionId, ws);
    const phx_click: PhxIncomingMessage<PhxClickPayload> = [
      "4",
      "6",
      "lv:phx-AAAAAAAA",
      "event",
      {
        type: "click",
        event: "eventName",
        value: { value: "eventValue" },
      },
    ];
    await cm.handleSubscriptions({ type: "event", message: phx_click });
    await cm.onEvent(phx_click);
    expect(ws.send).toHaveBeenCalledTimes(0);
  });

  it("onEvent valid click event", async () => {
    const phx_click: PhxIncomingMessage<PhxClickPayload> = [
      "4",
      "6",
      "lv:phx-AAAAAAAA",
      "event",
      {
        type: "click",
        event: "eventName",
        value: { value: "eventValue" },
      },
    ];
    await cmLiveView.handleJoin(
      newPhxJoin("my csrf token", "my signing secret", { url: "http://localhost:4444/test" })
    );
    await cmLiveView.handleSubscriptions({ type: "event", message: phx_click });
    await cmLiveView.onEvent(phx_click);
    expect(ws.send).toHaveBeenCalledTimes(3);
  });

  it("onEvent valid form event", async () => {
    const phx_form: PhxIncomingMessage<PhxFormPayload> = [
      "4",
      "6",
      "lv:phx-AAAAAAAA",
      "event",
      {
        type: "form",
        event: "eventName",
        value: { value: "eventValue" },
        uploads: {},
      },
    ];
    await cmLiveView.handleJoin(
      newPhxJoin("my csrf token", "my signing secret", { url: "http://localhost:4444/test" })
    );
    await cmLiveView.handleSubscriptions({ type: "event", message: phx_form });
    await cmLiveView.onEvent(phx_form);
    expect(ws.send).toHaveBeenCalledTimes(3);
  });

  it("onEvent valid keyup event", async () => {
    const phx_keyup: PhxIncomingMessage<PhxKeyUpPayload> = [
      "4",
      "6",
      "lv:phx-AAAAAAAA",
      "event",
      {
        type: "keyup",
        event: "eventName",
        value: { key: "key", value: "eventValue" },
      },
    ];
    await cmLiveView.handleJoin(
      newPhxJoin("my csrf token", "my signing secret", { url: "http://localhost:4444/test" })
    );
    await cmLiveView.handleSubscriptions({ type: "event", message: phx_keyup });
    await cmLiveView.onEvent(phx_keyup);
    expect(ws.send).toHaveBeenCalledTimes(3);
  });

  it("onEvent valid keydown event", async () => {
    const phx_keydown: PhxIncomingMessage<PhxKeyDownPayload> = [
      "4",
      "6",
      "lv:phx-AAAAAAAA",
      "event",
      {
        type: "keydown",
        event: "eventName",
        value: { key: "key", value: "eventValue" },
      },
    ];
    await cmLiveView.handleJoin(
      newPhxJoin("my csrf token", "my signing secret", { url: "http://localhost:4444/test" })
    );
    await cmLiveView.handleSubscriptions({ type: "event", message: phx_keydown });
    await cmLiveView.onEvent(phx_keydown);
    expect(ws.send).toHaveBeenCalledTimes(3);
  });

  it("onEvent valid blur event", async () => {
    const phx_blur: PhxIncomingMessage<PhxBlurPayload> = [
      "4",
      "6",
      "lv:phx-AAAAAAAA",
      "event",
      {
        type: "blur",
        event: "eventName",
        value: { value: "eventValue" },
      },
    ];
    await cmLiveView.handleJoin(
      newPhxJoin("my csrf token", "my signing secret", { url: "http://localhost:4444/test" })
    );
    await cmLiveView.handleSubscriptions({ type: "event", message: phx_blur });
    await cmLiveView.onEvent(phx_blur);
    expect(ws.send).toHaveBeenCalledTimes(3);
  });

  it("onEvent valid focus event", async () => {
    const phx_focus: PhxIncomingMessage<PhxFocusPayload> = [
      "4",
      "6",
      "lv:phx-AAAAAAAA",
      "event",
      {
        type: "focus",
        event: "eventName",
        value: { value: "eventValue" },
      },
    ];
    await cmLiveView.handleJoin(
      newPhxJoin("my csrf token", "my signing secret", { url: "http://localhost:4444/test" })
    );
    await cmLiveView.handleSubscriptions({ type: "event", message: phx_focus });
    await cmLiveView.onEvent(phx_focus);
    expect(ws.send).toHaveBeenCalledTimes(3);
  });

  it("onEvent valid hook event", async () => {
    const phx_hook: PhxIncomingMessage<PhxHookPayload> = [
      "4",
      "6",
      "lv:phx-AAAAAAAA",
      "event",
      {
        type: "hook",
        event: "eventName",
        value: { blah: "something" },
      },
    ];
    await cmLiveView.handleJoin(
      newPhxJoin("my csrf token", "my signing secret", { url: "http://localhost:4444/test" })
    );
    await cmLiveView.handleSubscriptions({ type: "event", message: phx_hook });
    await cmLiveView.onEvent(phx_hook);
    expect(ws.send).toHaveBeenCalledTimes(3);
  });

  it("onEvent unknown event type", async () => {
    const phx_unknown: PhxIncomingMessage<unknown> = [
      "4",
      "6",
      "lv:phx-AAAAAAAA",
      "event",
      {
        type: "unknown",
        event: "eventName",
        value: { value: "eventValue" },
      },
    ];
    // @ts-ignore -- skip type check for unknown
    await cmLiveView.handleSubscriptions({ type: "event", message: phx_unknown });
    // @ts-ignore -- skip type check for unknown
    await cmLiveView.onEvent(phx_unknown);
    expect(ws.send).toHaveBeenCalledTimes(0);
  });

  it("onLivePatch calls send", async () => {
    const phxLivePatch: PhxLivePatchIncoming = [
      "4",
      "7",
      "lv:phx-AAAAAAAA",
      "live_patch",
      {
        url: "http://localhost:4444/test?id=1",
      },
    ];
    await cmLiveView.handleJoin(
      newPhxJoin("my csrf token", "my signing secret", { url: "http://localhost:4444/test" })
    );
    await cmLiveView.handleSubscriptions({ type: "live_patch", message: phxLivePatch });
    await cmLiveView.onLivePatch(phxLivePatch);
    expect(ws.send).toHaveBeenCalledTimes(3);
  });

  it("test repeat / shutdown", (done) => {
    let count = 0;
    cmLiveView.repeat(() => {
      count++;
    }, 100);
    setTimeout(() => {
      expect(count).toBe(2);
      done();
    }, 250);
  });

  it("sendInternal with handleInfo", async () => {
    const sic = new SendInternalTestLiveViewComponent();
    const cm = new LiveViewComponentManager(sic, "my signing secret", liveViewConnectionId, ws);
    const phx_click: PhxIncomingMessage<PhxClickPayload> = [
      "4",
      "6",
      "lv:phx-AAAAAAAA",
      "event",
      {
        type: "click",
        event: "eventName",
        value: { value: "eventValue" },
      },
    ];
    await cm.handleJoin(newPhxJoin("my csrf token", "my signing secret", { url: "http://localhost:4444/test" }));
    await cm.handleSubscriptions({ type: "event", message: phx_click });
    expect(ws.send).toHaveBeenCalledTimes(3);
  });

  it("sendInternal with no handleInfo", async () => {
    const sic = new SendInternalNoHandleInfoLiveViewComponent();
    const cm = new LiveViewComponentManager(sic, "my signing secret", liveViewConnectionId, ws);
    const phx_click: PhxIncomingMessage<PhxClickPayload> = [
      "4",
      "6",
      "lv:phx-AAAAAAAA",
      "event",
      {
        type: "click",
        event: "eventName",
        value: { value: "eventValue" },
      },
    ];
    await cm.handleJoin(newPhxJoin("my csrf token", "my signing secret", { url: "http://localhost:4444/test" }));
    await cm.handleSubscriptions({ type: "event", message: phx_click });
    expect(ws.send).toHaveBeenCalledTimes(2);
  });

  it("send phxReply on unknown socket error", async () => {
    const tc = new TestLiveViewComponent();
    const ws = mock<WebSocket>();
    ws.send.mockImplementation(
      (
        data: any,
        options: {
          mask?: boolean;
          binary?: boolean;
          compress?: boolean;
          fin?: boolean;
        },
        cb?: (err?: Error) => void
      ) => {
        if (cb) {
          cb(new Error("unknown error"));
        }
      }
    );
    const cm = new LiveViewComponentManager(tc, "my signing secret", liveViewConnectionId, ws);

    const phx_click: PhxIncomingMessage<PhxClickPayload> = [
      "4",
      "6",
      "lv:phx-AAAAAAAA",
      "event",
      {
        type: "click",
        event: "eventName",
        value: { value: "eventValue" },
      },
    ];
    await cm.handleJoin(newPhxJoin("my csrf token", "my signing secret", { url: "http://localhost:4444/test" }));
  });

  it("a component that sets page title", async () => {
    const c = new SetsPageTitleComponent();
    const cm = new LiveViewComponentManager(c, "my signing secret", liveViewConnectionId, ws);
    const spyMaybeAddPageTitleToParts = jest.spyOn(cm as any, "maybeAddPageTitleToParts");

    await cm.handleJoin(newPhxJoin("my csrf token", "my signing secret", { url: "http://localhost:4444/test" }));
    expect(ws.send).toHaveBeenCalledTimes(1);
    expect(spyMaybeAddPageTitleToParts).toHaveBeenCalledTimes(1);
    expect(spyMaybeAddPageTitleToParts).toReturnWith({ s: ["<div>test</div>"], t: "new page title" });
  });

  it("component that repeats", async () => {
    jest.useFakeTimers();
    const c = new Repeat50msTestLiveViewComponent();
    const spyHandleInfo = jest.spyOn(c as any, "handleInfo");
    const cm = new LiveViewComponentManager(c, "my signing secret", liveViewConnectionId, ws);
    await cm.handleJoin(newPhxJoin("my csrf token", "my signing secret", { url: "http://localhost:4444/test" }));

    setTimeout(async () => {
      // get private socket context
      expect((cm["socket"] as LiveViewSocket<LiveViewContext>).context).toHaveProperty("count", 2);
      cm.shutdown();
    }, 125);
    jest.runAllTimers();
  });

  it("component that subscribes and received message", async () => {
    const c = new SubscribeTestLiveViewComponent();
    const cm = new LiveViewComponentManager(c, "my signing secret", liveViewConnectionId, ws);
    await cm.handleJoin(newPhxJoin("my csrf token", "my signing secret", { url: "http://localhost:4444/test" }));

    await PubSub.broadcast("testTopic", { test: "test" });
    expect((cm["socket"] as LiveViewSocket<LiveViewContext>).context).toHaveProperty("testReceived", 1);
    cm.shutdown();
  });

  it("component that pushPatches", async () => {
    const c = new PushPatchingTestComponent();
    const spyHandleParams = jest.spyOn(c as any, "handleParams");
    const cm = new LiveViewComponentManager(c, "my signing secret", liveViewConnectionId, ws);
    await cm.handleJoin(newPhxJoin("my csrf token", "my signing secret", { url: "http://localhost:4444/test" }));

    const phx_click: PhxIncomingMessage<PhxClickPayload> = [
      "4",
      "6",
      "lv:phx-AAAAAAAA",
      "event",
      {
        type: "click",
        event: "eventName",
        value: { value: "eventValue" },
      },
    ];
    await cm.onEvent(phx_click);
    await cm.onEvent(phx_click);
    expect(spyHandleParams).toHaveBeenCalledTimes(3);
    expect((cm["socket"] as LiveViewSocket<LiveViewContext>).context).toHaveProperty("pushed", 3);
    cm.shutdown();
  });

  it("component that pushRedirects", async () => {
    const c = new PushRedirectingTestComponent();
    const spyHandleParams = jest.spyOn(c as any, "handleParams");
    const cm = new LiveViewComponentManager(c, "my signing secret", liveViewConnectionId, ws);
    await cm.handleJoin(newPhxJoin("my csrf token", "my signing secret", { url: "http://localhost:4444/test" }));

    const phx_click: PhxIncomingMessage<PhxClickPayload> = [
      "4",
      "6",
      "lv:phx-AAAAAAAA",
      "event",
      {
        type: "click",
        event: "eventName",
        value: { value: "eventValue" },
      },
    ];
    await cm.onEvent(phx_click);
    await cm.onEvent(phx_click);
    expect(spyHandleParams).toHaveBeenCalledTimes(3);
    expect((cm["socket"] as LiveViewSocket<LiveViewContext>).context).toHaveProperty("pushed", 3);
    cm.shutdown();
  });

  it("component that pushEvents", async () => {
    const c = new PushEventTestComponent();
    const spyHandleParams = jest.spyOn(c as any, "handleParams");
    const cm = new LiveViewComponentManager(c, "my signing secret", liveViewConnectionId, ws);
    await cm.handleJoin(newPhxJoin("my csrf token", "my signing secret", { url: "http://localhost:4444/test" }));

    const phx_click: PhxIncomingMessage<PhxClickPayload> = [
      "4",
      "6",
      "lv:phx-AAAAAAAA",
      "event",
      {
        type: "click",
        event: "eventName",
        value: { value: "eventValue" },
      },
    ];
    await cm.onEvent(phx_click);
    expect(spyHandleParams).toHaveBeenCalledTimes(1);
    expect((cm["socket"] as LiveViewSocket<LiveViewContext>).context).toHaveProperty("pushed", 0);
    cm.shutdown();
  });

  it("default live view meta", async () => {
    const c = new PushPatchingTestComponent();
    const spyHandleParams = jest.spyOn(c as any, "handleParams");
    const cm = new LiveViewComponentManager(c, "my signing secret", liveViewConnectionId, ws);
    await cm.handleJoin(newPhxJoin("my csrf token", "my signing secret", { url: "http://localhost:4444/test" }));

    const phx_click: PhxIncomingMessage<PhxClickPayload> = [
      "4",
      "6",
      "lv:phx-AAAAAAAA",
      "event",
      {
        type: "click",
        event: "eventName",
        value: { value: "eventValue" },
      },
    ];
    await cm.onEvent(phx_click);
    expect(spyHandleParams).toHaveBeenCalledTimes(2);
    expect((cm["socket"] as LiveViewSocket<LiveViewContext>).context).toHaveProperty("pushed", 2);
    cm.shutdown();
  });

  it("areContextsValueEqual test", () => {
    // @ts-ignore
    expect(areContextsValueEqual(undefined, undefined)).toBeFalsy();
  });
});

interface TestLiveViewComponentContext extends LiveViewContext {}
class TestLiveViewComponent
  extends BaseLiveView<TestLiveViewComponentContext, {}>
  implements
    LiveViewExternalEventListener<TestLiveViewComponentContext, "eventName", unknown>,
    LiveViewInternalEventListener<TestLiveViewComponentContext, "internalEvent">
{
  private newPageTitle?: string;

  constructor(newPageTitle?: string) {
    super();
    this.newPageTitle = newPageTitle;
  }

  handleInfo(event: "internalEvent", socket: LiveViewSocket<TestLiveViewComponentContext>): void | Promise<void> {
    // no op but expected for test
  }

  handleEvent(
    event: "eventName",
    params: StringPropertyValues<unknown>,
    socket: LiveViewSocket<TestLiveViewComponentContext>
  ) {
    if (this.newPageTitle) {
      socket.pageTitle(this.newPageTitle);
    }
  }

  render() {
    return html`<div>test</div>`;
  }
}

interface SendInternalContext extends LiveViewContext {
  handleEventCount: number;
  handleInfoCount: number;
}
class SendInternalTestLiveViewComponent
  extends BaseLiveView<SendInternalContext, {}>
  implements
    LiveViewExternalEventListener<SendInternalContext, "eventName", unknown>,
    LiveViewInternalEventListener<SendInternalContext, "eventName">
{
  mount(params: LiveViewMountParams, session: Partial<SessionData>, socket: LiveViewSocket<{}>) {
    socket.assign({
      handleEventCount: 0,
      handleInfoCount: 0,
    });
  }

  handleEvent(event: "eventName", params: StringPropertyValues<unknown>, socket: LiveViewSocket<SendInternalContext>) {
    socket.send("eventName");
    socket.assign({
      handleEventCount: socket.context.handleEventCount + 1,
      handleInfoCount: socket.context.handleInfoCount,
    });
  }

  handleInfo(event: "eventName", socket: LiveViewSocket<SendInternalContext>) {
    socket.assign({
      handleEventCount: socket.context.handleEventCount,
      handleInfoCount: socket.context.handleInfoCount + 1,
    });
  }

  render(context: SendInternalContext) {
    const { handleEventCount, handleInfoCount } = context;
    return html`<div>${handleEventCount},${handleInfoCount}</div>`;
  }
}

interface SendInternalNoHandleInfoContext extends LiveViewContext {
  handleEventCount: number;
  handleInfoCount: number;
}
class SendInternalNoHandleInfoLiveViewComponent
  extends BaseLiveView<SendInternalNoHandleInfoContext, {}>
  implements LiveViewExternalEventListener<SendInternalNoHandleInfoContext, "eventName", unknown>
{
  mount(params: LiveViewMountParams, session: Partial<SessionData>, socket: LiveViewSocket<{}>) {
    socket.assign({
      handleEventCount: 0,
      handleInfoCount: 0,
    });
  }

  handleEvent(
    event: "eventName",
    params: StringPropertyValues<unknown>,
    socket: LiveViewSocket<SendInternalNoHandleInfoContext>
  ) {
    socket.send("eventName");
    socket.assign({
      handleEventCount: socket.context.handleEventCount + 1,
      handleInfoCount: socket.context.handleInfoCount,
    });
  }

  render(context: SendInternalNoHandleInfoContext) {
    const { handleEventCount, handleInfoCount } = context;
    return html`<div>${handleEventCount},${handleInfoCount}</div>`;
  }
}

class NotEventHandlerNorInfoHandlerLiveViewComponent extends BaseLiveView<LiveViewContext, {}> {
  render() {
    return html`<div>test</div>`;
  }
}

interface RepeatCtx extends LiveViewContext {
  count: number;
}
class Repeat50msTestLiveViewComponent
  extends BaseLiveView<RepeatCtx, {}>
  implements LiveViewInternalEventListener<RepeatCtx, "add">
{
  mount(params: LiveViewMountParams, session: Partial<SessionData>, socket: LiveViewSocket<RepeatCtx>) {
    socket.repeat(() => {
      socket.send("add");
    }, 50);
    socket.assign({ count: 0 });
  }

  handleInfo(event: "add", socket: LiveViewSocket<RepeatCtx>) {
    socket.assign({ count: socket.context.count + 1 });
  }

  render() {
    return html`<div>test</div>`;
  }
}

interface SubscribeCtx extends LiveViewContext {
  testReceived: number;
}
class SubscribeTestLiveViewComponent
  extends BaseLiveView<SubscribeCtx, {}>
  implements LiveViewInternalEventListener<SubscribeCtx, "testTopicReceived">
{
  mount(params: LiveViewMountParams, session: Partial<SessionData>, socket: LiveViewSocket<SubscribeCtx>) {
    socket.subscribe("testTopic");
    socket.assign({
      testReceived: 0,
    });
  }

  handleInfo(event: "testTopicReceived", socket: LiveViewSocket<SubscribeCtx>) {
    socket.assign({
      testReceived: socket.context.testReceived + 1,
    });
  }

  render() {
    return html`<div>test</div>`;
  }
}

interface PushPatchCtx extends LiveViewContext {
  pushed: number;
}
class PushPatchingTestComponent
  extends BaseLiveView<PushPatchCtx, { go?: string }>
  implements LiveViewExternalEventListener<PushPatchCtx, "push", {}>
{
  mount(params: LiveViewMountParams, session: Partial<SessionData>, socket: LiveViewSocket<PushPatchCtx>) {
    socket.assign({
      pushed: 0,
    });
  }

  handleParams(params: StringPropertyValues<{ go?: string }>, url: string, socket: LiveViewSocket<PushPatchCtx>) {
    let pushed = Number(socket.context.pushed);
    socket.assign({
      pushed: pushed + 1,
    });
  }

  handleEvent(event: "push", params: StringPropertyValues<{}>, socket: LiveViewSocket<PushPatchCtx>) {
    if (socket.context.pushed === 0) {
      socket.pushPatch("pushed");
    } else if (socket.context.pushed === 1) {
      socket.pushPatch("pushed", { go: "dog" });
    } else {
      socket.pushPatch("pushed", { go: "dog" }, true);
    }
  }

  render() {
    return html`<div>test</div>`;
  }
}

interface PushRedirectCtx extends LiveViewContext {
  pushed: number;
}
class PushRedirectingTestComponent
  extends BaseLiveView<PushRedirectCtx, { go?: string }>
  implements LiveViewExternalEventListener<PushRedirectCtx, "push", {}>
{
  mount(params: LiveViewMountParams, session: Partial<SessionData>, socket: LiveViewSocket<PushRedirectCtx>) {
    socket.assign({
      pushed: 0,
    });
  }

  handleParams(params: StringPropertyValues<{ go?: string }>, url: string, socket: LiveViewSocket<PushRedirectCtx>) {
    let pushed = Number(socket.context.pushed);
    socket.assign({
      pushed: pushed + 1,
    });
  }

  handleEvent(event: "push", params: StringPropertyValues<{}>, socket: LiveViewSocket<PushRedirectCtx>) {
    if (socket.context.pushed === 0) {
      socket.pushRedirect("pushed");
    } else if (socket.context.pushed === 1) {
      socket.pushRedirect("pushed", { go: "dog" });
    } else {
      socket.pushRedirect("pushed", { go: "dog" }, true);
    }
  }

  render() {
    return html`<div>test</div>`;
  }
}

interface PushEventCtx extends LiveViewContext {
  pushed: number;
}
class PushEventTestComponent
  extends BaseLiveView<PushEventCtx, { go?: string }>
  implements LiveViewExternalEventListener<PushEventCtx, "push", {}>
{
  mount(params: LiveViewMountParams, session: Partial<SessionData>, socket: LiveViewSocket<PushEventCtx>) {
    socket.assign({
      pushed: 0,
    });
  }

  handleParams(params: StringPropertyValues<{ go?: string }>, url: string, socket: LiveViewSocket<PushEventCtx>) {
    let pushed = Number(socket.context.pushed);
    if (params.go === "dog") {
      // only increment if passed params.go is dog
      pushed += 1;
      socket.assign({
        pushed,
      });
    }
  }

  handleEvent(event: "push", params: StringPropertyValues<{}>, socket: LiveViewSocket<PushEventCtx>) {
    socket.pushEvent("pushed", { go: "dog" });
  }

  render() {
    return html`<div>test</div>`;
  }
}

interface NewPhxJoinOptions {
  url?: string;
  redirect?: string;
  flash?: PhxFlash | null;
  paramCsrfOverride?: string;
  signingSecretOverride?: string;
}
const newPhxJoin = (csrfToken: string, signingSecret: string, options: NewPhxJoinOptions): PhxJoinIncoming => {
  const session: Partial<SessionData> = {
    csrfToken,
  };
  const params: LiveViewMountParams = {
    _csrf_token: options.paramCsrfOverride ?? csrfToken,
    _mounts: 0,
  };
  const url = options.url ?? options.redirect;
  const jwtSession = jwt.sign(JSON.stringify(session), options.signingSecretOverride ?? signingSecret);
  const jwtStatic = jwt.sign(JSON.stringify([]), options.signingSecretOverride ?? signingSecret);
  return [
    "4",
    "4",
    "lv:phx-AAAAAAAA",
    "phx_join",
    {
      url,
      params,
      session: jwtSession,
      static: jwtStatic,
    },
  ];
};

class SetsPageTitleComponent extends BaseLiveView<LiveViewContext, {}> {
  mount(params: LiveViewMountParams, session: Partial<SessionData>, socket: LiveViewSocket<{}>) {
    socket.pageTitle("new page title");
  }
  render(): HtmlSafeString {
    return html`<div>test</div>`;
  }
}

interface TestLVAndLCContext extends LiveViewContext {
  called: number;
}

class TestLiveViewAndLiveComponent
  extends BaseLiveView<TestLVAndLCContext, {}>
  implements LiveViewInternalEventListener<TestLVAndLCContext, "test">
{
  mount(params: LiveViewMountParams, session: Partial<SessionData>, socket: LiveViewSocket<TestLVAndLCContext>) {
    socket.assign({ called: 0 });
  }

  async render(ctx: TestLVAndLCContext, meta: LiveViewMeta): Promise<LiveViewTemplate> {
    const { called } = ctx;
    const { live_component } = meta;
    return html`
      <div>${await live_component(new TestLiveComponent(), { id: 1, subcalled: called })}</div>
      <div>${await live_component(new TestLiveComponent(), { foo: "bar" })}</div>
    `;
  }

  handleInfo(event: "test", socket: LiveViewSocket<TestLVAndLCContext>) {
    socket.assign({ called: socket.context.called + 1 });
  }
}

interface TestLVContext extends LiveViewContext {
  foo: string;
}
class TestLiveComponent extends BaseLiveComponent<TestLVContext> {
  render(ctx: TestLVContext) {
    return html`<div>${ctx.foo}</div>`;
  }

  handleEvent(event: "test", params: StringPropertyValues<TestLVContext>, socket: LiveComponentSocket<TestLVContext>) {
    socket.send("test");
    socket.pushEvent("test", { foo: "bar" });
    socket.assign({ foo: "bar" });
  }
}
