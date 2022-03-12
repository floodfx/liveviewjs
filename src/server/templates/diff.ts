import { Parts } from ".";

// returns a Parts tree that only contains the differences between
// the oldParts tree and the newParts tree
export function deepDiff(oldParts: Parts, newParts: Parts): Parts {
  let diff: Parts = {};

  // ok to use JSON stringify here since Parts is ordered
  if (JSON.stringify(oldParts) === JSON.stringify(newParts)) {
    // same parts so no diff
    return diff;
  }

  // if JSON.strigifys are different then iterate through keys
  for (let i = 0; i < Object.keys(newParts).length; i++) {
    const key = Object.keys(newParts)[i];

    // if key is 's' should always be a statics array
    // if key is 'd' should always be an array of Parts[]
    if (key === "s" || key === "d") {
      if (diffArrays(oldParts[key] as Array<unknown>, newParts[key] as Array<unknown>)) {
        diff[key] = newParts[key];
      }
    }
    // if oldParts[key] is present is can only be a string or Parts object
    else if (oldParts[key]) {
      // check if string and diff it
      if (typeof newParts[key] === "string" && typeof oldParts[key] === "string") {
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
      // both aren't strings or Parts so they must be different
      // types.  in that case, keep the newParts.
      else {
        diff[key] = newParts[key];
      }
    }
    // newParts has new key so add keep that
    else {
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
