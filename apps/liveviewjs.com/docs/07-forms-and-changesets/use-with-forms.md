---
sidebar_position: 3
---

# Forms & Changesets Example

Now that we've revisited Form Events and learned about Changesets, let's take a look at how we can use them together to
build, validate, and process a form.

## Example LiveView

We're going to build a LiveView for managing our book library. We'll be able to add new books and mark those books as
"available" or "checked out".

Here's the LiveView example code:

```ts
import {
  createLiveView,
  error_tag,
  form_for,
  html,
  LiveViewChangeset,
  newChangesetFactory,
  submit,
  text_input,
} from "liveviewjs";
import { nanoid } from "nanoid";
import { z } from "zod";

// Create the zod BookSchema
const BookSchema = z.object({
  id: z.string().default(nanoid),
  name: z.string().min(2).max(100),
  author: z.string().min(2).max(100),
  checked_out: z.boolean().default(false),
});

// Infer the Book type from the BookSchema
type Book = z.infer<typeof BookSchema>;

// in memory data store for Books
const booksDB: Record<string, Book> = {};

// Book LiveViewChangesetFactory
const bookCSF = newChangesetFactory<Book>(BookSchema);

export const booksLiveView = createLiveView<
  // Define the Context of the LiveView
  {
    books: Book[];
    changeset: LiveViewChangeset<Book>;
  },
  // Define events that are initiated by the end-user
  | { type: "save"; name: string; author: string }
  | { type: "validate"; name: string; author: string }
  | { type: "toggle-checkout"; id: string }
>({
  mount: async (socket) => {
    socket.assign({
      books: Object.values(booksDB),
      changeset: bookCSF({}, {}), // empty changeset
    });
  },

  handleEvent: (event, socket) => {
    switch (event.type) {
      case "validate":
        // validate the form data
        socket.assign({
          changeset: bookCSF({}, event, "validate"),
        });
        break;
      case "save":
        // attempt to create the volunteer from the form data
        const saveChangeset = bookCSF({}, event, "save");
        let changeset = saveChangeset;
        if (saveChangeset.valid) {
          // save the book to the in memory data store
          const newBook = saveChangeset.data as Book;
          booksDB[newBook.id] = newBook;
          // since book was saved, reset the changeset to empty
          changeset = bookCSF({}, {});
        }
        // update context
        socket.assign({
          books: Object.values(booksDB),
          changeset,
        });
        break;
      case "toggle-checkout":
        // lookup book by id
        const book = booksDB[event.id];
        if (book) {
          // update book
          book.checked_out = !book.checked_out;
          booksDB[book.id] = book;
          // update context
          socket.assign({
            books: Object.values(booksDB),
          });
        }
        break;
    }
  },

  render: (context, meta) => {
    const { changeset, books } = context;
    const { csrfToken } = meta;
    return html`
      <h1>My Library</h1>

      <div id="bookForm">
        ${form_for<Book>("#", csrfToken, {
          phx_submit: "save",
          phx_change: "validate",
        })}

          <div class="field">
            ${text_input<Book>(changeset, "name", { placeholder: "Name", autocomplete: "off", phx_debounce: 1000 })}
            ${error_tag(changeset, "name")}
          </div>

          <div class="field">
            ${text_input<Book>(changeset, "author", { placeholder: "Author", autocomplete: "off", phx_debounce: 1000 })}
            ${error_tag(changeset, "author")}
          </div>

          ${submit("Add Book", { phx_disable_with: "Saving..." })}
        </form>
      </div>

      <div id="books">
        ${books.map(renderBook)}
      </div>
    `;
  },
});

function renderBook(b: Book) {
  const color = b.checked_out ? `color: #ccc;` : ``;
  const emoji = b.checked_out ? `📖[checked out]` : `📚[available]`;
  return html`
    <div id="${b.id}" style="margin-top: 1rem; ${color}">
      ${emoji}<span>${b.name}</span> by <span>${b.author}</span>
      <div>
        <button phx-click="toggle-checkout" phx-value-id="${b.id}" phx-disable-with="Updating...">
          ${b.checked_out ? "Return" : "Check Out"}
        </button>
      </div>
    </div>
  `;
}
```

## Code Walk Through

Let's walk through the code to see how it all works together.

### First defining the Zod Schema, Types, and Changeset Factory

```ts
// Create the zod BookSchema
const BookSchema = z.object({
  id: z.string().default(nanoid),
  name: z.string().min(2).max(100),
  author: z.string().min(2).max(100),
  checked_out: z.boolean().default(false),
});

