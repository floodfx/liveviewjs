---
sidebar_position: 1
---

# Security Topics

Here are some security topics to consider when using LiveViewJS.

## Authenticity Tokens / CSRF Protection

We use CSRF tokens (a.k.a. Authenticity Tokens) to protect against Cross-Site Request Forgery (CSRF) attacks. CSRF
attacks are a type of malicious exploit where unauthorized commands are performed on behalf of an authenticated user.

### Websocket Join Authenticity

Every LiveView page load embeds a CSRF token in the page header in a `meta` tag named `csrf-token`. This token is
created by **LiveViewJS** when the HTML page is initially rendered. The **LiveViewJS** client-side code automatically
pulls in that token and sends it to the server as part of the websocket join phase where it is used to verify that the
request is legitimate.

### LiveViewJS Forms Authenticity

LiveViewJS expects forms to have an input named `_csrf_token`. This input field is automatically added to forms by the
`form_for` helper and populated by the csrf token passed in during join. If you don't use `form_for` you can add a
hidden input with the name `_csrf_token` and populate it yourself. When the form is submitted, the `_csrf_token` input
field is sent to the server along with the form data. The **LiveViewJS** server verifies that the submitted CSRF token
matches the CSRF token from the page header. If they do not match, the request is rejected. **If the CSRF token is
missing, the server prints out a warning but allows the form submission to continue.**

## Session Data

Part of the webserver integration is being able to pass any session data from the HTTP session to the LiveView websocket
session. **LiveViewJS** allows each webserver integration to implement a `getSessionData` method that returns a JSON
object containing the session data. **LiveViewJS** then uses the webserver integration's serializer/deserializer (a.k.a.
`SerDe`) to serialize this data to be passed to the server as part of the websocket join. The **LiveViewJS** server then
deserializes the session data and makes it available to the LiveView via the `session` property in `mount`.

### Default SerDe uses JWT

The default SerDe implementation uses JWT to serialize and deserialize the session data. This means that the session
data is signed (which prevents tampering) but not encrypted. If you want to encrypt the session data, you will have to
implement your own SerDe.

## Please Ask Questions 🎁

If there is something you are concerned about regarding security and LiveViewJS, please add an issue to the
[LiveViewJS GitHub repo](https://github.com/floodfx/liveviewjs/issues). We will do our best to answer your questions and
address any concerns you may have.
