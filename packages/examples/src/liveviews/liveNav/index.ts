import { createLiveView, html } from "liveviewjs";

/**
 * Example showing how to use server-side live navigation.
 */
export const liveNavLV = createLiveView<
  { id?: string }, // Define LiveView Context / State
  { type: "patch"; id: string } | { type: "redirect"; path: string } // Define LiveView Events
>({
  handleParams: (url, socket) => {
    console.log("handleParams", url);
    if (url.searchParams.has("id")) {
      socket.assign({ id: url.searchParams.get("id")! });
    }
  },
  handleEvent: (event, socket) => {
    switch (event.type) {
      case "patch":
        socket.assign({ id: event.id });
        socket.pushPatch(socket.url.pathname, new URLSearchParams({ id: event.id }));
        break;
      case "redirect":
        // extract first part of path (e.g. /liveNav)
        const path = socket.url.pathname.split("/")[1];
        socket.pushRedirect("/" + path + event.path);
        break;
    }
  },
  render: async (context) => {
    // render the view based on the state
    const { id } = context;
    return html`
      <div>
        <h1>Query String ID: ${id}</h1>
        <button phx-click="patch" phx-value-id="foo">Live Patch Search Param (to ?id=foo)</button>
        <button phx-click="redirect" phx-value-path="/bar">Live Redirect (to /bar)</button>
      </div>
    `;
  },
});
