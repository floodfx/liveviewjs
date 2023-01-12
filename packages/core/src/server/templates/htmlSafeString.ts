// Initially copied from https://github.com/Janpot/escape-html-template-tag/blob/master/src/index.ts
// This is a modified version of escape-html-template-tag that builds a tree
// of statics and dynamics that can be used to render the template.
//

const ENTITIES: {
  [key: string]: string;
} = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
  "/": "&#x2F;",
  "`": "&#x60;",
  "=": "&#x3D;",
};

const ENT_REGEX = new RegExp(Object.keys(ENTITIES).join("|"), "g");

export function join(array: (string | HtmlSafeString)[], separator: string | HtmlSafeString = "") {
  if (array.length <= 0) {
    return new HtmlSafeString([""], []);
  }

  return new HtmlSafeString(["", ...Array(array.length - 1).fill(separator), ""], array);
}

export function safe(value: unknown) {
  if (value instanceof HtmlSafeString) {
    return value;
  }
  return new HtmlSafeString([String(value)], []);
}

export function escapehtml(unsafe: unknown): string {
  if (unsafe instanceof HtmlSafeString) {
    return unsafe.toString();
  }
  if (Array.isArray(unsafe)) {
    return join(unsafe, "").toString();
  }
  return String(unsafe).replace(ENT_REGEX, (char) => ENTITIES[char]);
}

// cases
//   1. only statics e.g. html`abc`
//     { s: ['abc'] }
//   2. statics and dynamics e.g. html`ab${1}c` or html`${1}`
//     {'0': '1', s: ['ab', 'c'] } or { 0: '1', s: ['', ''] }
//   3. array of html substring e.g. html`${[1, 2, 3].map(x => html`<a>${x}</a>`)}`
//     { d: [['1'], ['2'], ['3']], s:['<a>''</a>']}
//   4. tree of statics and dymaics e.g. html`${html`${html`${1}${2}${3}`}`}`
// type IndexPart = { [index: string]: string | Parts | number }
// type StaticsPart = { s: readonly string[] }
// type DynamicsPart = { d: (string | Parts)[] }
// type Parts = IndexPart | StaticsPart | DynamicsPart
export type Parts = { [key: string]: unknown };

/**
 * HtmlSafeString is what a `LiveView` returns from its `render` function.
 * It is based on "tagged template literals" and is what allows LiveViewJS
 * to minimize the amount of data sent to the client.
 */
export class HtmlSafeString {
  readonly statics: readonly string[];
  readonly dynamics: readonly unknown[];
  readonly isLiveComponent: boolean = false;
  // readonly children: readonly HtmlSafeString[]

  constructor(statics: readonly string[], dynamics: readonly unknown[], isLiveComponent: boolean = false) {
    this.statics = statics;
    this.dynamics = dynamics;
    this.isLiveComponent = isLiveComponent;
  }

  partsTree(includeStatics: boolean = true): Parts {
    // statics.length should always equal dynamics.length + 1
    if (this.dynamics.length === 0) {
      if (this.statics.length !== 1) {
        throw new Error("Expected exactly one static string for HtmlSafeString" + this);
      }
      // TODO Optimization to just return the single static string?
      // if only statics, return just the statics
      // in fact, only statics / no dymaincs means we
      // can simplify this node and just return the only
      // static string since there can only be one static
      // return this.statics[0];
      return {
        s: this.statics,
      };
    }

    // otherwise walk the dynamics and build the parts tree
    const parts = this.dynamics.reduce((acc: Parts, cur: unknown, index: number) => {
      if (cur instanceof HtmlSafeString) {
        // handle isLiveComponent case
        if (cur.isLiveComponent) {
          // for live components, we only send back a number which
          // is the index of the component in the `c` key
          // the `c` key is added to the parts tree by the
          // ComponentManager when it renders the `LiveView`
          return {
            ...acc,
            [`${index}`]: Number(cur.statics[0]),
          };
        } else {
          // this isn't a live component, so we need to contine walking
          // the parts tree for this HtmlSafeString including to the children

          // check if parts only has a single static string
          // and if so make that the parts string instead of using
          // the full parts tree
          if (cur.statics.length === 1) {
            return {
              ...acc,
              [`${index}`]: cur.statics[0],
            };
          }
          // if not just a single static then we need to include the
          // full parts tree
          else {
            return {
              ...acc,
              [`${index}`]: cur.partsTree(), // recurse to children
            };
          }
        }
      } else if (Array.isArray(cur)) {
        // if array is empty just return empty string
        if (cur.length === 0) {
          return {
            ...acc,
            [`${index}`]: "",
          };
        }
        // Not an empty array
        else {
          // elements of Array are either: HtmlSafeString or Promise<HtmlSafeString>
          let d: unknown[][] | Promise<unknown[]>[];
          let s: readonly string[] | Promise<readonly string[]>;
          // istanbul ignore next
          if (cur[0] instanceof Promise) {
            // istanbul ignore next
            throw new Error(
              "Promise not supported in HtmlSafeString, try using Promise.all to wait for all promises to resolve."
            );
          } else if (cur[0] instanceof HtmlSafeString) {
            // if any of the children are live components, then we assume they all are
            // and do not return the statics for this array
            let isLiveComponentArray = false;
            d = cur.map((c: HtmlSafeString) => {
              if (c.isLiveComponent) {
                isLiveComponentArray = true;
                return [Number(c.statics[0])];
              } else {
                return Object.values(c.partsTree(false));
              }
            });
            if (isLiveComponentArray) {
              return {
                ...acc,
                [`${index}`]: { d },
              };
            }
            // not an array of LiveComponents so return the statics too
            s = cur.map((c: HtmlSafeString) => c.statics)[0];
            return {
              ...acc,
              [`${index}`]: { d, s },
            };
          } else {
            // probably added an array of objects directly
            // e.g. to the dynamic e.g. ${myArray}
            // so just render the object as a string
            s = cur.map((c: unknown) => String(c));
            return {
              ...acc,
              [`${index}`]: s.join(""),
            };
          }
        }
      } else {
        // cur is a literal string or number
        return {
          ...acc,
          [`${index}`]: escapehtml(String(cur)),
        };
      }
    }, {} as Parts);

    // appends the statics to the parts tree
    if (includeStatics) {
      parts["s"] = this.statics;
    }
    return parts;
  }

  toString(): string {
    return this.statics.reduce((result, s, i) => {
      const d = this.dynamics[i - 1];
      return result + escapehtml(d) + s;
    });
  }
}

export function html(statics: TemplateStringsArray, ...dynamics: unknown[]) {
  return new HtmlSafeString(statics, dynamics);
}
