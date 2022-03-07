import { SessionData } from "express-session";
import { mock } from "jest-mock-extended";
import jwt from "jsonwebtoken";
import { nanoid } from "nanoid";
import { WebSocket } from "ws";
import { BaseLiveViewComponent, LiveViewExternalEventListener, LiveViewInternalEventListener, LiveViewMountParams, LiveViewRouter, LiveViewSocket, PushPatchPathAndParams } from "..";
import { StringPropertyValues } from "../component";
import { PubSub } from "../pubsub/SingleProcessPubSub";
import { html, HtmlSafeString } from "../templates";
import { isEventHandler, isInfoHandler, LiveViewComponentManager } from "./component_manager";
import { PhxBlurPayload, PhxClickPayload, PhxFlash, PhxFocusPayload, PhxFormPayload, PhxHeartbeatIncoming, PhxHookPayload, PhxIncomingMessage, PhxJoinIncoming, PhxKeyDownPayload, PhxKeyUpPayload, PhxLivePatchIncoming } from "./types";


describe("test component manager", () => {

  let cm: LiveViewComponentManager;
  let connectionId: string;
  let ws: WebSocket;
  beforeEach(() => {
    connectionId = nanoid()
    ws = mock<WebSocket>()
    cm = new LiveViewComponentManager(new TestLiveViewComponent(), "my signing secret", connectionId, ws);
  })

  afterEach(() => {
    cm.shutdown()
  });

  it("handle join works", async () => {
    await cm.handleJoin(newPhxJoin("my csrf token", "my signing secret", { url: "http://localhost:4444/test" }))
    expect(ws.send).toHaveBeenCalledTimes(1)
  })

  it("handle join with mismatching csrfTokens", () => {
    cm.handleJoin(newPhxJoin("my csrf token", "my signing secret", {
      url: "http://localhost:4444/test",
      paramCsrfOverride: "my other csrf token"
    }))
    expect(ws.send).toHaveBeenCalledTimes(0)
  })

  it("handle join with jwt signing error", () => {
    cm.handleJoin(newPhxJoin("my csrf token", "my signing secret", {
      url: "http://localhost:4444/test",
      signingSecretOverride: "my other signing secret"
    }))
    expect(ws.send).toHaveBeenCalledTimes(0)
  })

  it("can determine if component implements handleEvent", () => {
    expect(isEventHandler(new TestLiveViewComponent())).toBe(true)
    expect(isInfoHandler(new TestLiveViewComponent())).toBe(true)

    expect(isEventHandler(new NotEventHandlerNorInfoHandlerLiveViewComponent())).toBe(false)
    expect(isInfoHandler(new NotEventHandlerNorInfoHandlerLiveViewComponent())).toBe(false)
  })

  it("handleSubscription unknown message fails", async() => {
    const phx_unknown = [null, null, "unknown", "unknown", {}]
    // @ts-ignore - ignore type error for test
    await cm.handleSubscriptions({type: "unknown", message: phx_unknown});
    expect(ws.send).toHaveBeenCalledTimes(0)
  })

  it("handleHB sends reply", async() => {
    const phx_hb: PhxHeartbeatIncoming = [null, "5", "phoenix", "heartbeat", {}]
    await cm.handleSubscriptions({type: "heartbeat", message: phx_hb});
    await cm.onHeartbeat(phx_hb);
    expect(ws.send).toHaveBeenCalledTimes(2)
  })

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
      }
    ]
    await cm.handleSubscriptions({type: "event", message: phx_click});
    await cm.onEvent(phx_click);
    expect(ws.send).toHaveBeenCalledTimes(2)
  })

  it("onEvent valid click event but not eventHandler", async () => {
    const c = new NotEventHandlerNorInfoHandlerLiveViewComponent();
    const cm = new LiveViewComponentManager(c, "my signing secret", connectionId, ws)
    const phx_click: PhxIncomingMessage<PhxClickPayload> = [
      "4",
      "6",
      "lv:phx-AAAAAAAA",
      "event",
      {
        type: "click",
        event: "eventName",
        value: { value: "eventValue" },
      }
    ]
    await cm.handleSubscriptions({type: "event", message: phx_click});
    await cm.onEvent(phx_click);
    expect(ws.send).toHaveBeenCalledTimes(0)
  })

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
      }
    ]
    await cm.handleSubscriptions({type: "event", message: phx_click});
    await cm.onEvent(phx_click);
    expect(ws.send).toHaveBeenCalledTimes(2)
  })

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
      }
    ]
    await cm.handleSubscriptions({type: "event", message: phx_form});
    await cm.onEvent(phx_form);
    expect(ws.send).toHaveBeenCalledTimes(2)
  })

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
      }
    ]
    await cm.handleSubscriptions({type: "event", message: phx_keyup});
    await cm.onEvent(phx_keyup);
    expect(ws.send).toHaveBeenCalledTimes(2)
  })

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
      }
    ]
    await cm.handleSubscriptions({type: "event", message: phx_keydown});
    await cm.onEvent(phx_keydown);
    expect(ws.send).toHaveBeenCalledTimes(2)
  })

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
      }
    ]
    await cm.handleSubscriptions({type: "event", message: phx_blur});
    await cm.onEvent(phx_blur);
    expect(ws.send).toHaveBeenCalledTimes(2)
  })

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
      }
    ]
    await cm.handleSubscriptions({type: "event", message: phx_focus});
    await cm.onEvent(phx_focus);
    expect(ws.send).toHaveBeenCalledTimes(2)
  })

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
      }
    ]
    await cm.handleSubscriptions({type: "event", message: phx_hook});
    await cm.onEvent(phx_hook);
    expect(ws.send).toHaveBeenCalledTimes(2)
  })

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
      }
    ]
    // @ts-ignore -- skip type check for unknown
    await cm.handleSubscriptions({type: "event", message: phx_unknown});
    // @ts-ignore -- skip type check for unknown
    await cm.onEvent(phx_unknown);
    expect(ws.send).toHaveBeenCalledTimes(0)
  })

  it("onLivePatch calls send", async () => {
    const phxLivePatch: PhxLivePatchIncoming = [
      "4",
      "7",
      "lv:phx-AAAAAAAA",
      "live_patch",
      {
        url: "http://localhost:4444/test?id=1",
      }
    ]
    await cm.handleSubscriptions({type: "live_patch", message: phxLivePatch});
    await cm.onLivePatch(phxLivePatch);
    expect(ws.send).toHaveBeenCalledTimes(2)
  })

  it("onPushPatch calls send", async () => {
    const pushPatchFn = jest.fn()
    const liveSocket: LiveViewSocket<unknown> = buildLiveViewSocketMock(
      "lv:phx-AAAAAAAA",
      true,
      {},
      ws,
      () => { },
      () => { },
      () => { },
      () => { },
      pushPatchFn
    )
    liveSocket.pushPatch({to: {params: {}, path: "/test"}})
    expect(pushPatchFn).toHaveBeenCalledTimes(1)
  })

  it("test repeat / shutdown", (done) => {
    let count = 0;
    cm.repeat(() => { count++ }, 100)
    setTimeout(() => {
      expect(count).toBe(2)
      done()
    }, 250)
  })

  it("sendInternal with handleInfo", async() => {
    const sic = new SendInternalTestLiveViewComponent();
    const cm = new LiveViewComponentManager(sic, "my signing secret", connectionId, ws)
    const phx_click: PhxIncomingMessage<PhxClickPayload> = [
      "4",
      "6",
      "lv:phx-AAAAAAAA",
      "event",
      {
        type: "click",
        event: "eventName",
        value: { value: "eventValue" },
      }
    ]
    await cm.handleSubscriptions({type: "event", message: phx_click});
    expect(ws.send).toHaveBeenCalledTimes(2)
  })

  it("sendInternal with no handleInfo", async() => {
    const sic = new SendInternalNoHandleInfoLiveViewComponent();
    const cm = new LiveViewComponentManager(sic, "my signing secret", connectionId, ws)
    const phx_click: PhxIncomingMessage<PhxClickPayload> = [
      "4",
      "6",
      "lv:phx-AAAAAAAA",
      "event",
      {
        type: "click",
        event: "eventName",
        value: { value: "eventValue" },
      }
    ]
    await cm.handleSubscriptions({type: "event", message: phx_click});
    expect(ws.send).toHaveBeenCalledTimes(1);
  })

  it("send phxReply on unknown socket error", async() => {
    const tc = new TestLiveViewComponent()
    const ws = mock<WebSocket>()
    ws.send.mockImplementation((data: any, options: {
      mask?: boolean;
      binary?: boolean;
      compress?: boolean;
      fin?: boolean;
    }, cb?: (err?: Error) => void) => {
      if (cb) {
        cb(new Error("unknown error"))
      }
    })
    const cm = new LiveViewComponentManager(tc, "my signing secret", connectionId, ws)

    const phx_click: PhxIncomingMessage<PhxClickPayload> = [
      "4",
      "6",
      "lv:phx-AAAAAAAA",
      "event",
      {
        type: "click",
        event: "eventName",
        value: { value: "eventValue" },
      }
    ]

    await cm.handleSubscriptions({type: "event", message: phx_click});
  })

  it("a component that sets page title", async() => {
    const c = new SetsPageTitleComponent();
    const cm = new LiveViewComponentManager(c, "my signing secret", connectionId, ws)
    const spyMaybeAddPageTitleToParts = jest.spyOn(cm as any, 'maybeAddPageTitleToParts');

    await cm.handleJoin(newPhxJoin("my csrf token", "my signing secret", { url: "http://localhost:4444/test" }))
    expect(ws.send).toHaveBeenCalledTimes(1);
    expect(spyMaybeAddPageTitleToParts).toHaveBeenCalledTimes(1);
    expect(spyMaybeAddPageTitleToParts).toReturnWith( {"s": ["<div>test</div>"], "t": "new page title"})
  })

  it("component that repeats", async() => {
    jest.useFakeTimers();
    const c = new Repeat50msTestLiveViewComponent();
    const spyHandleInfo = jest.spyOn(c as any, 'handleInfo');
    const cm = new LiveViewComponentManager(c, "my signing secret", connectionId, ws)
    await cm.handleJoin(newPhxJoin("my csrf token", "my signing secret", { url: "http://localhost:4444/test" }))

    setTimeout(async () => {
      // get private context
      expect(spyHandleInfo).toReturnWith({count: 2} as RepeatCtx)
      cm.shutdown();
    }, 125)
    jest.runAllTimers()
  })

  it("component that subscribes and received message", async() => {
    const c = new SubscribeTestLiveViewComponent();
    const cm = new LiveViewComponentManager(c, "my signing secret", connectionId, ws)
    await cm.handleJoin(newPhxJoin("my csrf token", "my signing secret", { url: "http://localhost:4444/test" }))

    await PubSub.broadcast("testTopic", { test: "test" })
    expect(cm['context'] as SubscribeCtx).toHaveProperty('testReceived', 1)
    cm.shutdown();
  })

  it("component that pushPatches", async() => {
    const c = new PushPatchingTestComponent();
    const spyHandleParams = jest.spyOn(c as any, 'handleParams');
    const cm = new LiveViewComponentManager(c, "my signing secret", connectionId, ws)
    await cm.handleJoin(newPhxJoin("my csrf token", "my signing secret", { url: "http://localhost:4444/test" }))

    const phx_click: PhxIncomingMessage<PhxClickPayload> = [
      "4",
      "6",
      "lv:phx-AAAAAAAA",
      "event",
      {
        type: "click",
        event: "eventName",
        value: { value: "eventValue" },
      }
    ]
    await cm.onEvent(phx_click);
    expect(spyHandleParams).toHaveBeenCalledTimes(2);
    expect(spyHandleParams).toReturnWith({pushed: 1} as PushPatchCtx)
    cm.shutdown();

  })

})


