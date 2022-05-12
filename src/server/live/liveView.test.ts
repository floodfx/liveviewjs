import { BaseLiveComponent, LiveViewTemplate } from ".";
import { html } from "..";
import { LiveComponentMeta } from "./liveComponent";
import { LiveViewManager } from "../socket/liveViewManager";
import { BaseLiveView, createLiveView, LiveViewMeta, LiveViewMountParams } from "./liveView";
import { SessionData } from "../session";
import { LiveViewSocket, WsMessageRouter } from "../socket";
import { SingleProcessPubSub } from "../pubsub";
import { PhxJoinIncoming } from "../socket/types";
import { JsonSerDe } from "../adaptor/jsonSerDe";
import { SessionFlashAdaptor, WsAdaptor } from "../adaptor";

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
  mount(socket: LiveViewSocket<TestLVContext>, session: Partial<SessionData>, params: LiveViewMountParams) {
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
    // new TestLiveView(),
    TestFuncLiveView,
    "id",
    new CallbackMessenger(callback),
    new JsonSerDe(),
    new SingleProcessPubSub(),
    new SessionFlashAdaptor()
  );
}

const TestFuncLiveView = createLiveView({
  handleInfo: (infos: { type: "Tick" }, socket) => {
    console.log("Tick");
  },
  mount: (socket) => {
    socket.assign({ called: 0 });
    socket.sendInfo({ type: "Tick" });
  },
  render: async (ctx: { called: number; id?: string }, meta: LiveViewMeta) => {
    const { called } = ctx;
    return html` <div>${called}</div> `;
  },
});

// const TestFuncLiveView = createLiveView({
//   handleInfo: (infos: { type: "Tick" }, socket) => {
//     console.log("Tick");
//   },
//   mount: (socket) => {
//     socket.assign({ called: 0 });
//     socket.sendInfo({ type: "Tick" });
//   },
//   handleEvent: (event: { type: "Click" }, socket) => {},
//   handleParams: (url, socket) => {
//     socket.assign({ id: url.searchParams.get("id") ?? undefined });
//   },
//   render: async (ctx: { called: number; id?: string }, meta: LiveViewMeta) => {
//     const { called } = ctx;
//     const { live_component } = meta;
//     return html` <div>${await live_component(new TestLiveComponent(), { id: 1, foo: `called:${called}` })}</div> `;
//   },
// });

const dashboardLV = createLiveView({
  handleInfo: (info: { type: "tick" }, socket) => {
    socket.assign(nextRandomData());
  },
  mount: (socket) => {
    if (socket.connected) {
      // socket will be connected after websocket connetion established
      socket.repeat(() => {
        socket.sendInfo({ type: "tick" });
      }, 1000);
    }
    socket.assign(nextRandomData());
  },
  handleEvent: (event: { type: "refresh" }, socket) => {
    socket.assign(nextRandomData());
  },
  render: async (context: { newOrders: number; salesAmount: number; rating: number }) => {
    const { newOrders, salesAmount, rating } = context;
    return html`
      <h1>Sales Dashboard</h1>
      <hr />
      <span>🥡 New Orders</span>
      <h2>${newOrders}</h2>
      <hr />
      <span>💰 Sales Amount</span>
      <h2>${salesAmount}</h2>
      <hr />
      <span>🌟 Rating</spa>
      <h2>${rating}</h2>

      <br />
      <br />
      <button phx-click="refresh">↻ Refresh</button>
    `;
  },
});

function nextRandomData() {
  return {
    newOrders: randomNewOrders(),
    salesAmount: randomSalesAmount(),
    rating: randomRating(),
  };
}

// generate a random number between min and max
const random = (min: number, max: number): (() => number) => {
  return () => Math.floor(Math.random() * (max - min + 1)) + min;
};

const randomSalesAmount = random(100, 1000);
const randomNewOrders = random(5, 20);
const randomRating = random(1, 5);
