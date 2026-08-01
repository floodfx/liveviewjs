import { describe, test, expect } from "bun:test";
import { html, safe, HtmlSafeString } from "./htmlSafeString";
import { deepDiff } from "./diff";

/**
 * Phoenix LiveView 1.0 JSON Diff Fixture Suite
 * 
 * Tests exact wire protocol payload compatibility matching Phoenix 1.0 JSON diff structure.
 */
describe("Phoenix LiveView 1.0 JSON Diff Fixture Suite", () => {
  describe("1. Basic Statics & Dynamics (s & d)", () => {
    test("single static literal with no dynamics", () => {
      const result = html`<h1>Static Title</h1>`;
      expect(result.partsTree()).toEqual({
        s: ["<h1>Static Title</h1>"],
      });
      expect(result.toString()).toBe("<h1>Static Title</h1>");
    });

    test("single string dynamic substitution", () => {
      const name = "World";
      const result = html`<h1>Hello ${name}!</h1>`;
      expect(result.partsTree()).toEqual({
        0: "World",
        r: 1,
        s: ["<h1>Hello ", "!</h1>"],
      });
      expect(result.toString()).toBe("<h1>Hello World!</h1>");
    });

    test("multiple dynamics with mixed primitive types (numbers, booleans)", () => {
      const count = 42;
      const active = true;
      const price = 19.99;
      const result = html`<div>Count: ${count}, Active: ${active}, Price: $${price}</div>`;
      expect(result.partsTree()).toEqual({
        0: "42",
        1: "true",
        2: "19.99",
        r: 1,
        s: ["<div>Count: ", ", Active: ", ", Price: $", "</div>"],
      });
      expect(result.toString()).toBe("<div>Count: 42, Active: true, Price: $19.99</div>");
    });

    test("escapes XSS script tags and special HTML characters in dynamic slots", () => {
      const xss = "<script>alert('xss')</script>";
      const quotes = '123 "Main" & \'Street\'';
      const result = html`<div>${xss} - ${quotes}</div>`;
      expect(result.partsTree()).toEqual({
        0: "&lt;script&gt;alert(&#39;xss&#39;)&lt;&#x2F;script&gt;",
        1: "123 &quot;Main&quot; &amp; &#39;Street&#39;",
        r: 1,
        s: ["<div>", " - ", "</div>"],
      });
      expect(result.toString()).toBe(
        "<div>&lt;script&gt;alert(&#39;xss&#39;)&lt;&#x2F;script&gt; - 123 &quot;Main&quot; &amp; &#39;Street&#39;</div>"
      );
    });

    test("safe() helper bypasses HTML escaping for trusted HTML", () => {
      const trusted = safe("<span>Trusted HTML</span>");
      const result = html`<div>${trusted}</div>`;
      expect(result.toString()).toBe("<div><span>Trusted HTML</span></div>");
    });

    test("multi-byte UTF-8 string dynamics and emojis with slash escaping", () => {
      const emoji = "👋 🌎";
      const unicode = "日本語 / 🚀";
      const result = html`<p>${emoji} - ${unicode}</p>`;
      expect(result.partsTree()).toEqual({
        0: "👋 🌎",
        1: "日本語 &#x2F; 🚀",
        r: 1,
        s: ["<p>", " - ", "</p>"],
      });
      expect(result.toString()).toBe("<p>👋 🌎 - 日本語 &#x2F; 🚀</p>");
    });
  });

  describe("2. Nested Templates (HtmlSafeString in Dynamic Slots)", () => {
    test("single nested child HtmlSafeString", () => {
      const child = html`<span>Nested ${"Child"}</span>`;
      const parent = html`<div>${child}</div>`;
      expect(parent.partsTree()).toEqual({
        0: {
          0: "Child",
          r: 1,
          s: ["<span>Nested ", "</span>"],
        },
        r: 1,
        s: ["<div>", "</div>"],
      });
      expect(parent.toString()).toBe("<div><span>Nested Child</span></div>");
    });

    test("3-level deep nested template trees", () => {
      const level3 = html`<i>Level3:${3}</i>`;
      const level2 = html`<b>Level2:${2} -> ${level3}</b>`;
      const level1 = html`<div>Level1:${1} -> ${level2}</div>`;

      expect(level1.partsTree()).toEqual({
        0: "1",
        1: {
          0: "2",
          1: {
            0: "3",
            r: 1,
            s: ["<i>Level3:", "</i>"],
          },
          r: 1,
          s: ["<b>Level2:", " -> ", "</b>"],
        },
        r: 1,
        s: ["<div>Level1:", " -> ", "</div>"],
      });
      expect(level1.toString()).toBe("<div>Level1:1 -> <b>Level2:2 -> <i>Level3:3</i></b></div>");
    });

    test("escapes unsafe child inside nested template even if parent uses safe()", () => {
      const unsafeChild = html`<span>${"<script>xss</script>"}</span>`;
      const parent = safe(`<div>${unsafeChild}</div>`);
      expect(parent.toString()).toBe("<div><span>&lt;script&gt;xss&lt;&#x2F;script&gt;</span></div>");
    });
  });

  describe("3. Array Dynamics & List Collections (d key)", () => {
    test("array of dynamic templates produces d array format", () => {
      const items = ["Apple", "Banana", "Cherry"];
      const list = html`<ul>${items.map((item) => html`<li>${item}</li>`)}</ul>`;
      expect(list.partsTree()).toEqual({
        0: {
          d: [["Apple"], ["Banana"], ["Cherry"]],
          r: 1,
          s: ["<li>", "</li>"],
        },
        r: 1,
        s: ["<ul>", "</ul>"],
      });
      expect(list.toString()).toBe("<ul><li>Apple</li><li>Banana</li><li>Cherry</li></ul>");
    });

    test("empty list mapping produces empty string placeholder", () => {
      const empty: string[] = [];
      const list = html`<ul>${empty.map((item) => html`<li>${item}</li>`)}</ul>`;
      expect(list.partsTree()).toEqual({
        0: "",
        r: 1,
        s: ["<ul>", "</ul>"],
      });
      expect(list.toString()).toBe("<ul></ul>");
    });

    test("list mapping with items containing special HTML character escaping", () => {
      const unsafeItems = ["<foo>", 'bar"baz', "a & b"];
      const list = html`<ul>${unsafeItems.map((item) => html`<li>${item}</li>`)}</ul>`;
      expect(list.partsTree()).toEqual({
        0: {
          d: [
            ["&lt;foo&gt;"],
            ["bar&quot;baz"],
            ["a &amp; b"],
          ],
          r: 1,
          s: ["<li>", "</li>"],
        },
        r: 1,
        s: ["<ul>", "</ul>"],
      });
      expect(list.toString()).toBe(
        "<ul><li>&lt;foo&gt;</li><li>bar&quot;baz</li><li>a &amp; b</li></ul>"
      );
    });
  });

  describe("4. LiveComponent Dictionary Trees (c key & Component References)", () => {
    test("direct LiveComponent result produces component numeric ID in partsTree", () => {
      const liveComponentResult = new HtmlSafeString(["1"], [], true);
      const liveView = html`<div>${liveComponentResult}</div>`;
      expect(liveView.partsTree()).toEqual({
        0: 1,
        r: 1,
        s: ["<div>", "</div>"],
      });
    });

    test("array of LiveComponents produces array of component numeric IDs under d key", () => {
      const lc1 = new HtmlSafeString(["1"], [], true);
      const lc2 = new HtmlSafeString(["2"], [], true);
      const liveView = html`<div>${[lc1, lc2]}</div>`;

      expect(liveView.partsTree()).toEqual({
        0: {
          d: [[1], [2]],
        },
        r: 1,
        s: ["<div>", "</div>"],
      });
    });
  });

  describe("5. Differential Updates (deepDiff Calculation)", () => {
    test("Dashbit timeline reorder example: reversing tweets sends only updated d array indices", () => {
      const initialTweets = ["Tweet 1", "Tweet 2", "Tweet 3"];
      const renderTimeline = (tweets: string[]) =>
        html`<div id="timeline">${tweets.map((t) => html`<div class="tweet">${t}</div>`)}</div>`;

      const treeV1 = renderTimeline(initialTweets).partsTree();
      const treeV2 = renderTimeline(["Tweet 3", "Tweet 2", "Tweet 1"]).partsTree();

      const diff = deepDiff(treeV1, treeV2);

      expect(diff).toEqual({
        0: {
          d: [["Tweet 3"], ["Tweet 2"], ["Tweet 1"]],
        },
      });
    });

    test("returns empty diff when state is unchanged", () => {
      const render = (val: string) => html`<span>${val}</span>`;
      const tree1 = render("hello").partsTree();
      const tree2 = render("hello").partsTree();

      const diff = deepDiff(tree1, tree2);
      expect(diff).toEqual({});
    });

    test("returns only changed dynamic keys and omits statics (s key)", () => {
      const render = (name: string, age: number) =>
        html`<div>Name: ${name}, Age: ${age}</div>`;
      const tree1 = render("Alice", 30).partsTree();
      const tree2 = render("Alice", 31).partsTree();

      const diff = deepDiff(tree1, tree2);
      expect(diff).toEqual({
        1: "31",
      });
    });

    test("returns full tree if statics count or structure changes", () => {
      const tree1 = html`<div>${"a"}</div>`.partsTree();
      const tree2 = html`<div>${"a"} - ${"b"}</div>`.partsTree();

      const diff = deepDiff(tree1, tree2);
      expect(diff).toEqual({
        0: "a",
        1: "b",
        r: 1,
        s: ["<div>", " - ", "</div>"],
      });
    });
  });
});