interface TestLiveViewComponentContext {

}
class TestLiveViewComponent extends BaseLiveViewComponent<{}, {}> implements
  LiveViewExternalEventListener<TestLiveViewComponentContext, "eventName", unknown>,
  LiveViewInternalEventListener<TestLiveViewComponentContext, "eventName">
{
  private newPageTitle?: string;
  constructor(newPageTitle?: string) {
    super();
    this.newPageTitle = newPageTitle;
  }

  mount(params: LiveViewMountParams, session: Partial<SessionData>, socket: LiveViewSocket<{}>): {} {
    return {}
  }

  handleEvent(event: "eventName", params: StringPropertyValues<unknown>, socket: LiveViewSocket<TestLiveViewComponentContext>): TestLiveViewComponentContext {
    if (this.newPageTitle) {
      socket.pageTitle(this.newPageTitle);
    }
    return {}
  }

  handleInfo(event: "eventName", socket: LiveViewSocket<TestLiveViewComponentContext>): TestLiveViewComponentContext {
    return {}
  }

  render() {
    return html`<div>test</div>`;
  }

}

interface SendInternalContext {
  handleEventCount: number;
  handleInfoCount: number;
}
class SendInternalTestLiveViewComponent extends BaseLiveViewComponent<SendInternalContext, {}> implements
  LiveViewExternalEventListener<TestLiveViewComponentContext, "eventName", unknown>,
  LiveViewInternalEventListener<TestLiveViewComponentContext, "eventName">
{

  mount(params: LiveViewMountParams, session: Partial<SessionData>, socket: LiveViewSocket<{}>): SendInternalContext {
    return {
      handleEventCount: 0,
      handleInfoCount: 0,
    }
  }

  handleEvent(event: "eventName", params: StringPropertyValues<unknown>, socket: LiveViewSocket<SendInternalContext>): SendInternalContext {
    socket.sendInternal("eventName")
    return {
      handleEventCount: socket.context.handleEventCount + 1,
      handleInfoCount: socket.context.handleInfoCount,
    }
  }

  handleInfo(event: "eventName", socket: LiveViewSocket<SendInternalContext>): SendInternalContext {
    return {
      handleEventCount: socket.context.handleEventCount,
      handleInfoCount: socket.context.handleInfoCount + 1,
    }
  }

  render(context: SendInternalContext) {
    const { handleEventCount, handleInfoCount } = context
    return html`<div>${handleEventCount},${handleInfoCount}</div>`;
  }

}

