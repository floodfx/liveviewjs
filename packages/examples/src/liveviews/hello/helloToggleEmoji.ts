import { createLiveView, html } from "liveviewjs";

export const helloToggleEmojiLiveView = createLiveView({
  mount: (socket) => {
    socket.assign({ useEmoji: false });
  },
  handleEvent(event, socket) {
    socket.assign({ useEmoji: !socket.context.useEmoji });
  },
  render: (context) => {
    const msg = context.useEmoji ? "👋 🌎" : "Hello World";
    return html`
      ${msg}
      <br />
      <button phx-click="toggle">Toggle Message</button>
    `;
  },
});
