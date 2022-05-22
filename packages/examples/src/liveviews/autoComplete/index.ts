import { BaseLiveView, createLiveView, html, LiveViewMountParams, LiveViewSocket, SessionData } from "liveviewjs";
import { searchByCity, searchByZip, Store } from "../liveSearch/data";
import { suggest } from "./data";

interface Context {
  zip: string;
  city: string;
  stores: Store[];
  matches: string[];
  loading: boolean;
}

type Events =
  | { type: "zip-search"; zip: string }
  | { type: "city-search"; city: string }
  | { type: "suggest-city"; city: string };

type Infos = { type: "run_zip_search"; zip: string } | { type: "run_city_search"; city: string };

export const autocompleteLiveView = createLiveView<Context, Events, Infos>({
  mount: (socket) => {
    const zip = "";
    const city = "";
    const stores: Store[] = [];
    const matches: string[] = [];
    const loading = false;
    socket.assign({ zip, city, stores, matches, loading });
  },
  handleEvent: (event, socket) => {
    let city: string;
    switch (event.type) {
      case "zip-search":
        const { zip } = event;
        socket.sendInfo({ type: "run_zip_search", zip });
        socket.assign({ zip, loading: true, stores: [], matches: [] });
        break;
      case "city-search":
        city = event.city;
        socket.sendInfo({ type: "run_city_search", city });
        socket.assign({ city, loading: true, matches: [], stores: [] });
        break;
      case "suggest-city":
        city = event.city;
        const matches = suggest(city);
        socket.assign({ city, loading: false, matches });
        break;
    }
  },
  handleInfo: (info, socket) => {
    const { type } = info;
    let stores: Store[] = [];
    switch (type) {
      case "run_zip_search":
        const { zip } = info;
        stores = searchByZip(zip);
        socket.assign({
          zip,
          stores,
          loading: false,
        });
        break;
      case "run_city_search":
        const { city } = info;
        stores = searchByCity(city);
        socket.assign({
          city,
          stores,
          loading: false,
        });
    }
  },
  render: (context, meta) => {
    return html`
      <h1>Find a Store</h1>
      <div id="search">
        <form phx-submit="zip-search">
          <input
            type="text"
            name="zip"
            value="${context.zip}"
            placeholder="Zip Code"
            autofocus
            autocomplete="off"
            ${context.loading ? "readonly" : ""} />

          <button type="submit">📫🔎</button>
        </form>

        <form phx-submit="city-search" phx-change="suggest-city">
          <input
            type="text"
            name="city"
            value="${context.city}"
            placeholder="City"
            autocomplete="off"
            list="matches"
            phx-debounce="1000"
            ${context.loading ? "readonly" : ""} />

          <button type="submit">🏙🔎</button>
        </form>

        <datalist id="matches">
          ${context.matches.map((match) => html`<option value="${match}">${match}</option>`)}
        </datalist>

        ${context.loading ? renderLoading() : ""}

        <div class="stores">
          <ul>
            ${context.stores.map((store) => renderStore(store))}
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

function calculateLicenseAmount(seats: number): number {
  if (seats <= 5) {
    return seats * 20;
  } else {
    return 100 + (seats - 5) * 15;
  }
}
