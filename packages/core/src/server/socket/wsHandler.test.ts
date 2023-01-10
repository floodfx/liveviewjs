import { SessionFlashAdaptor } from "../adaptor";
import { JsonSerDe } from "../adaptor/jsonSerDe";
import { TestNodeFileSystemAdatptor } from "../adaptor/testFilesAdatptor";
import { Phx } from "../protocol/phx";
import { Test } from "../test/liveviews";
import { TestWsAdaptor } from "../test/wsAdaptor";
import { WsHandler } from "./ws/wsHandler";

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
});
