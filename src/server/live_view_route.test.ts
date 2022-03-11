import { SessionData } from "express-session";
import { nanoid } from "nanoid";
import request from "superwstest";
import { BaseLiveComponent, BaseLiveView, configLiveViewHandler, LiveViewMeta, LiveViewMountParams, LiveViewSocket, LiveViewTemplate } from ".";
import { LiveComponentContext, LiveViewContext } from "./component";
import { LiveViewServer } from "./live_view_server";
import { html } from "./templates";


describe("test live view route", () => {

  it("starting / stopping twice has no effect", async () => {
    const lvServer = new LiveViewServer({
      signingSecret: "MY_VERY_SECRET_KEY",
      port: 7878,
    });
    lvServer.start();
    expect(lvServer.isStarted).toBe(true);
    lvServer.start();
    expect(lvServer.isStarted).toBe(true);
    lvServer.shutdown();
    expect(lvServer.isStarted).toBe(false);
    lvServer.shutdown();
    expect(lvServer.isStarted).toBe(false);
  })

  it("use configLiveViewHandler", (done) => {
    const lvServer = new LiveViewServer({
      signingSecret: "MY_VERY_SECRET_KEY",
      port: 7878,
      pageTitleDefaults: {
        prefix: "TitlePrefix - ",
        suffix: " - TitleSuffix",
        title: "Title",
      },
    });

    lvServer.start();
    expect(lvServer.isStarted).toBe(true);
    const liveView = new TestLiveView()
    lvServer.expressApp.get(...configLiveViewHandler(
      "/test/foo",
      liveView,
      "root.html.ejs",
      "my signing secret",
      (req) => {
        return {
          ...req.session, // copy session data
          csrfToken: req.session.csrfToken || nanoid(),
        }
      },
    ))
    lvServer.start()
    setTimeout((() => {
      request(lvServer.httpServer).get('/test/foo').expect(200).then(res => {
        expect(res.text).toContain(liveView.render({ message: "test" }).toString())
        done();
        lvServer.shutdown()
      })
    }), 100)
  })

  it("test LiveView with a LiveComponent", (done) => {
    const lvServer = new LiveViewServer({
      signingSecret: "MY_VERY_SECRET_KEY",
      port: 7878,
      pageTitleDefaults: {
        prefix: "TitlePrefix - ",
        suffix: " - TitleSuffix",
        title: "Title",
      },
    });

    lvServer.start();
    expect(lvServer.isStarted).toBe(true);
    const liveView = new TestLiveViewAndLiveComponent()
    lvServer.expressApp.get(...configLiveViewHandler(
      "/test/foo",
      liveView,
      "root.html.ejs",
      "my signing secret",
      (req) => {
        return {
          ...req.session, // copy session data
          csrfToken: req.session.csrfToken || nanoid(),
        }
      },
      {
        title: "Default Title",
      }
    ))
    lvServer.start()
    setTimeout((() => {
      request(lvServer.httpServer).get('/test/foo').expect(200).then(res => {
        expect(res.text).toContain(`<div>bar</div>`)
        done();
        lvServer.shutdown()
      })
    }), 100)
  })

})

declare module 'express-session' {
  interface SessionData {
    message: string;
  }
}

interface TestLVContext extends LiveViewContext {
  message?: string;
}
class TestLiveView extends BaseLiveView<TestLVContext, {}> {

  mount(params: LiveViewMountParams, session: Partial<SessionData>, socket: LiveViewSocket<TestLVContext>) {
    socket.assign({ message: session.message || "test" })
  }

  render(ctx: TestLVContext) {
    const { message } = ctx
    return html`<div>${message}</div>`;
  }

}


class TestLiveViewAndLiveComponent extends BaseLiveView<TestLVContext, {}> {

  mount(params: LiveViewMountParams, session: Partial<SessionData>, socket: LiveViewSocket<TestLVContext>) {
    socket.assign({ message: session.message || "test" })
  }

  async render(ctx: TestLVContext, meta: LiveViewMeta): Promise<LiveViewTemplate> {
    const { message } = ctx
    const { live_component } = meta
    return html`
      <div>${ await live_component(new TestLiveComponent(), {id: 1, foo: "bar"})}</div>
      <div>${ await live_component(new TestLiveComponent())}</div>
    `;
  }

}

interface TestLCContext extends LiveComponentContext {
  foo: string
}
class TestLiveComponent extends BaseLiveComponent<TestLCContext> {

  render(ctx: {foo: string}) {
    return html`<div>${ctx.foo}</div>`;
  }

}
