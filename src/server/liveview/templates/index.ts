// COPIED from https://github.com/Janpot/escape-html-template-tag/blob/master/src/index.ts
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

export function join(array: (string | HtmlSafeString)[], separator: string | HtmlSafeString) {
  if (separator === undefined || separator === null) {
    separator = ','
  }
  if (array.length <= 0) {
    return new HtmlSafeString([''], [])
  }
  return new HtmlSafeString(['', ...Array(array.length - 1).fill(separator), ''], array)
}

export function safe(value: unknown) {
  return new HtmlSafeString([String(value)], [])
}

function escapehtml(unsafe: unknown): string {
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
  readonly dynamics: readonly unknown[]
  readonly children: readonly HtmlSafeString[]

  constructor(statics: readonly string[], dynamics: readonly unknown[]) {
    this.statics = statics
    this.dynamics = dynamics
  }

  toString(): string {
    return this.statics.reduce((result, s, i) => {
      const d = this.dynamics[i - 1]
      return result + escapehtml(d) + s
    })
  }

  [inspect]() {
    return `HtmlSafeString '${this.toString()}'`
  }
}

export default function escapeHtml(statics: TemplateStringsArray, ...dynamics: unknown[]) {
  return new HtmlSafeString(statics, dynamics)
}

export const templateTag = (strings: TemplateStringsArray, ...keys: unknown[]) => {
  return ((...values: unknown[]) => {
    let dict: any = values[values.length - 1] || {};
    let result = [strings[0]];
    keys.forEach((key: any, i) => {
      let value = Number.isInteger(key) ? values[key] : dict[key];
      result.push(value, strings[i + 1]);
    });
    return result.join('');
  });
}