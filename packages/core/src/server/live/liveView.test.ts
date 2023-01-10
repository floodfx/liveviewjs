import { BaseLiveComponent, LiveViewTemplate } from ".";
import { html } from "..";
import { SessionFlashAdaptor, WsAdaptor, WsCloseListener, WsMsgListener } from "../adaptor";
import { JsonSerDe } from "../adaptor/jsonSerDe";
import { TestNodeFileSystemAdatptor } from "../adaptor/testFilesAdatptor";
import { SingleProcessPubSub } from "../pubsub";
import { SessionData } from "../session";
import { LiveViewSocket } from "../socket";
import { LiveViewManager } from "../socket/liveViewManager";
import { PhxJoinIncoming } from "../socket/types";
import { LiveComponentMeta } from "./liveComponent";
import { BaseLiveView, createLiveView, LiveViewMeta, LiveViewMountParams } from "./liveView";
import { LiveViewRouter } from "./router";

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
  subscribeToClose(closeListener: WsCloseListener): void | Promise<void> {
    throw new Error("Method not implemented.");
  }
  subscribeToMessages(msgListener: WsMsgListener): void | Promise<void> {
    throw new Error("Method not implemented.");
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
    new SessionFlashAdaptor(),
    new TestNodeFileSystemAdatptor(),
    {}
  );
}

const TestFuncLiveView = createLiveView<
  { eventCount: number; id?: string },
  { type: "Event" } | { type: "Event2" },
  { type: "Tick"; tickCount: number } | { type: "Tick2" }
>({
  mount: (socket) => {
    socket.assign({ eventCount: 0 });
  },
  handleInfo: (info, socket) => {
    if (info.type === "Tick") {
      // console.log(info.type, info.tickCount);
      socket.sendInfo({ type: "Tick2" });
    }
  },
  handleEvent: (event, socket) => {
    const eventCount = socket.context.eventCount + 1;
    socket.assign({ eventCount });
    socket.sendInfo({ type: "Tick", tickCount: eventCount });
  },
  render: async (ctx, meta) => {
    const { eventCount } = ctx;
    const { live_component } = meta;
    return html` <div>${await live_component(new TestLiveComponent(), { id: 1, foo: `called:${eventCount}` })}</div> `;
  },
});

const router: LiveViewRouter = {
  "/foo": TestFuncLiveView,
};

// Matt P's suggestions
// interface BaseLiveViewParams<
//   TContext extends LiveContext = AnyLiveContext,
//   TEvents extends LiveEvent = AnyLiveEvent,
//   TInfos extends LiveInfo = AnyLiveInfo
// > {
//   mount?: (
//     socket: LiveViewSocket<TContext, TInfos>,
//     session: Partial<SessionData>,
//     params: LiveViewMountParams
//   ) => void | Promise<void>;
//   handleParams?: (url: URL, socket: LiveViewSocket<TContext, TInfos>) => void;
//   handleEvent?: (event: TEvents, socket: LiveViewSocket<TContext, TInfos>) => void;
//   handleInfo?: (info: TInfos, socket: LiveViewSocket<TContext, TInfos>) => void | Promise<void>;
//   render(context: TContext, meta: LiveViewMeta): LiveViewTemplate | Promise<LiveViewTemplate>;
// }

// const createLiveViewFunc = <
//   TContext extends LiveContext = AnyLiveContext,
//   TEvents extends LiveEvent = AnyLiveEvent,
//   TInfos extends LiveInfo = AnyLiveInfo
// >(
//   params: BaseLiveViewParams<TContext, TEvents, TInfos>
// ): LiveView<TContext, TEvents, TInfos> => {
//   return {} as any;
// };

// weird inference issues:
// 1) adding "meta" to render function transforms "mount" socket inferrence from render context to AnyLiveContext
// 1a) adding full type of meta (meta: LiveViewMeta) to render fixes this!?
// 2) handleInfo must be before mount || the socket type in handleInfo must be "socket: LiveViewSocket" otherwise
// the handleInfo fuction has a type mismatch error. removing the socket param also fixes this
// createLiveViewFunc({
//   mount: (socket) => {
//     socket.assign({ videoId: "id", foo: "bar" });
//   },
//   handleInfo: (info: { type: "blah" }, socket: LiveViewSocket) => {},
//   handleParams(url, socket) {
//     socket.assign({
//       videoId: url.searchParams.get("videoId")!,
//     });
//   },

//   handleEvent: (events: { type: "WHATEVER" }, socket) => {},
//   render: (context: { videoId: string }, meta) => {
//     return html``;
//   },
// });
