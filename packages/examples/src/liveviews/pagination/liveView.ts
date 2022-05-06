import {
  BaseLiveView,
  html,
  HtmlSafeString,
  join,
  LiveViewMountParams,
  LiveViewSocket,
  live_patch,
  options_for_select,
  SessionData,
} from "liveviewjs";
import { almostExpired, Donation, listItems } from "./data";

interface Options {
  page: number;
  perPage: number;
}

interface Context {
  options: Options;
  donations: Donation[];
}

type Events = { type: "select-per-page"; perPage: string };

export class PaginateLiveView extends BaseLiveView<Context, Events> {
  mount(params: LiveViewMountParams, session: Partial<SessionData>, socket: LiveViewSocket<Context>) {
    const options = { page: 1, perPage: 10 };
    const { page, perPage } = options;
    const donations = listItems(page, perPage);
    socket.assign({
      options,
      donations,
    });
  }

  handleParams(url: URL, socket: LiveViewSocket<Context>) {
    const page = Number(url.searchParams.get("page") || 1);
    const perPage = Number(url.searchParams.get("perPage") || 10);
    const donations = listItems(page, perPage);
    socket.assign({
      options: { page, perPage },
      donations,
    });
  }

  render(context: Context) {
    const {
      options: { perPage, page },
      donations,
    } = context;
    return html`
      <h1>Food Bank Donations</h1>
      <div id="donations">
        <form phx-change="select-per-page">
          Show
          <select name="perPage">
            ${options_for_select(
              [5, 10, 15, 20].map((n) => String(n)),
              String(perPage)
            )}
          </select>
          <label for="perPage">per page</label>
        </form>
        <div class="wrapper">
          <table>
            <thead>
              <tr>
                <th class="item">Item</th>
                <th>Quantity</th>
                <th>Days Until Expires</th>
              </tr>
            </thead>
            <tbody>
              ${this.renderDonations(donations)}
            </tbody>
          </table>
          <div class="footer">
            <div class="pagination">
              ${page > 1 ? this.paginationLink("Previous", page - 1, perPage, "previous") : ""}
              ${this.pageLinks(page, perPage)} ${this.paginationLink("Next", page + 1, perPage, "next")}
            </div>
          </div>
        </div>
      </div>
    `;
  }

  handleEvent(event: Events, socket: LiveViewSocket<Context>) {
    const page = socket.context.options.page;
    const perPage = Number(event.perPage || 10);

    socket.pushPatch("/paginate", new URLSearchParams({ page: String(page), perPage: String(perPage) }));

    socket.assign({
      options: { page, perPage },
      donations: listItems(page, perPage),
    });
  }

  pageLinks(page: number, perPage: number) {
    let links: HtmlSafeString[] = [];
    for (var p = page - 2; p <= page + 2; p++) {
      if (p > 0) {
        links.push(this.paginationLink(String(p), p, perPage, p === page ? "active" : ""));
      }
    }
    return join(links, "");
  }

  paginationLink(text: string, pageNum: number, perPageNum: number, className: string) {
    const page = String(pageNum);
    const perPage = String(perPageNum);
    return live_patch(html`<button>${text}</button>`, {
      to: {
        path: "/paginate",
        params: { page, perPage },
      },
      className,
    });
  }

  renderDonations(donations: Donation[]) {
    return donations.map(
      (donation) => html`
        <tr>
          <td class="item">
            <span class="id">${donation.id}</span>
            ${donation.emoji} ${donation.item}
          </td>
          <td>${donation.quantity} lbs</td>
          <td>
            <span> ${this.expiresDecoration(donation)} </span>
          </td>
        </tr>
      `
    );
  }

  expiresDecoration(donation: Donation) {
    if (almostExpired(donation)) {
      return html`<mark>${donation.days_until_expires}</mark>`;
    } else {
      return donation.days_until_expires;
    }
  }
}
