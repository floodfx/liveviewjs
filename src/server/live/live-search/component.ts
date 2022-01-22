import escapeHtml from "../../liveview/templates";
import { LiveViewComponent, LiveViewContext, LiveViewExternalEventListener, LiveViewInternalEventListener } from "src/server/liveview/types";
import { PhxSocket } from "../../socket/types";
import { listStores, searchByZip, Store } from "./data";
import { sendInternalMessage } from "../../socket/websocket_server";
import { WebSocket } from "ws";


export interface SearchContext {
  zip: string;
  stores: Store[];
  loading: boolean;
}

const idToWs = new Map<string, WebSocket>();

export class SearchLiveViewComponent implements
  LiveViewComponent<SearchContext>,
  LiveViewExternalEventListener<SearchContext, "zip-search", Pick<SearchContext, "zip">>,
  LiveViewInternalEventListener<SearchContext, {type: "run_zip_search", zip: string}>
  {

  mount(params: any, session: any, socket: PhxSocket) {
    if(socket.connected) {
      // TODO handle disconnect
      idToWs.set(socket.id, socket.ws!);
    }
    const zip = "";
    const stores: Store[] = [];
    const loading = false
    return { data: { zip, stores, loading} };
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

  render(context: LiveViewContext<SearchContext>) {
    return escapeHtml`
    <h1>Find a Store</h1>
    <div id="search">

      <form phx-submit="zip-search">
        <input type="text" name="zip" value="${context.data.zip}"
              placeholder="Zip Code"
              autofocus autocomplete="off"
              ${ context.data.loading ? "readonly" : ""} />

        <button type="submit">
          🔎
        </button>
      </form>

      ${ context.data.loading ? this.renderLoading() : "" }

      <div class="stores">
        <ul>
          ${ context.data.stores.map(store => this.renderStore(store))}
        </ul>
      </div>
    </div>
    `
  };

  handleEvent(event: "zip-search", params: {zip: string}, socket: PhxSocket) {
    console.log("event:", event, params, socket);
    const { zip } = params;
    // wait a second to send the message
    setTimeout(() => {
      sendInternalMessage(socket, this, {type: "run_zip_search", zip });
    }, 1000);

    return { data: { zip, stores:[], loading: true } };
  }

  handleInfo(event: {type: "run_zip_search", zip: string}, socket: PhxSocket){
    // lookup websocekt by id
    socket.ws = idToWs.get(socket.id);
    // console.log("run_zip_search:", event, socket);
    const { zip } = event;
    const stores = searchByZip(zip);
    return {
      data: {
        zip,
        stores,
        loading: false
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

