import { JsonSerDe } from "../adaptor/jsonSerDe";
import { TestNodeFileSystemAdatptor } from "../adaptor/testFilesAdatptor";
import { Phx } from "../protocol/phx";
import { Test } from "../test/liveviews";
import { TestWsAdaptor } from "../test/wsAdaptor";
import { WsHandler } from "./wsHandler";

describe("test NodeWsHandler", () => {
  let wsh: WsHandler;
  let wsa: TestWsAdaptor;
  let send: jest.Mock;
  let subscribeToClose: jest.Mock;
  let subscribeToMessages: jest.Mock;

  beforeEach(() => {
    // use jest to mock the websocket
    send = jest.fn();
    subscribeToClose = jest.fn();
    subscribeToMessages = jest.fn();
    wsa = new TestWsAdaptor(send, subscribeToClose, subscribeToMessages);
    wsh = new WsHandler(wsa, {
      router: { "/counter": Test.counterLiveView },
      fileSysAdaptor: new TestNodeFileSystemAdatptor(),
      serDe: new JsonSerDe(),
    });
  });

  it("handles a message", () => {
    wsa.sendIncomingMsg(JSON.stringify(["", "", "", "", {}] as Phx.Msg));
    expect(send).toHaveBeenCalledTimes(0);
  });
});
