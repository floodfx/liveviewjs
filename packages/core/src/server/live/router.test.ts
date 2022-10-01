import { html } from "../templates";
import { createLiveView } from "./liveView";
import { LiveViewRouter, matchRoute } from "./router";

describe("test matchRoute", () => {
  const router: LiveViewRouter = {
    "/foo": createLiveView({ render: () => html`` }),
    "/bar/:name": createLiveView({ render: () => html`` }),
    "/blah/:id": createLiveView({ render: () => html`` }),
    "/zee/(\\d+)": createLiveView({ render: () => html`` }),
  };
  it("test plain route", () => {
    let m = matchRoute(router, "/foo");
    expect(m).toBeDefined();
    let [lv, mr] = m!;
    expect(lv).toBeDefined();
    expect(mr).toBeDefined();
    expect(Object.keys(mr!.params).length).toEqual(0);
  });

  it("test param route", () => {
    let m = matchRoute(router, "/bar/bob");
    expect(m).toBeDefined();
    let [lv, mr] = m!;
    expect(lv).toBeDefined();
    expect(mr).toBeDefined();
    expect(mr!.params.name).toBe("bob");
  });

  it("test decode route", () => {
    let m = matchRoute(router, "/blah/caf%C3%A9");
    expect(m).toBeDefined();
    let [lv, mr] = m!;
    expect(lv).toBeDefined();
    expect(mr).toBeDefined();
    expect(mr!.params.id).toBe("café");
  });

  it("test indexed route", () => {
    let m = matchRoute(router, "/zee/123");
    expect(m).toBeDefined();
    let [lv, mr] = m!;
    expect(lv).toBeDefined();
    expect(mr).toBeDefined();
    expect(mr!.params[0]).toBe("123");
  });

  it("test no match", () => {
    let m = matchRoute(router, "/baz");
    expect(m).toBeUndefined();
  });
});
