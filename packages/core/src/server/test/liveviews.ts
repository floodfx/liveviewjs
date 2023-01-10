import { createLiveView } from "../live";
import { html } from "../templates";

export namespace Test {
  type CounterCtx = {
    count: number;
  };
  export const counterLiveView = createLiveView<CounterCtx>({
    mount: (socket) => {
      socket.assign({ count: 0 });
    },
    render: (ctx) => {
      return html`<div>${ctx.count}</div>`;
    },
  });
}
