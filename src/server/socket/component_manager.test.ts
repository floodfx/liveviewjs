import { SessionData } from "express-session";
import { WebSocket } from "ws";
import { BaseLiveViewComponent, LiveViewExternalEventListener, LiveViewInternalEventListener, LiveViewMountParams, LiveViewRouter, LiveViewSocket, LiveViewComponent } from "..";
import { html, HtmlSafeString } from "../templates";
import { mock } from "jest-mock-extended";
import { PhxBlurPayload, PhxClickPayload, PhxFlash, PhxFocusPayload, PhxFormPayload, PhxHeartbeatIncoming, PhxHookPayload, PhxIncomingMessage, PhxJoinIncoming, PhxKeyDownPayload, PhxKeyUpPayload, PhxLivePatchIncoming } from "./types";
import jwt from "jsonwebtoken";
import { StringPropertyValues } from "../component";
import { isEventHandler, isInfoHandler, LiveViewComponentManager } from "./component_manager";


describe("test component manager", () => {

  it("handle join works", () => {
    const cm = new LiveViewComponentManager(new TestLiveViewComponent(), "my signing secret")
    const ws = mock<WebSocket>()
    cm.handleJoin(ws, newPhxJoin("my csrf token", "my signing secret", { url: "http://localhost:4444/test" }))
    expect(ws.send).toHaveBeenCalledTimes(1)
  })

  it("handle join with mismatching csrfTokens", () => {
    const cm = new LiveViewComponentManager(new TestLiveViewComponent(), "my signing secret")
    const ws = mock<WebSocket>()
    cm.handleJoin(ws, newPhxJoin("my csrf token", "my signing secret", {
      url: "http://localhost:4444/test",
      paramCsrfOverride: "my other csrf token"
    }))
    expect(ws.send).toHaveBeenCalledTimes(0)
  })

  it("handle join with jwt signing error", () => {
    const cm = new LiveViewComponentManager(new TestLiveViewComponent(), "my signing secret")
    const ws = mock<WebSocket>()
    cm.handleJoin(ws, newPhxJoin("my csrf token", "my signing secret", {
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

  it("handleHB sends reply", () => {
    const cm = new LiveViewComponentManager(new TestLiveViewComponent(), "my signing secret")
    const ws = mock<WebSocket>()
    const phx_hb: PhxHeartbeatIncoming = [null, "5", "phoenix", "heartbeat", {}]
    cm.onHeartbeat(ws, phx_hb)
    expect(ws.send).toHaveBeenCalledTimes(1)
  })

  it("does not register back the component manager if not a BaseLiveViewComponent", () => {
    const notBaseLiveViewComponent = new NotBaseLiveViewComponent()
    const cm = new LiveViewComponentManager(notBaseLiveViewComponent, "my signing secret")
  })

  it("onEvent valid click event but not eventHandler", () => {
    const cm = new LiveViewComponentManager(new NotEventHandlerNorInfoHandlerLiveViewComponent(), "my signing secret")
    const ws = mock<WebSocket>()
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
    cm.onEvent(ws, phx_click)
    expect(ws.send).toHaveBeenCalledTimes(0)
  })

  it("onEvent valid click event", () => {
    const cm = new LiveViewComponentManager(new TestLiveViewComponent(), "my signing secret")
    const ws = mock<WebSocket>()
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
    cm.onEvent(ws, phx_click)
    expect(ws.send).toHaveBeenCalledTimes(1)
  })

  it("onEvent valid form event", () => {
    const cm = new LiveViewComponentManager(new TestLiveViewComponent(), "my signing secret")
    const ws = mock<WebSocket>()
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
    cm.onEvent(ws, phx_form)
    expect(ws.send).toHaveBeenCalledTimes(1)
  })

  it("onEvent valid keyup event", () => {
    const cm = new LiveViewComponentManager(new TestLiveViewComponent(), "my signing secret")
    const ws = mock<WebSocket>()
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
    cm.onEvent(ws, phx_keyup)
    expect(ws.send).toHaveBeenCalledTimes(1)
  })

  it("onEvent valid keydown event", () => {
    const cm = new LiveViewComponentManager(new TestLiveViewComponent(), "my signing secret")
    const ws = mock<WebSocket>()
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
    cm.onEvent(ws, phx_keydown)
    expect(ws.send).toHaveBeenCalledTimes(1)
  })

  it("onEvent valid blur event", () => {
    const cm = new LiveViewComponentManager(new TestLiveViewComponent(), "my signing secret")
    const ws = mock<WebSocket>()
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
    cm.onEvent(ws, phx_blur)
    expect(ws.send).toHaveBeenCalledTimes(1)
  })

  it("onEvent valid focus event", () => {
    const cm = new LiveViewComponentManager(new TestLiveViewComponent(), "my signing secret")
    const ws = mock<WebSocket>()
    const phx_blur: PhxIncomingMessage<PhxFocusPayload> = [
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
    cm.onEvent(ws, phx_blur)
    expect(ws.send).toHaveBeenCalledTimes(1)
  })

  it("onEvent valid hook event", () => {
    const cm = new LiveViewComponentManager(new TestLiveViewComponent(), "my signing secret")
    const ws = mock<WebSocket>()
    const phx_blur: PhxIncomingMessage<PhxHookPayload> = [
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
    cm.onEvent(ws, phx_blur)
    expect(ws.send).toHaveBeenCalledTimes(1)
  })

  it("onEvent unknown event type", () => {
    const cm = new LiveViewComponentManager(new TestLiveViewComponent(), "my signing secret")
    const ws = mock<WebSocket>()
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
    cm.onEvent(ws, phx_unknown)
    expect(ws.send).toHaveBeenCalledTimes(0)
  })

  it("onLivePatch calls send", () => {
    const cm = new LiveViewComponentManager(new TestLiveViewComponent(), "my signing secret")
    const ws = mock<WebSocket>()
    const phxLivePatch: PhxLivePatchIncoming = [
      "4",
      "7",
      "lv:phx-AAAAAAAA",
      "live_patch",
      {
        url: "http://localhost:4444/test?id=1",
      }
    ]
    cm.onLivePatch(ws, phxLivePatch)
    expect(ws.send).toHaveBeenCalledTimes(1)
  })

  it("onPushPatch calls send", () => {
    const cm = new LiveViewComponentManager(new TestLiveViewComponent(), "my signing secret")
    const ws = mock<WebSocket>()
    const liveSocket = buildLiveViewSocketMock(
      "lv:phx-AAAAAAAA",
      true,
      {},
      ws,
      () => { },
      () => { },
    )
    const phxLivePatch: PhxLivePatchIncoming = [
      "4",
      "7",
      "lv:phx-AAAAAAAA",
      "live_patch",
      {
        url: "http://localhost:4444/test?id=1",
      }
    ]
    cm.onPushPatch(liveSocket, {
      to: {
        params: {},
        path: "/test",
      }
    })
    expect(ws.send).toHaveBeenCalledTimes(1)
  })

  it("test repeat / shutdown", (done) => {
    const cm = new LiveViewComponentManager(new TestLiveViewComponent(), "my signing secret")
    let count = 0;
    cm.repeat(() => { count++ }, 100)
    setTimeout(() => {
      cm.shutdown()
      expect(count).toBe(2)
      done()
    }, 250)
  })

  it("sendInternal with handleInfo", (done) => {
    const sic = new SendInternalTestLiveViewComponent();
    const cm = new LiveViewComponentManager(sic, "my signing secret")
    const ws = mock<WebSocket>()
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
    cm.onEvent(ws, phx_click)
    setTimeout(() => {
      // handleEvent calls handleInfo
      // both call ws.send
      expect(ws.send).toHaveBeenCalledTimes(2)
      done()
    }, 100)
  })

  it("sendInternal with no handleInfo", (done) => {
    const sic = new SendInternalNoHandleInfoLiveViewComponent();
    const cm = new LiveViewComponentManager(sic, "my signing secret")
    const ws = mock<WebSocket>()
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
    cm.onEvent(ws, phx_click)
    setTimeout(() => {
      // handleEvent calls handleInfo
      // both call ws.send
      expect(ws.send).toHaveBeenCalledTimes(1)
      done()
    }, 100)
  })

  it("repeat via liveview socket", (done) => {
    const sic = new RepeatTestLiveViewComponent();
    const cm = new LiveViewComponentManager(sic, "my signing secret")
    const ws = mock<WebSocket>()
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
    cm.onEvent(ws, phx_click)
    setTimeout(() => {
      // repeat calls ws.send once
      // every 50ms plus one for the onEvent
      // for a total of 3
      cm.shutdown();
      expect(ws.send).toHaveBeenCalledTimes(3)
      done()
    }, 110)
  })

  it("send phxReply on unknown socket error", () => {
    const tc = new TestLiveViewComponent()
    const cm = new LiveViewComponentManager(tc, "my signing secret")
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
    // @ts-ignore -- skip type check for unknown
    cm.onEvent(ws, phx_click)
  })


})


interface TestLiveViewComponentContext {

}
class TestLiveViewComponent extends BaseLiveViewComponent<{}, {}> implements
  LiveViewExternalEventListener<TestLiveViewComponentContext, "eventName", unknown>,
  LiveViewInternalEventListener<TestLiveViewComponentContext, "eventName">
{

  mount(params: LiveViewMountParams, session: Partial<SessionData>, socket: LiveViewSocket<{}>): {} {
    return {}
  }

  handleEvent(event: "eventName", params: StringPropertyValues<unknown>, socket: LiveViewSocket<TestLiveViewComponentContext>): TestLiveViewComponentContext {
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

class RepeatTestLiveViewComponent extends BaseLiveViewComponent<{}, {}> implements
  LiveViewExternalEventListener<{}, "", unknown>
{

  mount(params: LiveViewMountParams, session: Partial<SessionData>, socket: LiveViewSocket<{}>): {} {
    return {}
  }

  handleEvent(event: "", params: StringPropertyValues<unknown>, socket: LiveViewSocket<{}>): {} {
    socket.repeat(() => { socket.ws!.send(""); console.log("here") }, 50)
    return {}
  }

  render() {
    return html`<div>test</div>`;
  }

}

class NotBaseLiveViewComponent implements LiveViewComponent<{}, {}> {
  mount(params: LiveViewMountParams, session: Partial<SessionData>, socket: LiveViewSocket<{}>): {} {
    return {}
  }
  render(): HtmlSafeString {
    return html`<div>not base</div>`;
  }
  handleParams(params: StringPropertyValues<{}>, url: string, socket: LiveViewSocket<{}>): {} {
    return {}
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

const buildLiveViewSocketMock = (topic: string, connected: boolean, context: unknown, ws: WebSocket, sendInternal: (event: any) => void, repeat: (fn: Function, intervalMills: number) => void) => {
  return {
    id: topic,
    connected, // websocket is connected
    ws, // the websocket
    context,
    sendInternal,
    repeat,
  }
}