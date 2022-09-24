---
sidebar_position: 2
---

# Changesets

## High Level

At a high level, Changesets are used to track creation and mutation of data models in LiveView projects and synchronize
them with HTML Forms and the user input that drives them.

Changeset are built on top of [Zod](https://github.com/colinhacks/zod) which is a "Typescript-first schema validation
with static type inference" library.

Let's go through the steps of creating a changeset helper for a Book data model.

:::info The [basics of Zod](https://github.com/colinhacks/zod#basic-usage) are pretty easy to pick up especially if you
are familiar with Typescript. Even if you are not too familiar with Zod or Typescript, the concept is Zod is pretty
straight forward. Essentially you are defining a schema and then parsing the input data against the schema. If the input
data matches the schema then the data is valid. If the input data does not match the schema then the data is invalid and
you can use the error messages to display validation errors to the user. :::

## Create a Zod Schema

First, we need to define a Zod schema for the data model:

```ts
import { z } from "zod";

// Use Zod to define the schema for the Book model
const BookSchema = z.object({
  id: z.string().default(nanoid),
  name: z.string().min(2).max(100),
  author: z.string().min(2).max(100),
  checked_out: z.boolean().default(false),
});
```

As you can see the `BookSchema` has an `id`, `name`, `genre` and `checked_out` property. The `id` is a string and is
generated using the `nanoid` function by default. The `name` and `author` are strings and must be at least 2 characters
long and no more than 100 characters long. The `checked_out` property is a boolean and is set to `false` by default.

## Infer the Type based on the Schema

```ts
// infer the Book type from the schema
type Book = z.infer<typeof BookSchema>;
```

Now, we have a schema and a type for the Book data model. The `z.infer` function is used to infer a valid type from the
schema.

So far this is basic Zod usage. Now that we have the schema and type we can use them to create a
`LiveViewChangesetFactory`.

## Generate a LiveViewChangesetFactory

```ts
import { newChangesetFactory } from "liveviewjs";

// generate changeset factory
const bookCSF = newChangesetFactory<Book>(BookSchema);
```

The `newChangesetFactory` function takes a Zod schema (and type annotation) and returns a `LiveViewChangesetFactory` for
that schema and type. The `LiveViewChangesetFactory` is used to create `LiveViewChangeset`s for the `Book` model.

## Using a LiveViewChangesetFactory

Despite it's long name, a `LiveViewChangesetFactory` is simply a function that takes two `Partial`s and an (optional)
action string and returns a `LiveViewChangeset`. The first `Partial` is the starting data model and the second `Partial`
is the changes to the data model.

Here is the signature of the `LiveViewChangesetFactory`:

```ts
/**
 * A factory for creating a changeset for a given existing data model, updated data model, and optional action.
 */
export type LiveViewChangesetFactory<T> = (
  existing: Partial<T>,
  newAttrs: Partial<T>,
  action?: string
) => LiveViewChangeset<T>;
```

When you generate a `LiveViewChangesetFactory` for a given schema and type, the `LiveViewChangesetFactory` is created
(and "typed") for that schema and type. So, if you generate a `LiveViewChangesetFactory` for a `Book` schema and type,
then the `LiveViewChangesetFactory` will be typed to a `LiveViewChangeset` for a `Book` model and will only accept
`Partial<Book>`s as the first and second arguments.

## Use a LiveViewChangesetFactory to create a LiveViewChangeset

Now that we have a `LiveViewChangesetFactory` for the `Book` model, we can use it to create a `LiveViewChangeset` for a
`Book` data.

```ts
const bookData: Partial<Book> = {
  name: "The Hobbit",
  author: "J.R.R. Tolkien",
};
// create a new changeset for a new book
const bookCS = changeset({}, bookData, "create");
```

The `bookCS` object is a `LiveViewChangeset` for a `Book` model. Zod parsed and validated the `bookData` we passed in.

A `LiveViewChangeset` has the following properties:

- `valid: boolean` - does the resulting merged data model pass all validation rules?
- `changes: Partial<T>` - just the parts of the model that have been changed relative to the existing model
- `data: T` - the data model after the changeset has been applied (which may be invalid or valid depending on the
  validations)
- `errors: { [Property in keyof T]?: string | undefined; }` - an object that maps property names to error messages if
  the changeset has invalid data
- `action?: string` - the changeset action (or undefined if unset)

So now that we've created a `LiveViewChangeset` for the book data we can ask it if the data is valid or not:

```ts
bookCS.valid; // => true
```

Then we can ask it for the new data:

```ts
bookCS.data; // => { id: "some-random-id", name: "The Hobbit", author: "J.R.R. Tolkien", checked_out: false }
```

## Invalid Data

Let's create a new `LiveViewChangeset` for a book with invalid data:

```ts
const invalidBookData: Partial<Book> = {
  name: "a",
  author: "b",
};
// create a new changeset for this book
const invalidBookCS = changeset({}, invalidBookData, "create");
```

Now, we can ask the `invalidBookCS` if it is valid:

```ts
invalidBookCS.valid; // => false
```

And we can ask it for the errors:

```ts
invalidBookCS.errors; // => { name: "Must be at least 2 characters", author: "Must be at least 2 characters" }
```

## What about the action string?

The value of the action string has no significance in an of itself. The presence of the action string however does
impact the `valid` property of the `LiveViewChangeset` returned by the `LiveViewChangesetFactory`. **If the action
string is NOT set** the `valid` property will always return `true`. **If the action string IS set** the `valid` property
will return `true` if the data is valid and `false` if the data is invalid.

:::note We pass "empty" (i.e.,  no action string) changesets to form helpers in the `render` function otherwise there
would be errors on the form when the page is first loaded. "Empty" changesets are always valid. :::

## Next Steps

Now that you understand "Changesets", we can show you how they are powerful partners with the Form Events we discussed
earlier.
