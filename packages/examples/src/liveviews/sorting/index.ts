import { createLiveView, html, HtmlSafeString, join, live_patch, options_for_select } from "liveviewjs";
import { almostExpired, Donation, donations, listItems } from "./data";

export interface PaginateOptions {
  page: number;
  perPage: number;
}

export interface SortOptions {
  sortby: keyof Donation;
  sortOrder: "asc" | "desc";
}

export const sortLiveView = createLiveView<
  {
    options: PaginateOptions & SortOptions;
    donations: Donation[];
  },
  { type: "select-per-page"; perPage: string } | { type: "change-sort"; sortby: string; sortOrder: string }
>({
  mount: (socket) => {
    const paginateOptions: PaginateOptions = {
      page: 1,
      perPage: 10,
    };
    const sortOptions: SortOptions = {
      sortby: "item",
      sortOrder: "asc",
    };
    socket.assign({
      options: { ...paginateOptions, ...sortOptions },
      donations: listItems(paginateOptions, sortOptions),
    });
  },
  handleParams: (url, socket) => {
    const page = Number(url.searchParams.get("page") || 1);
    const perPage = Number(url.searchParams.get("perPage") || 10);

    let sortby = (url.searchParams.get("sortby") || "item") as keyof Donation;
    const validSortby = Object.keys(donations[0]).includes(sortby);
    sortby = validSortby ? sortby : "item";
    const sortOrder = url.searchParams.get("sortOrder") === "desc" ? "desc" : "asc";
    socket.assign({
      options: { page, perPage, sortby, sortOrder },
      donations: listItems({ page, perPage }, { sortby, sortOrder }),
    });
  },

  handleEvent: (event, socket) => {
    const { options } = socket.context;
    let { page, perPage, sortby, sortOrder } = options;

    switch (event.type) {
      case "select-per-page":
        perPage = Number(event.perPage || perPage);
        break;
      case "change-sort":
        if (event.sortby === sortby) {
          sortOrder = sortOrder === "asc" ? "desc" : "asc";
        } else {
          sortby = event.sortby as keyof Donation;
          sortOrder = "asc";
        }
        break;
    }

    socket.pushPatch("/sort", new URLSearchParams({ page: String(page), perPage: String(perPage), sortOrder, sortby }));

    socket.assign({
      options: { page, perPage, sortby, sortOrder },
      donations: listItems({ page, perPage }, { sortby, sortOrder }),
    });
  },

  render: (context) => {
    const {
      options: { perPage, page, sortOrder, sortby },
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
                <th class="item" phx-click="change-sort" phx-value-sortby="id">
                  ${sort_emoji(sortby, "id", sortOrder)}Item
                </th>
                <th phx-click="change-sort" phx-value-sortby="quantity">
                  ${sort_emoji(sortby, "quantity", sortOrder)}Quantity
                </th>
                <th phx-click="change-sort" phx-value-sortby="days_until_expires">
                  ${sort_emoji(sortby, "days_until_expires", sortOrder)}Days Until Expires
                </th>
              </tr>
            </thead>
            <tbody>
              ${renderDonations(donations)}
            </tbody>
          </table>
          <div class="footer">
            <div class="pagination">
              ${page > 1 ? paginationLink("Previous", page - 1, perPage, sortby, sortOrder, "previous") : ""}
              ${pageLinks(page, perPage, sortby, sortOrder)}
              ${paginationLink("Next", page + 1, perPage, sortby, sortOrder, "next")}
            </div>
          </div>
        </div>
      </div>
    `;
  },
});

function sort_emoji(sortby: keyof Donation, sortby_value: string, sortOrder: "asc" | "desc") {
  return sortby === sortby_value ? (sortOrder === "asc" ? "👇" : "☝️") : "";
}

function pageLinks(page: number, perPage: number, sortby: keyof Donation, sortOrder: "asc" | "desc") {
  let links: HtmlSafeString[] = [];
  for (var p = page - 2; p <= page + 2; p++) {
    if (p > 0) {
      links.push(paginationLink(String(p), p, perPage, sortby, sortOrder, p === page ? "active" : ""));
    }
  }
  return join(links, "");
}

function paginationLink(
  text: string,
  pageNum: number,
  perPageNum: number,
  sortby: keyof Donation,
  sortOrder: "asc" | "desc",
  className: string
) {
  const page = String(pageNum);
  const perPage = String(perPageNum);
  return live_patch(html`<button>${text}</button>`, {
    to: {
      path: "/sort",
      params: { page, perPage, sortby, sortOrder },
    },
    className,
  });
}

function renderDonations(donations: Donation[]) {
  return donations.map(
    (donation) => html`
      <tr>
        <td class="item">
          <span class="id">${donation.id}</span>
          ${donation.emoji} ${donation.item}
        </td>
        <td>${donation.quantity} lbs</td>
        <td>
          <span> ${expiresDecoration(donation)} </span>
        </td>
      </tr>
    `
  );
}

function expiresDecoration(donation: Donation) {
  if (almostExpired(donation)) {
    return html`<mark>${donation.days_until_expires}</mark>`;
  } else {
    return donation.days_until_expires;
  }
}