interface SendInternalNoHandleInfoContext {
  handleEventCount: number;
  handleInfoCount: number;
}
class SendInternalNoHandleInfoLiveViewComponent extends BaseLiveViewComponent<SendInternalNoHandleInfoContext, {}> implements
  LiveViewExternalEventListener<TestLiveViewComponentContext, "eventName", unknown>
{

  mount(params: LiveViewMountParams, session: Partial<SessionData>, socket: LiveViewSocket<{}>): SendInternalNoHandleInfoContext {
    return {
      handleEventCount: 0,
      handleInfoCount: 0,
    }
  }

  handleEvent(event: "eventName", params: StringPropertyValues<unknown>, socket: LiveViewSocket<SendInternalNoHandleInfoContext>): SendInternalNoHandleInfoContext {
    socket.sendInternal("eventName")
    return {
      handleEventCount: socket.context.handleEventCount + 1,
      handleInfoCount: socket.context.handleInfoCount,
    }
  }

  render(context: SendInternalContext) {
    const { handleEventCount, handleInfoCount } = context
    return html`<div>${handleEventCount},${handleInfoCount}</div>`;
  }

}

class NotEventHandlerNorInfoHandlerLiveViewComponent extends BaseLiveViewComponent<{}, {}> {

  mount(params: LiveViewMountParams, session: Partial<SessionData>, socket: LiveViewSocket<{}>): {} {
    return {}
  }

