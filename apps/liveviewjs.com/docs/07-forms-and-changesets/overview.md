---
sidebar_position: 1
---

# Overview

Forms are obviously extremely important for any web application that needs user input. Building, validating, and
handling form submission is built into **LiveViewJS** forms .

## Form Bindigs

We've already reviewed the form event bindings that are available in LiveViewJS. Here is a quick summary:

- `phx-change` - This event is sent to the server along with all the form values when any form input is changed.
- `phx-submit` - This event is sent to the server when the form is submitted alog with all the form values.

Feel free to review form events in more detail in the
[User Events and Bindings](/docs/user-events-slash-bindings/overview) section.

## Changesets

We have not yet discussed the concept of a "changeset" in LiveViewJS. At a high level a changeset is a way to parse and
validate that incoming JSON data maps to the expected constraints. You will see it is a very powerful concept that
allows you to build and validate complex forms with ease.

:::note Changesets are a concept that is taken from an Elixir library called
[Ecto](https://hexdocs.pm/ecto/Ecto.Changeset.html). Ecto changesets are used to validate and persist data to a
database. While **LiveViewJS** changeset are not ORM or DB releated, we've taken the concept of a changeset and adapted
it to the Typescript world for parsing and validation. :::

We will take a deep dive into Changesets in a more detail in the next section.
