import escapeHtml from "../liveview/templates";
import { LiveViewComponent, LiveViewContext, LiveViewExternalEventListener } from "../liveview/types";

export interface LightContext {
  brightness: number;
}

export class POCLiveViewComponent implements
  LiveViewComponent<LightContext>,
  LiveViewExternalEventListener<LightContext, "on">,
  LiveViewExternalEventListener<LightContext, "off"> {

  mount(params: any, session: any, socket: any) {
    return { data: { brightness: 10 } };
  };

  render(context: LiveViewContext<LightContext>) {
    return escapeHtml`
    <script src="/socket.io/socket.io.js"></script>
    <script>
      var socket = io();
      socket.on("connect", () => {
        console.log(socket.id); //
        socket.emit("phx_join", ["4", "4", "lv:phx-FsrMvfqMqliBmgJF", "phx_join", {
          params: {_csrf_token: "OnAPAm1NKwgPCQg4TAUMdnx3WSI6fj8Jm2Zk8yoEVhOgxUSG72hFT7se", _mounts: 0},
          session: "SFMyNTY.g2gDaAJhBXQAAAAIZAACaWRtAAAAFHBoeC1Gc3JNdmZxTXFsaUJtZ0pGZAAMbGl2ZV9zZXNzaW9uaAJkAAdkZWZhdWx0bggAyL-egcCNyhZkAApwYXJlbnRfcGlkZAADbmlsZAAIcm9vdF9waWRkAANuaWxkAAlyb290X3ZpZXdkACJFbGl4aXIuTGl2ZVZpZXdTdHVkaW9XZWIuTGlnaHRMaXZlZAAGcm91dGVyZAAfRWxpeGlyLkxpdmVWaWV3U3R1ZGlvV2ViLlJvdXRlcmQAB3Nlc3Npb250AAAAAGQABHZpZXdkACJFbGl4aXIuTGl2ZVZpZXdTdHVkaW9XZWIuTGlnaHRMaXZlbgYAFjWyY34BYgABUYA.9ZElHc0CEv9Nu5S1JCoidU2S0uDDBqN1IsTcOMFTCrg",
          static: "SFMyNTY.g2gDaAJhBXQAAAADZAAKYXNzaWduX25ld2pkAAVmbGFzaHQAAAAAZAACaWRtAAAAFHBoeC1Gc3JNdmZxTXFsaUJtZ0pGbgYAFjWyY34BYgABUYA.X73SFphVgh0CYME6vGp47u3Q4jKg5Rh6i_UCQEdl0ac",
          url: "http://localhost:4000/light"}
        ]);
      });
      socket.on("phx_reply", function (message) {
          console.log("Reply: ", message);
      });

      function onClick() {
          socket.emit("event", ["4", "64", "lv:phx-FssjlAMwe9RhogDq", "event", {type: "click", event: "on", value: {value: ""}}]);

      }
    </script>
    <h1>Front Porch Light</h1>
    <div id="light">
      <div class="meter">
        <span style="width: ${context.data.brightness} %>%">
          ${context.data.brightness}%
        </span>
      </div>

      <button phx-click="off">
        Off
      </button>

      <button phx-click="down">
        Down
      </button>

      <button phx-click="up">
        Up
      </button>

      <button phx-click="on" onClick="onClick()">
        On
      </button>
    </div>
    `
  };

  handleEvent(event: "on" | "off", params: any, socket: any) {
    let brightness = 0;
    switch (event) {
      case 'off':
        console.log('off');
        brightness = 0;
        break;
      case 'on':
        console.log('on');
        brightness = 100;
        break;
    }
    return { data: { brightness: 10 } };
  }

}