import {
  createLiveView,
  error_tag,
  form_for,
  html,
  LiveViewChangeset,
  newChangesetFactory,
  SingleProcessPubSub,
  submit,
  text_input,
} from "liveviewjs";
import { nanoid } from "nanoid";
import { z } from "zod";

// Create the zod BookSchema
const BookSchema = z.object({
  id: z.string().default(nanoid),
  name: z.string().min(2).max(100),
  author: z.string().min(4).max(100),
  checked_out: z.boolean().default(false),
});

// Infer the Book type from the BookSchema
type Book = z.infer<typeof BookSchema>;

// Book LiveViewChangesetFactory
const bookCSF = newChangesetFactory<Book>(BookSchema);

// in memory data store for Books
const booksDB: Record<string, Book> = {};

// Pub/Sub for publishing changes
const pubSub = new SingleProcessPubSub();

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
  mount: (socket) => {
    if (socket.connected) {
      socket.subscribe("books");
    }
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
        // attempt to create the book from the form data
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
        pubSub.broadcast("books", { type: "updated" });
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
          pubSub.broadcast("books", { type: "updated" });
        }
        break;
    }
  },
  handleInfo: (info, socket) => {
    if (info.type === "updated") {
      socket.assign({
        books: Object.values(booksDB),
      });
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
            ${text_input(changeset, "name", { placeholder: "Name", autocomplete: "off", phx_debounce: 1000 })}
            ${error_tag(changeset, "name")}
          </div>

          <div class="field">
            ${text_input(changeset, "author", { placeholder: "Author", autocomplete: "off", phx_debounce: 1000 })}
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
      ${emoji} <span>${b.name}</span> by <span>${b.author}</span>
      <div>
        <button phx-click="toggle-checkout" phx-value-id="${b.id}" phx-disable-with="Updating...">
          ${b.checked_out ? "Return" : "Check Out"}
        </button>
      </div>
    </div>
  `;
}
