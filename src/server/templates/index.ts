// Initially copied from https://github.com/Janpot/escape-html-template-tag/blob/master/src/index.ts
// This is a modified version of escape-html-template-tag that builds a tree
// of statics and dynamics that can be used to render the template.
//

const ENTITIES: {
  [key: string]: string
} = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
  '/': '&#x2F;',
  '`': '&#x60;',
  '=': '&#x3D;'
}

const inspect = Symbol.for('nodejs.util.inspect.custom');

const ENT_REGEX = new RegExp(Object.keys(ENTITIES).join('|'), 'g')

export function join(array: (string | HtmlSafeString)[], separator: string | HtmlSafeString = "") {
  if (array.length <= 0) {
    return new HtmlSafeString([''], [])
  }

  return new HtmlSafeString(['', ...Array(array.length - 1).fill(separator), ''], array)
}

export function safe(value: unknown) {
  return new HtmlSafeString([String(value)], [])
}

export function escapehtml(unsafe: unknown): string {
  if (unsafe instanceof HtmlSafeString) {
    return unsafe.toString()
  }
  if (Array.isArray(unsafe)) {
    return join(unsafe, '').toString()
  }
  return String(unsafe).replace(ENT_REGEX, (char) => ENTITIES[char])
}

export class HtmlSafeString {
  readonly statics: readonly string[]
  readonly _dynamics: readonly unknown[]
  readonly children: readonly HtmlSafeString[]

  constructor(statics: readonly string[], dynamics: readonly unknown[]) {
    this.statics = statics
    this._dynamics = dynamics
  }

  partsTree(includeStatics: boolean = true): { [key: string]: unknown } {
    // if only statics, return just the statics
    if (this._dynamics.length === 0) {
      return {
        s: this.statics
      }
    }
    // else walk the dynamics and build the parts tree
    const parts = this._dynamics.reduce((acc: { [key: string]: unknown }, cur: unknown, index: number) => {
      if (cur instanceof HtmlSafeString) {
        return {
          ...acc,
          [`${index}`]: cur.partsTree() // recurse to children
        }
      } else if (Array.isArray(cur)) {
        // if array is empty just return empty string
        if (cur.length === 0) {
          return {
            ...acc,
            [`${index}`]: ""
          }
        }
        else {
          // collect all the dynamic partsTrees
          const d = cur.map(c => Object.values(c.partsTree(false)))
          // we know the statics are the same for all the children
          // so we can just take the first one
          const s = cur.map(c => c.statics)[0]
          return {
            ...acc,
            [`${index}`]: { d, s }
          }
        }
      } else {
        // cur is a literal string or number
        return {
          ...acc,
          [`${index}`]: escapehtml(String(cur))
        }
      }
    }, {} as { [key: string]: unknown })
    // appends the statics to the parts tree
    if (includeStatics) {
      parts["s"] = this.statics;
    }
    return parts
  }

  toString(): string {
    return this.statics.reduce((result, s, i) => {
      const d = this._dynamics[i - 1]
      return result + escapehtml(d) + s
    })
  }

}

export function html(statics: TemplateStringsArray, ...dynamics: unknown[]) {
  return new HtmlSafeString(statics, dynamics)
}