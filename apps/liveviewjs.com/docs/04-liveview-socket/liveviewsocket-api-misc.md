---
sidebar_position: 6
---

# LiveViewSocket API - Misc

A few other methods and properties are available on the LiveViewSocket object that we haven't covered yet.

## LiveViewSocket Properties and Methods

| Name                                                    | Description                                                                                              |
| ------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `id` (property, read-only)                              | The (random) id of the LiveView                                                                          |
| `connected` (property, read-only)                       | Whether the websocket is connected. `true` if connected to a websocket, `false` for http request         |
| `pageTitle(newPageTitle:string):void;`                  | Updates the `<title>` tag of the LiveView. Requires using the `live_title` helper in rendering the page. |
| `putFlash(key: string, value: string): Promise<void>;`  | Add flash message to the socket for a given key and value.                                               |
| `repeat(fn: () => void, intervalMillis: number): void;` | Runs the given function on the given interval until this LiveView is unloaded.                           |

## `id` Property

The `id` property is a unique identifier for the LiveView. It is a random string that is generated when the LiveView is
created. It is useful for debugging and logging purposes.

## `connected` Property

The `connected` property is a boolean that indicates whether the LiveView is connected to a websocket or not. If the
LiveView is connected to a websocket, then the value will be `true`. If the LiveView is not connected to a websocket
(i.e.,  executing an HTTP request), then the value will be `false`. This is useful for executing logic based on whether
the LiveView has completed the initial websocket connection or not. For example:

```ts
...
if (socket.connected) {
  // only subscribe to the topic if the LiveView is connected to a websocket
  await socket.subscribe("my_topic");
}
...
```

## `pageTitle` Method

LiveViewJS provides a `live_title_tag` helper that enables LiveViews to update the `<title>` tag of the page
dynamically. This is useful for LiveViews that need to update the page title based on the current state of the LiveView.
For example, a LiveView may want to update the title to include the details of the item being viewed. The `pageTitle`
method works in partnership with the `live_title_tag` to enable dynamic page titles. `live_title_tag` is usually used
in the `LiveViewHtmlPageTemplate` template. For example:

```ts {14}
export const htmlPageTemplate: LiveViewHtmlPageTemplate = (
  liveTitleOptions: LiveTitleOptions,
  csrfToken: string,
  liveViewContent: LiveViewTemplate
): LiveViewTemplate => {
  const pageTitle = liveTitleOptions?.title ?? "";
  const pageTitlePrefix = liveTitleOptions?.prefix ?? "";
  const pageTitleSuffix = liveTitleOptions?.suffix ?? "";
  return html`
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta name="csrf-token" content="${csrfToken}" />
        ${live_title_tag(pageTitle, { prefix: pageTitlePrefix, suffix: pageTitleSuffix })}
        <script defer type="text/javascript" src="/js/index.js"></script>
      </head>
      <body>
        <p><a href="/">← Back</a><br /><br /></p>
        ${safe(liveViewContent)}
      </body>
    </html>
  `;
};
```

Now you can update the page title from within the LiveView using the `pageTitle` method. For example:

```ts
...
socket.pageTitle("My New Page Title");
...
```

:::note The `pageTitle` method does not update the `prefix` or `suffix` part of the `live_title_tag`. :::

## `putFlash` Method

Flash messages are a way to display small notes or alerts to users to provide feedback on actions they are taken.
`putFlash` is a method that allows you to add a flash message to the LiveView. The flash message will be displayed on
the next render. The `putFlash` method takes two arguments: the key and the value. The key is used to identify the flash
message and the value is the message to display. `putFlash` usually works with a `LiveViewWrapperTemplate` to be used as
the root template for the LiveView. The `LiveViewWrapperTemplate` is used to display the flash messages. For example:

```ts {5-7}
export const wrapperTemplate: LiveViewWrapperTemplate = async (
  session: SessionData,
  liveViewContent: LiveViewTemplate
): Promise<LiveViewTemplate> => {
  const flashAdaptor = new SessionFlashAdaptor();
  const infoFlash = (await flashAdaptor.popFlash(session, "info")) || "";
  const errorFlash = (await flashAdaptor.popFlash(session, "error")) || "";
  return html`
    <main role="main" class="container">
      ${infoFlash !== "" ? html`<blockquote><strong>ℹ Info</strong> ${infoFlash}</blockquote>` : ""} ${errorFlash !== ""
        ? html`<blockquote><strong>⚠️ Error</strong> ${errorFlash}</blockquote>`
        : ""} ${safe(liveViewContent)}
    </main>
  `;
};
```

## `repeat` Method

The `repeat` method is a way to execute a function on a given interval. The `repeat` method takes two arguments: the
function to execute and the interval in milliseconds. The function will be executed on the given interval until the
LiveView is unloaded. For example:

```ts
...
if (socket.connected) {
  // only start repeating if the socket is connected
  socket.repeat(() => {
    // send the tick event to `handleInfo` every second
    socket.sendInfo({ type: "tick" });
  }, 1000);
}
...
```
