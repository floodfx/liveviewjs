---
sidebar_position: 3
---

# Statics and Dynamics

It is helpful to understand why and how **LiveViewJS** takes a HTML template and breaks it into static and dynamic
parts.

## Template Example

Let's say we have the following template being returned in a LiveView's `render` function:

```ts
...
render: (context, meta) => {
  const {title, body} = context;
  return html`
    <div>
      <h1>${title}</h1>
      <p>${body}</p>
    </div>
  `
}
...
```

:::info The `html` tag is a "tagged template literal" function which allows **LiveViewJS** to parse the template literal
into a tree of static and dynamic parts. For more information on tagged template literals, see
[MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Template_literals#tagged_templates). :::

## Parts of the Template

The template above is pretty simple but easy to see how it can break into static parts and dynamic parts. There are two
dynamic parts of the template: `${context.title}` and `${context.body}`. The rest of the template is static. The parts
break down into something like this:

```ts
// array of static parts
const statics = [
  "
    <div>
      <h1>",
  "</h1>
      <p>",
  "</p>
    </div>
  "
];

// array of dynamic parts
const dynamics = [
  title,
  body
];

```

## Zip Together

You can see that once we resolve the values for `title` and `body` we can "zip" these two arrays together to create the
final HTML string. This is exactly what **LiveViewJS** does when it renders a HTML LiveView.

## Send Both Statics and Dynamics to Client

In the case of the websocket, **LiveViewJS** initially sends both the statics and dynamics to the client. The client
then uses the statics and dynamics to render the HTML. The client also stores the statics in memory so that it can use
them to re-render the HTML when the dynamics change.

## Only Update the Dynamics

When updates occur on the server and the LiveView is rerendered, we don't need to send the statics again. We only need
to send the dynamics and furthermore, we only need to send the dynamics that have changed. The client then uses the
stored statics and the new dynamics to re-render the HTML.

## Super Fast 🏎

This sending only the value of a dynamic part of the LiveView that changed is extremely efficient and allows
**LiveViewJS** to be super fast. It also allows **LiveViewJS** to be very lightweight. The client only needs to store
the statics in memory and the server only needs to send the dynamics that have changed.
