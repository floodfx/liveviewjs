---
sidebar_position: 1
---

# User Events / Bindings

## Four main User Events

There are four main types of user events that a LiveView can listen to and respond to:

- Click events
- Form events
- Key events
- Focus events

To listen for user events there are a set of "bindings" (a.k.a. attributes) that you add to the HTML elements in your
LiveView `render` method.

### Click Events

User clicks are the most common type of user event and there are two types of click bindings:

- `phx-click` - Add this binding to an HTML element (e.g.,  `<... phx-click="myEvent" ...>`) and when a user clicks on the
  element the event (i.e.,  value of the attribute) will be sent to the server.
- `phx-click-away` - This binding is similar to `phx-click` except that an event will occur when the user clicks outside
  of the element.

#### Click Event Example

Let's say we want to send the `increment` event to the server when the user clicks on the "+" button:

```html
<button phx-click="increment">+</button>
```

The `handleEvent` method would receive an event that looks like this:

```ts
{
  type: "increment";
}
```

### Form Events

Form events are triggered by the user interacting with form inputs. There are two types of form bindings:

- `phx-change` - When a user changes the value of a form element, the event named by the `phx-change` attribute will be
  sent to the server along with all the form values. This is typically used for form validation purposes prior to form
  submission.
- `phx-submit` - This binding is initiated when a user submits a form and the event named by the `phx-submit` attribute
  will be sent to the server along with all the form values.

```html
<form action="#" phx-change="validate" phx-submit="save">...</form>
```

Adding `phx-change` to a form means that any time a user changes the value of a form element, the `validate` event will
be sent to the server along with the form values. Typically, `phx-change` handles form validation prior to form
submission.

Adding `phx-submit` to a form means that when the user submits the form, the `save` event will be sent to the server
along with all the form values.

:::info In LiveViewJS, Forms are typically used in conjunction with
[`LiveViewChangeset`](/docs/forms-and-changesets/changesets)s. `LiveViewChangeset`s are designed to work together with
form events to make form validation and submission easy and powerful. We'll dive into more details later on in the next
section. :::

### Key Events

Key events are triggered by the user pressing a key on the keyboard. There are key bindings for both the element-level
and the window-level:

- `phx-keydown`, `phx-window-keydown` - When a user presses a key down on the keyboard, the event named by the attribute
  will be sent to the server along with the key that was pressed.
- `phx-keyup`, `phx-window-keyup` - When a user releases a key on the keyboard, the event named by the attribute will be
  sent to the server along with the key that was released.

`phx-key` is an optional attribute which limits triggering of the key events to the key provided in the attribute (e.g.
`phx-key="ArrowUp"`). You can find a list of the keys on
[MDN Keyboard Values](https://developer.mozilla.org/en-US/docs/Web/API/UI_Events/Keyboard_event_key_values).

#### Key Event Example

Let's say we want to send the `key_event` event to the server along with the `{key: "ArrowUp"}` payload when the user
presses the "ArrowUp" key:

```html
<div phx-window-keydown="key_event" phx-key="ArrowUp" />
```

The `handleEvent` method would receive an event that looks like this:

```ts
{
  type: "key_event",
  key: "ArrowUp"
}
```

### Focus / Blur Events

If a HTML element emits focus and blur events, you can use the following bindings to send events to the server upon
focus and/or blur:

- `phx-focus` - When a user focuses on an element, the event named by the `phx-focus` attribute will be sent to the
  server.
- `phx-blur` - When a user blurs from an element, the event named by the `phx-blur` attribute will be sent to the
  server.

Similar to key events, there are window-level and element-level bindings:

- `phx-window-focus` - When a user focuses on the window, the event named by the `phx-window-focus` attribute will be
  sent to the server.
- `phx-window-blur` - When a user blurs from the window, the event named by the `phx-window-blur` attribute will be sent
  to the server.

#### Focus / Blur Examples

Let's say we want to send the `focus_event` event to the server when the user focuses on the input and the `blur_event`
event when the user blurs from the input

```html
<input name="text" phx-focus="focus_event" phx-blur="blur_event" />
```

The `handleEvent` method would receive an event that looks like this on focus:

```ts
{
  type: "focus_event";
}
```

The `handleEvent` method would receive an event that looks like this on blur:

```ts
{
  type: "blur_event";
}
```

### Additional Bindings

There are other bindings that provide additional functionality for your LiveView and work in conjunction with the event
bindings we reviewed above.
