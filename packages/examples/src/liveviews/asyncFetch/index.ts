import {
  BaseLiveView,
  createLiveView,
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

/**
 * Example that loads a today's comic from xkcd.com and allows paginating and loading
 * random comics from the same site.
 */
export const xkcdLiveView = createLiveView({
  mount: async (socket) => {
    // get today's comic from xkcd
    const comic = await fetchXkcd();
    // pull out today's number and use it as the max
    const max = comic.num;
    socket.pageTitle(`Xkcd: ${comic.title}`);
    socket.assign({
      comic,
      max,
    });
  },

  handleParams: async (url, socket) => {
    // num should be between 1 and max
    const { max } = socket.context;
    const num = Number(url.searchParams.get("num"));
    const which = num === NaN ? undefined : num;
    const comic = await fetchXkcd(which, max);
    socket.assign({
      comic,
      num,
    });
  },

  render: (context: { comic: XkcdData; num?: number; max: number }, meta) => {
    const { comic, num, max } = context;
    return html`
      <h1>Xkcd</h1>
      <div>
        <nav>${prev(max, num)} ${next(max, num)} ${random(max)} ${today()}</nav>
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
  },
});

function prev(max: number, num?: number): HtmlSafeString {
  if (num && isValidXkcd(num - 1, max)) {
    return live_patch(html`<button>Previous</button>`, {
      to: { path: "/asyncfetch", params: { num: String(num - 1) } },
    });
  }
  return html``;
}

function next(max: number, num?: number): HtmlSafeString {
  if (num && isValidXkcd(num + 1, max)) {
    return live_patch(html`<button>Next</button>`, {
      to: { path: "/asyncfetch", params: { num: String(num + 1) } },
    });
  }
  return html``;
}

function random(max: number): HtmlSafeString | undefined {
  const num = randomXkcdNum(max);
  return live_patch(html`<button>Random</button>`, {
    to: { path: "/asyncfetch", params: { num: String(num) } },
  });
}

function today(): HtmlSafeString | undefined {
  return live_patch(html`<button>Today</button>`, {
    to: { path: "/asyncfetch" },
  });
}
