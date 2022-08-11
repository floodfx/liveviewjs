import { escapehtml, join } from "..";
import {
  AnyLiveContext,
  AnyLiveEvent,
  createLiveComponent,
  createLiveView,
  LiveComponent,
  LiveViewMeta,
} from "../live";
import { html, HtmlSafeString, safe } from "./index";

describe("test escapeHtml", () => {
  it("combines statics and dynamics properly", () => {
    const result = html`a${1}b${2}c`;
    expect(result.toString()).toBe("a1b2c");
  });

  it("returns components of the template", () => {
    const result = html`a${1}b${2}c`;
    expect(result.partsTree()).toEqual({
      0: "1",
      1: "2",
      s: ["a", "b", "c"],
    });
  });

  it("returns components of the template with templates", () => {
    const result = html`a${1}b${html`sub${"sub1"}`}c`;
    expect(result.partsTree()).toEqual({
      0: "1",
      1: {
        0: "sub1",
        s: ["sub", ""],
      },
      s: ["a", "b", "c"],
    });
  });

  it("can apply different dynamics to a HtmlSafeString", () => {
    const result = html`before${"middle"}after`;
    expect(result.toString()).toBe("beforemiddleafter");
    expect(new HtmlSafeString(result.statics, ["diffmid"]).toString()).toBe("beforediffmidafter");
  });

  it("Throws error if dynamics is zero and statics not one", () => {
    const result = new HtmlSafeString(["a", "b"], []);
    expect(() => result.partsTree()).toThrow();
  });

  it("works for if/then controls", () => {
    const template = (show: boolean) => html`before${show ? "show" : ""}after`;
    let result = template(true);
    expect(result.toString()).toBe("beforeshowafter");
    result = template(false);
    expect(result.toString()).toBe("beforeafter");
  });

  it("can join array without commas", () => {
    const stuff = ["a", "b", "c"];
    const result = html`${stuff}`;
    expect(result.toString()).toBe("abc");
  });

  it("can join zero length array", () => {
    const empty: string[] = [];
    const result = join(empty);
    expect(result.toString()).toBe("");
  });

  it("escapes unsafe child even if parent is rendered with safe", () => {
    const child = html`${"<foo>"}`;
    const parent = safe(`<span>${child}</span>`);
    expect(parent.toString()).toBe("<span>&lt;foo&gt;</span>");
  });

  it("more join array without commas on multiple levels", () => {
    const result = html`${html`<a>${1}${2}${3}</a>`}`;
    expect(result.toString()).toBe("<a>123</a>");
    expect(result.partsTree()).toEqual({
      0: {
        0: "1",
        1: "2",
        2: "3",
        s: ["<a>", "", "", "</a>"],
      },
      s: ["", ""],
    });
  });

  it("non-interpolated literal should just be a single static", () => {
    const result = html`abc`;
    expect(result.partsTree()).toEqual({
      s: ["abc"],
    });
  });

  it("array of dynamics maps to object with s and d attrs", () => {
    const strings = ["a", "b", "c"];
    const result = html`1${strings.map((x) => html`${x}`)}2`;
    expect(result.partsTree()).toEqual({
      0: {
        s: ["", ""],
        d: [["a"], ["b"], ["c"]],
      },
      s: ["1", "2"],
    });
  });

  it("array of dynamics maps to object with s and d attrs", async () => {
    const strings = ["a", "b", "c"];
    const promises = strings.map((x) => Promise.resolve(html`${x}`));
    const result = html`${await Promise.all(promises)}`;
    expect(result.partsTree()).toEqual({
      0: {
        s: ["", ""],
        d: [["a"], ["b"], ["c"]],
      },
      s: ["", ""],
    });
  });

  it("tree of templates", () => {
    const result = html`3${html`2${html`1${1}1`}${2}2`}${3}3`;
    expect(result.partsTree()).toEqual({
      0: {
        0: {
          0: "1",
          s: ["1", "1"],
        },
        1: "2",
        s: ["2", "", "2"],
      },
      1: "3",
      s: ["3", "", "3"],
    });
  });

  it("render empty stores has the right parts", () => {
    const empty = renderStores("", [], false);
    expect(empty.partsTree()).toEqual({
      "0": "",
      "1": "",
      "2": "",
      "3": "",
      s: [...empty.statics],
    });
  });

  it("render loading stores has the right parts", () => {
    const loading = renderStores("80204", [], true);
    expect(loading.partsTree()).toEqual({
      "0": "80204",
      "1": "readonly",
      "2": renderLoading().statics[0],
      "3": "",
      s: [...loading.statics],
    } as any);
  });

  it("render loaded stores has the right parts", () => {
    const loaded = renderStores("80204", stores.slice(3), false);
    // console.log('partsTree', JSON.stringify(loaded.partsTree(), null, 2));
    expect(loaded.partsTree()).toEqual({
      "0": "80204",
      "1": "",
      "2": "",
      "3": {
        d: [
          [
            stores[3].name,
            renderStoreStatusWithoutEmojis(stores[3]).statics[0],
            stores[3].street,
            stores[3].phone_number,
          ],
          [
            stores[4].name,
            renderStoreStatusWithoutEmojis(stores[4]).statics[0],
            stores[4].street,
            stores[4].phone_number,
          ],
          [
            stores[5].name,
            renderStoreStatusWithoutEmojis(stores[5]).statics[0],
            stores[5].street,
            stores[5].phone_number,
          ],
          [
            stores[6].name,
            renderStoreStatusWithoutEmojis(stores[6]).statics[0],
            stores[6].street,
            stores[6].phone_number,
          ],
        ],
        s: renderStore(stores[3]).statics,
      },
      s: [...loaded.statics],
    });
  });

  it("escapes a script tag in store name", () => {
    const xssStore: Store = {
      name: "<script>alert('xss')</script>",
      open: true,
      street: '123 Main"><span>hello</span> St',
      phone_number: "555-555-5555",
      zip: "80204",
      city: "Denver",
      hours: "9am-9pm",
    };
    const loaded = renderStores("80204", [xssStore], false);
    // console.log('partsTree', JSON.stringify(loaded.partsTree(), null, 2));
    expect(loaded.partsTree()).toEqual({
      "0": "80204",
      "1": "",
      "2": "",
      "3": {
        d: [
          [
            escapehtml(xssStore.name),
            renderStoreStatusWithoutEmojis(xssStore).statics[0],
            escapehtml(xssStore.street),
            xssStore.phone_number,
          ],
        ],
        s: renderStore(xssStore).statics,
      },
      s: [...loaded.statics],
    });
  });

  it("direct live component parts renders", () => {
    const liveComponentResult = new HtmlSafeString(["1"], [], true);

    const liveView = html`<div>${liveComponentResult}</div>`;

    expect(liveView.partsTree()).toEqual({
      0: 1, // LiveComponents result in a single number
      s: ["<div>", "</div>"],
    });
  });

  it("direct live component array renders", async () => {
    const liveComponentArray = [
      Promise.resolve(new HtmlSafeString(["1"], [], true)),
      Promise.resolve(new HtmlSafeString(["2"], [], true)),
    ];

    const liveView = html`<div>${await Promise.all(liveComponentArray)}</div>`;

    expect(liveView.partsTree()).toEqual({
      0: { d: [[1], [2]] },
      s: ["<div>", "</div>"],
    });
  });

  it("live component parts renders", async () => {
    const url = new URL("http://example.com/foo");
    const res = await testLV.render(
      {},
      {
        csrfToken: "",
        live_component: async (
          liveComponent: LiveComponent<AnyLiveContext, AnyLiveEvent>,
          params?: Partial<AnyLiveContext & { id: number }>
        ) => {
          return new HtmlSafeString(["1"], [], true);
        },
        url,
        uploads: {},
      }
    );
    expect(res.partsTree()).toEqual({
      0: 1, // LiveComponents result in a single number
      s: ["", ""],
    });
  });

  it("optimizes single item statics with no dynamics into a string", () => {
    const result = html`a${"b"}`;
    expect(result.partsTree()).toEqual({ 0: "b", s: ["a", ""] });
  });

  it("renders a dynamic promise", async () => {
    const result = html`a${await Promise.resolve(html`b`)}`;
    expect(result.partsTree()).toEqual({ 0: "b", s: ["a", ""] });
  });

  it("renders an array of dynamic promise", async () => {
    const result = html`a${await Promise.all(["b"].map(async (i) => await Promise.resolve(html`${i}`)))}`;
    expect(result.partsTree()).toMatchInlineSnapshot(`
      Object {
        "0": Object {
          "d": Array [
            Array [
              "b",
            ],
          ],
          "s": Array [
            "",
            "",
          ],
        },
        "s": Array [
          "a",
          "",
        ],
      }
    `);
  });
});

