// deno-lint-ignore-file
import NProgress from "nprogress";
import { Socket } from "phoenix";
import "phoenix_html";
import { LiveSocket, ViewHook } from "phoenix_live_view";

/**
 * Define custom LiveView Hooks that can tap into browser events.
 * See: https://hexdocs.pm/phoenix_live_view/js-interop.html#client-hooks-via-phx-hook
 */
let Hooks = {
  /**
   * This hook can be used by an input element to prevent input other than numbers.
   * e.g. <input type="text" phx-hook="NumberInput" />
   */
  NumberInput: {
    mounted() {
      this.el.addEventListener("input", () => {
        // replace all non-numeric characters with empty string
        this.el.value = this.el.value.replace(/\D/g, "");
      });
    },
  } as ViewHook,
};

const url = "/live";
let csrfToken = document.querySelector("meta[name='csrf-token']")?.getAttribute("content");
let liveSocket = new LiveSocket(url, Socket, { params: { _csrf_token: csrfToken }, hooks: Hooks });

// Show progress bar on live navigation and form submits
window.addEventListener("phx:page-loading-start", (info) => NProgress.start());
window.addEventListener("phx:page-loading-stop", (info) => NProgress.done());

// connect if there are any LiveViews on the page
liveSocket.connect();

// expose liveSocket on window for web console debug logs and latency simulation:
// liveSocket.enableDebug();
// liveSocket.enableLatencySim(1000)(window as any).liveSocket = liveSocket;
(window as any).liveSocket = liveSocket;
