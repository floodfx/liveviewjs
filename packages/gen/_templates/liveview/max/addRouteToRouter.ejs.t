---
inject: true
to: src/server/liveview/router.ts
after: liveRouter
---
  "<%= route %>": <%= h.inflection.camelize(name, false) %>,