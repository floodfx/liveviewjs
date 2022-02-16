## Setting and Updating the HTML document title

Setting the default HTML document title for LiveViewJS via the `LiveViewServer.pageTitleDefaults` option when creating a new `LiveViewServer` instance.

The `PageTitleDefaults` interface looks like this:
```typescript
export interface PageTitleDefaults {
  prefix?: string;
  suffix?: string;
  title: string;
}
```

And setting this on the `LiveViewServer` instance looks like this:
```typescript
const lvServer = new LiveViewServer({
  // other settings
  pageTitleDefaults: {
    title: "Examples",
    suffix: " · LiveViewJS"
  }
});
```

Defining these defaults applies them to all pages that are rendered by the server.  You can override the title for each `LiveViewComponent` and on any event that triggers a page render.

**Note**: The `prefix` and `suffix` properties are **NOT** updatable from a `LiveViewComponent` instance.  In other words, if you set a `prefix` and/or a `suffix` on a given `LiveViewServer` instance, they are applied to all component titles.

## Changing the HTML Title for each `LiveViewComponent`
To change the HTML title for a specific `LiveViewComponent` you can use the `LiveViewSocket.pageTitle(newTitle: string)` method in either the `mount` or `handleParams` methods on a component.

Typeically, if you only have `mount` you would set it there.  If you want to update the `<title />` based on incoming params you would set it in the `handleParams` method.

Example in `mount`:
```typescript
  // see src/examples/light_liveview.ts
  mount(params: LiveViewMountParams, session: Partial<SessionData>, socket: LiveViewSocket<LightContext>) {
    socket.pageTitle("Front Porch Light");
    return { brightness: 10 };
  };
```

Example in `handleParams`:
```typescript
  // see src/examples/servers/component.ts
  handleParams(params: { id: string; }, url: string, socket: LiveViewSocket<ServersContext>): ServersContext {
    const servers = listServers();
    const selectedServer = servers.find(server => server.id === params.id) || servers[0];
    socket.pageTitle(selectedServer.name);
    return { servers, selectedServer };
  }
```

## Changing the HTML Title in `handleEvent` or `handleInfo`
Since `handleEvent` and `handleInfo` are passed a `LiveViewSocket` instance, you can use the `LiveViewSocket.pageTitle(newTitle: string)` method to change the HTML title in these methods as well.