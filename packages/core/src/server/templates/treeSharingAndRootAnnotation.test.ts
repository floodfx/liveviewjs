import { describe, test, expect } from "bun:test";
import { html, HtmlSafeString } from "./htmlSafeString";

/**
 * Dashbit Optimization #6 & #7 TDD Test Suite
 * 
 * Optimization #6: LiveComponent Tree-Sharing ("s": CID / "s": -CID)
 * Optimization #7: Subtree Change-Tracking ("r": 1 Root Annotations)
 */
describe("Dashbit Optimization #6 & #7 - Tree-Sharing & Root Annotations", () => {
  test("1. Subtree with single root HTML element receives 'r': 1 annotation", () => {
    const tmpl = html`<div class="card"><h1>Header</h1><p>${"Dynamic Content"}</p></div>`;
    const tree = tmpl.partsTree();

    // Single root <div> element should have "r": 1 annotation
    expect(tree["r"]).toBe(1);
    expect(tree["0"]).toBe("Dynamic Content");
    expect(tree["s"]).toEqual(["<div class=\"card\"><h1>Header</h1><p>", "</p></div>"]);
  });

  test("2. Multiple LiveComponents sharing statics reuse CID reference in 's' key ('s': 1)", () => {
    // Component 1 and Component 2 have identical template statics
    const comp1Parts = html`<div class="card">${"Item 1"}</div>`.partsTree();
    const comp2Parts = html`<div class="card">${"Item 2"}</div>`.partsTree();

    const componentsDict: Record<string, any> = {
      "1": comp1Parts,
      "2": comp2Parts,
    };

    // Helper to deduplicate LiveComponent statics across component dictionary
    const deduplicated = deduplicateComponentStatics(componentsDict);

    expect(deduplicated["1"]["s"]).toEqual(["<div class=\"card\">", "</div>"]);
    expect(deduplicated["2"]["s"]).toBe(1); // Reuses CID 1's statics!
  });
});

/**
 * Deduplicates LiveComponent statics across component dictionary trees (Optimization #6)
 */
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
          s: refCid, // Positive CID reference for duplicate component in same payload
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
