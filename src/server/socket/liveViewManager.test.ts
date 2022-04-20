import { mock } from "jest-mock-extended";
import { nanoid } from "nanoid";
import {
  BaseLiveComponent,
  BaseLiveView,
  html,
  HtmlSafeString,
  LiveComponentSocket,
  LiveViewMeta,
  LiveViewMountParams,
  LiveViewSocket,
  LiveViewTemplate,
} from "..";
import { SingleProcessPubSub } from "../pubsub";
import { JsonSerDe } from "../adaptor/jsonSerDe";
import { LiveViewManager } from "./liveViewManager";
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
import { AnyLiveContext, AnyLiveEvent, AnyLiveInfo } from "../live";
import { SessionData } from "../session";
import { WsAdaptor } from "../adaptor";

describe("test component manager", () => {
  let cmLiveView: LiveViewManager;
  let cmLiveViewAndLiveComponent: LiveViewManager;
  let liveViewConnectionId: string;
  let liveViewAndLiveComponentConnectionId: string;
  let ws: WsAdaptor;
  beforeEach(() => {
    liveViewConnectionId = nanoid();
    liveViewAndLiveComponentConnectionId = nanoid();
    ws = mock<WsAdaptor>();
    cmLiveView = new LiveViewManager(
      new TestLiveViewComponent(),
      liveViewConnectionId,
      ws,
      new JsonSerDe(),
      new SingleProcessPubSub(),
      (sessionData, innerContent) => {
        return html`<div>${innerContent}</div>`;
      }
    );
    cmLiveViewAndLiveComponent = new LiveViewManager(
      new TestLiveViewAndLiveComponent(),
      liveViewAndLiveComponentConnectionId,
      ws,
      new JsonSerDe(),
      new SingleProcessPubSub()
    );
  });

  afterEach(() => {
    (cmLiveView as any).shutdown();
    (cmLiveViewAndLiveComponent as any).shutdown();
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

  it("fails join without valid redirect or url", () => {
    cmLiveView.handleJoin(
      newPhxJoin("my csrf token", "my signing secret", {
        signingSecretOverride: "my other signing secret",
      })
    );
    expect(ws.send).toHaveBeenCalledTimes(0);
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

  it("onEvent valid form event rejects mismatching csrf", async () => {
    const phx_form: PhxIncomingMessage<PhxFormPayload> = [
      "4",
      "6",
      "lv:phx-AAAAAAAA",
      "event",
      {
        type: "form",
        event: "eventName",
        // @ts-ignore
        value: { value: "eventValue", _csrf_token: "wrong" },
        uploads: {},
      },
    ];
    await cmLiveView.handleJoin(
      newPhxJoin("my csrf token", "my signing secret", { url: "http://localhost:4444/test" })
    );
    // this call is rejected because mismatching csrf so send not called after join
    await cmLiveView.handleSubscriptions({ type: "event", message: phx_form });
    expect(ws.send).toHaveBeenCalledTimes(1);
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

  it("sendInternal with handleInfo", async () => {
    const sic = new SendInternalTestLiveViewComponent();
    const cm = new LiveViewManager(sic, liveViewConnectionId, ws, new JsonSerDe(), new SingleProcessPubSub());
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

  it("send phxReply on unknown socket error", async () => {
    const tc = new TestLiveViewComponent();
    const ws = mock<WsAdaptor>();
    ws.send.mockImplementation((message: string, errorHandler?: (err?: Error) => void) => {
      if (errorHandler) {
        errorHandler(new Error("unknown error"));
      }
    });
    const cm = new LiveViewManager(tc, liveViewConnectionId, ws, new JsonSerDe(), new SingleProcessPubSub());

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
    const cm = new LiveViewManager(c, liveViewConnectionId, ws, new JsonSerDe(), new SingleProcessPubSub());
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
    const cm = new LiveViewManager(c, liveViewConnectionId, ws, new JsonSerDe(), new SingleProcessPubSub());
    await cm.handleJoin(newPhxJoin("my csrf token", "my signing secret", { url: "http://localhost:4444/test" }));

    setTimeout(async () => {
      // get private socket context
      expect((cm["socket"] as LiveViewSocket).context).toHaveProperty("count", 2);
      (cm as any).shutdown();
    }, 125);
    jest.runAllTimers();
  });

  it("component that subscribes and received message", async () => {
    const c = new SubscribeTestLiveViewComponent();
    const pubSub = new SingleProcessPubSub();
    const cm = new LiveViewManager(c, liveViewConnectionId, ws, new JsonSerDe(), pubSub);
    await cm.handleJoin(newPhxJoin("my csrf token", "my signing secret", { url: "http://localhost:4444/test" }));

    await pubSub.broadcast("testTopic", { test: "test" });
    expect((cm["socket"] as LiveViewSocket).context).toHaveProperty("testReceived", 1);
    (cm as any).shutdown();
  });

  it("component that pushPatches", async () => {
    const c = new PushPatchingTestComponent();
    const cm = new LiveViewManager(c, liveViewConnectionId, ws, new JsonSerDe(), new SingleProcessPubSub());
    const spyCm = jest.spyOn(cm as any, "onPushPatch");
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
    await cm.onEvent(phx_click);
    expect(spyCm).toHaveBeenCalledTimes(3);
    (cm as any).shutdown();
  });

  it("component that pushRedirects", async () => {
    const c = new PushRedirectingTestComponent();
    const cm = new LiveViewManager(c, liveViewConnectionId, ws, new JsonSerDe(), new SingleProcessPubSub());
    const spyCm = jest.spyOn(cm as any, "onPushRedirect");
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
    await cm.onEvent(phx_click);
    expect(spyCm).toHaveBeenCalledTimes(3);
    (cm as any).shutdown();
  });

  it("component that pushEvents", async () => {
    const c = new PushEventTestComponent();
    const cm = new LiveViewManager(c, liveViewConnectionId, ws, new JsonSerDe(), new SingleProcessPubSub());
    const spyCm = jest.spyOn(cm as any, "onPushEvent");
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
    expect(spyCm).toHaveBeenCalledTimes(1);
    (cm as any).shutdown();
  });

  it("component that putFlash", async () => {
    const c = new PutFlashComponent();
    const cm = new LiveViewManager(c, liveViewConnectionId, ws, new JsonSerDe(), new SingleProcessPubSub());
    const spyPutFlash = jest.spyOn(cm as any, "putFlash");
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
    expect(spyPutFlash).toHaveBeenCalledTimes(1);
    (cm as any).shutdown();
  });

  it("default live view meta", async () => {
    const c = new PushPatchingTestComponent();
    const spyHandleParams = jest.spyOn(c as any, "handleParams");
    const cm = new LiveViewManager(c, liveViewConnectionId, ws, new JsonSerDe(), new SingleProcessPubSub());
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
    expect((cm["socket"] as LiveViewSocket).context).toHaveProperty("pushed", 2);
    (cm as any).shutdown();
  });

  it("test liveViewRootTemplate", async () => {
    const c = new TestLiveViewComponent();
    const liveViewRootTemplate = (session: SessionData, inner_content: HtmlSafeString) =>
      html`<div>${session.csrfToken} ${inner_content}</div>`;
    const cm = new LiveViewManager(c, liveViewConnectionId, ws, new JsonSerDe(), new SingleProcessPubSub());
    await cm.handleJoin(newPhxJoin("my csrf token", "my signing secret", { url: "http://localhost:4444/test" }));
    // use inline shapshot to see liveViewRootTemplate rendered
    expect(ws.send).toMatchInlineSnapshot(`
      [MockFunction] {
        "calls": Array [
          Array [
            "[\\"4\\",\\"4\\",\\"lv:phx-AAAAAAAA\\",\\"phx_reply\\",{\\"response\\":{\\"rendered\\":{\\"s\\":[\\"<div>test</div>\\"]}},\\"status\\":\\"ok\\"}]",
            [Function],
          ],
        ],
        "results": Array [
          Object {
            "type": "return",
            "value": undefined,
          },
        ],
      }
    `);
    (cm as any).shutdown();
  });
});

class TestLiveViewComponent extends BaseLiveView {
  private newPageTitle?: string;

  constructor(newPageTitle?: string) {
    super();
    this.newPageTitle = newPageTitle;
  }

  handleEvent(event: AnyLiveEvent, socket: LiveViewSocket<AnyLiveContext>) {
    if (this.newPageTitle) {
      socket.pageTitle(this.newPageTitle);
    }
  }

  render() {
    return html`<div>test</div>`;
  }
}

interface SendInternalContext {
  handleEventCount: number;
  handleInfoCount: number;
}
type SendInternalInfo = { type: "internal" };

class SendInternalTestLiveViewComponent extends BaseLiveView<SendInternalContext, AnyLiveEvent, SendInternalInfo> {
  mount(params: LiveViewMountParams, session: Partial<SessionData>, socket: LiveViewSocket<SendInternalContext>) {
    socket.assign({
      handleEventCount: 0,
      handleInfoCount: 0,
    });
  }

  handleEvent(event: AnyLiveEvent, socket: LiveViewSocket<SendInternalContext>) {
    socket.send({ type: "internal" });
    socket.assign({
      handleEventCount: socket.context.handleEventCount + 1,
      handleInfoCount: socket.context.handleInfoCount,
    });
  }

  handleInfo(info: SendInternalInfo, socket: LiveViewSocket<SendInternalContext>) {
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

interface RepeatCtx {
  count: number;
}
type RepeatInfo = { type: "add" };
class Repeat50msTestLiveViewComponent extends BaseLiveView<RepeatCtx, AnyLiveEvent, RepeatInfo> {
  mount(params: LiveViewMountParams, session: Partial<SessionData>, socket: LiveViewSocket<RepeatCtx>) {
    socket.repeat(() => {
      socket.send({ type: "add" });
    }, 50);
    socket.assign({ count: 0 });
  }

  handleInfo(info: RepeatInfo, socket: LiveViewSocket<RepeatCtx>) {
    socket.assign({ count: socket.context.count + 1 });
  }

  render(context: RepeatCtx, meta: LiveViewMeta) {
    return html`<div>test:${context.count}</div>`;
  }
}

interface SubscribeCtx {
  testReceived: number;
}
type SubscribeInfo = { type: "testTopicReceived" };
class SubscribeTestLiveViewComponent extends BaseLiveView<SubscribeCtx> {
  mount(params: LiveViewMountParams, session: Partial<SessionData>, socket: LiveViewSocket<SubscribeCtx>) {
    socket.subscribe("testTopic");
    socket.assign({
      testReceived: 0,
    });
  }

  handleInfo(info: SubscribeInfo, socket: LiveViewSocket<SubscribeCtx>) {
    socket.assign({
      testReceived: socket.context.testReceived + 1,
    });
  }

  render() {
    return html`<div>test</div>`;
  }
}

interface PushPatchCtx {
  pushed: number;
}
class PushPatchingTestComponent extends BaseLiveView<PushPatchCtx> {
  mount(params: LiveViewMountParams, session: Partial<SessionData>, socket: LiveViewSocket<PushPatchCtx>) {
    socket.assign({
      pushed: 0,
    });
  }

  handleParams(url: URL, socket: LiveViewSocket<PushPatchCtx>) {
    let pushed = Number(socket.context.pushed);
    socket.assign({
      pushed: pushed + 1,
    });
  }

  handleEvent(event: AnyLiveEvent, socket: LiveViewSocket<PushPatchCtx>) {
    if (socket.context.pushed === 0) {
      socket.pushPatch("pushed");
    } else if (socket.context.pushed === 1) {
      socket.pushPatch("pushed", new URLSearchParams({ go: "dog" }));
    } else {
      socket.pushPatch("pushed", new URLSearchParams({ go: "dog" }), true);
    }
  }

  render() {
    return html`<div>test</div>`;
  }
}

interface PushRedirectCtx {
  pushed: number;
}
class PushRedirectingTestComponent extends BaseLiveView<PushRedirectCtx> {
  mount(params: LiveViewMountParams, session: Partial<SessionData>, socket: LiveViewSocket<PushRedirectCtx>) {
    socket.assign({
      pushed: 0,
    });
  }

  handleParams(url: URL, socket: LiveViewSocket<PushRedirectCtx>) {
    let pushed = Number(socket.context.pushed);
    socket.assign({
      pushed: pushed + 1,
    });
  }

  handleEvent(event: AnyLiveEvent, socket: LiveViewSocket<PushRedirectCtx>) {
    if (socket.context.pushed === 0) {
      socket.pushRedirect("pushed");
    } else if (socket.context.pushed === 1) {
      socket.pushRedirect("pushed", new URLSearchParams({ go: "dog" }));
    } else {
      socket.pushRedirect("pushed", new URLSearchParams({ go: "dog" }), true);
    }
  }

  render() {
    return html`<div>test</div>`;
  }
}

interface PushEventCtx {
  pushed: number;
}
class PushEventTestComponent extends BaseLiveView<PushEventCtx> {
  mount(params: LiveViewMountParams, session: Partial<SessionData>, socket: LiveViewSocket<PushEventCtx>) {
    socket.assign({
      pushed: 0,
    });
  }

  handleParams(url: URL, socket: LiveViewSocket<PushEventCtx>) {
    let pushed = Number(socket.context.pushed);
    if (url.searchParams.get("go") === "dog") {
      // only increment if passed params.go is dog
      pushed += 1;
      socket.assign({
        pushed,
      });
    }
  }

  handleEvent(event: AnyLiveEvent, socket: LiveViewSocket<PushEventCtx>) {
    socket.pushEvent({ type: "pushed", go: "dog" });
  }

  render() {
    return html`<div>test</div>`;
  }
}

interface PutFlashContext {
  called: number;
}
class PutFlashComponent extends BaseLiveView<PutFlashContext> {
  mount(params: LiveViewMountParams, session: Partial<SessionData>, socket: LiveViewSocket<PutFlashContext>) {
    socket.assign({
      called: 0,
    });
  }

  handleEvent(event: AnyLiveEvent, socket: LiveViewSocket<PutFlashContext>) {
    socket.putFlash("info", "flash test");
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
    _csrf_token: csrfToken,
  };
  const params: LiveViewMountParams = {
    _csrf_token: options.paramCsrfOverride ?? csrfToken,
    _mounts: 0,
  };
  const url = options.url ?? options.redirect;
  const jwtSession = JSON.stringify(session);
  return [
    "4",
    "4",
    "lv:phx-AAAAAAAA",
    "phx_join",
    {
      url,
      params,
      session: jwtSession,
      static: "",
    },
  ];
};

class SetsPageTitleComponent extends BaseLiveView {
  mount(params: LiveViewMountParams, session: Partial<SessionData>, socket: LiveViewSocket<{}>) {
    socket.pageTitle("new page title");
  }
  render(): HtmlSafeString {
    return html`<div>test</div>`;
  }
}

interface TestLVAndLCContext {
  called: number;
}

class TestLiveViewAndLiveComponent extends BaseLiveView<TestLVAndLCContext> {
  mount(params: LiveViewMountParams, session: Partial<SessionData>, socket: LiveViewSocket<TestLVAndLCContext>) {
    socket.assign({ called: 0 });
  }

  async render(ctx: TestLVAndLCContext, meta: LiveViewMeta): Promise<LiveViewTemplate> {
    const { called } = ctx;
    const { live_component } = meta;
    return html`
      <div>${await live_component(new TestLiveComponent(), { id: 1, foo: "called" })}</div>
      <div>${await live_component(new TestLiveComponent(), { foo: "bar" })}</div>
    `;
  }

  handleInfo(info: AnyLiveInfo, socket: LiveViewSocket<TestLVAndLCContext>) {
    socket.assign({ called: socket.context.called + 1 });
  }
}

interface TestLVContext {
  foo: string;
}
class TestLiveComponent extends BaseLiveComponent<TestLVContext> {
  render(ctx: TestLVContext) {
    return html`<div>${ctx.foo}</div>`;
  }

  handleEvent(event: AnyLiveEvent, socket: LiveComponentSocket<TestLVContext>) {
    socket.send({ type: "test" });
    socket.pushEvent({ type: "test", foo: "bar" });
    socket.assign({ foo: "bar" });
  }
}
