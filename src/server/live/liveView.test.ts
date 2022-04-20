import { BaseLiveComponent, LiveViewTemplate } from ".";
import { html } from "..";
import { LiveComponentMeta } from "./liveComponent";
import { LiveViewManager } from "../socket/liveViewManager";
import { AnyLiveEvent, BaseLiveView, LiveViewMeta, LiveViewMountParams } from "./liveView";
import { SessionData } from "../session";
import { LiveViewSocket, WsMessageRouter } from "../socket";
import { SingleProcessPubSub } from "../pubsub";
import { PhxJoinIncoming } from "../socket/types";
import { JsonSerDe } from "../adaptor/jsonSerDe";
import { WsAdaptor } from "../adaptor";

describe("test LiveViewMeta", () => {
  it("test meta", async () => {
    let msgs: string[] = [];
    const manager = newManager((message) => {
      msgs.push(message);
    });
    await manager.handleJoin([
      null,
      null,
      "test",
      "phx_join",
      {
        params: { _csrf_token: "csrf", _mounts: -1 } as LiveViewMountParams,
        session: JSON.stringify({ _csrf_token: "csrf" }),
        static: "",
        url: "http://localhost:9999/foo",
      },
    ] as PhxJoinIncoming);

    expect(msgs[0]).toMatchInlineSnapshot(
      `"[null,null,\\"test\\",\\"phx_reply\\",{\\"response\\":{\\"rendered\\":{\\"0\\":1,\\"s\\":[\\" <div>\\",\\"</div> \\"],\\"c\\":{\\"1\\":{\\"0\\":\\"called:0\\",\\"s\\":[\\"<div>\\",\\"</div>\\"]}}}},\\"status\\":\\"ok\\"}]"`
    );
  });

  it("test handleInfo", async () => {
    let msgs: string[] = [];
    const manager = newManager((message) => {
      msgs.push(message);
    });

    await manager.handleJoin([
      null,
      null,
      "test",
      "phx_join",
      {
        params: { _csrf_token: "csrf", _mounts: -1 } as LiveViewMountParams,
        session: JSON.stringify({ _csrf_token: "csrf" }),
        static: "",
        url: "http://localhost:9999/foo",
      },
    ] as PhxJoinIncoming);
  });
});

interface TestLCContext {
  foo: string;
}

class TestLiveComponent extends BaseLiveComponent<TestLCContext> {
  render(ctx: TestLCContext, meta: LiveComponentMeta): LiveViewTemplate {
    return html`<div>${ctx.foo}</div>`;
  }
}

interface TestLVContext {
  called: number;
}

class TestLiveView extends BaseLiveView<TestLVContext> {
  mount(params: LiveViewMountParams, session: Partial<SessionData>, socket: LiveViewSocket<TestLVContext>) {
    socket.assign({ called: 0 });
  }

  async render(ctx: TestLVContext, meta: LiveViewMeta): Promise<LiveViewTemplate> {
    const { called } = ctx;
    const { live_component } = meta;
    return html` <div>${await live_component(new TestLiveComponent(), { id: 1, foo: `called:${called}` })}</div> `;
  }
}

class CallbackMessenger implements WsAdaptor {
  constructor(private callback: (message: string) => void) {
    this.callback = callback;
  }

  send(message: string, errorHandler?: (err: any) => void): void {
    this.callback(message);
  }
}

function newManager(callback: (message: string) => void): LiveViewManager {
  return new LiveViewManager(
    new TestLiveView(),
    "id",
    new CallbackMessenger(callback),
    new JsonSerDe(),
    new SingleProcessPubSub()
  );
}
