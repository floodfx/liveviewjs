import { updatedDiff } from "deep-object-diff";
import { SomeZodObject } from "zod";

// Validation errors for a type T should
// be keyed by the field name
export type LiveViewChangesetErrors<T> = {
  [Property in keyof T]?: string;
};

// Changeset represents the state of a form
// as it is validated and submitted by the user
export interface LiveViewChangeset<T> {
  action?: string; //
  changes: Partial<T>; // diff between initial and updated
  errors?: LiveViewChangesetErrors<T>; // validation errors by field name of T
  data: T | Partial<T>; // merged data
  valid: boolean; // true if no validation errors
}

export type LiveViewChangesetFactory<T> = (
  existing: Partial<T>,
  newAttrs: Partial<T>,
  action?: string
) => LiveViewChangeset<T>;

export const newChangesetFactory = <T>(schema: SomeZodObject): LiveViewChangesetFactory<T> => {
  return (existing: Partial<T>, newAttrs: Partial<T>, action?: string): LiveViewChangeset<T> => {
    const merged = { ...existing, ...newAttrs };
    const result = schema.safeParse(merged);
    let errors;
    if (result.success === false) {
      errors = result.error.issues.reduce((acc, issue) => {
        // @ts-ignore
        acc[issue.path[0]] = issue.message;
        return acc;
      }, {} as LiveViewChangesetErrors<T>);
    }
    return {
      action,
      changes: updatedDiff(existing, merged),
      data: result.success ? result.data : merged,
      valid: result.success,
      errors,
    } as LiveViewChangeset<T>;
  };
};
