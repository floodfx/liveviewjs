
import { join } from '..';
import { html, HtmlSafeString } from './index';

describe("test escapeHtml", () => {
  it("combines statics and dynamics properly", () => {
    const result = html`a${1}b${2}c`;
    expect(result.toString()).toBe('a1b2c');
  });

  it("returns components of the template", () => {
    const result = html`a${1}b${2}c`;
    expect(result.partsTree()).toEqual({
      0: '1',
      1: '2',
      s: ['a', 'b', 'c']
    });
  });

  it("returns components of the template with templates", () => {
    const result = html`a${1}b${html`sub${"sub1"}`}c`;
    expect(result.partsTree()).toEqual({
      0: '1',
      1: {
        0: "sub1",
        s: ['sub', ""]
      },
      s: ['a', 'b', 'c']
    });
  });

  it("can apply different dynamics to a HtmlSafeString", () => {
    const result = html`before${"middle"}after`;
    expect(result.toString()).toBe('beforemiddleafter');
    expect(new HtmlSafeString(result.statics, ["diffmid"]).toString()).toBe('beforediffmidafter');
  });

  it("works for if/then controls", () => {
    const template = (show: boolean) => html`before${show ? "show" : ""}after`;
    let result = template(true);
    expect(result.toString()).toBe('beforeshowafter');
    result = template(false);
    expect(result.toString()).toBe('beforeafter');
  });

  it("can join array without commas", () => {
    const stuff = ["a", "b", "c"];
    const result = html`${stuff}`;
    expect(result.toString()).toBe('abc');
  });

  it("can join zero length array", () => {
    const empty: string[] = [];
    const result = join(empty);
    expect(result.toString()).toBe('');
  });

  it("more join array without commas on multiple levels", () => {
    const result = html`${html`<a>${1}${2}${3}</a>`}`;
    expect(result.toString()).toBe('<a>123</a>');
  });

  it("non-interpolated literal should just be a single static", () => {
    const result = html`abc`;
    expect(result.partsTree()).toEqual({
      s: ["abc"]
    });
  });

  it("render empty stores has the right parts", () => {
    const empty = renderStores("", [], false);
    expect(empty.partsTree()).toEqual({
      '0': '',
      '1': '',
      '2': '',
      '3': '',
      s: [...empty.statics]
    });
  });

  it("render loading stores has the right parts", () => {
    const loading = renderStores("80204", [], true);
    expect(loading.partsTree()).toEqual({
      '0': '80204',
      '1': 'readonly',
      '2': { s: [`${renderLoading().statics}`] },
      '3': '',
      s: [...loading.statics]
    } as any);
  });

  it("render loaded stores has the right parts", () => {
    const loaded = renderStores("80204", stores.slice(3), false);
    console.log('partsTree', JSON.stringify(loaded.partsTree(), null, 2));
    expect(loaded.partsTree()).toEqual({
      '0': '80204',
      '1': '',
      '2': '',
      '3': {
        d: [
          [
            stores[3].name,
            { s: renderStoreStatus(stores[3]).statics },
            stores[3].street,
            stores[3].phone_number
          ],
          [
            stores[4].name,
            { s: renderStoreStatus(stores[4]).statics },
            stores[4].street,
            stores[4].phone_number
          ],
          [
            stores[5].name,
            { s: renderStoreStatus(stores[5]).statics },
            stores[5].street,
            stores[5].phone_number
          ],
          [
            stores[6].name,
            { s: renderStoreStatus(stores[6]).statics },
            stores[6].street,
            stores[6].phone_number
          ],
        ],
        s: renderStore(stores[3]).statics,
      },
      s: [...loaded.statics]
    });
  });


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

const renderStoreStatus = (store: Store) => {
  if (store.open) {
    return html`<span class="open">🔓 Open</span>`;
  } else {
    return html`<span class="closed">🔐 Closed</span>`;
  }
};

const renderLoading = () => {
  return html`<div class="loader">Loading...</div>`;
}

const renderStore = (store: Store) => {
  return html`
  <li>
    <div class="first-line">
      <div class="name">
        ${store.name}
      </div>
      <div class="status">
        ${renderStoreStatus(store)}
      </div>
      <div class="second-line">
        <div class="street">
          📍 ${store.street}
        </div>
        <div class="phone_number">
          📞 ${store.phone_number}
        </div>
      </div>
    </div>
  </li>`
}

const renderStores = (zip: string, stores: Store[], loading: boolean) => {
  return html`
  <h1>Find a Store</h1>
    <div id="search">

      <form phx-submit="zip-search">
        <input type="text" name="zip" value="${zip}"
              placeholder="Zip Code"
              autofocus autocomplete="off"
              ${loading ? "readonly" : ""} />

        <button type="submit">
          🔎
        </button>
      </form>

      ${loading ? renderLoading() : ""}

      <div class="stores">
        <ul>
          ${stores.map(store => renderStore(store))}
        </ul>
      </div>
    </div>
  `
}

const stores: Store[] = [
  {
    name: "Downtown Helena",
    street: "312 Montana Avenue",
    phone_number: "406-555-0100",
    city: "Helena, MT",
    zip: "59602",
    open: true,
    hours: "8am - 10pm M-F"
  },
  {
    name: "East Helena",
    street: "227 Miner's Lane",
    phone_number: "406-555-0120",
    city: "Helena, MT",
    zip: "59602",
    open: false,
    hours: "8am - 10pm M-F"
  },
  {
    name: "Westside Helena",
    street: "734 Lake Loop",
    phone_number: "406-555-0130",
    city: "Helena, MT",
    zip: "59602",
    open: true,
    hours: "8am - 10pm M-F"
  },
  {
    name: "Downtown Denver",
    street: "426 Aspen Loop",
    phone_number: "303-555-0140",
    city: "Denver, CO",
    zip: "80204",
    open: true,
    hours: "8am - 10pm M-F"
  },
  {
    name: "Midtown Denver",
    street: "7 Broncos Parkway",
    phone_number: "720-555-0150",
    city: "Denver, CO",
    zip: "80204",
    open: false,
    hours: "8am - 10pm M-F"
  },
  {
    name: "Denver Stapleton",
    street: "965 Summit Peak",
    phone_number: "303-555-0160",
    city: "Denver, CO",
    zip: "80204",
    open: true,
    hours: "8am - 10pm M-F"
  },
  {
    name: "Denver West",
    street: "501 Mountain Lane",
    phone_number: "720-555-0170",
    city: "Denver, CO",
    zip: "80204",
    open: true,
    hours: "8am - 10pm M-F"
  }
]