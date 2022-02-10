import { updatedDiff } from "deep-object-diff";
import { SomeZodObject } from "zod";
import { LiveViewChangeset, LiveViewChangesetErrors } from ".";

export type LiveViewChangesetFactory<T> = (existing: Partial<T>, newAttrs: Partial<T>, action?: string) => LiveViewChangeset<T>

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
      }, {} as LiveViewChangesetErrors<T>)
    }
    return {
      action,
      changes: updatedDiff(existing, merged),
      data: result.success ? result.data : merged,
      valid: result.success,
      errors
    } as LiveViewChangeset<T>
  }
}