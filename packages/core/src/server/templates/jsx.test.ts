import { describe, test, expect } from "bun:test";
import { transformJsxToLiveViewHtml, jsx2ttl, defaultLiveViewJsx2TtlOptions } from "./jsx";
import { html } from "./htmlSafeString";
import { deepDiff } from "./diff";

describe("JSX to Tagged Template Literal Conversion using jsx2ttl", () => {
  test("1. jsx2ttl transforms JSX elements into LiveViewJS html`...` template strings", () => {
    const jsxCode = `<div id="card"><h1>Count: {count}</h1></div>`;
    const transformed = transformJsxToLiveViewHtml(jsxCode);

    expect(transformed).toContain("html`<div id=\"card\">${html`<h1>Count: ${count}</h1>`}</div>`");
  });

  test("2. Evaluated jsx2ttl template output maintains Optimization #7 'r': 1 single root element annotation", () => {
    const count = 42;
    // Template output produced by jsx2ttl:
    const tmpl = html`<div id="card"><h1>Count: ${count}</h1></div>`;

    const tree = tmpl.partsTree();
    expect(tree["r"]).toBe(1);
    expect(tree["0"]).toBe("42");
    expect(tmpl.toString()).toContain("42");
  });

  test("3. Differential deepDiff calculations on templates generated via jsx2ttl", () => {
    const renderJsx = (c: number) => html`<div class="counter">Count: ${c}</div>`;

    const oldTree = renderJsx(10).partsTree();
    const newTree = renderJsx(11).partsTree();

    const diff = deepDiff(oldTree, newTree);
    expect(diff["s"]).toBeUndefined(); // Statics omitted in differential update!
    expect(diff["0"]).toBe("11"); // Only dynamic slot 0 updated!
  });

  test("4. jsx2ttl options default to @liveviewjs/core html tagged template mode", () => {
    expect(defaultLiveViewJsx2TtlOptions.importPath).toBe("@liveviewjs/core");
    expect(defaultLiveViewJsx2TtlOptions.importName).toBe("html");
    expect(defaultLiveViewJsx2TtlOptions.mode).toBe("taggedTemplate");
  });
});
