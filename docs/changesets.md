## Changesets

Changesets are used to track creation and mutation of data models in LiveView projects and synchronize them with HTML Forms and the user input that drives them.

Changeset are built on top of [Zod](https://github.com/colinhacks/zod) which is a "Typescript-first schema validation with static type inference" library.

### Define the Schema

First, we need to define a schema for the data model:
```typescript
import { z } from "zod";

// custom validation
const phoneRegex = /^\d{3}[\s-.]?\d{3}[\s-.]?\d{4}$/

// Use Zod to define the schema for the Volunteer model
// More on Zod - https://github.com/colinhacks/zod
export const VolunteerSchema = z.object({
  id: z.string().default(nanoid),
  name: z.string().min(2).max(100),
  phone: z.string().regex(phoneRegex, 'Should be a valid phone number'),
  checked_out: z.boolean().default(false),
})
```

### Infer the Data Model Type based on the Schema
```typescript
// infer the Volunteer model from the Zod Schema
export type Volunteer = z.infer<typeof VolunteerSchema>;
```

### Generate a Changeset Helper and use it to validate the data model
```typescript
import { newChangesetFactory } from "liveviewjs";

// generate changeset helper
export const changeset = newChangesetFactory<Volunteer>(VolunteerSchema)

// implement a mutating changeset function
export const createVolunteer = (newVolunteer: Partial<Volunteer>): LiveViewChangeset<Volunteer> => {
  const result = changeset({}, newVolunteer, 'create');
  if (result.valid) {
    const v = result.data as Volunteer;
    // Update your database or other data store
    volunteers[v.id] = v;
  }
  return result;
}
```

## More on Changeset Helpers

The `newChangesetFactory` function generates a changeset helper function that can be used to validate and mutate data models defined by the schema and inferred type.

The API for generate changeset helpers is pretty straight forward.  It takes 3 arguments:
 * `existing: Partial<T>` the current data model - which can be an empty object if you are creating a new record
 * `newData: Partial<T>` the new data to apply to the data model
 * `action?: string` which is an optional string describing the changeset action (Note: we keep the action unset for an empty changeset but must be set for form validations to be visible.)

You can see the implementation of the changeset helper factory in the `src/server/component/changeset.ts` file.

When executed, the changeset helper function returns a `LiveViewChangeset<T>` object which has the following properties:
 * `valid: boolean` - does the resulting merged data model pass all validation rules?
 * `changes: Partial<T>` - just the parts of the model that have been mutated
 * `data: T` - the data model after the changeset has been applied (which may be invalid or valid depending on the validations)
 * `errors: { [Property in keyof T]?: string | undefined; }` - an object of error messages if the changeset is invalid keyed by field name(s) of the data model
 * `action?: string` - the changeset action (or undefined if unset)

### Use with HTML Forms and Form Validation
Changesets are used in concert with HTML Forms to gather user input, validate that input, update the data model or send back error messages for the user to correct.

Example of using a changeset helper with a form text input field including error messages:
```typescript
<div class="field">
  ${text_input<Volunteer>(changeset, "name", { placeholder: "Name", autocomplete: "off", phx_debounce: 1000 })}
  ${error_tag(changeset, "name")}
</div>
```

### Empty Changeset
Empty changesets are used to initialize a form with and can be created by calling `changset({}, {})`.

### Detailed Example
See `src/examples/volunteers/*` for working, detailed example of how changesets work and how to use them including with forms.
