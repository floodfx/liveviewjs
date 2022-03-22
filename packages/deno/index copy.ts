import { serve, Application } from "./deps.ts"

const app = new Application();

app.use((ctx) => {
  ctx.response.body = "Hello dsaffads!";
});

await app.listen({ port: 8000 });