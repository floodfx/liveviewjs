## `LiveViewServer` Options

The `LiveViewServer` constructor takes an a `LiveViewServerOptions` object which can be used to customize the server.  The only required option is `signingSecret` which is used to sign the session cookie as well as the JWT tokens sent to the client.

```ts
export interface LiveViewServerOptions {
  port?: number;
  rootView?: string;
  viewsPath?: string;
  publicPath?: string;
  sessionStore?: session.Store;
  pageTitleDefaults?: PageTitleDefaults;
  middleware?: express.Handler[];
  signingSecret: string;
}
```
### Details on each option:
* `port`: `number` - The port to listen on.  Defaults to `4444`.
* `rootView`: `string` - The [ejs](https://ejs.co/) template that wraps each `LiveViewComponent`s  render output.  Defaults to `src/server/web/views/root.html.ejs`.
* `viewsPath`: `string` - The path to the directory containing views (ejs templates) for your application.  The webserver will look for views here including your `rootView` if that has been specified.
* `publicPath`: `string` - The path to the directory containing static files for your application.  The webserver will serve static files from here.
* `sessionStore`: `session.Store` - The session store to use.  Defaults to `express-session`'s in-memory store. See [express store implementations](https://github.com/expressjs/session#session-store-implementation) for more details.
* `pageTitleDefaults`: `PageTitleDefaults` - The default page title to use for each `LiveViewComponent`.  You can set a `prefix`, `suffix`, and default title.  The default is empty strings for each.
* `middleware`: `express.Handler[]` - An array of middleware to add to the express server.  This is useful for adding logging, authentication, or other middleware.  See [express middleware](https://expressjs.com/en/guide/using-middleware.html) for more details.


