import { SessionData } from "express-session";
import { BaseLiveView, html, LiveViewContext, LiveViewExternalEventListener, LiveViewMeta, LiveViewMountParams, LiveViewSocket, LiveViewTemplate } from "liveviewjs";

interface ClickDemoContext extends LiveViewContext{
  count: number;
}

export class ClickDemo extends BaseLiveView<ClickDemoContext, never> implements LiveViewExternalEventListener<ClickDemoContext, "click", never>{

  mount(params: LiveViewMountParams, session: Partial<SessionData>, socket: LiveViewSocket<ClickDemoContext>): void {
    // set initial count to 0
    socket.assign({count: 0});

    // override default page title
    socket.pageTitle("Click Demo");
  }

  handleEvent(event: "click", params: never, socket: LiveViewSocket<ClickDemoContext>): void | Promise<void> {
    // increment count
    socket.assign({count: socket.context.count + 1});
  }

  render(context: ClickDemoContext, meta: LiveViewMeta): LiveViewTemplate | Promise<LiveViewTemplate> {
    return html`
      <div class="max-w-7xl mx-auto py-6">
        <div class="grid grid-col-1 justify-evenly justify-items-center">
          <h2 class="text-2xl font-bold py-4">Click Demo</h2>
          <button phx-click="click" type="button" class="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">Click to Increment</button>
          <div class="py-4"><b>Count:</b> ${context.count}</div>
        </div>
      </div>
    `
  }
}