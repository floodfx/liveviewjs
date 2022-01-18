import { Dynamics, RenderedNode } from "../../server/socket/types";


export const renderedToHtml = (rendered: RenderedNode): string => {
  // if key is a "s" it is a static
  // else if key is a number it is a dynamic
  //   if value is a string it is a dynamic
  //   else if value is an object it is a rendered node

  const dynamics: string[] = [];
  let statics: readonly string[] = [];
  Object.keys(rendered).forEach(key => {
    if (key === "s") {
      // collect statics
      statics = rendered[key];
    } else {
      // key is for a dynamic
      if (typeof rendered[key as any] === "string") { // "as any" because key is typed as number
        dynamics.push(rendered[key as any] as string);
      }
      else if (typeof rendered[key as any] === "object") {
        // recursively render the child rendered node
        dynamics.push(renderedToHtml(rendered[key as any] as any));
      } else {
        console.error("Unknown type", typeof rendered[key as any], "for key", key);
      }
    }
  })

  // zip up the dynamics and statics
  let html = statics[0];
  for (let i = 1; i < statics.length; i++) {
    html += dynamics[i - 1] + statics[i];
  }
  return html;
}

export const updateRenderedWithDiff = (rendered: RenderedNode, diff: Dynamics): RenderedNode => {
  const newRendered = { ...rendered };

  // if key is a "s" it is a static
  // else if key is a number it is a dynamic
  //   if value is a string it is a dynamic
  //   else if value is an object it is a rendered node
  let statics: readonly string[] = [];
  Object.keys(rendered).forEach(key => {
    if (key === "s") {
      // ignore statics
    } else {
      // key is for a dynamic
      if (typeof rendered[key as any] === "string") { // "as any" because key is typed as number
        if (diff.hasOwnProperty(key)) {
          // update newRendered with the diff
          newRendered[key as any] = diff[key as any] as string;
        }
      }
      else if (typeof rendered[key as any] === "object" && diff.hasOwnProperty(key)) {
        // recursively update the child rendered node
        newRendered[key as any] = updateRenderedWithDiff(rendered[key as any] as RenderedNode, diff[key as any] as Dynamics);
      } else {
        console.error("Unknown type", typeof rendered[key as any], "for key", key);
      }
    }
  })

  return newRendered
}