  render() {
    return html`<div>test</div>`;
  }

}

interface RepeatCtx {
  count: number;
}
class Repeat50msTestLiveViewComponent extends BaseLiveViewComponent<RepeatCtx, {}> implements
  LiveViewInternalEventListener<RepeatCtx, "add">
{

  mount(params: LiveViewMountParams, session: Partial<SessionData>, socket: LiveViewSocket<RepeatCtx>): RepeatCtx {
    socket.repeat(() => { socket.sendInternal("add") }, 50)
    return {
      count: 0,
    }
  }

  handleInfo(event: "add", socket: LiveViewSocket<RepeatCtx>): RepeatCtx {
    return {
      count: socket.context.count + 1,
    }
  }

  render() {
    return html`<div>test</div>`;
  }

}

interface SubscribeCtx {
  testReceived: number;
}
class SubscribeTestLiveViewComponent extends BaseLiveViewComponent<SubscribeCtx, {}> implements
  LiveViewInternalEventListener<SubscribeCtx, "testTopicReceived">
{

  mount(params: LiveViewMountParams, session: Partial<SessionData>, socket: LiveViewSocket<SubscribeCtx>): SubscribeCtx {
    socket.subscribe("testTopic")
    return {
      testReceived: 0,
    }
  }

  handleInfo(event: "testTopicReceived", socket: LiveViewSocket<SubscribeCtx>): SubscribeCtx {
    return {
      testReceived: socket.context.testReceived + 1,
    }
  }

  render() {
    return html`<div>test</div>`;
  }

}

