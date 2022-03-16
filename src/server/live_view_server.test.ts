import { MemoryStore, SessionData } from "express-session";
import request from "superwstest";
import {
  BaseLiveComponent,
  BaseLiveView,
  LiveViewMeta,
  LiveViewMountParams,
  LiveViewRouter,
  LiveViewServer,
  LiveViewSocket,
  LiveViewTemplate,
} from ".";
import { LiveComponentContext, LiveViewContext } from "./component";
import { PhxJoinIncoming } from "./socket/types";
import { html, HtmlSafeString } from "./templates";

describe("test live view server", () => {
  let lvServer: LiveViewServer;

  const liveViewRootTemplate = (session: SessionData, inner_content: HtmlSafeString) => html`<div>
    ${session.csrfToken} ${inner_content}
  </div>`;

  beforeEach(() => {
    lvServer = new LiveViewServer({
      signingSecret: "MY_VERY_SECRET_KEY",
      port: 7654,
      pageTitleDefaults: {
        prefix: "TitlePrefix - ",
        suffix: " - TitleSuffix",
        title: "Title",
      },
      liveViewRootTemplate,
    });
    lvServer.start();
  });
  afterEach(() => {
    lvServer.shutdown();
  });

  it("register route updates the internal router", () => {
    expect(Object.keys(lvServer.router).length).toBe(0);
    lvServer.registerLiveViewRoute("/test", new TestLiveViewComponent());
    expect(Object.keys(lvServer.router).length).toBe(1);
  });

  it("exercises other settings", () => {
    const lvServerOpts = new LiveViewServer({
      signingSecret: "MY_VERY_SECRET_KEY",
      rootView: "foo",
      publicPath: "/public",
      sessionStore: new MemoryStore(),
      viewsPath: "./views",
      liveViewRootTemplate,
    });
    expect(lvServerOpts["rootView"] as string).toBe("foo");
    expect(lvServerOpts["publicPath"] as string).toBe("/public");
    expect((lvServerOpts["viewsPath"] as string[])[0]).toBe("./views");
    expect((lvServerOpts["viewsPath"] as string[])[1]).toContain("/web/views");
    expect(lvServerOpts["sessionStore"]).toBeInstanceOf(MemoryStore);
    expect(lvServerOpts["signingSecret"]).toEqual("MY_VERY_SECRET_KEY");
    expect(
      (lvServerOpts["liveViewRootTemplate"] as Function)({ csrfToken: "my csrf" }, html`<div>inner</div>`).toString()
    ).toMatchInlineSnapshot(`
      "<div>
          my csrf <div>inner</div>
        </div>"
    `);
  });

  it("register router udpates internal router", () => {
    const router: LiveViewRouter = {
      "/test": new TestLiveViewComponent(),
    };
    expect(Object.keys(lvServer.router).length).toBe(0);
    lvServer.registerLiveViewRoutes(router);
    expect(Object.keys(lvServer.router).length).toBe(1);
  });

  it("updates start status after starting / stopping", async () => {
    // start called in beforeEach
    expect(lvServer.isStarted).toBe(true);
    lvServer.shutdown();
    expect(lvServer.isStarted).toBe(false);
  });

  it("starting / stopping twice has no effect", async () => {
    // start called in beforeEach
    expect(lvServer.isStarted).toBe(true);
    lvServer.start();
    expect(lvServer.isStarted).toBe(true);
    lvServer.shutdown();
    expect(lvServer.isStarted).toBe(false);
    lvServer.shutdown();
    expect(lvServer.isStarted).toBe(false);
  });

  it("http request renders a live view component html", (done) => {
    const lvComponent = new TestLiveViewComponent();
    lvServer.registerLiveViewRoute("/test", lvComponent);
    request(lvServer.httpServer)
      .get("/test")
      .expect(200)
      .then((res) => {
        expect(res.text).toContain(lvComponent.render({ message: "test" }).toString());
        done();
      });
  });

  it("http request renders a live view component html at deeper path", (done) => {
    const lvComponent = new TestLiveViewComponent();
    lvServer.registerLiveViewRoute("/test/foo/bar", lvComponent);
    request(lvServer.httpServer)
      .get("/test/foo/bar")
      .expect(200)
      .then((res) => {
        expect(res.text).toContain(lvComponent.render({ message: "test" }).toString());
        done();
      });
  });

  it("http request contains live title components", (done) => {
    const lvComponent = new TestLiveViewComponent();
    lvServer.registerLiveViewRoute("/test", lvComponent);
    request(lvServer.httpServer)
      .get("/test")
      .expect(200)
      .then((res) => {
        expect(res.text).toContain(
          '<title data-prefix="TitlePrefix - " data-suffix=" - TitleSuffix">TitlePrefix - Title - TitleSuffix</title>'
        );
        done();
      });
  });

  it("test LiveView with a LiveComponent", (done) => {
    const liveView = new TestLiveViewAndLiveComponent();
    lvServer.registerLiveViewRoute("/test", liveView);

    request(lvServer.httpServer)
      .get("/test")
      .expect(200)
      .then((res) => {
        expect(res.text).toContain(`<div>bar</div>`);
        done();
      });
  });

  it("http 404s on unknown route", (done) => {
    lvServer.start();
    request(lvServer.httpServer)
      .get("/unknwon")
      .then((res) => {
        expect(res.status).toBe(404);
        lvServer.shutdown();
        done();
      });
  });

  it("socket connection is accepted and closed", async () => {
    await request(lvServer.httpServer).ws("/liveview").close().expectClosed();
  });

  it("socket message is accepted", async () => {
    const lvComponent = new TestLiveViewComponent();
    lvServer.registerLiveViewRoute("/test", lvComponent);

    const joinMsg: PhxJoinIncoming = [
      "4",
      "4",
      "lv:phx-V0qpjAuqyZRRIx6exYoSX",
      "phx_join",
      {
        url: "http://localhost:4444/test",
        params: { _csrf_token: "F8mpxGGkXIoG7VOltspwG", _mounts: 0 },
        session:
          "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJjc3JmVG9rZW4iOiJGOG1weEdHa1hJb0c3Vk9sdHNwd0ciLCJpYXQiOjE2NDQ0MzkzODd9.BQDaufrhRJBSlXDVY_Spmfv0iHqrr94uiVjAkkuEy0Y",
        static:
          "eyJhbGciOiJIUzI1NiJ9.WyJcbiAgICA8ZGl2IGlkPVwibGlnaHRcIj5cbiAgICAgIDxoMT5Gcm9udCBQb3JjaCBMaWdodDwvaDE-XG4gICAgICA8ZGl2PlxuICAgICAgIDxkaXY-IiwiJTwvZGl2PlxuICAgICAgIDxwcm9ncmVzcyBpZD1cImxpZ2h0X21ldGVyXCIgc3R5bGU9XCJ3aWR0aDogMzAwcHg7IGhlaWdodDogMmVtOyBvcGFjaXR5OiAiLCJcIiB2YWx1ZT1cIiIsIlwiIG1heD1cIjEwMFwiPjwvcHJvZ3Jlc3M-XG4gICAgICA8L2Rpdj5cblxuICAgICAgPGJ1dHRvbiBwaHgtY2xpY2s9XCJvZmZcIiBwaHgtd2luZG93LWtleWRvd249XCJrZXlfdXBkYXRlXCIgcGh4LWtleT1cIkFycm93TGVmdFwiPlxuICAgICAgICDirIXvuI8gT2ZmXG4gICAgICA8L2J1dHRvbj5cblxuICAgICAgPGJ1dHRvbiBwaHgtY2xpY2s9XCJkb3duXCIgcGh4LXdpbmRvdy1rZXlkb3duPVwia2V5X3VwZGF0ZVwiIHBoeC1rZXk9XCJBcnJvd0Rvd25cIj5cbiAgICAgICAg4qyH77iPIERvd25cbiAgICAgIDwvYnV0dG9uPlxuXG4gICAgICA8YnV0dG9uIHBoeC1jbGljaz1cInVwXCIgcGh4LXdpbmRvdy1rZXlkb3duPVwia2V5X3VwZGF0ZVwiIHBoeC1rZXk9XCJBcnJvd1VwXCI-XG4gICAgICAgIOKshu-4jyBVcFxuICAgICAgPC9idXR0b24-XG5cbiAgICAgIDxidXR0b24gcGh4LWNsaWNrPVwib25cIiBwaHgtd2luZG93LWtleWRvd249XCJrZXlfdXBkYXRlXCIgcGh4LWtleT1cIkFycm93UmlnaHRcIj5cbiAgICAgICAg4p6h77iPIE9uXG4gICAgICA8L2J1dHRvbj5cbiAgICA8L2Rpdj5cbiAgICAiXQ.-0vaPZNgCC0QfXBXCPJV85pPU3tUFDKcXIm4pa4gYb8",
      },
    ];
    await request(lvServer.httpServer)
      .ws("/liveview")
      .sendText(JSON.stringify(joinMsg))
      .expectMessage((msg) => {
        // console.log(msg)
        expect(msg.data).not.toBeUndefined();
      })
      .close()
      .expectClosed();
  });

  it("middleware is applied", (done) => {
    let middlewareCalled = false;
    const testLVServer = new LiveViewServer({
      middleware: [
        (req, res, next) => {
          middlewareCalled = true;
          next();
        },
      ],
      signingSecret: "test",
      port: 7655,
    });

    const lvComponent = new TestLiveViewComponent();
    testLVServer.registerLiveViewRoute("/test", lvComponent);
    testLVServer.start();
    request(testLVServer.httpServer)
      .get("/test")
      .expect(200)
      .then((res) => {
        // expect(res.text).toContain(lvComponent.render().toString())
        expect(middlewareCalled).toBe(true);
        testLVServer.shutdown();
        done();
      });
  });

  it("middleware sets message", (done) => {
    const message = "blah";
    const testLVServer = new LiveViewServer({
      middleware: [
        (req, res, next) => {
          req.session.message = message;
          next();
        },
      ],
      signingSecret: "test",
      port: 7655,
    });

    const lvComponent = new TestLiveViewComponent();
    testLVServer.registerLiveViewRoute("/test", lvComponent);
    testLVServer.start();
    request(testLVServer.httpServer)
      .get("/test")
      .expect(200)
      .then((res) => {
        expect(res.text).toContain(message);
        testLVServer.shutdown();
        done();
      });
  });

  it("first request sets session flash, second request reads it from cookie", (done) => {
    const lvComponent = new TestLiveViewComponent();
    lvServer.registerLiveViewRoute("/test", lvComponent);
    let cookies: string;
    let req = request(lvServer.httpServer).get("/test");
    let req2 = request(lvServer.httpServer).get("/test");

    // set session flash
    req.expect(200).then((res) => {
      expect(res.text).toContain(lvComponent.render({ message: "test" }).toString());
      // read session cookie
      cookies = res.headers["set-cookie"].pop().split(";")[0];

      // set request2 cookie
      req2.cookies = cookies;
      req2.expect(200).then((res) => {
        expect(res.text).toContain(lvComponent.render({ message: "test" }).toString());
        done();
      });
    });
  });
});

