---
sidebar_position: 3
---

# Rate Limiting Bindings

Deboucing and throttling user events is a very common need and to support these use-cases there are the following
bindings:

- `phx-debounce` - Debounce an event by the number of milliseconds specified in the attribute value **or** by setting
  the value to `blur`. This is useful for preventing multiple events from being sent to the server in rapid succession.
  When `blur` is the value, the event will be debounced until the element is blurred by the user. Typically used for
  input elements.
- `phx-throttle` - Throttle an event by the number of milliseconds specified in the attribute value. In contrast to
  debouncing, throttling emits an event immediately and then only once every specified number of milliseconds. Typically
  used to rate limit click events, key events, and mouse actions.

## Debounce Examples

Here are some examples of the debounce binding in action.

### Debounce input blur

Let's say we want to send the `validate` event to the server when a user blurs away from the address input in a form:

```html
<form action="#" phx-change="validate" phx-submit="save">
  <!--// only send "validate" event when address input is blurred -->
  <input name="address" phx-debounce="blur" />
</form>
```

### Debouce input change

Let's say we only want to send the `search` event to the server 1 second after a user stops typing into the search
input:

```html
<form action="#" phx-change="search">
  <!--// send "search" event after 1 second of debouncing  -->
  <input name="query" phx-debounce="1000" />
</form>
```

## Throttle Example

Let's say we only want to send one `volume_up` event every 500ms. The user can click the button as many times as they
want, but the event will only be sent to the server every 500ms:

```html
<!--// rate limit clicks on a volume up event -->
<button phx-click="volume_up" phx-throttle="500" />
```
