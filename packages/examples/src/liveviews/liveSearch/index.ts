import { createLiveView, html } from "liveviewjs";
import { searchByZip, Store } from "./data";

export const searchLiveView = createLiveView<
  // Define the Context / State of the LiveView
  {
    zip: string;
    stores: Store[];
    loading: boolean;
  },
  // Define the events that can be triggered by the user
  { type: "zip-search"; zip: string },
  // Define internal events that can be triggered by the LiveView
  { type: "run_zip_search"; zip: string }
>({
  // initialState
  mount: (socket) => {
    const zip = "";
    const stores: Store[] = [];
    const loading = false;
    socket.assign({ zip, stores, loading });
  },

  // user events
  handleEvent: (event, socket) => {
    const { zip } = event;

    socket.sendInfo({ type: "run_zip_search", zip });

    socket.assign({ zip, stores: [], loading: true });
  },

  // internal events
  handleInfo: (info, socket) => {
    const { zip } = info;
    const stores = searchByZip(zip);
    socket.assign({
      zip,
      stores,
      loading: false,
    });
  },

  // render the LiveView
  render: (context, meta) => {
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
          <div style="font-size: 10px">(Try "80204" for results)</div>
        </form>

        ${loading ? renderLoading() : ""}

        <div class="stores">
          <ul>
            ${stores.map((store) => renderStore(store))}
          </ul>
        </div>
      </div>
    `;
  },
});

function renderStoreStatus(store: Store) {
  if (store.open) {
    return html`<span class="open">🔓 Open</span>`;
  } else {
    return html`<span class="closed">🔐 Closed</span>`;
  }
}

function renderStore(store: Store) {
  return html` <li>
    <div class="first-line">
      <div class="name">${store.name}</div>
      <div class="status">${renderStoreStatus(store)}</div>
      <div class="second-line">
        <div class="street">📍 ${store.street}</div>
        <div class="phone_number">📞 ${store.phone_number}</div>
      </div>
    </div>
  </li>`;
}

function renderLoading() {
  return html` <div class="loader">Loading...</div> `;
}