declare module "express-session" {
  interface SessionData {
    message: string;
  }
}

interface TestLVContext extends LiveViewContext {
  message?: string;
}

class TestLiveViewComponent extends BaseLiveView<TestLVContext, {}> {
  mount(params: LiveViewMountParams, session: Partial<SessionData>, socket: LiveViewSocket<TestLVContext>) {
    socket.assign({ message: session.message || "test" });
  }

  render(ctx: TestLVContext) {
    const { message } = ctx;
    return html`<div>${message}</div>`;
  }
}

class TestLiveViewAndLiveComponent extends BaseLiveView<TestLVContext, {}> {
  mount(params: LiveViewMountParams, session: Partial<SessionData>, socket: LiveViewSocket<TestLVContext>) {
    socket.assign({ message: session.message || "test" });
  }

  async render(ctx: TestLVContext, meta: LiveViewMeta): Promise<LiveViewTemplate> {
    const { message } = ctx;
    const { live_component } = meta;
    return html`
      <div>${await live_component(new TestLiveComponent(), { id: 1, foo: "bar" })}</div>
      <div>${await live_component(new TestLiveComponent())}</div>
    `;
  }
}

interface TestLCContext extends LiveComponentContext {
  foo: string;
}
class TestLiveComponent extends BaseLiveComponent<TestLCContext> {
  render(ctx: { foo: string }) {
    return html`<div>${ctx.foo}</div>`;
  }
}
