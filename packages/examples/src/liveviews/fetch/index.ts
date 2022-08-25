import { createLiveView, html, HtmlSafeString, live_patch, safe } from "liveviewjs";
import { fetchXkcd, isValidXkcd, randomXkcdNum, XkcdData } from "./data";

/**
 * Example that loads a today's comic from xkcd.com and allows paginating and loading
 * random comics from the same site.
 */
export const xkcdLiveView = createLiveView({
  // initialize the context
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

  // handle url data and update the context accordingly
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

  // update the LiveView based on the context
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

// helper to create a button to go to the previous comic using `live_patch`
function prev(max: number, num?: number): HtmlSafeString {
  if (num && isValidXkcd(num - 1, max)) {
    return live_patch(html`<button>Previous</button>`, {
      to: { path: "/asyncfetch", params: { num: String(num - 1) } },
    });
  }
  return html``;
}

// helper to create a button to go to the next comic using `live_patch`
function next(max: number, num?: number): HtmlSafeString {
  if (num && isValidXkcd(num + 1, max)) {
    return live_patch(html`<button>Next</button>`, {
      to: { path: "/asyncfetch", params: { num: String(num + 1) } },
    });
  }
  return html``;
}

// helper to create a button to go to a randoms comic using `live_patch`
function random(max: number): HtmlSafeString | undefined {
  const num = randomXkcdNum(max);
  return live_patch(html`<button>Random</button>`, {
    to: { path: "/asyncfetch", params: { num: String(num) } },
  });
}

// helper to create a button to go to today's comic using `live_patch`
function today(): HtmlSafeString | undefined {
  return live_patch(html`<button>Today</button>`, {
    to: { path: "/asyncfetch" },
  });
}
