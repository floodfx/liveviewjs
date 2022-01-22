import escapeHtml from "../../liveview/templates";
import { LiveViewComponent, LiveViewContext, LiveViewExternalEventListener, LiveViewInternalEventListener } from "src/server/liveview/types";
import { PhxSocket } from "../../socket/types";
import { listCities, suggest } from "./data";
import { sendInternalMessage } from "../../socket/websocket_server";
import { WebSocket } from "ws";
import { searchByCity, searchByZip, Store } from "../live-search/data";


export interface AutocompleteContext {
  zip: string;
  city: string;
  stores: Store[];
  matches: string[];
  loading: boolean;
}

const idToWs = new Map<string, WebSocket>();

export class AutocompleteLiveViewComponent implements
  LiveViewComponent<AutocompleteContext>,
  LiveViewExternalEventListener<AutocompleteContext, "zip-search", Pick<AutocompleteContext, "zip">>,
  LiveViewExternalEventListener<AutocompleteContext, "suggest-city", Pick<AutocompleteContext, "city">>,
  LiveViewInternalEventListener<AutocompleteContext, {type: "run_zip_search", zip: string}>,
  LiveViewInternalEventListener<AutocompleteContext, {type: "run_city_search", city: string}>
  {

  mount(params: any, session: any, socket: PhxSocket) {
    if(socket.connected) {
      // TODO handle disconnect
      idToWs.set(socket.id, socket.ws!);
    }
    const zip = "";
    const city = "";
    const stores: Store[] = [];
    const matches: string[] = [];
    const loading = false
    return { data: { zip, city, stores, matches, loading} };
  };

  renderStoreStatus(store: Store) {
    if (store.open) {
      return escapeHtml`<span class="open">🔓 Open</span>`;
    } else {
      return escapeHtml`<span class="closed">🔐 Closed</span>`;
    }
  };

  renderStore(store:Store) {
    return escapeHtml`
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
    return escapeHtml`
      <div class="loader">
        Loading...
      </div>
    `
  }



  render(context: LiveViewContext<AutocompleteContext>) {
    return escapeHtml`
    <h1>Find a Store</h1>
    <div id="search">

      <form phx-submit="zip-search">
        <input type="text" name="zip" value="${context.data.zip}"
              placeholder="Zip Code"
              autofocus autocomplete="off"
              ${ context.data.loading ? "readonly" : ""} />

        <button type="submit">
          📫🔎
        </button>
      </form>

      <form phx-submit="city-search" phx-change="suggest-city">
        <input type="text" name="city" value="${context.data.city}"
              placeholder="City"
              autocomplete="off"
              list="matches"
              phx-debounce="1000"
              ${ context.data.loading ? "readonly" : ""} />

        <button type="submit">
          🏙🔎
        </button>
      </form>

      <datalist id="matches">
        ${context.data.matches.map(match => escapeHtml`<option value="${match}">${match}</option>`)}
      </datalist>

      ${ context.data.loading ? this.renderLoading() : "" }

      <div class="stores">
        <ul>
          ${ context.data.stores.map(store => this.renderStore(store))}
        </ul>
      </div>
    </div>
    `
  };

  handleEvent(event: "zip-search" | "suggest-city", params: {zip: string} | {city: string}, socket: PhxSocket) {
    console.log("event:", event, params, socket);
    if (event === "zip-search") {

        // @ts-ignore TODO better params types for different events
        const { zip } = params;
        // wait a second to send the message
        setTimeout(() => {
          sendInternalMessage(socket, this, {type: "run_zip_search", zip });
        }, 1000);
        return { data: { zip, city: "", stores:[], matches:[], loading: true } };
      }
      else if (event === "suggest-city") {

        // @ts-ignore TODO better params types for different events
        const { city } = params;
        const matches = suggest(city);
        console.log("matches:", matches);
        return { data: { zip: "", city, stores:[], matches, loading: false } };
      }
      else if (event === "city-search") {
        // @ts-ignore TODO better params types for different events
        const { city } = params;
        // wait a second to send the message
        setTimeout(() => {
          sendInternalMessage(socket, this, {type: "run_city_search", city });
        }, 1000);
        return { data: { zip: "", city, stores:[], matches:[], loading: true } };
      }
      else {
        return { data: { zip: "", city: "", stores:[], matches: [], loading: false } };
      }
  }

  // handleEvent(event: "suggest-city", params: {zip: string}, socket: PhxSocket) {
  //   console.log("event:", event, params, socket);
  //   const { zip } = params;
  //   // wait a second to send the message
  //   setTimeout(() => {
  //     sendInternalMessage(socket, this, {type: "run_zip_search", zip });
  //   }, 1000);

  //   return { data: { zip, city: "", stores:[], matches:[], loading: true } };
  // }

  handleInfo(event: {type: "run_zip_search", zip: string} | {type: "run_city_search", city: string}, socket: PhxSocket){
    // lookup websocekt by id
    socket.ws = idToWs.get(socket.id);

    let stores: Store[] = [];
    switch(event.type) {
      case "run_zip_search":
        const { zip } = event;
        stores = searchByZip(zip);
        return {
          data: {
            zip,
            city: "",
            stores,
            matches: [],
            loading: false
          }
        }
      case "run_city_search":
        const { city } = event;
        stores = searchByCity(city);
        return {
          data: {
            zip: "",
            city,
            stores,
            matches: [],
            loading: false
          }
        }
      }
  }

}

function calculateLicenseAmount(seats: number): number {
  if(seats <= 5) {
    return seats * 20;
  } else {
    return 100 + (seats - 5) * 15;
  }
}

