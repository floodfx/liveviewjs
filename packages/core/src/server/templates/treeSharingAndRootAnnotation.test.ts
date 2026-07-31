import { describe, test, expect } from "bun:test";
import { html } from "./htmlSafeString";

/**
 * Dashbit Optimization #6 & #7 Corner Case Test Suite
 *
 * Optimization #6: LiveComponent Tree-Sharing ("s": CID / "s": -CID)
 * Optimization #7: Subtree Change-Tracking ("r": 1 Root Annotations)
 * Reference: https://dashbit.co/blog/latency-rendering-liveview
 */
describe("Dashbit Optimization #6 & #7 - Corner Cases & Edge Coverage", () => {
  test("1. Template with multiple root elements does NOT receive 'r': 1 annotation", () => {
    const tmpl = html`<div>Root 1</div><div>Root 2</div>`;
    const tree = tmpl.partsTree();

    // Multiple root tags -> no single root element -> "r" should be undefined
    expect(tree["r"]).toBeUndefined();
    expect(tree["s"]).toEqual(["<div>Root 1</div><div>Root 2</div>"]);
  });

  test("2. Template with whitespace/newlines around single root tag receives 'r': 1 annotation", () => {
    const tmpl = html`
      
      <section class="container">
        <h1>Title: ${"Hello"}</h1>
      </section>
      
    `;
    const tree = tmpl.partsTree();

    expect(tree["r"]).toBe(1);
    expect(tree["0"]).toBe("Hello");
  });

  test("3. Partial LiveComponent statics deduplication (2 matching components, 1 unique component)", () => {
    const comp1Parts = html`<div class="card">${"Item 1"}</div>`.partsTree();
    const comp2Parts = html`<div class="card">${"Item 2"}</div>`.partsTree();
    const comp3Parts = html`<span class="badge">${"Badge 1"}</span>`.partsTree();

    const componentsDict: Record<string, any> = {
      "1": comp1Parts,
      "2": comp2Parts,
      "3": comp3Parts,
    };

    const deduplicated = deduplicateComponentStatics(componentsDict);

    expect(deduplicated["1"]["s"]).toEqual(["<div class=\"card\">", "</div>"]);
    expect(deduplicated["2"]["s"]).toBe(1); // Reuses CID 1
    expect(deduplicated["3"]["s"]).toEqual(["<span class=\"badge\">", "</span>"]); // Unique statics preserved!
  });
});

export function deduplicateComponentStatics(components: Record<string, any>): Record<string, any> {
  const fingerprintMap = new Map<string, number>();
  const result: Record<string, any> = {};

  for (const [cidStr, tree] of Object.entries(components)) {
    const cid = Number(cidStr);
    if (tree && Array.isArray(tree.s)) {
      const fingerprint = JSON.stringify(tree.s);
      if (fingerprintMap.has(fingerprint)) {
        const refCid = fingerprintMap.get(fingerprint)!;
        result[cidStr] = {
          ...tree,
          s: refCid,
        };
      } else {
        fingerprintMap.set(fingerprint, cid);
        result[cidStr] = tree;
      }
    } else {
      result[cidStr] = tree;
    }
  }

  return result;
}
