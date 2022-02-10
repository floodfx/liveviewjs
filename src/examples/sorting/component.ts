import { options_for_select } from "../../server/templates/helpers/options_for_select";
import { live_patch } from "../../server/templates/helpers/live_patch";
import { html, HtmlSafeString, join } from "../../server/templates";
import { LiveViewExternalEventListener, LiveViewMountParams, LiveViewSocket, StringPropertyValues } from "../../server/component/types";
import { almostExpired, Donation, listItems, donations } from "./data";
import { SessionData } from "express-session";
import { BaseLiveViewComponent } from "../../server/component/base_component";

export interface PaginateOptions {
  page: number;
  perPage: number;
}

export interface SortOptions {
  sort_by: keyof Donation;
  sortOrder: "asc" | "desc";
}

export interface SortContext {
  options: PaginateOptions & SortOptions;
  donations: Donation[]
}

export class SortLiveViewComponent extends BaseLiveViewComponent<SortContext, PaginateOptions & SortOptions> implements
  LiveViewExternalEventListener<SortContext, "select-per-page", Pick<PaginateOptions & SortOptions, "perPage">>,
  LiveViewExternalEventListener<SortContext, "change-sort", Pick<PaginateOptions & SortOptions, "sort_by" | "sortOrder">> {

  mount(params: LiveViewMountParams, session: Partial<SessionData>, socket: LiveViewSocket<SortContext>) {
    const paginateOptions: PaginateOptions = {
      page: 1,
      perPage: 10,
    }
    const sortOptions: SortOptions = {
      sort_by: "item",
      sortOrder: "asc"
    }
    return {
      options: { ...paginateOptions, ...sortOptions },
      donations: listItems(paginateOptions, sortOptions)
    };
  };

  handleParams(params: StringPropertyValues<PaginateOptions & SortOptions>, url: string, socket: LiveViewSocket<SortContext>): SortContext {
    const page = Number(params.page || 1);
    const perPage = Number(params.perPage || 10);
    const validSortBy = Object.keys(donations[0]).includes(params.sort_by)
    const sort_by = validSortBy ? params.sort_by as keyof Donation : "item";
    const sortOrder = params.sortOrder === "desc" ? "desc" : "asc";
    return {
      options: { page, perPage, sort_by, sortOrder },
      donations: listItems({ page, perPage }, { sort_by, sortOrder })
    };
  }

  render(context: SortContext) {
    const { options: { perPage, page, sortOrder, sort_by }, donations } = context;
    return html`
    <h1>Food Bank Donations</h1>
    <div id="donations">
      <form phx-change="select-per-page">
        Show
        <select name="perPage">
          ${options_for_select([5, 10, 15, 20].map(n => String(n)), String(perPage))}
        </select>
        <label for="perPage">per page</label>
      </form>
      <div class="wrapper">
        <table>
          <thead>
            <tr>
              <th class="item" phx-click="change-sort" phx-value-sort_by="id">
              ${this.sort_emoji(sort_by, "id", sortOrder)}Item
              </th>
              <th phx-click="change-sort" phx-value-sort_by="quantity">
              ${this.sort_emoji(sort_by, "quantity", sortOrder)}Quantity
              </th>
              <th phx-click="change-sort" phx-value-sort_by="days_until_expires">
              ${this.sort_emoji(sort_by, "days_until_expires", sortOrder)}Days Until Expires
              </th>
            </tr>
          </thead>
          <tbody>
            ${this.renderDonations(donations)}
          </tbody>
        </table>
        <div class="footer">
          <div class="pagination">
            ${page > 1 ? this.paginationLink("Previous", page - 1, perPage, sort_by, sortOrder, "previous") : ""}

            ${this.pageLinks(page, perPage, sort_by, sortOrder,)}

            ${this.paginationLink("Next", page + 1, perPage, sort_by, sortOrder, "next")}
          </div>
        </div>
      </div>
    </div>
    `
  };

  handleEvent(event: "select-per-page" | "change-sort", params: StringPropertyValues<Pick<PaginateOptions & SortOptions, "perPage" | "sort_by" | "sortOrder">>, socket: LiveViewSocket<SortContext>): SortContext {
    const page = socket.context.options.page;
    let perPage = socket.context.options.perPage;
    let sort_by = socket.context.options.sort_by;
    let sortOrder = socket.context.options.sortOrder;

    if (event === "select-per-page") {
      perPage = Number(params.perPage || socket.context.options.perPage);
    }

    if (event === "change-sort") {
      const incoming_sort_by = params.sort_by as keyof Donation;
      // if already sorted by this column, reverse the order
      if (sort_by === incoming_sort_by) {
        sortOrder = sortOrder === "asc" ? "desc" : "asc";
      } else {
        sort_by = incoming_sort_by;
      }
    }


    this.pushPatch(socket, { to: { path: "/sort", params: { page: String(page), perPage: String(perPage), sortOrder, sort_by } } });

    return {
      options: { page, perPage, sort_by, sortOrder },
      donations: listItems({ page, perPage }, { sort_by, sortOrder })
    };
  }

  sort_emoji(sort_by: keyof Donation, sort_by_value: string, sortOrder: "asc" | "desc") {
    return sort_by === sort_by_value ? sortOrder === "asc" ? "👇" : "☝️" : ""
  }

  pageLinks(page: number, perPage: number, sort_by: keyof Donation, sortOrder: "asc" | "desc") {
    let links: HtmlSafeString[] = [];
    for (var p = page - 2; p <= page + 2; p++) {
      if (p > 0) {
        links.push(this.paginationLink(String(p), p, perPage, sort_by, sortOrder, p === page ? "active" : ""))
      }
    }
    return join(links, "")
  }

  paginationLink(text: string, pageNum: number, perPageNum: number, sort_by: keyof Donation, sortOrder: "asc" | "desc", className: string) {
    const page = String(pageNum);
    const perPage = String(perPageNum);
    return live_patch(html`<button>${text}</button>`, {
      to: {
        path: "/sort",
        params: { page, perPage, sort_by, sortOrder }
      },
      className
    })
  }

  renderDonations(donations: Donation[]) {
    return donations.map(donation => html`
      <tr>
        <td class="item">
          <span class="id">${donation.id}</span>
          ${donation.emoji} ${donation.item}
        </td>
        <td>
        ${donation.quantity} lbs
        </td>
        <td>
          <span>
          ${this.expiresDecoration(donation)}
          </span>
        </td>
      </tr>
    `)
  }

  expiresDecoration(donation: Donation) {
    if (almostExpired(donation)) {
      return html`<mark>${donation.days_until_expires}</mark>`
    } else {
      return donation.days_until_expires
    }
  }

}

