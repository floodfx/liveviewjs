---
sidebar_position: 3
---

# Example Hook

Let's create a hook that will format a text input into a phone number as a user types.

## Hook Definition

```ts
// Define the hook
const PhoneNumber: ViewHook = {
  mounted() {
    this.el.addEventListener("input", (e) => {
      let match = this.el.value.replace(/\D/g, "").match(/^(\d{3})(\d{3})(\d{4})$/);
      if (match) {
        this.el.value = `${match[1]}-${match[2]}-${match[3]}`;
      }
    });
  },
};
// Add the hook to the LiveSocket
let liveSocket = new LiveSocket("/live", Socket, {
  hooks: { PhoneNumber },
});
```

## Hook Usage

```html
<input phx-hook="PhoneNumber" type="text" />
```

## Credit 🙌

Credit for this example goes to the
[Phoenix LiveView docs](https://hexdocs.pm/phoenix_live_view/js-interop.html#client-hooks-via-phx-hook). I didn't want
to reinvent the wheel, so I just copied the example from the Phoenix LiveView docs, added some types, and simplified it
a bit.
