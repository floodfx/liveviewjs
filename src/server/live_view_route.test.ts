import { SessionData } from "express-session";
import { nanoid } from "nanoid";
import request from "superwstest";
import { configLiveViewHandler } from ".";
import { LiveViewMountParams, LiveViewSocket } from "./component";
import { BaseLiveView } from "./component/base_component";
import { LiveViewServer } from "./live_view_server";
import { html } from "./templates";


describe("test live view route", () => {

  it("starting / stopping twice has no effect", async () => {
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
    const lvComponent = new LiveViewComponent()
    lvServer.expressApp.get(...configLiveViewHandler(
      "/test/foo",
      lvComponent,
      "root.html.ejs",
      "my signing secret",
      (req) => {
        return {
          ...req.session, // copy session data
          csrfToken: req.session.csrfToken || nanoid(),
        }
      },
      {
        title: "Default Title"
      }
    ))
    lvServer.start()
    setTimeout((() => {
      request(lvServer.httpServer).get('/test/foo').expect(200).then(res => {
        expect(res.text).toContain(lvComponent.render({ message: "test" }).toString())
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

class LiveViewComponent extends BaseLiveView<{ message?: string }, {}> {

  mount(params: LiveViewMountParams, session: Partial<SessionData>, socket: LiveViewSocket<{}>): {} {
    return { message: session.message || "test" }
  }

  render(ctx: { message: string }) {
    const { message } = ctx
    return html`<div>${message}</div>`;
  }

}
