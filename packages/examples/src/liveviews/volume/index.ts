import { createLiveView, html } from "liveviewjs";

/**
 * Simulates a UI to control the volume using buttons and keyboard input.
 */
export const volumeLiveView = createLiveView<
  // Define LiveView Context / State
  { volume: number },
  // Define LiveView External Events
  // button events
  | { type: "on" }
  | { type: "off" }
  | { type: "up" }
  | { type: "down" }
  // key events
  | { type: "key_update"; key: string }
>({
  mount: (socket) => {
    socket.pageTitle("🎧 Volume Control");
    socket.assign({ volume: 10 });
  },
  handleEvent: async (event, socket) => {
    const { volume } = socket.context;

    let key: string = event.type;
    // if event was a key event, use the key name as the event
    if (event.type === "key_update") {
      key = event.key;
    }
    let newVolume = volume;
    switch (key) {
      case "off":
      case "ArrowLeft":
        newVolume = 0;
        break;
      case "on":
      case "ArrowRight":
        newVolume = 100;
        break;
      case "up":
      case "ArrowUp":
        newVolume = Math.min(volume + 10, 100);
        break;
      case "down":
      case "ArrowDown":
        newVolume = Math.max(volume - 10, 0);
        break;
    }
    if (newVolume === 100) {
      await socket.putFlash("info", "Cranked full volume! 🤘");
    } else if (newVolume === 0) {
      await socket.putFlash("error", "Silence! 🤫");
    }
    socket.assign({ volume: newVolume });
  },
  render: (context) => {
    const { volume } = context;
    return html`
      <div id="light">
        <h1>🎧 Volume Control</h1>
        <div>
          <div>${volume}%</div>
          <progress
            id="volume_control"
            style="width: 300px; height: 2em; opacity: ${volume / 100}"
            value="${volume}"
            max="100"></progress>
        </div>

        <button phx-click="off" phx-window-keydown="key_update" phx-key="ArrowLeft">⬅️ Silence</button>

        <button phx-click="down" phx-window-keydown="key_update" phx-key="ArrowDown">⬇️ Turn Down</button>

        <button phx-click="up" phx-window-keydown="key_update" phx-key="ArrowUp">⬆️ Turn Up</button>

        <button phx-click="on" phx-window-keydown="key_update" phx-key="ArrowRight">➡️ Cranked</button>

        <div>
          <h5>Try using the keys too!</h5>
        </div>
      </div>
    `;
  },
});
