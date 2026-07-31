---
to: src/server/liveview/<%= h.inflection.camelize(name) %>.ts
---
import { createLiveView, html } from "liveviewjs";

/**
 * <%= name %> is a LiveView that ...
 */
export const <%= name %> = createLiveView({
  render: (context, meta) => {
    return html`
      <div class="flex flex-col items-center mt-4">
        <h2 class="text-2xl"><%= name %></h2>
      </div>
    `;
  },
});
