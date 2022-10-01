import { createLiveView, html } from "liveviewjs";

export const helloNameLiveView = createLiveView({
  mount: (socket, _, params) => {
    socket.assign({ name: params.name ?? "World" });
  },
  render: (context) => {
    const { name } = context;
    return html`👋 ${name}! `;
  },
});
