import { BaseLiveView, html, LiveViewMeta, LiveViewMountParams, LiveViewSocket, SessionData } from "liveviewjs";
import { searchByZip, Store } from "./data";

interface Context {
  zip: string;
  stores: Store[];
  loading: boolean;
}

type Events = { type: "zip-search"; zip: string };

type Infos = { type: "run_zip_search"; zip: string };

export class SearchLiveView extends BaseLiveView<Context, Events, Infos> {
  mount(params: LiveViewMountParams, session: Partial<SessionData>, socket: LiveViewSocket<Context>) {
    const zip = "";
    const stores: Store[] = [];
    const loading = false;
    socket.assign({ zip, stores, loading });
  }

  renderStoreStatus(store: Store) {
    if (store.open) {
      return html`<span class="open">🔓 Open</span>`;
    } else {
      return html`<span class="closed">🔐 Closed</span>`;
    }
  }

  renderStore(store: Store) {
    return html` <li>
      <div class="first-line">
        <div class="name">${store.name}</div>
        <div class="status">${this.renderStoreStatus(store)}</div>
        <div class="second-line">
          <div class="street">📍 ${store.street}</div>
          <div class="phone_number">📞 ${store.phone_number}</div>
        </div>
      </div>
    </li>`;
  }

  renderLoading() {
    return html` <div class="loader">Loading...</div> `;
  }

  render(context: Context, meta: LiveViewMeta) {
    const { zip, stores, loading } = context;
    return html`
      <h1>Find a Store</h1>
      <div id="search">
        <form phx-submit="zip-search">
          <input type="hidden" name="_csrf_token" value="${meta.csrfToken}" />
          <input
            type="text"
            name="zip"
            value="${zip}"
            placeholder="Zip Code"
            autofocus
            autocomplete="off"
            ${loading ? "readonly" : ""} />

          <button type="submit">🔎</button>
        </form>

        ${loading ? this.renderLoading() : ""}

        <div class="stores">
          <ul>
            ${stores.map((store) => this.renderStore(store))}
          </ul>
        </div>
      </div>
    `;
  }

  handleEvent(event: Events, socket: LiveViewSocket<Context>) {
    const { zip } = event;

    socket.sendInfo({ type: "run_zip_search", zip });

    socket.assign({ zip, stores: [], loading: true });
  }

  handleInfo(info: Infos, socket: LiveViewSocket<Context>) {
    const { zip } = info;
    const stores = searchByZip(zip);
    socket.assign({
      zip,
      stores,
      loading: false,
    });
  }
}