interface PushPatchCtx {
  pushed: number;
}
class PushPatchingTestComponent extends BaseLiveViewComponent<PushPatchCtx, {go?: string}> implements
  LiveViewExternalEventListener<PushPatchCtx, "push", {}>
{

  mount(params: LiveViewMountParams, session: Partial<SessionData>, socket: LiveViewSocket<PushPatchCtx>): PushPatchCtx {
    return {
      pushed: 0,
    }
  }

  handleParams(params: StringPropertyValues<{go?: string}>, url: string, socket: LiveViewSocket<PushPatchCtx>): PushPatchCtx | Promise<PushPatchCtx> {
    let pushed = Number(socket.context.pushed);
    if (params.go === "dog") {
      // only increment if passed params.go is dog
      pushed += 1;
    }
    return {
      pushed,
    }
  }

  handleEvent(event: "push", params: StringPropertyValues<{}>, socket: LiveViewSocket<PushPatchCtx>): PushPatchCtx | Promise<PushPatchCtx> {
    socket.pushPatch({
      to: {
        path: "pushed",
        params: {go: "dog"}
      }
    })
    return {
      pushed: socket.context.pushed,
    }
  }

  render() {
    return html`<div>test</div>`;
  }

}

const router: LiveViewRouter = {
  "/test": new TestLiveViewComponent()
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
    csrfToken
  }
  const params: LiveViewMountParams = {
    _csrf_token: options.paramCsrfOverride ?? csrfToken,
    _mounts: 0
  }
  const url = options.url ?? options.redirect
  const jwtSession = jwt.sign(JSON.stringify(session), options.signingSecretOverride ?? signingSecret)
  const jwtStatic = jwt.sign(JSON.stringify([]), options.signingSecretOverride ?? signingSecret)
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
    }
  ]
}

const buildLiveViewSocketMock = <T>(
  topic: string,
  connected: boolean,
  context: T,
  ws: WebSocket,
  sendInternal: (event: any) => void = () => {},
  repeat: (fn: Function, intervalMills: number) => void = () => {},
  pageTitle: (title: string) => void = () => {},
  subscribe: (topic: string) => void = () => {},
  pushPatch: (pushPatch: PushPatchPathAndParams) => void = () => {}): LiveViewSocket<T> => {
  return {
    id: topic,
    connected, // websocket is connected
    ws, // the websocket
    context,
    sendInternal,
    repeat,
    pageTitle,
    subscribe,
    pushPatch,
  }
}

class SetsPageTitleComponent extends BaseLiveViewComponent<{}, {}> {
  mount(params: LiveViewMountParams, session: Partial<SessionData>, socket: LiveViewSocket<{}>): {} {
    socket.pageTitle("new page title")
    return {}
  }
  render(): HtmlSafeString {
    return html`<div>test</div>`;
  }
}