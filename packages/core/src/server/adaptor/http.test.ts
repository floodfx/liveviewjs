import {
  AnyLiveContext,
  BaseLiveComponent,
  BaseLiveView,
  createLiveView,
  LiveComponentMeta,
  LiveViewMeta,
  LiveViewMountParams,
  LiveViewTemplate,
} from "../live";
import { SessionData } from "../session";
import { LiveViewSocket } from "../socket";
import { html } from "../templates";
import { CsrfGenerator } from "./csrfGen";
import { handleHttpLiveView, HttpRequestAdaptor } from "./http";
import { IdGenerator } from "./idGen";
import { JsonSerDe } from "./jsonSerDe";
import { SessionFlashAdaptor } from "./sessionFlashAdaptor";

const idGen: IdGenerator = (id?: string) => id || "id";
const csrfGen: CsrfGenerator = (csrf?: string) => csrf || "csrf";

describe("test http adaptor", () => {
  it("adapts to http live views", async () => {
    const view = await handleHttpLiveView(
      idGen,
      csrfGen,
      new TestLiveView(),
      new TestHttpAdaptor(),
      (pageTitleDefault, csrfToken, content) => {
        return html`<main>${content}</main>`;
      },
      {}
    );

    expect(view).toMatchSnapshot();
  });

  it("handles redirect in mount", async () => {
    const redirectM = true;
    const adaptor = new TestHttpAdaptor();
    const view = await handleHttpLiveView(
      idGen,
      csrfGen,
      new TestLiveView(redirectM),
      adaptor,
      (pageTitleDefault, csrfToken, content) => {
        return html`<main>${content}</main>`;
      },
      {}
    );

    expect(adaptor.redirect).toEqual("/redirectM");
    expect(view).toBeUndefined();
  });

  it("handles redirect in HP", async () => {
    const redirectM = false;
    const redirectHP = true;
    const adaptor = new TestHttpAdaptor();
    const view = await handleHttpLiveView(
      idGen,
      csrfGen,
      new TestLiveView(redirectM, redirectHP),
      adaptor,
      (pageTitleDefault, csrfToken, content) => {
        return html`<main>${content}</main>`;
      },
      {}
    );

    expect(adaptor.redirect).toEqual("/redirectHP");
    expect(view).toBeUndefined();
  });

  it("shows live component", async () => {
    const redirectM = false;
    const redirectHP = false;
    const showLiveComponent = true;
    const adaptor = new TestHttpAdaptor();
    const view = await handleHttpLiveView(
      idGen,
      csrfGen,
      new TestLiveView(redirectM, redirectHP, showLiveComponent),
      adaptor,
      (pageTitleDefault, csrfToken, content) => {
        return html`<main>${content}</main>`;
      },
      {}
    );

    expect(view).toMatchSnapshot();
  });

  it("shows live stateless component", async () => {
    const redirectM = false;
    const redirectHP = false;
    const showLiveComponent = true;
    const adaptor = new TestHttpAdaptor();
    const view = await handleHttpLiveView(
      idGen,
      csrfGen,
      testEmptyParamLC,
      adaptor,
      (pageTitleDefault, csrfToken, content) => {
        return html`<main>${content}</main>`;
      },
      {}
    );

    expect(view).toMatchSnapshot();
  });

  it("rendering view inside another template", async () => {
    const redirectM = false;
    const redirectHP = false;
    const showLiveComponent = true;
    const adaptor = new TestHttpAdaptor();
    const view = await handleHttpLiveView(
      idGen,
      csrfGen,
      new TestLiveView(redirectM, redirectHP, showLiveComponent),
      adaptor,
      (pageTitleDefault, csrfToken, content) => {
        return html`<main>${content}</main>`;
      },
      {},
      { title: "Default Title" },
      async (session, content) => {
        const flashAdaptor = new SessionFlashAdaptor();
        const infoFlash = (await flashAdaptor.popFlash(session, "test")) || "";
        return html`<div class="container">
          <p class="flash">test: ${infoFlash}</p>
          ${content}
        </div>`;
      }
    );

    expect(view).toMatchSnapshot();
  });
});

class TestHttpAdaptor implements HttpRequestAdaptor {
  redirect: string;
  getRequestPath = () => {
    return "/test";
  };
  getRequestUrl = () => {
    return new URL("http://example.com/test");
  };
  onRedirect = (toUrl: string) => {
    this.redirect = toUrl;
  };
  getSerDe = () => {
    return new JsonSerDe();
  };
  getSessionData = () => {
    const session: SessionData = {};
    const flashAdaptor = new SessionFlashAdaptor();
    flashAdaptor.putFlash(session, "test", "test message");
    return session;
  };
}

class TestLiveComponent extends BaseLiveComponent {
  render(context: AnyLiveContext, meta: LiveComponentMeta): LiveViewTemplate | Promise<LiveViewTemplate> {
    return html`<div>Test Live Component: ${meta.myself}</div>`;
  }
}

class TestLiveView extends BaseLiveView {
  redirectM?: boolean;
  redirectHP?: boolean;
  showLiveComponent?: boolean;
  constructor(redirectM: boolean = false, redirectHP: boolean = false, showLiveComponent: boolean = false) {
    super();
    this.redirectM = redirectM;
    this.redirectHP = redirectHP;
    this.showLiveComponent = showLiveComponent;
  }
  mount(socket: LiveViewSocket<AnyLiveContext>, session: Partial<SessionData>, params: LiveViewMountParams): void {
    if (this.redirectM) {
      socket.pushRedirect("/redirectM");
    }
  }
  handleParams(url: URL, socket: LiveViewSocket<AnyLiveContext>): void {
    if (this.redirectHP) {
      socket.pushRedirect("/redirectHP");
    }
  }
  async render(context: AnyLiveContext, meta: LiveViewMeta): Promise<LiveViewTemplate> {
    // console.log("showLiveComponent", this.showLiveComponent);
    return html`
      <div>
        Test Live View
        ${this.showLiveComponent
          ? html`<div>${await meta.live_component(new TestLiveComponent(), { id: 1 })}</div>`
          : ""}
      </div>
    `;
  }
}

const testEmptyParamLC = createLiveView({
  render: async (ctx, meta) => {
    return html`<div>${await meta.live_component(new TestLiveComponent())}</div>`;
  },
});
