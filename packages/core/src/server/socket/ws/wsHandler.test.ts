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

  beforeEach(() => {
    // use jest to mock the websocket
    send = jest.fn();
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
    expect(send).toHaveBeenCalledTimes(1);
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
    expect(send).toHaveBeenCalledTimes(2);
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
    expect(send).toHaveBeenCalledTimes(2);
  });

  it("deduplicates rendered statics on phx_join when matching signed static token is provided in WsHandler", async () => {
    const serDe = new JsonSerDe();
    const counterView = Test.counterLiveView;
    const view = await counterView.render({ count: 0 }, { csrfToken: "k8iJ9AjzFhU5rbzMgnjTh" });
    const parts = view.partsTree(true);
    const staticToken = await serDe.serialize(parts.s);

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
          static: staticToken,
          flash: null,
        },
      ] as Phx.Msg)
    );

    expect(send).toHaveBeenCalledTimes(1);
    const sentMessageStr = (send as any).mock.calls[0][0];
    const sentMsg = JSON.parse(sentMessageStr);
    const renderedPayload = sentMsg[4].response.rendered;

    // Verify statics array `s` is included on join to populate client template cache
    expect(renderedPayload.s).toBeDefined();
    expect(renderedPayload[0]).toBe("0");
  });
});
