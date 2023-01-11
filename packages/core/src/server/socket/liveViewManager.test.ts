// import { mock } from "jest-mock-extended";
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
import {
  FileSystemAdaptor,
  FlashAdaptor,
  SerDe,
  SessionFlashAdaptor,
  WsAdaptor,
  WsCloseListener,
  WsMsgListener,
} from "../adaptor";
import { JsonSerDe } from "../adaptor/jsonSerDe";
import { TestNodeFileSystemAdatptor } from "../adaptor/testFilesAdatptor";
import { AnyLiveContext, AnyLiveEvent, AnyLiveInfo, createLiveComponent, createLiveView } from "../live";
import { PubSub, SingleProcessPubSub } from "../pubsub";
import { SessionData } from "../session";
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
  PhxLVClearFlashPayload,
} from "./types";

describe("test liveview manager", () => {
  let cmLiveView: LiveViewManager;
  let cmLiveViewAndLiveComponent: LiveViewManager;
  let liveViewConnectionId: string;
  let liveViewAndLiveComponentConnectionId: string;
  let pubSub: PubSub;
  let flashAdaptor: FlashAdaptor;
  let serDe: SerDe;
  let filesAdaptor: FileSystemAdaptor;
  let ws: WsAdaptor;
  beforeEach(() => {
    pubSub = new SingleProcessPubSub();
    flashAdaptor = new SessionFlashAdaptor();
    filesAdaptor = new TestNodeFileSystemAdatptor();
    serDe = new JsonSerDe();
    liveViewConnectionId = nanoid();
    liveViewAndLiveComponentConnectionId = nanoid();
    ws = {
      send: jest.fn(),
      subscribeToClose: jest.fn(),
      subscribeToMessages: jest.fn(),
    };
    cmLiveView = new LiveViewManager(
      new TestLiveViewComponent(),
      liveViewConnectionId,
      ws,
      serDe,
      pubSub,
      flashAdaptor,
      filesAdaptor,
      {},
      (sessionData, innerContent) => {
        return html`<div>${innerContent}</div>`;
      }
    );
    cmLiveViewAndLiveComponent = new LiveViewManager(
      new TestLiveViewAndLiveComponent(),
      liveViewAndLiveComponentConnectionId,
      ws,
      serDe,
      pubSub,
      flashAdaptor,
      filesAdaptor,
      {}
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
    expect(ws.send).toHaveBeenCalledTimes(5); // join, subscription + sendInternal, event+sendInternal = 5
    expect(spySendInternal).toHaveBeenCalledTimes(2); // subscription, event
    await cmLiveViewAndLiveComponent.onEvent(phx_click);
    expect(ws.send).toHaveBeenCalledTimes(7); // event + sendInternal = 2
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
    // join, subscription+sendInternal, event+sendInternal = 5
    expect(ws.send).toHaveBeenCalledTimes(5);
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
        value: "eventValue",
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
    const cm = new LiveViewManager(
      sic,
      liveViewConnectionId,
      ws,
      new JsonSerDe(),
      new SingleProcessPubSub(),
      new SessionFlashAdaptor(),
      new TestNodeFileSystemAdatptor(),
      {}
    );
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

  it("sendInternal with handleInfo string info", async () => {
    const sic = new SendInternalTestLiveViewComponent(true);
    const cm = new LiveViewManager(
      sic,
      liveViewConnectionId,
      ws,
      new JsonSerDe(),
      new SingleProcessPubSub(),
      new SessionFlashAdaptor(),
      new TestNodeFileSystemAdatptor(),
      {}
    );
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
    const ws: WsAdaptor = {
      send(message: string, errorHandler?: (error?: Error) => void) {
        if (errorHandler) {
          errorHandler(new Error("unknown error"));
        }
      },
      subscribeToClose: () => {},
      subscribeToMessages: () => {},
    };
    const cm = new LiveViewManager(
      tc,
      liveViewConnectionId,
      ws,
      new JsonSerDe(),
      new SingleProcessPubSub(),
      new SessionFlashAdaptor(),
      new TestNodeFileSystemAdatptor(),
      {}
    );

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

  it("a live view that sets page title", async () => {
    const c = new SetsPageTitleComponent();
    const cm = new LiveViewManager(
      c,
      liveViewConnectionId,
      ws,
      new JsonSerDe(),
      new SingleProcessPubSub(),
      new SessionFlashAdaptor(),
      new TestNodeFileSystemAdatptor(),
      {}
    );
    const spyMaybeAddPageTitleToParts = jest.spyOn(cm as any, "maybeAddPageTitleToParts");

    await cm.handleJoin(newPhxJoin("my csrf token", "my signing secret", { url: "http://localhost:4444/test" }));
    expect(ws.send).toHaveBeenCalledTimes(1);
    expect(spyMaybeAddPageTitleToParts).toHaveBeenCalledTimes(1);
    expect(spyMaybeAddPageTitleToParts).toReturnWith({ s: ["<div>test</div>"], t: "new page title" });
  });

  it("a liveview with array of LiveTemplates", async () => {
    let msg: string = "";
    const wsa: WsAdaptor = {
      send(message: string, errorHandler?: (error?: Error) => void) {
        msg = message;
      },
      subscribeToClose: () => {},
      subscribeToMessages: () => {},
    };
    const cm = new LiveViewManager(
      testArrayOfLiveTemplatesLV,
      liveViewConnectionId,
      wsa,
      new JsonSerDe(),
      new SingleProcessPubSub(),
      new SessionFlashAdaptor(),
      new TestNodeFileSystemAdatptor(),
      {}
    );

    await cm.handleJoin(newPhxJoin("my csrf token", "my signing secret", { url: "http://localhost:4444/test" }));
    // expect(ws.send).toHaveBeenCalledTimes(1);
    expect(msg).toMatchInlineSnapshot(
      `"[\\"4\\",\\"4\\",\\"lv:phx-AAAAAAAA\\",\\"phx_reply\\",{\\"response\\":{\\"rendered\\":{\\"0\\":{\\"d\\":[[\\"a\\"],[\\"b\\"],[\\"c\\"]],\\"s\\":[\\"<div>LiveComponent: \\",\\"</div>\\"]},\\"s\\":[\\"\\",\\"\\"]}},\\"status\\":\\"ok\\"}]"`
    );
  });

  it("a liveview with array of livecomponents", async () => {
    let msg: string = "";
    const wsa: WsAdaptor = {
      send(message: string, errorHandler?: (error?: Error) => void) {
        msg = message;
      },
      subscribeToClose: () => {},
      subscribeToMessages: () => {},
    };
    const cm = new LiveViewManager(
      testArrayOfLCLV,
      liveViewConnectionId,
      wsa,
      new JsonSerDe(),
      new SingleProcessPubSub(),
      new SessionFlashAdaptor(),
      new TestNodeFileSystemAdatptor(),
      {}
    );

    await cm.handleJoin(newPhxJoin("my csrf token", "my signing secret", { url: "http://localhost:4444/test" }));
    // expect(ws.send).toHaveBeenCalledTimes(1);
    expect(msg).toMatchInlineSnapshot(
      `"[\\"4\\",\\"4\\",\\"lv:phx-AAAAAAAA\\",\\"phx_reply\\",{\\"response\\":{\\"rendered\\":{\\"0\\":{\\"d\\":[[1],[2],[3]]},\\"s\\":[\\"<div>\\",\\"</div>\\"],\\"c\\":{\\"1\\":{\\"0\\":\\"1\\",\\"s\\":[\\"<div>LiveComponent: \\",\\"</div>\\"]},\\"2\\":{\\"0\\":\\"2\\",\\"s\\":[\\"<div>LiveComponent: \\",\\"</div>\\"]},\\"3\\":{\\"0\\":\\"3\\",\\"s\\":[\\"<div>LiveComponent: \\",\\"</div>\\"]}}}},\\"status\\":\\"ok\\"}]"`
    );
  });

  it("component that subscribes and received message", async () => {
    const c = new SubscribeTestLiveViewComponent();
    const pubSub = new SingleProcessPubSub();
    const cm = new LiveViewManager(
      c,
      liveViewConnectionId,
      ws,
      new JsonSerDe(),
      pubSub,
      new SessionFlashAdaptor(),
      new TestNodeFileSystemAdatptor(),
      {}
    );
    await cm.handleJoin(newPhxJoin("my csrf token", "my signing secret", { url: "http://localhost:4444/test" }));

    await pubSub.broadcast("testTopic", { test: "test" });
    expect((cm["socket"] as LiveViewSocket).context).toHaveProperty("testReceived", 1);
    (cm as any).shutdown();
  });

  it("component that pushPatches", async () => {
    const c = new PushPatchingTestComponent();
    const cm = new LiveViewManager(
      c,
      liveViewConnectionId,
      ws,
      new JsonSerDe(),
      new SingleProcessPubSub(),
      new SessionFlashAdaptor(),
      new TestNodeFileSystemAdatptor(),
      {}
    );
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
    const cm = new LiveViewManager(
      c,
      liveViewConnectionId,
      ws,
      new JsonSerDe(),
      new SingleProcessPubSub(),
      new SessionFlashAdaptor(),
      new TestNodeFileSystemAdatptor(),
      {}
    );
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
    const cm = new LiveViewManager(
      c,
      liveViewConnectionId,
      ws,
      new JsonSerDe(),
      new SingleProcessPubSub(),
      new SessionFlashAdaptor(),
      new TestNodeFileSystemAdatptor(),
      {}
    );
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

  it("component that puts and clears flash", async () => {
    let lastMessage: string;
    const wsa: WsAdaptor = {
      send(msg: string) {
        lastMessage = msg;
      },
      subscribeToClose: () => {},
      subscribeToMessages: () => {},
    };
    const c = new PutFlashComponent();
    const cm = new LiveViewManager(
      c,
      liveViewConnectionId,
      wsa,
      new JsonSerDe(),
      new SingleProcessPubSub(),
      new SessionFlashAdaptor(),
      new TestNodeFileSystemAdatptor(),
      {},
      async (session, innerContent) => {
        const flashAdaptor = new SessionFlashAdaptor();
        const _ = await flashAdaptor.peekFlash(session, "info");
        const infoFlash = (await flashAdaptor.popFlash(session, "info")) || "";
        return html`
          <p class="alert alert-info" role="alert" phx-click="lv:clear-flash" phx-value-key="info">${infoFlash}</p>
          <div>${innerContent}</div>
        `;
      }
    );
    const spyPutFlash = jest.spyOn(cm as any, "putFlash");
    const spyClearFlash = jest.spyOn(cm as any, "clearFlash");

    // initial join
    await cm.handleJoin(newPhxJoin("my csrf token", "my signing secret", { url: "http://localhost:4444/test" }));
    expect(spyPutFlash).toHaveBeenCalledTimes(0);
    expect(spyClearFlash).toHaveBeenCalledTimes(0);
    expect(lastMessage!).toMatchInlineSnapshot(
      `"[\\"4\\",\\"4\\",\\"lv:phx-AAAAAAAA\\",\\"phx_reply\\",{\\"response\\":{\\"rendered\\":{\\"0\\":\\"\\",\\"1\\":\\"<div>test</div>\\",\\"s\\":[\\"\\\\n          <p class=\\\\\\"alert alert-info\\\\\\" role=\\\\\\"alert\\\\\\" phx-click=\\\\\\"lv:clear-flash\\\\\\" phx-value-key=\\\\\\"info\\\\\\">\\",\\"</p>\\\\n          <div>\\",\\"</div>\\\\n        \\"]}},\\"status\\":\\"ok\\"}]"`
    );

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
    expect(spyClearFlash).toHaveBeenCalledTimes(0);
    // has flash of "flash test"
    expect(lastMessage!).toMatchInlineSnapshot(
      `"[\\"4\\",\\"6\\",\\"lv:phx-AAAAAAAA\\",\\"phx_reply\\",{\\"response\\":{\\"diff\\":{\\"0\\":\\"flash test\\"}},\\"status\\":\\"ok\\"}]"`
    );

    // clear flash by sending "lv:clear-flash" event
    const phx_clear_flash: PhxIncomingMessage<PhxLVClearFlashPayload> = [
      "4",
      "6",
      "lv:phx-AAAAAAAA",
      "event",
      {
        type: "click",
        event: "lv:clear-flash",
        value: { key: "info" },
      },
    ];

    await cm.onEvent(phx_clear_flash);
    expect(spyPutFlash).toHaveBeenCalledTimes(1);
    expect(spyClearFlash).toHaveBeenCalledTimes(1);
    // flash should be cleared again
    expect(lastMessage!).toMatchInlineSnapshot(
      `"[\\"4\\",\\"6\\",\\"lv:phx-AAAAAAAA\\",\\"phx_reply\\",{\\"response\\":{\\"diff\\":{\\"0\\":\\"\\"}},\\"status\\":\\"ok\\"}]"`
    );

    (cm as any).shutdown();
  });

  it("default live view meta", async () => {
    const c = new PushPatchingTestComponent();
    const spyHandleParams = jest.spyOn(c as any, "handleParams");
    const cm = new LiveViewManager(
      c,
      liveViewConnectionId,
      ws,
      new JsonSerDe(),
      new SingleProcessPubSub(),
      new SessionFlashAdaptor(),
      new TestNodeFileSystemAdatptor(),
      {}
    );
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
    const cm = new LiveViewManager(
      c,
      liveViewConnectionId,
      ws,
      new JsonSerDe(),
      new SingleProcessPubSub(),
      new SessionFlashAdaptor(),
      new TestNodeFileSystemAdatptor(),
      {}
    );
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
  useStringInfo: boolean = false;
  constructor(useStringInfo: boolean = false) {
    super();
    this.useStringInfo = useStringInfo;
  }
  mount(socket: LiveViewSocket<SendInternalContext>, session: Partial<SessionData>, params: LiveViewMountParams) {
    socket.assign({
      handleEventCount: 0,
      handleInfoCount: 0,
    });
  }

  handleEvent(event: AnyLiveEvent, socket: LiveViewSocket<SendInternalContext>) {
    this.useStringInfo ? socket.sendInfo("internal") : socket.sendInfo({ type: "internal" });
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
  ignores: number;
  intervalRef?: NodeJS.Timeout;
}
type RepeatInfo = { type: "add" };
class Repeat50msTestLiveViewComponent extends BaseLiveView<RepeatCtx, AnyLiveEvent, RepeatInfo> {
  mount(socket: LiveViewSocket<RepeatCtx>, session: Partial<SessionData>, params: LiveViewMountParams) {
    const ref = setInterval(() => {
      socket.sendInfo({ type: "add" });
      socket.sendInfo({ type: "ignore" });
    }, 50);
    socket.assign({ count: 0, ignores: 0, intervalRef: ref });
  }

  handleInfo(info: RepeatInfo, socket: LiveViewSocket<RepeatCtx>) {
    // console.log("info", info, socket.context);
    if (info.type === "add") {
      socket.assign({ count: socket.context.count + 1 });
    } else if (info.type === "ignore") {
      socket.assign({ ignores: socket.context.ignores + 1 });
    }
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
  mount(socket: LiveViewSocket<SubscribeCtx>, session: Partial<SessionData>, params: LiveViewMountParams) {
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
  mount(socket: LiveViewSocket<PushPatchCtx>, session: Partial<SessionData>, params: LiveViewMountParams) {
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
  mount(socket: LiveViewSocket<PushRedirectCtx>, session: Partial<SessionData>, params: LiveViewMountParams) {
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
  mount(socket: LiveViewSocket<PushEventCtx>, session: Partial<SessionData>, params: LiveViewMountParams) {
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
  mount(socket: LiveViewSocket<PutFlashContext>, session: Partial<SessionData>, params: LiveViewMountParams) {
    socket.assign({
      called: 0,
    });
  }

  handleEvent(event: AnyLiveEvent, socket: LiveViewSocket<PutFlashContext>) {
    socket.putFlash("info", "flash test");
    socket.assign({ called: socket.context.called + 1 });
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
  mount(socket: LiveViewSocket<{}>, session: Partial<SessionData>, params: LiveViewMountParams) {
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
  mount(socket: LiveViewSocket<TestLVAndLCContext>, session: Partial<SessionData>, params: LiveViewMountParams) {
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
    socket.sendParentInfo({ type: "test" });
    socket.pushEvent({ type: "test", foo: "bar" });
    socket.assign({ foo: "bar" });
  }
}

class TestWsAdaptor implements WsAdaptor {
  constructor(private msgCb: (msg: string) => void, private errorCb?: (err: any) => void) {
    this.msgCb = msgCb;
    this.errorCb = errorCb;
  }
  subscribeToMessages(msgListener: WsMsgListener): void | Promise<void> {
    throw new Error("Method not implemented.");
  }
  subscribeToClose(closeListener: WsCloseListener): void | Promise<void> {
    throw new Error("Method not implemented.");
  }

  send(message: string, errorHandler?: (err: any) => void): void {
    this.msgCb(message);
    if (errorHandler) {
    }
  }
}

const testLC = createLiveComponent({
  render: (ctx, meta) => {
    return html`<div>LiveComponent: ${meta.myself}</div>`;
  },
});

const items = ["a", "b", "c"];
const testArrayOfLCLV = createLiveView({
  render: async (context: AnyLiveContext, meta: LiveViewMeta) => {
    const { live_component } = meta;
    return html`<div>${await Promise.all(items.map(async (i) => await live_component(testLC, { id: i })))}</div>`;
  },
});

const testArrayOfLiveTemplatesLV = createLiveView({
  render: async (context: AnyLiveContext, meta: LiveViewMeta) => {
    const { live_component } = meta;
    return html`${items.map((i) => html`<div>LiveComponent: ${i}</div>`)}`;
  },
});
