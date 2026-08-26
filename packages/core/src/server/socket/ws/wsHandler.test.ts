import { SessionFlashAdaptor } from "../../adaptor";
import { JsonSerDe } from "../../adaptor/jsonSerDe";
import { TestNodeFileSystemAdatptor } from "../../adaptor/testFilesAdatptor";
import { Phx } from "../../protocol/phx";
import { SingleProcessPubSub } from "../../pubsub";
import { Test } from "../../test/liveviews";
import { TestWsAdaptor } from "../../test/wsAdaptor";
import { WsHandler } from "./wsHandler";

describe("test NodeWsHandler", () => {
  let wsh: WsHandler;
  let wsa: TestWsAdaptor;
  let send: (msg: string) => void;
  let sentMessages: string[];

  beforeEach(() => {
    sentMessages = [];
    send = (msg) => sentMessages.push(msg);
    wsa = new TestWsAdaptor(send);
    wsh = new WsHandler(wsa, {
      router: { "/counter": Test.counterLiveView },
      fileSysAdaptor: new TestNodeFileSystemAdatptor(),
      serDe: new JsonSerDe(),
      flashAdaptor: new SessionFlashAdaptor(),
      pubSub: new SingleProcessPubSub(),
    });
  });

  it("handles a join", async () => {
    await wsa.sendIncomingMsg(
      JSON.stringify([
        "402",
        "402",
        "lv:phx-5fzo3jZQ_CTAWVnfIsGP3",
        "phx_join",
        {
          url: "http://localhost:4001/counter",
          params: { _csrf_token: "k8iJ9AjzFhU5rbzMgnjTh", _mounts: 4 },
          session: JSON.stringify({ _csrf_token: "k8iJ9AjzFhU5rbzMgnjTh" }),
          static: null,
          flash: null,
        },
      ] as Phx.Msg)
    );
    expect(sentMessages).toHaveLength(1);
    expect(JSON.parse(sentMessages[0])[4].response.rendered).toMatchObject({
      p: { 0: expect.any(Array) },
      r: 1,
      s: 0,
    });
  });

  it("advertises the configured LiveView version on join", async () => {
    wsh = new WsHandler(wsa, {
      router: { "/counter": Test.counterLiveView },
      fileSysAdaptor: new TestNodeFileSystemAdatptor(),
      serDe: new JsonSerDe(),
      flashAdaptor: new SessionFlashAdaptor(),
      pubSub: new SingleProcessPubSub(),
      liveViewVersion: "1.2.9",
    });

    await wsa.sendIncomingMsg(
      JSON.stringify([
        "402",
        "402",
        "lv:phx-5fzo3jZQ_CTAWVnfIsGP3",
        "phx_join",
        {
          url: "http://localhost:4001/counter",
          params: { _csrf_token: "k8iJ9AjzFhU5rbzMgnjTh", _mounts: 4 },
          session: JSON.stringify({ _csrf_token: "k8iJ9AjzFhU5rbzMgnjTh" }),
          static: null,
          flash: null,
        },
      ] as Phx.Msg)
    );

    const response = JSON.parse(sentMessages[0])[4].response;
    expect(response.liveview_version).toBe("1.2.9");
    expect(response.rendered).toMatchObject({
      p: { 0: expect.any(Array) },
      r: 1,
      s: 0,
    });
  });

  it("handles a join then heartbeat", async () => {
    await wsa.sendIncomingMsg(
      JSON.stringify([
        "402",
        "402",
        "lv:phx-5fzo3jZQ_CTAWVnfIsGP3",
        "phx_join",
        {
          url: "http://localhost:4001/counter",
          params: { _csrf_token: "k8iJ9AjzFhU5rbzMgnjTh", _mounts: 4 },
          session: JSON.stringify({ _csrf_token: "k8iJ9AjzFhU5rbzMgnjTh" }),
          static: null,
          flash: null,
        },
      ] as Phx.Msg)
    );

    await wsa.sendIncomingMsg(JSON.stringify([null, "1", "phoenix", "heartbeat", {}]));
    expect(sentMessages).toHaveLength(2);
  });

  it("handles a join then click", async () => {
    const joinId = "lv:phx-5fzo3jZQ_CTAWVnfIsGP3";
    await wsa.sendIncomingMsg(
      JSON.stringify([
        "402",
        "402",
        joinId,
        "phx_join",
        {
          url: "http://localhost:4001/counter",
          params: { _csrf_token: "k8iJ9AjzFhU5rbzMgnjTh", _mounts: 4 },
          session: JSON.stringify({ _csrf_token: "k8iJ9AjzFhU5rbzMgnjTh" }),
          static: null,
          flash: null,
        },
      ] as Phx.Msg)
    );

    await wsa.sendIncomingMsg(
      JSON.stringify(["4", "6", joinId, "event", { type: "click", event: "increment", value: { value: "" } }])
    );
    expect(sentMessages).toHaveLength(2);
  });
});
