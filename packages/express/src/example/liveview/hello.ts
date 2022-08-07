import { createLiveView, html } from "liveviewjs";

export const helloLiveView = createLiveView({
  render: () => {
    return html`<div>Hello World</div>`;
  },
});
