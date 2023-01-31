---
to: src/server/liveview/hello.ts
---
import { createLiveView, html } from "liveviewjs";

/**
 * A simple LiveView that toggles between "Hello" and "👋" when the button is clicked.
 */
export const helloLive = createLiveView({
  mount: (socket, _, params) => {
    socket.assign({ name: params.name || "<%= h.inflection.camelize(name, false) %>", useEmoji: true });
  },
  handleEvent(event, socket) {
    if (event.type === "toggle") {
      socket.assign({ useEmoji: !socket.context.useEmoji });
    }
  },
  render: (context) => {
    const { useEmoji, name } = context;
    const hello = useEmoji ? "👋" : "Hello";
    return html`
      <div class="flex flex-col items-center space-y-10 pt-10">
        <div class="flex flex-col items-center space-y-5">
          <h1 class="text-2xl font-bold">${hello} ${name}</h1>
          <button class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded" phx-click="toggle">
            ${useEmoji ? "Use Text" : "Use Emoji"}
          </button>
        </div>
        <div class="text-center max-w-[200px]">
          More documentation and examples at
          <a class="text-blue-500" href="https://liveviewjs.com" target="_blank" rel="noopener noreferrer"
            >LiveViewJS.com</a
          >
        </div>
      </div>
    `;
  },
});
