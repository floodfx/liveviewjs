import { html, HtmlSafeString, safe } from "../../server/templates";
import { LiveViewMountParams, LiveViewSocket, LiveViewTemplate } from "../../server/component/types";
import { fetchXkcd, isValidXkcd, randomXkcdNum, XkcdData } from "./data";
import { live_patch } from "../../server/templates/helpers/live_patch";
import { SessionData } from "express-session";
import { BaseLiveViewComponent } from "../../server/component/base_component";


interface Context {
  comic: XkcdData
  num?: number
}

//  navigate through Xkcd comics using async/await
export class AsyncFetchLiveViewComponent extends BaseLiveViewComponent<Context, { num: number }> {

  async mount(params: LiveViewMountParams, session: Partial<SessionData>, socket: LiveViewSocket<Context>): Promise<Context> {
    // get today's comic from xkcd
    const comic = await fetchXkcd();
    return {
      comic,
    }
  }

  async handleParams(params: { num: string; }, url: string, socket: LiveViewSocket<Context>): Promise<Context> {
    const n = Number(params.num);
    // num should be between 1 and 2580
    const num = Number(params.num) === NaN ? undefined : Math.max(1, Math.min(2580, Number(params.num)));
    const comic = await fetchXkcd(num);
    return { comic, num };
  }

  render(context: Context): LiveViewTemplate {
    const { comic, num } = context;
    return html`
      <h1>Xkcd</h1>
      <div>
        <nav>
          ${this.prev(num)}
          ${this.next(num)}
          ${this.random()}
          ${this.today()}
        </nav>
      </div>
      <div>
        <h2>${num ? `#${num}` : `Today's (#${comic.num})`}</h2>
        <h3>${comic.title}</h3>
      </div>
      <div>
        <img src="${safe(comic.img)}" alt="${comic.alt}" />
        <pre style="white-space:pre-line;">${comic.transcript}</pre>
      </div>
    `
  }

  private prev(num?: number): HtmlSafeString {
    if (num && isValidXkcd(num - 1)) {
      return live_patch(html`<button>Previous</button>`, {
        to: { path: "/asyncfetch", params: { num: String(num - 1) } }
      })
    }
    return html``;
  }

  private next(num?: number): HtmlSafeString {
    if (num && isValidXkcd(num + 1)) {
      return live_patch(html`<button>Next</button>`, {
        to: { path: "/asyncfetch", params: { num: String(num + 1) } }
      })
    }
    return html``;
  }

  private random(): HtmlSafeString | undefined {
    const num = randomXkcdNum();
    return live_patch(html`<button>Random</button>`, {
      to: { path: "/asyncfetch", params: { num: String(num) } }
    })
  }

  private today(): HtmlSafeString | undefined {
    return live_patch(html`<button>Today</button>`, {
      to: { path: "/asyncfetch" }
    })
  }

}


