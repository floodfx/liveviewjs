import {
  BaseLiveView,
  html,
  HtmlSafeString,
  LiveViewMeta,
  LiveViewMountParams,
  LiveViewSocket,
  LiveViewTemplate,
  live_patch,
  safe,
  SessionData,
} from "liveviewjs";
import { fetchXkcd, isValidXkcd, randomXkcdNum, XkcdData } from "./data";

interface Context {
  comic: XkcdData;
  num?: number;
}

//  navigate through Xkcd comics using async/await
export class AsyncFetchLiveView extends BaseLiveView<Context> {
  async mount(params: LiveViewMountParams, session: Partial<SessionData>, socket: LiveViewSocket<Context>) {
    // get today's comic from xkcd
    const comic = await fetchXkcd();
    socket.pageTitle(`Xkcd: ${comic.title}`);
    socket.assign({
      comic,
    });
  }

  async handleParams(url: URL, socket: LiveViewSocket<Context>) {
    // num should be between 1 and 2580
    const num = Number(url.searchParams.get("num"));
    const which = num === NaN ? undefined : Math.max(1, Math.min(2580, num));
    const comic = await fetchXkcd(which);
    socket.assign({
      comic,
      num,
    });
  }

  render(context: Context, meta: LiveViewMeta): LiveViewTemplate {
    const { comic, num } = context;
    return html`
      <h1>Xkcd</h1>
      <div>
        <nav>${this.prev(num)} ${this.next(num)} ${this.random()} ${this.today()}</nav>
      </div>
      <div>
        <h2>${num ? `#${num}` : `Today's (#${comic.num})`}</h2>
        <h3>${comic.title}</h3>
      </div>
      <div>
        <img src="${safe(comic.img)}" alt="${comic.alt}" />
        <pre style="white-space:pre-line;">${comic.transcript}</pre>
      </div>
    `;
  }

  private prev(num?: number): HtmlSafeString {
    if (num && isValidXkcd(num - 1)) {
      return live_patch(html`<button>Previous</button>`, {
        to: { path: "/asyncfetch", params: { num: String(num - 1) } },
      });
    }
    return html``;
  }

  private next(num?: number): HtmlSafeString {
    if (num && isValidXkcd(num + 1)) {
      return live_patch(html`<button>Next</button>`, {
        to: { path: "/asyncfetch", params: { num: String(num + 1) } },
      });
    }
    return html``;
  }

  private random(): HtmlSafeString | undefined {
    const num = randomXkcdNum();
    return live_patch(html`<button>Random</button>`, {
      to: { path: "/asyncfetch", params: { num: String(num) } },
    });
  }

  private today(): HtmlSafeString | undefined {
    return live_patch(html`<button>Today</button>`, {
      to: { path: "/asyncfetch" },
    });
  }
}
