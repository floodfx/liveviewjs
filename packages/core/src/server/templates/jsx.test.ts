import { describe, test, expect } from "bun:test";
import { jsx, jsxs } from "./jsx";
import { deepDiff } from "./diff";

describe("JSX Template Rendering & Tree Optimization Unit Suite", () => {
  test("1. Basic JSX element renders with statics and dynamics in partsTree", () => {
    const count = 42;
    // Equivalent to <div id="card"><h1>Count: {count}</h1></div>
    const tmpl = jsx("div", { id: "card" }, "Count: ", count);

    const tree = tmpl.partsTree();
    expect(tree["r"]).toBe(1); // Single root element optimization #7!
    expect(tmpl.toString()).toContain("42");
  });

  test("2. JSX converts camelCase attributes (phxClick, phxValue) to kebab-case (phx-click, phx-value)", () => {
    // Equivalent to <button phxClick="inc" phxValueId="123">+ Increment</button>
    const tmpl = jsx("button", { phxClick: "inc", phxValueId: "123" }, "+ Increment");

    const htmlStr = tmpl.toString();
    expect(htmlStr).toContain('phx-click="inc"');
    expect(htmlStr).toContain('phx-value-id="123"');
  });

  test("3. Component functions render seamlessly in JSX tree", () => {
    function Badge(props: { label: string; count: number }) {
      return jsx("span", { class: "badge" }, props.label, ": ", props.count);
    }

    // Equivalent to <div class="container"><Badge label="Items" count={5} /></div>
    const tmpl = jsx("div", { class: "container" }, jsx(Badge, { label: "Items", count: 5 }));

    const htmlStr = tmpl.toString();
    expect(htmlStr).toContain('<span class="badge">Items: 5</span>');
  });

  test("4. Differential deepDiff calculation between JSX renders", () => {
    const renderCount = (c: number) => jsx("div", { class: "counter" }, "Count: ", c);

    const oldTree = renderCount(10).partsTree();
    const newTree = renderCount(11).partsTree();

    const diff = deepDiff(oldTree, newTree);
    expect(diff["s"]).toBeUndefined(); // Statics omitted in diff!
    expect(diff["0"]).toBe("11"); // Only dynamic slot 0 updated!
  });
});
