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
  max: number;
}

/**
 * Example that loads a today's comic from xkcd.com and allows paginating and loading
 * random comics from the same site.
 */
export class AsyncFetchLiveView extends BaseLiveView<Context> {
  async mount(params: LiveViewMountParams, session: Partial<SessionData>, socket: LiveViewSocket<Context>) {
    // get today's comic from xkcd
    const comic = await fetchXkcd();
    // pull out today's number and use it as the max
    const max = comic.num;
    socket.pageTitle(`Xkcd: ${comic.title}`);
    socket.assign({
      comic,
      max,
    });
  }

  async handleParams(url: URL, socket: LiveViewSocket<Context>) {
    // num should be between 1 and max
    const { max } = socket.context;
    const num = Number(url.searchParams.get("num"));
    const which = num === NaN ? undefined : num;
    const comic = await fetchXkcd(which, max);
    socket.assign({
      comic,
      num,
    });
  }

  render(context: Context, meta: LiveViewMeta): LiveViewTemplate {
    const { comic, num, max } = context;
    return html`
      <h1>Xkcd</h1>
      <div>
        <nav>${this.prev(max, num)} ${this.next(max, num)} ${this.random(max)} ${this.today()}</nav>
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

  private prev(max: number, num?: number): HtmlSafeString {
    if (num && isValidXkcd(num - 1, max)) {
      return live_patch(html`<button>Previous</button>`, {
        to: { path: "/asyncfetch", params: { num: String(num - 1) } },
      });
    }
    return html``;
  }

  private next(max: number, num?: number): HtmlSafeString {
    if (num && isValidXkcd(num + 1, max)) {
      return live_patch(html`<button>Next</button>`, {
        to: { path: "/asyncfetch", params: { num: String(num + 1) } },
      });
    }
    return html``;
  }

  private random(max: number): HtmlSafeString | undefined {
    const num = randomXkcdNum(max);
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
