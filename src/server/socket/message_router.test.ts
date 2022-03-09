import { SessionData } from "express-session";
import { mock } from "jest-mock-extended";
import jwt from "jsonwebtoken";
import { WebSocket } from "ws";
import { BaseLiveView, LiveViewExternalEventListener, LiveViewMountParams, LiveViewRouter, LiveViewSocket } from "..";
import { StringPropertyValues } from "../component";
import { html } from "../templates";
import { MessageRouter } from "./message_router";
import { PhxClickPayload, PhxFlash, PhxHeartbeatIncoming, PhxIncomingMessage, PhxJoinIncoming, PhxLivePatchIncoming } from "./types";


describe("test message router", () => {
  it("onMessage unknown message throws unknown message type error", async () => {
    const mr = new MessageRouter()
    const ws = mock<WebSocket>()
    try {
      await mr.onMessage(ws, Buffer.from(JSON.stringify([])), router, "1234", "my signing string")
      fail("should have thrown")
    } catch (e: any) {
      expect(e.message).toContain("unknown message type")
    }
  })

  it("onMessage valid phx_join with url", async () => {
    const mr = new MessageRouter()
    const ws = mock<WebSocket>()
    const phx_join = newPhxJoin("my csrf token", "my signing string", { url: "http://localhost:4444/test" })
    await mr.onMessage(ws, Buffer.from(JSON.stringify(phx_join)), router, "1234", "my signing string")
    expect(ws.send).toHaveBeenCalledTimes(1)
  })

  it("onMessage valid phx_join with redirect", async () => {
    const mr = new MessageRouter()
    const ws = mock<WebSocket>()
    const phx_join = newPhxJoin("my csrf token", "my signing string", { redirect: "http://localhost:4444/test" })
    await mr.onMessage(ws, Buffer.from(JSON.stringify(phx_join)), router, "1234", "my signing string")
    expect(ws.send).toHaveBeenCalledTimes(1)
  })

  it("onMessage phx_join missing url or redirect", async () => {
    const mr = new MessageRouter()
    const ws = mock<WebSocket>()
    const phx_join = newPhxJoin("my csrf token", "my signing string", {})
    try {
      await mr.onMessage(ws, Buffer.from(JSON.stringify(phx_join)), router, "1234", "my signing string")
      fail()
    } catch (e: any) {
      expect(e.message).toContain("no url or redirect in join message")
    }
  })

  it("onMessage phx_join unrouted url", async () => {
    const mr = new MessageRouter()
    const ws = mock<WebSocket>()
    const phx_join = newPhxJoin("my csrf token", "my signing string", { url: "http://localhost:4444/noroute" })
    try {
      await mr.onMessage(ws, Buffer.from(JSON.stringify(phx_join)), router, "1234", "my signing string")
      fail()
    } catch (e: any) {
      expect(e.message).toContain("no component found for")
    }
  })

  it("onMessage valid heartbeat", async () => {
    const mr = new MessageRouter()
    const ws = mock<WebSocket>()
    const phx_join = newPhxJoin("my csrf token", "my signing string", { url: "http://localhost:4444/test" })
    await mr.onMessage(ws, Buffer.from(JSON.stringify(phx_join)), router, "1234", "my signing string")
    expect(ws.send).toHaveBeenCalledTimes(1)
    // heartbeat requires a join first
    const phx_hb: PhxHeartbeatIncoming = [null, "5", "phoenix", "heartbeat", {}]
    await mr.onMessage(ws, Buffer.from(JSON.stringify(phx_hb)), router, "1234", "my signing string")
    expect(ws.send).toHaveBeenCalledTimes(2)
  })

  it("onMessage valid click event", async () => {
    const mr = new MessageRouter()
    const ws = mock<WebSocket>()
    const phx_join = newPhxJoin("my csrf token", "my signing string", { url: "http://localhost:4444/test" })
    await mr.onMessage(ws, Buffer.from(JSON.stringify(phx_join)), router, "1234", "my signing string")
    expect(ws.send).toHaveBeenCalledTimes(1)
    // click event requires a join first
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
    await mr.onMessage(ws, Buffer.from(JSON.stringify(phx_click)), router, "1234", "my signing string")
    expect(ws.send).toHaveBeenCalledTimes(2)
  })

  it("onMessage no join before click event so no socket send", async () => {
    const mr = new MessageRouter()
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
    await mr.onMessage(ws, Buffer.from(JSON.stringify(phx_click)), router, "1234", "my signing string")
    expect(ws.send).toHaveBeenCalledTimes(0)
  })

  it("onMessage no join before live patch event so no socket send", async () => {
    const mr = new MessageRouter()
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
    await mr.onMessage(ws, Buffer.from(JSON.stringify(phxLivePatch)), router, "1234", "my signing string")
    expect(ws.send).toHaveBeenCalledTimes(0)
  })

  it("onMessage valid live patch event", async () => {
    const mr = new MessageRouter()
    const ws = mock<WebSocket>()
    const phx_join = newPhxJoin("my csrf token", "my signing string", { url: "http://localhost:4444/test" })
    await mr.onMessage(ws, Buffer.from(JSON.stringify(phx_join)), router, "1234", "my signing string")
    expect(ws.send).toHaveBeenCalledTimes(1)
    // live patch requires a join first
    const phxLivePatch: PhxLivePatchIncoming = [
      "4",
      "7",
      "lv:phx-AAAAAAAA",
      "live_patch",
      {
        url: "http://localhost:4444/test?id=1",
      }
    ]
    await mr.onMessage(ws, Buffer.from(JSON.stringify(phxLivePatch)), router, "1234", "my signing string")
    expect(ws.send).toHaveBeenCalledTimes(2)
  })

  it("onMessage valid leave event", async () => {
    const mr = new MessageRouter()
    const ws = mock<WebSocket>()
    const phx_join = newPhxJoin("my csrf token", "my signing string", { url: "http://localhost:4444/test" })
    await mr.onMessage(ws, Buffer.from(JSON.stringify(phx_join)), router, "1234", "my signing string")
    expect(ws.send).toHaveBeenCalledTimes(1)
    // live patch requires a join first
    const phxLeave: PhxIncomingMessage<{}> = [
      "4",
      "8",
      "lv:phx-AAAAAAAA",
      "phx_leave",
      {}
    ]
    await mr.onMessage(ws, Buffer.from(JSON.stringify(phxLeave)), router, "1234", "my signing string")
    // no socket send expected
    expect(ws.send).toHaveBeenCalledTimes(1)
  })

  it("onMessage unknown leave event", async () => {
    const mr = new MessageRouter()
    const ws = mock<WebSocket>()
    // live patch requires a join first
    const phxLeave: PhxIncomingMessage<{}> = [
      "4",
      "8",
      "lv:phx-AAAAAAAA",
      "phx_leave",
      {}
    ]
    await mr.onMessage(ws, Buffer.from(JSON.stringify(phxLeave)), router, "1234", "my signing string")
    // no socket send expected
    expect(ws.send).toHaveBeenCalledTimes(0)
  })

  it("onMessage unknown message throws error", async () => {
    const mr = new MessageRouter()
    const ws = mock<WebSocket>()
    // live patch requires a join first
    const phxUnknown = [
      "4",
      "8",
      "lv:phx-AAAAAAAA",
      "blahblah",
      {}
    ]
    try {
      await mr.onMessage(ws, Buffer.from(JSON.stringify(phxUnknown)), router, "1234", "my signing string")
      fail()
    } catch (e: any) {
      expect(e.message).toContain("unexpected protocol event")
    }
  })

  // it("shutdown unhealth component managers", async () => {
  //   const mr = new MessageRouter()
  //   const ws = mock<WebSocket>()
  //   const phx_join = newPhxJoin("my csrf token", "my signing string", { url: "http://localhost:4444/test" })
  //   await mr.onMessage(ws, Buffer.from(JSON.stringify(phx_join)), router, "1234", "my signing string")
  //   expect(ws.send).toHaveBeenCalledTimes(1)
  //   // mark component as unhealthy
  //   const c = mr.topicComponentManager["lv:phx-AAAAAAAA"];
  //   if (c.isHealthy) {
  //     c.shutdown()
  //   }
  //   // now run another message
  //   const phx_hb: PhxHeartbeatIncoming = [null, "5", "phoenix", "heartbeat", {}]
  //   await mr.onMessage(ws, Buffer.from(JSON.stringify(phx_hb)), router, "1234", "my signing string")
  //   expect(ws.send).toHaveBeenCalledTimes(2)
  // })

})


