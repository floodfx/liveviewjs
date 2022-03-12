import { Chart, registerables } from "chart.js";
import NProgress from "nprogress";
import { Socket } from "phoenix";
import "phoenix_html";
import { LiveSocket } from "phoenix_live_view";
Chart.register(...registerables)// make sure to register all charts

let Hooks = {
  NumberInput: {
    mounted() {
      this.el.addEventListener("input", (e) => {
        // replace all non-numeric characters with empty string
        this.el.value = this.el.value.replace(/\D/g, "");
      });
    },
  },
  Chart: {
    mounted() {
      // TODO prob need to handle diff for multiple charts per page
      const initData = document.getElementById(`${this.el.id}-init-data`).innerText
      const data = JSON.parse(initData);

      this.chart = new Chart(this.el.id, {
        type: 'pie',
        data,
      });

      // listen for "updateChart" events from server
      this.handleEvent("updateChart", data => {
        // update data
        this.chart.data.datasets[0].data = data;
        this.chart.update();
      })
    }
  },
};

const url = "/live"

let csrfToken = document.querySelector("meta[name='csrf-token']").getAttribute("content")
let liveSocket = new LiveSocket(url, Socket, { params: { _csrf_token: csrfToken }, hooks: Hooks })

// Show progress bar on live navigation and form submits
window.addEventListener("phx:page-loading-start", info => NProgress.start())
window.addEventListener("phx:page-loading-stop", info => NProgress.done())

// connect if there are any LiveViews on the page
liveSocket.connect()

// expose liveSocket on window for web console debug logs and latency simulation:
// >> liveSocket.enableDebug()
// >> liveSocket.enableLatencySim(1000)
// @ts-ignore
window.liveSocket = liveSocket