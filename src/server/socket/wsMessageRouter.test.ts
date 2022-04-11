import { mock } from "jest-mock-extended";
import { WebSocket } from "ws";
import { BaseLiveView, LiveViewMountParams, LiveViewRouter, LiveViewSocket } from "..";
import { WsAdaptor } from "../adaptor";
import { JsonSerDe } from "../adaptor/jsonSerDe";
import { SingleProcessPubSub } from "../pubsub";
import { SessionData } from "../session";
import { html } from "../templates";
import {
  PhxClickPayload,
  PhxFlash,
  PhxHeartbeatIncoming,
  PhxIncomingMessage,
  PhxJoinIncoming,
  PhxLivePatchIncoming,
} from "./types";
import { WsMessageRouter } from "./wsMessageRouter";

describe("test message router", () => {
  let mr: WsMessageRouter;
  let ws: WsAdaptor;
  beforeEach(() => {
    mr = new WsMessageRouter(new JsonSerDe(), new SingleProcessPubSub());
    ws = mock<WsAdaptor>();
  });

  it("onMessage unknown message logs error", async () => {
    try {
      await mr.onMessage(ws, JSON.stringify([]), router, "1234");
    } catch (e: any) {
      fail("should not throw");
    }
  });

  it("onMessage valid phx_join with url", async () => {
    const phx_join = newPhxJoin("my csrf token", { url: "http://localhost:4444/test" });
    await mr.onMessage(ws, JSON.stringify(phx_join), router, "1234");
    expect(ws.send).toHaveBeenCalledTimes(1);
  });

  it("onMessage valid phx_join with redirect", async () => {
    const phx_join = newPhxJoin("my csrf token", { redirect: "http://localhost:4444/test" });
    await mr.onMessage(ws, JSON.stringify(phx_join), router, "1234");
    expect(ws.send).toHaveBeenCalledTimes(1);
  });

  it("onMessage phx_join missing url or redirect", async () => {
    const phx_join = newPhxJoin("my csrf token", {});
    try {
      await mr.onMessage(ws, JSON.stringify(phx_join), router, "1234");
    } catch (e: any) {
      fail("should not throw");
    }
  });

  it("onMessage phx_join unrouted url", async () => {
    const phx_join = newPhxJoin("my csrf token", { url: "http://localhost:4444/noroute" });
    try {
      await mr.onMessage(ws, JSON.stringify(phx_join), router, "1234");
    } catch (e: any) {
      fail("should not throw");
    }
  });

  it("onMessage valid heartbeat", async () => {
    const phx_join = newPhxJoin("my csrf token", { url: "http://localhost:4444/test" });
    await mr.onMessage(ws, JSON.stringify(phx_join), router, "1234");
    expect(ws.send).toHaveBeenCalledTimes(1);
    // heartbeat requires a join first
    const phx_hb: PhxHeartbeatIncoming = [null, "5", "phoenix", "heartbeat", {}];
    await mr.onMessage(ws, JSON.stringify(phx_hb), router, "1234");
    expect(ws.send).toHaveBeenCalledTimes(2);
  });

  it("onMessage valid click event", async () => {
    const phx_join = newPhxJoin("my csrf token", { url: "http://localhost:4444/test" });
    await mr.onMessage(ws, JSON.stringify(phx_join), router, "1234");
    expect(ws.send).toHaveBeenCalledTimes(1);
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
      },
    ];
    await mr.onMessage(ws, JSON.stringify(phx_click), router, "1234");
    expect(ws.send).toHaveBeenCalledTimes(2);
  });

  it("onMessage no join before click event so no socket send", async () => {
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
    await mr.onMessage(ws, JSON.stringify(phx_click), router, "1234");
    expect(ws.send).toHaveBeenCalledTimes(0);
  });

  it("onMessage no join before live patch event so no socket send", async () => {
    const phxLivePatch: PhxLivePatchIncoming = [
      "4",
      "7",
      "lv:phx-AAAAAAAA",
      "live_patch",
      {
        url: "http://localhost:4444/test?id=1",
      },
    ];
    await mr.onMessage(ws, JSON.stringify(phxLivePatch), router, "1234");
    expect(ws.send).toHaveBeenCalledTimes(0);
  });

  it("onMessage valid live patch event", async () => {
    const phx_join = newPhxJoin("my csrf token", { url: "http://localhost:4444/test" });
    await mr.onMessage(ws, JSON.stringify(phx_join), router, "1234");
    expect(ws.send).toHaveBeenCalledTimes(1);
    // live patch requires a join first
    const phxLivePatch: PhxLivePatchIncoming = [
      "4",
      "7",
      "lv:phx-AAAAAAAA",
      "live_patch",
      {
        url: "http://localhost:4444/test?id=1",
      },
    ];
    await mr.onMessage(ws, JSON.stringify(phxLivePatch), router, "1234");
    expect(ws.send).toHaveBeenCalledTimes(2);
  });

  it("onMessage valid leave event", async () => {
    const phx_join = newPhxJoin("my csrf token", { url: "http://localhost:4444/test" });
    await mr.onMessage(ws, JSON.stringify(phx_join), router, "1234");
    expect(ws.send).toHaveBeenCalledTimes(1);
    // live patch requires a join first
    const phxLeave: PhxIncomingMessage<{}> = ["4", "8", "lv:phx-AAAAAAAA", "phx_leave", {}];
    await mr.onMessage(ws, JSON.stringify(phxLeave), router, "1234");
    // no socket send expected
    expect(ws.send).toHaveBeenCalledTimes(1);
  });

  it("onMessage unknown leave event", async () => {
    // live patch requires a join first
    const phxLeave: PhxIncomingMessage<{}> = ["4", "8", "lv:phx-AAAAAAAA", "phx_leave", {}];
    await mr.onMessage(ws, JSON.stringify(phxLeave), router, "1234");
    // no socket send expected
    expect(ws.send).toHaveBeenCalledTimes(0);
  });

  it("onMessage unknown message does not throw error", async () => {
    // live patch requires a join first
    const phxUnknown = ["4", "8", "lv:phx-AAAAAAAA", "blahblah", {}];
    try {
      await mr.onMessage(ws, JSON.stringify(phxUnknown), router, "1234");
    } catch (e: any) {
      fail("should not throw");
    }
  });
});

class LiveViewComponent extends BaseLiveView {
  render() {
    return html`<div>test</div>`;
  }
}

const router: LiveViewRouter = {
  "/test": new LiveViewComponent(),
};

interface NewPhxJoinOptions {
  url?: string;
  redirect?: string;
  flash?: PhxFlash | null;
}
const newPhxJoin = (csrfToken: string, options: NewPhxJoinOptions): PhxJoinIncoming => {
  const session: Partial<SessionData> = {
    _csrf_token: csrfToken,
  };
  const params: LiveViewMountParams = {
    _csrf_token: csrfToken,
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
