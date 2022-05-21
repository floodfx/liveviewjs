import { Parts } from ".";

// returns a Parts tree that only contains the differences between
// the oldParts tree and the newParts tree
export function deepDiff(oldParts: Parts, newParts: Parts): Parts {
  let diff: Parts = {};

  // ok to use JSON stringify here since Parts is ordered
  if (JSON.stringify(oldParts) === JSON.stringify(newParts)) {
    // same parts so no diff thus return empty diff
    return diff;
  }

  // if lengths of newParts and oldParts are different, then
  // the diff is all the new parts AND the new statics.  The reason is that
  // statics and dynamics part counts are dependent on each other.  if there are N
  // dynamics there are N+1 statics.
  let keyCountsDiffer = false;
  if (Object.keys(oldParts).length !== Object.keys(newParts).length) {
    // // different lengths so diff is all new parts. i.e. new statics and new dynamics
    // diff = structuredClone(newParts);
    // return diff;
    keyCountsDiffer = true;
  }

  // if JSON.strigifys are different then iterate through keys
  // TODO - should we check if key length is different?
  for (let i = 0; i < Object.keys(newParts).length; i++) {
    const key = Object.keys(newParts)[i];

    // the final message to client can also contain keys of 't' and 'e'
    // but these are added after the diff is calculated and represent
    // the title and event parts of the phx reply message.  they will not
    // be present in the Parts tree.

    if (key === "s") {
      // key of 's' should always be a statics array
      const oldStatics = oldParts[key] as Array<string>;
      const newStatics = newParts[key] as Array<string>;
      if (oldStatics.length !== newStatics.length) {
        // if length is different and if so keep new statics
        diff[key] = newStatics;
      } else if (keyCountsDiffer) {
        // if key counts are different for new and old parts keep the new statics
        diff[key] = newStatics;
      } else if (diffArrays(oldStatics, newStatics)) {
        // if length is the same but contents are different then keep new statics
        diff[key] = newStatics;
      }
    } else if (key === "d") {
      // key of 'd' should always be an array of Parts
      if (diffArrays(oldParts[key] as Array<unknown>, newParts[key] as Array<unknown>)) {
        diff[key] = newParts[key];
      }
    } else if (oldParts[key] !== undefined) {
      // if oldParts[key] is present it can only be a string or Parts object
      // check if string and diff it
      if (typeof newParts[key] === "string" && typeof oldParts[key] === "string") {
        if (newParts[key] !== oldParts[key]) {
          diff[key] = newParts[key];
        }
      }
      // if both are numbers they are references to `LiveComponents`
      else if (typeof newParts[key] === "number" && typeof oldParts[key] === "number") {
        if (newParts[key] !== oldParts[key]) {
          diff[key] = newParts[key];
        }
      }
      // since both aren't strings, check if they are Parts objects
      else if (typeof newParts[key] === "object" && typeof oldParts[key] === "object") {
        // check children for diffs
        const oldPart = oldParts[key] as Parts;
        const newPart = newParts[key] as Parts;
        // diff based on object type
        if (typeof newPart === "object" && typeof oldPart === "object") {
          const maybeDiff = deepDiff(oldPart, newPart);
          // keep if any keys are different
          if (Object.keys(maybeDiff).length > 0) {
            diff[key] = maybeDiff;
          }
        }
      }
      // both aren't strings, Parts, or numbers so they must be different
      // types.  in that case, keep the newParts.
      else {
        diff[key] = newParts[key];
      }
    } else {
      // newParts has new key so add that diff
      diff[key] = newParts[key];
    }
  }
  return diff;
}

export function diffArrays(oldArray: unknown[], newArray: unknown[]): boolean {
  if (oldArray.length !== newArray.length) {
    return true;
  }
  for (let i = 0; i < newArray.length; i++) {
    const newPart = newArray[i];
    const oldPart = oldArray[i];
    // parts are both strings
    if (typeof newPart === "string" && typeof oldPart === "string") {
      if (newPart !== oldPart) {
        return true;
      }
    }
    // parts are both objects (potentially arrays or not)
    else if (typeof newPart === "object" && typeof oldPart === "object") {
      // both parts are arrays
      if (Array.isArray(newPart) && Array.isArray(oldPart)) {
        if (diffArrays(oldPart, newPart)) {
          return true;
        }
      }
      // both parts are objects
      else if (!Array.isArray(newPart) && !Array.isArray(oldPart)) {
        const maybeDiff = deepDiff(oldPart as Parts, newPart as Parts);
        // keep if any keys are different
        if (Object.keys(maybeDiff).length > 0) {
          return true;
        }
      }
    }
  }
  return false;
}
