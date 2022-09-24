---
sidebar_position: 3
---

# Built-in Drag and Drop

LiveViewJS ships with built-in support for drag and drop file uploads. It is incredibly easy to use. All you need to do
is add a `<div />` that has the `phx-drop-target` attribute set to the upload config ref you want to target. For
example, if you want to allow users to drag and drop files into a `photos` upload config, you would do the following:

```ts
...
render: (context, meta) => {
  ...
  <div phx-drop-target="${meta.uploads.photos.ref}">
    Drop files here
  </div>
  ...
}
```

That's it! **LiveViewJS** will automatically handle the rest. The user will be able to drag and drop files into the div
and they will be added to the entries of that upload config. 🤯

## Credit where credit is due

Thanks to the Phoenix LiveView folks that built this! 🙌 This is a great example of why we built on top of the existing
LiveView client-side JS.