interface TestLiveViewComponentContext {

}
class LiveViewComponent extends BaseLiveView<{}, {}> implements LiveViewExternalEventListener<TestLiveViewComponentContext, "eventName", unknown> {

  mount(params: LiveViewMountParams, session: Partial<SessionData>, socket: LiveViewSocket<{}>): {} {
    return {}
  }

  handleEvent(event: "eventName", params: StringPropertyValues<unknown>, socket: LiveViewSocket<TestLiveViewComponentContext>): TestLiveViewComponentContext {
    return {}
  }

  render() {
    return html`<div>test</div>`;
  }

}

const router: LiveViewRouter = {
  "/test": new LiveViewComponent()
}

interface NewPhxJoinOptions {
  url?: string;
  redirect?: string;
  flash?: PhxFlash | null
}
const newPhxJoin = (csrfToken: string, signingSecret: string, options: NewPhxJoinOptions): PhxJoinIncoming => {
  const session: Partial<SessionData> = {
    csrfToken
  }
  const params: LiveViewMountParams = {
    _csrf_token: csrfToken,
    _mounts: 0
  }
  const url = options.url ?? options.redirect
  const jwtSession = jwt.sign(JSON.stringify(session), signingSecret)
  const jwtStatic = jwt.sign(JSON.stringify([]), signingSecret)
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