const testLC = createLiveComponent({
  render: () => {
    return html`<div>LiveComponent</div>`;
  },
});

const testLV = createLiveView({
  render: async (context: AnyLiveContext, meta: LiveViewMeta) => {
    return html`${await meta.live_component(testLC, { id: 1 })}`;
  },
});

interface Store {
  name: string;
  street: string;
  city: string;
  zip: string;
  hours: string;
  phone_number: string;
  open: boolean;
}

const renderStoreStatusWithoutEmojis = (store: Store) => {
  if (store.open) {
    return html`<span class="open">Open</span>`;
  } else {
    return html`<span class="closed">Closed</span>`;
  }
};

const renderStoreStatusWithEmojis = (store: Store) => {
  if (store.open) {
    return html`<span class="open">${statusEmojis(store)} Open</span>`;
  } else {
    return html`<span class="closed">${statusEmojis(store)} Closed</span>`;
  }
};

const statusEmojis = (store: Store) => {
  if (store.open) {
    return html`🔓`;
  } else {
    return html`🔐`;
  }
};

const renderLoading = () => {
  return html`<div class="loader">Loading...</div>`;
};

const renderStore = (store: Store) => {
  return html` <li>
    <div class="first-line">
      <div class="name">${store.name}</div>
      <div class="status">${renderStoreStatusWithoutEmojis(store)}</div>
      <div class="second-line">
        <div class="street">📍 ${store.street}</div>
        <div class="phone_number">📞 ${store.phone_number}</div>
      </div>
    </div>
  </li>`;
};

