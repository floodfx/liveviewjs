import { SessionData } from "express-session";
import { LiveViewServer } from "./live_view_server";
import { html } from "./templates";
import { LiveViewMountParams, LiveViewRouter, LiveViewSocket } from "./component/types";
import request from "superwstest"
import { Server } from "http";
import { PhxJoinIncoming } from "./socket/types";
import { BaseLiveViewComponent } from "./component/base_component";


describe("test live view server", () => {
  let lvServer: LiveViewServer;
  let httpServer: Server;

  beforeEach(() => {
    lvServer = new LiveViewServer({
      signingSecret: "MY_VERY_SECRET_KEY",
      port: 7654
    })
    httpServer = lvServer.httpServer;
    lvServer.start();
  })
  afterEach(() => {
    lvServer.shutdown();
  });

  it("register route updates the internal router", () => {
    expect(Object.keys(lvServer.router).length).toBe(0);
    lvServer.registerLiveViewRoute("/test", new LiveViewComponent())
    expect(Object.keys(lvServer.router).length).toBe(1);
  });

  it("register router udpates internal router", () => {
    const router: LiveViewRouter = {
      "/test": new LiveViewComponent()
    }
    expect(Object.keys(lvServer.router).length).toBe(0);
    lvServer.registerLiveViewRoutes(router)
    expect(Object.keys(lvServer.router).length).toBe(1);
  });

  it("updates start status after starting / stopping", async () => {
    // start called in beforeEach
    expect(lvServer.isStarted).toBe(true);
    lvServer.shutdown();
    expect(lvServer.isStarted).toBe(false);
  })

  it("starting / stopping twice has no effect", async () => {
    // start called in beforeEach
    expect(lvServer.isStarted).toBe(true);
    lvServer.start();
    expect(lvServer.isStarted).toBe(true);
    lvServer.shutdown();
    expect(lvServer.isStarted).toBe(false);
    lvServer.shutdown();
    expect(lvServer.isStarted).toBe(false);
  })

  it("http request renders a live view component html", (done) => {
    const lvComponent = new LiveViewComponent()
    lvServer.registerLiveViewRoute("/test", lvComponent)
    request(lvServer.httpServer).get('/test').expect(200).then(res => {
      expect(res.text).toContain(lvComponent.render().toString())
      done();
    })
  })

  it("http 404s on unknown route", (done) => {
    lvServer.start();
    request(lvServer.httpServer).get('/unknwon').then(res => {
      expect(res.status).toBe(404);
      lvServer.shutdown()
      done()
    });
  })

  it("socket connection is accepted", async () => {

    await request(lvServer.httpServer)
      .ws('/liveview')
      .close()
      .expectClosed()
  })

  it("socket message is accepted", async () => {
    const lvComponent = new LiveViewComponent()
    lvServer.registerLiveViewRoute("/test", lvComponent)

    const joinMsg: PhxJoinIncoming = [
      "4",
      "4",
      "lv:phx-V0qpjAuqyZRRIx6exYoSX",
      "phx_join",
      {
        url: "http://localhost:4444/test",
        params: { _csrf_token: "F8mpxGGkXIoG7VOltspwG", _mounts: 0 },
        session: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJjc3JmVG9rZW4iOiJGOG1weEdHa1hJb0c3Vk9sdHNwd0ciLCJpYXQiOjE2NDQ0MzkzODd9.BQDaufrhRJBSlXDVY_Spmfv0iHqrr94uiVjAkkuEy0Y",
        static: "eyJhbGciOiJIUzI1NiJ9.WyJcbiAgICA8ZGl2IGlkPVwibGlnaHRcIj5cbiAgICAgIDxoMT5Gcm9udCBQb3JjaCBMaWdodDwvaDE-XG4gICAgICA8ZGl2PlxuICAgICAgIDxkaXY-IiwiJTwvZGl2PlxuICAgICAgIDxwcm9ncmVzcyBpZD1cImxpZ2h0X21ldGVyXCIgc3R5bGU9XCJ3aWR0aDogMzAwcHg7IGhlaWdodDogMmVtOyBvcGFjaXR5OiAiLCJcIiB2YWx1ZT1cIiIsIlwiIG1heD1cIjEwMFwiPjwvcHJvZ3Jlc3M-XG4gICAgICA8L2Rpdj5cblxuICAgICAgPGJ1dHRvbiBwaHgtY2xpY2s9XCJvZmZcIiBwaHgtd2luZG93LWtleWRvd249XCJrZXlfdXBkYXRlXCIgcGh4LWtleT1cIkFycm93TGVmdFwiPlxuICAgICAgICDirIXvuI8gT2ZmXG4gICAgICA8L2J1dHRvbj5cblxuICAgICAgPGJ1dHRvbiBwaHgtY2xpY2s9XCJkb3duXCIgcGh4LXdpbmRvdy1rZXlkb3duPVwia2V5X3VwZGF0ZVwiIHBoeC1rZXk9XCJBcnJvd0Rvd25cIj5cbiAgICAgICAg4qyH77iPIERvd25cbiAgICAgIDwvYnV0dG9uPlxuXG4gICAgICA8YnV0dG9uIHBoeC1jbGljaz1cInVwXCIgcGh4LXdpbmRvdy1rZXlkb3duPVwia2V5X3VwZGF0ZVwiIHBoeC1rZXk9XCJBcnJvd1VwXCI-XG4gICAgICAgIOKshu-4jyBVcFxuICAgICAgPC9idXR0b24-XG5cbiAgICAgIDxidXR0b24gcGh4LWNsaWNrPVwib25cIiBwaHgtd2luZG93LWtleWRvd249XCJrZXlfdXBkYXRlXCIgcGh4LWtleT1cIkFycm93UmlnaHRcIj5cbiAgICAgICAg4p6h77iPIE9uXG4gICAgICA8L2J1dHRvbj5cbiAgICA8L2Rpdj5cbiAgICAiXQ.-0vaPZNgCC0QfXBXCPJV85pPU3tUFDKcXIm4pa4gYb8"
      }

    ]
    await request(lvServer.httpServer)
      .ws('/liveview')
      .sendText(JSON.stringify(joinMsg))
      .expectMessage((msg) => {
        console.log(msg)
      })
      .close()
      .expectClosed()
  })

})

class LiveViewComponent extends BaseLiveViewComponent<{}, {}> {

  mount(params: LiveViewMountParams, session: Partial<SessionData>, socket: LiveViewSocket<{}>): {} {
    return {}
  }

  render() {
    return html`<div>test</div>`;
  }

}
