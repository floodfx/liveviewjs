import NProgress from "nprogress";
import { Socket } from "phoenix";
import "phoenix_html";
import { LiveSocket } from "phoenix_live_view";

const url = "/live";

let Hooks = {
  /**
   * When applied (via phx-hook="NumberInput"), this hook only allows
   * numbers to be entered into a text input field.
   */
  NumberInput: {
    mounted() {
      this.el.addEventListener("input", (e) => {
        // replace all non-numeric characters with empty string
        this.el.value = this.el.value.replace(/\D/g, "");
      });
    },
  },
};

// @ts-ignore - document will be present in browser
let csrfToken = document.querySelector("meta[name='csrf-token']").getAttribute("content");
let liveSocket = new LiveSocket(url, Socket, { params: { _csrf_token: csrfToken }, hooks: Hooks });

// Show progress bar on live navigation and form submits
window.addEventListener("phx:page-loading-start", (info) => NProgress.start());
window.addEventListener("phx:page-loading-stop", (info) => NProgress.done());

// connect if there are any LiveViews on the page
liveSocket.connect();

// expose liveSocket on window for web console debug logs and latency simulation:
liveSocket.enableDebug();
// >> liveSocket.enableLatencySim(1000)
// @ts-ignore - window will be present in the browser
window.liveSocket = liveSocket;
