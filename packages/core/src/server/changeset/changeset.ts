import { updatedDiff } from "deep-object-diff";
import { SomeZodObject } from "zod";

/**
 * Validation errors keyed by properties of T
 */
export type LiveViewChangesetErrors<T> = {
  [Property in keyof T]?: string;
};

/**
 * A changeset represents the transition from one state of a data model to an updated
 * state and captures the changes, any validation errors that the changes may have had,
 * whether the changes are valid, and the data represented by the changeset.  Changesets are
 * useful for modeling data in HTML forms through their validation and submission.
 */
export interface LiveViewChangeset<T> {
  /**
   * Optional string representing the action occuring on the changeset. If the action is not
   * present on a changeset, the validation rules are NOT applied.  This is useful for "empty"
   * changesets used to model an empty form.
   */
  action?: string;
  /**
   * The properties of T that have changed between the initial state and the updated state.
   */
  changes: Partial<T>;
  /**
   * The validation errors keyed by the field names of T.
   */
  errors?: LiveViewChangesetErrors<T>;
  /**
   * The merged data between the initial state and the updated state.
   */
  data: T | Partial<T>;
  /**
   * Whether the changeset is valid.  A changeset is valid if there are no validation errors.  Note again,
   * an undefined action means no validation rules will be applied and thus there will be no validation
   * errors in that case and the changeset will be considered valid.
   */
  valid: boolean;
}

/**
 * A factory for creating a changeset for a given existing data model, updated data model, and optional action.
 */
export type LiveViewChangesetFactory<T> = (
  existing: Partial<T>,
  newAttrs: Partial<T>,
  action?: string
) => LiveViewChangeset<T>;

/**
 * Generates a LiveViewChangesetFactory for the type T and the provided zod schema.  The provided schema
 * and type must have the same properties and generally the type is infered from the schema using zod's
 * infer.
 * e.g.
 *   const mySchema = zod.object({ name: zod.string() });
 *   type myType = z.infer<typeof mySchema>;
 *   const myFactory = newChangesetFactory<myType>(mySchema);
 * @param schema the zod schema to use for validation
 * @returns a LiveViewChangesetFactory for the provided schema and type
 */
export const newChangesetFactory = <T>(schema: SomeZodObject): LiveViewChangesetFactory<T> => {
  return (existing: Partial<T>, newAttrs: Partial<T>, action?: string): LiveViewChangeset<T> => {
    const merged = { ...existing, ...newAttrs };
    const result = schema.safeParse(merged);

    let errors;
    if (result.success === false) {
      // check if _target is present in newAttrs and if so, only include
      // error(s) for that field
      const target = (newAttrs as any)["_target"] ?? false;
      errors = result.error.issues.reduce((acc, issue) => {
        // TODO recursively walk the full tree of fields for the issues?
        if (target) {
          if (issue.path[0] === target) {
            // @ts-ignore
            acc[target] = issue.message;
            return acc;
          }
          // do not include other fields in the errors if the target is present
          return acc;
        }
        // @ts-ignore
        acc[issue.path[0]] = issue.message;
        return acc;
      }, {} as LiveViewChangesetErrors<T>);
    }
    return {
      action,
      changes: updatedDiff(existing, merged),
      data: result.success ? result.data : merged,
      // if action is empty then we assume no validation rules are being applied
      valid: action !== undefined ? result.success : true,
      errors,
    } as LiveViewChangeset<T>;
  };
};