const renderStores = (zip: string, stores: Store[], loading: boolean) => {
  return html`
    <h1>Find a Store</h1>
    <div id="search">
      <form phx-submit="zip-search">
        <input
          type="text"
          name="zip"
          value="${zip}"
          placeholder="Zip Code"
          autofocus
          autocomplete="off"
          ${loading ? "readonly" : ""} />

        <button type="submit">🔎</button>
      </form>

      ${loading ? renderLoading() : ""}

      <div class="stores">
        <ul>
          ${stores.map((store) => renderStore(store))}
        </ul>
      </div>
    </div>
  `;
};

const stores: Store[] = [
  {
    name: "Downtown Helena",
    street: "312 Montana Avenue",
    phone_number: "406-555-0100",
    city: "Helena, MT",
    zip: "59602",
    open: true,
    hours: "8am - 10pm M-F",
  },
  {
    name: "East Helena",
    street: "227 Miner's Lane",
    phone_number: "406-555-0120",
    city: "Helena, MT",
    zip: "59602",
    open: false,
    hours: "8am - 10pm M-F",
  },
  {
    name: "Westside Helena",
    street: "734 Lake Loop",
    phone_number: "406-555-0130",
    city: "Helena, MT",
    zip: "59602",
    open: true,
    hours: "8am - 10pm M-F",
  },
  {
    name: "Downtown Denver",
    street: "426 Aspen Loop",
    phone_number: "303-555-0140",
    city: "Denver, CO",
    zip: "80204",
    open: true,
    hours: "8am - 10pm M-F",
  },
  {
    name: "Midtown Denver",
    street: "7 Broncos Parkway",
    phone_number: "720-555-0150",
    city: "Denver, CO",
    zip: "80204",
    open: false,
    hours: "8am - 10pm M-F",
  },
  {
    name: "Denver Stapleton",
    street: "965 Summit Peak",
    phone_number: "303-555-0160",
    city: "Denver, CO",
    zip: "80204",
    open: true,
    hours: "8am - 10pm M-F",
  },
  {
    name: "Denver West",
    street: "501 Mountain Lane",
    phone_number: "720-555-0170",
    city: "Denver, CO",
    zip: "80204",
    open: true,
    hours: "8am - 10pm M-F",
  },
];
