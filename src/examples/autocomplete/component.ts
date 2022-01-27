import html from "../../server/templates";
import { BaseLiveViewComponent, LiveViewExternalEventListener, LiveViewInternalEventListener, LiveViewSocket } from "../../server/types";
import { WebSocket } from "ws";
import { searchByCity, searchByZip, Store } from "../live-search/data";
import { suggest } from "./data";

export interface AutocompleteContext {
  zip: string;
  city: string;
  stores: Store[];
  matches: string[];
  loading: boolean;
}

export class AutocompleteLiveViewComponent extends BaseLiveViewComponent<AutocompleteContext, unknown> implements
  LiveViewExternalEventListener<AutocompleteContext, "zip-search", Pick<AutocompleteContext, "zip">>,
  LiveViewExternalEventListener<AutocompleteContext, "suggest-city", Pick<AutocompleteContext, "city">>,
  LiveViewInternalEventListener<AutocompleteContext, { type: "run_zip_search", zip: string }>,
  LiveViewInternalEventListener<AutocompleteContext, { type: "run_city_search", city: string }>
{

  mount(params: any, session: any, socket: LiveViewSocket<AutocompleteContext>) {
    const zip = "";
    const city = "";
    const stores: Store[] = [];
    const matches: string[] = [];
    const loading = false
    return { zip, city, stores, matches, loading };
  };

  renderStoreStatus(store: Store) {
    if (store.open) {
      return html`<span class="open">🔓 Open</span>`;
    } else {
      return html`<span class="closed">🔐 Closed</span>`;
    }
  };

  renderStore(store: Store) {
    return html`
    <li>
      <div class="first-line">
        <div class="name">
          ${store.name}
        </div>
        <div class="status">
          ${this.renderStoreStatus(store)}
        </div>
        <div class="second-line">
          <div class="street">
            📍 ${store.street}
          </div>
          <div class="phone_number">
            📞 ${store.phone_number}
          </div>
        </div>
      </div>
    </li>`
  }

  renderLoading() {
    return html`
      <div class="loader">
        Loading...
      </div>
    `
  }



  render(context: AutocompleteContext) {
    return html`
    <h1>Find a Store</h1>
    <div id="search">

      <form phx-submit="zip-search">
        <input type="text" name="zip" value="${context.zip}"
              placeholder="Zip Code"
              autofocus autocomplete="off"
              ${context.loading ? "readonly" : ""} />

        <button type="submit">
          📫🔎
        </button>
      </form>

      <form phx-submit="city-search" phx-change="suggest-city">
        <input type="text" name="city" value="${context.city}"
              placeholder="City"
              autocomplete="off"
              list="matches"
              phx-debounce="1000"
              ${context.loading ? "readonly" : ""} />

        <button type="submit">
          🏙🔎
        </button>
      </form>

      <datalist id="matches">
        ${context.matches.map(match => html`<option value="${match}">${match}</option>`)}
      </datalist>

      ${context.loading ? this.renderLoading() : ""}

      <div class="stores">
        <ul>
          ${context.stores.map(store => this.renderStore(store))}
        </ul>
      </div>
    </div>
    `
  };

  handleEvent(event: "zip-search" | "suggest-city", params: { zip: string } | { city: string }, socket: LiveViewSocket<AutocompleteContext>) {
    // console.log("event:", event, params, socket);
    if (event === "zip-search") {

      // @ts-ignore TODO better params types for different events
      const { zip } = params;
      // wait a second to send the message
      setTimeout(() => {
        socket.sendInternal({ type: "run_zip_search", zip });
      }, 1000);
      return { zip, city: "", stores: [], matches: [], loading: true };
    }
    else if (event === "suggest-city") {

      // @ts-ignore TODO better params types for different events
      const { city } = params;
      const matches = suggest(city);
      console.log("matches:", matches);
      return { zip: "", city, stores: [], matches, loading: false };
    }
    else if (event === "city-search") {
      // @ts-ignore TODO better params types for different events
      const { city } = params;
      // wait a second to send the message
      setTimeout(() => {
        socket.sendInternal({ type: "run_city_search", city });
      }, 1000);
      return { zip: "", city, stores: [], matches: [], loading: true };
    }
    else {
      return { zip: "", city: "", stores: [], matches: [], loading: false };
    }
  }

  handleInfo(event: { type: "run_zip_search", zip: string } | { type: "run_city_search", city: string }, socket: LiveViewSocket<AutocompleteContext>) {

    let stores: Store[] = [];
    switch (event.type) {
      case "run_zip_search":
        const { zip } = event;
        stores = searchByZip(zip);
        return {
          zip,
          city: "",
          stores,
          matches: [],
          loading: false
        }
      case "run_city_search":
        const { city } = event;
        stores = searchByCity(city);
        return {
          zip: "",
          city,
          stores,
          matches: [],
          loading: false
        }

    }
  }

}

function calculateLicenseAmount(seats: number): number {
  if (seats <= 5) {
    return seats * 20;
  } else {
    return 100 + (seats - 5) * 15;
  }
}

