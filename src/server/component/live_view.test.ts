import { BaseLiveComponent, LiveViewTemplate } from ".";
import { html } from "..";
import { LiveComponentContext, LiveComponentMeta } from "./live_component";
import { WsLiveViewMeta } from "./live_view";

describe("test LiveViewMeta", () => {

  it("test meta", async() => {
    const meta = new WsLiveViewMeta("id", "csrf")
    expect(meta.csrfToken).toEqual("csrf")
    const view = await meta.live_component(new TestLiveComponent(), {id: 1, foo: "bar"})
    expect(view.toString()).toEqual("<div>bar</div>");
  });

})

interface TestLCContext extends LiveComponentContext {
  foo: string
}

class TestLiveComponent extends BaseLiveComponent<TestLCContext> {

  render(ctx: TestLCContext, meta: LiveComponentMeta): LiveViewTemplate {

    return html`<div>${ctx.foo}</div>`;
  }

}


