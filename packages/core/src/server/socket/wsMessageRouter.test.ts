import { BaseLiveView, LiveViewMountParams, LiveViewRouter } from "..";
import { FlashAdaptor, SessionFlashAdaptor, WsAdaptor } from "../adaptor";
import { JsonSerDe } from "../adaptor/jsonSerDe";
import { TestNodeFileSystemAdatptor } from "../adaptor/testFilesAdatptor";
import { PubSub, SingleProcessPubSub } from "../pubsub";
import { SessionData } from "../session";
import { html } from "../templates";
import { BinaryUploadSerDe } from "../upload/binaryUploadSerDe";
import {
  PhxClickPayload,
  PhxFlash,
  PhxHeartbeatIncoming,
  PhxIncomingMessage,
  PhxJoinIncoming,
  PhxJoinUploadIncoming,
  PhxLivePatchIncoming,
  PhxMessage,
} from "./types";
import { WsMessageRouter } from "./wsMessageRouter";

describe("test message router", () => {
  let mr: WsMessageRouter;
  let ws: WsAdaptor;
  let send: jest.Mock;
  let subscribeToClose: jest.Mock;
  let subscribeToMessages: jest.Mock;
  let pubSub: PubSub;
  let flashAdaptor: FlashAdaptor;
  let filesAdaptor: TestNodeFileSystemAdatptor;
  beforeEach(() => {
    send = jest.fn();
    subscribeToClose = jest.fn();
    subscribeToMessages = jest.fn();
    pubSub = new SingleProcessPubSub();
    flashAdaptor = new SessionFlashAdaptor();
    filesAdaptor = new TestNodeFileSystemAdatptor();
    ws = {
      send,
      subscribeToClose,
      subscribeToMessages,
    };
    mr = new WsMessageRouter(router, pubSub, flashAdaptor, new JsonSerDe(), filesAdaptor);
  });

  it("onMessage unknown message logs error", async () => {
    try {
      await mr.onMessage("1234", JSON.stringify([]), ws);
    } catch (e: any) {
      fail("should not throw");
    }
  });

  it("onMessage valid phx_join with url", async () => {
    const phx_join = newPhxJoin("my csrf token", { url: "http://localhost:4444/test" });
    await mr.onMessage("1234", JSON.stringify(phx_join), ws);
    expect(ws.send).toHaveBeenCalledTimes(1);
  });

  it("onMessage valid phx_join with redirect", async () => {
    const phx_join = newPhxJoin("my csrf token", { redirect: "http://localhost:4444/test" });
    await mr.onMessage("1234", JSON.stringify(phx_join), ws);
    expect(ws.send).toHaveBeenCalledTimes(1);
  });

  it("onMessage phx_join missing url or redirect", async () => {
    const phx_join = newPhxJoin("my csrf token", {});
    try {
      await mr.onMessage("1234", JSON.stringify(phx_join), ws);
      expect(ws.send).toHaveBeenCalledTimes(0);
    } catch (e: any) {
      fail("should not throw");
    }
  });

  it("onMessage phx_join unrouted url", async () => {
    const phx_join = newPhxJoin("my csrf token", { url: "http://localhost:4444/noroute" });
    try {
      await mr.onMessage("1234", JSON.stringify(phx_join), ws);
    } catch (e: any) {
      fail("should not throw");
    }
  });

  it("onMessage phx_join_upload event", async () => {
    const phx_join_upload = [
      "4",
      "4",
      "lvu:0",
      "phx_join",
      {
        token: "token",
      },
    ] as PhxJoinUploadIncoming;
    const phx_join = newPhxJoin("my csrf token", { url: "http://localhost:4444/test" });
    // must join first
    await mr.onMessage("1234", JSON.stringify(phx_join), ws);
    await mr.onMessage("1234", JSON.stringify(phx_join_upload), ws);
    expect(ws.send).toHaveBeenCalledTimes(2);
  });

  it("onMessage upload_binary event", async () => {
    // must join first
    const phx_join = newPhxJoin("my csrf token", { url: "http://localhost:4444/test" });
    await mr.onMessage("1234", JSON.stringify(phx_join), ws);

    // now upload binary
    const data = await new BinaryUploadSerDe().serialize({
      joinRef: "joinRef",
      msgRef: "msgRef",
      topic: `lvu:0`,
      event: "binary_upload",
      payload: Buffer.alloc(100),
    });
    await mr.onMessage("1234", data, ws, true); // sends 2 replies
    expect(ws.send).toHaveBeenCalledTimes(3);
  });

  it("onMessage valid heartbeat", async () => {
    const phx_join = newPhxJoin("my csrf token", { url: "http://localhost:4444/test" });
    await mr.onMessage("1234", JSON.stringify(phx_join), ws);
    expect(ws.send).toHaveBeenCalledTimes(1);
    // heartbeat requires a join first
    const phx_hb: PhxHeartbeatIncoming = [null, "5", "phoenix", "heartbeat", {}];
    await mr.onMessage("1234", JSON.stringify(phx_hb), ws);
    expect(ws.send).toHaveBeenCalledTimes(2);
  });

  it("onMessage valid click event", async () => {
    const phx_join = newPhxJoin("my csrf token", { url: "http://localhost:4444/test" });
    await mr.onMessage("1234", JSON.stringify(phx_join), ws);
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
    await mr.onMessage("1234", JSON.stringify(phx_click), ws);
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
    await mr.onMessage("1234", JSON.stringify(phx_click), ws);
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
    await mr.onMessage("1234", JSON.stringify(phxLivePatch), ws);
    expect(ws.send).toHaveBeenCalledTimes(0);
  });

  it("onMessage valid live patch event", async () => {
    const phx_join = newPhxJoin("my csrf token", { url: "http://localhost:4444/test" });
    await mr.onMessage("1234", JSON.stringify(phx_join), ws);
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
    await mr.onMessage("1234", JSON.stringify(phxLivePatch), ws);
    expect(ws.send).toHaveBeenCalledTimes(2);
  });

  it("onMessage valid leave event", async () => {
    // join
    const phx_join = newPhxJoin("my csrf token", { url: "http://localhost:4444/test" });
    await mr.onMessage("1234", JSON.stringify(phx_join), ws);
    expect(ws.send).toHaveBeenCalledTimes(1);

    // leave
    const phxLeave: PhxIncomingMessage<{}> = ["4", "8", "lv:phx-AAAAAAAA", "phx_leave", {}];
    await mr.onMessage("1234", JSON.stringify(phxLeave), ws);
    // phx_leave doesn't send a response
    expect(ws.send).toHaveBeenCalledTimes(1);
  });

  it("onMessage unknown leave event", (done) => {
    // live patch requires a join first
    const phxLeave: PhxIncomingMessage<{}> = ["4", "8", "lv:phx-AAAAAAAA", "phx_leave", {}];
    pubSub.subscribe("lv:phx-AAAAAAAA", (msg: PhxMessage) => {
      fail("should not have received message");
    });
    mr.onMessage("1234", JSON.stringify(phxLeave), ws);
    setTimeout(() => {
      expect(ws.send).toHaveBeenCalledTimes(0);
      done();
    }, 100);
  });

  it("onMessage unknown message does not throw error", (done) => {
    // live patch requires a join first
    const phxUnknown = ["4", "8", "lv:phx-AAAAAAAA", "blahblah", {}];
    pubSub.subscribe("lv:phx-AAAAAAAA", (msg: PhxMessage) => {
      fail("should not have received message");
    });
    mr.onMessage("1234", JSON.stringify(phxUnknown), ws);
    setTimeout(() => {
      expect(ws.send).toHaveBeenCalledTimes(0);
      done();
    }, 100);
  });

  it("onClose sends phx-leave", (done) => {
    pubSub.subscribe("id", (msg: PhxMessage) => {
      expect(msg.type).toEqual("phx_leave");
      done();
    });
    mr.onClose("id");
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