// Infer the Book type from the BookSchema
type Book = z.infer<typeof BookSchema>;

// Book LiveViewChangesetFactory
const bookCSF = newChangesetFactory<Book>(BookSchema);
```

This code should look familiar. We're defining the Zod Schema, inferring the type, and creating the changeset factory
for the `BookSchema` and `Book` type.

### Define the LiveView TContext and TEvent types

```ts
...
export const booksLiveView = createLiveView<
  // Define the Context of the LiveView
  {
    books: Book[];
    changeset: LiveViewChangeset<Book>;
  },
  // Define events that are initiated by the end-user
  | { type: "save"; name: string; author: string }
  | { type: "validate"; name: string; author: string }
  | { type: "toggle-checkout"; id: string }
>({
...
```

Here we are saying the `context` of our LiveView will have a `books` array of type `Book` and a `changeset` of type
`LiveViewChangeset<Book>`. We are also defining the `events` that can be initiated by the end-user. In this case, we
have `save`, `validate`, and `toggle-checkout` events along with the data that is required for each event.

### Use Helpers in `render`

```ts
...
render: (context, meta) => {
  // get the changeset and books from the context
  const { changeset, books } = context;
  // pull out the csrf token from the meta data
  const { csrfToken } = meta;
  return html`
    <h1>My Library</h1>

    <div id="bookForm">
      <!-- use the form_for helper to render the form -->
      ${form_for<Book>("#", csrfToken, {
        phx_submit: "save",
        phx_change: "validate",
      })}

        <div class="field">
          <!-- use the text_input helper to render the input for the name property -->
          ${text_input<Book>(changeset, "name", { placeholder: "Name", autocomplete: "off", phx_debounce: 1000 })}
          <!-- use the error_tag helper to optionally render the error message for the name property -->
          ${error_tag(changeset, "name")}
        </div>

        <div class="field">
          <!-- use the text_input helper to render the input for the author property -->
          ${text_input<Book>(changeset, "author", { placeholder: "Author", autocomplete: "off", phx_debounce: 1000 })}
          <!-- use the error_tag helper to optionally render the error message for the author property -->
          ${error_tag(changeset, "author")}
        </div>
        <!-- use the submit helper to render the submit button -->
        ${submit("Add Book", { phx_disable_with: "Saving..." })}
      </form>

    </div>

    <div id="books">
      ${books.map(renderBook)}
    </div>
  `;
},
...
```

There is a bit going on here so let's break it down. First we are pulling out the `changeset` and `books` from the
`context`. We are also pulling out the `csrfToken` from the `meta` data. Next we are using the `form_for` helper to
render the form. We are passing in the `changeset` and the `csrfToken` as well as setting the `phx_submit` and
`phx_change` attributes to the events that will be called in `handleEvent`.

:::tip Using the `form_for` helper is optional. You can use the `form` helper and set the `phx_submit` and `phx_change`
attributes to the events that will be called in `handleEvent`. The `form_for` helper just makes it a little easier to
render the form and automatically passes the `csrfToken` to the form.

The **LiveViewJS** framework automatically validates the csrfToken (a.k.a. authenticity token) for you and will throw an
error if the token is invalid. :::

Next we are using the `text_input` helper to render the input for the `name` property. We are passing in the `changeset`
and the `name` property as well as the `placeholder`, `autocomplete`, and `phx_debounce` attributes.

:::tip The `text_input` helper is optional but it provides type safefy and automatically works with the `changeset`. Of
note, we use the `phx-debounce` attribute to only send the change event to the server after the user has stopped typing
for 1000ms. This is a great way to reduce the number of events sent to the server and improve performance. :::

Next we are using the `error_tag` helper to optionally render the error message for the `name` property. We are passing
in the `changeset` and the `name` property there as well.

:::tip The `error_tag` helper is optional but it provides type safefy and automatically works with the `changeset` to
pull out the error message for the property if there is one. :::

We follow the same pattern for the `author` property.

Next, we are using the `submit` helper to render the submit button. We are passing in the `Add Book` text and the
`phx_disable_with` attribute.

Finally we map over the `books` to render each book using the `renderBook` function.

### Handle `validate` event

```ts
handleEvent: (event, socket) => {
...
case "validate":
  // validate the form data
  socket.assign({
    changeset: bookCSF({}, event, "validate"),
  });
  break;
...
```

When `handleEvent` occurs with the `validate` event, we use the `bookCSF` changeset factory to generate a new
`LiveViewChangeset` for the the form data (also present in the `event`). Since, this isn't updating the book, we pass an
empty object `{}` first, along with the `event` data. Importantly, we set the `action` to `validate` and assign the
result to the `changeset` in the `context`.

:::info Remember if you don't set the `action` text in the `LiveViewChangesetFactory` call then returned
`LiveViewChangeset` will always be valid. :::

The `LiveViewChangeset` works with the helpers in `render` to automatically render the error messages for the properties
that have errors and set the value of the input fields to the values that were submitted.

### Handle `save` event

```ts
handleEvent: (event, socket) => {
...
case "save":
  // attempt to create the volunteer from the form data
  const saveChangeset = bookCSF({}, event, "save");
  let changeset = saveChangeset;
  if (saveChangeset.valid) {
    // save the book to the in memory data store
    const newBook = saveChangeset.data as Book;
    booksDB[newBook.id] = newBook;
    // since book was saved, reset the changeset to empty
    changeset = bookCSF({}, {});
  }
  // update context
  socket.assign({
    books: Object.values(booksDB),
    changeset,
  });
  break;
...
```

When `handleEvent` occurs with the `save` event, we use the `bookCSF` changeset factory to generate a new
`LiveViewChangeset` for the the form data (also present in the `event`). Since, this is also not updating an existing
book, we pass an empty object `{}` first, along with the `event` data. Importantly, we set the `action` to `save` and
assign the result to the `saveChangeset` variable.

If the `saveChangeset` is valid, we save the book to the in memory data store. We then reset the `changeset` to be an
empty changeset (i.e.,  `bookCSF({}, {})`). If the `saveChangeset` is not valid, we keep the `changeset` as the
`saveChangeset` so that the error messages will be rendered in the form using the form helpers (i.e.,  `error_tag` and
`text_input`).

Finally, we update the `books` and `changeset` in the `context`.

## Bonus `toggle_checkout` event

```ts
handleEvent: (event, socket) => {
...
case "toggle_checkout":
  // lookup book by id
  const book = booksDB[event.id];
  if (book) {
    // update book
    book.checked_out = !book.checked_out;
    booksDB[book.id] = book;
    // update context
    socket.assign({
      books: Object.values(booksDB),
    });
  }
  break;
...
```

When `handleEvent` occurs with the `toggle_checkout` event, we toggle the `checked_out` property of the book in the in
memory data store and update the `books` in the `context`.

## Conclusion

As you can see, Forms and Changesets are a powerful way to build forms in LiveView. They provide type safety and
automatically render the error messages and input values. They validate the form data incrementally and upon submission.
In short, they make forms easy and fun again!
