---
sidebar_position: 2
---

# Additional Bindings

There are additional bindings outside of the four main bindings for User Events that you will find extremely useful and
that you will use often.

## Value Bindings

When you need to send along additional data with an event binding you can use a "value binding" which looks something
like `phx-value-[NAME]` where `[NAME]` is replaced by the key of the value you want to pass. This binding can be used in
conjunction with other click, key, and focus bindings.

### Value Binding Example

For example let's say you want to send the `mark_complete` event to the server along with and `id` value
(e.g., `{id: "myId"}`) when the user clicks on the "Complete" button. To do this you do the following:

```html
<button phx-click="mark_complete" phx-value-id="myId">Complete</button>
```

Note the `[NAME]` part of `phx-value-[NAME]` is `id` used as the object key while the attribute value (i.e.,  `"myId"`) is
used as the object value.

This example would send the following event to the server:

```ts
{
  type: "mark_complete",
  id: "myId"
}
```
