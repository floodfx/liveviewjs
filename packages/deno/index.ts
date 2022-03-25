import { serve } from "https://deno.land/std/http/mod.ts";
import { acceptWebSocket } from "https://deno.land/std/ws/mod.ts"
async function reqHandler(req: Request) {
  console.log("req", req)
  if (req.headers.get("upgrade") != "websocket") {
    return new Response(null, { status: 501 });
  }
  const { socket: ws, response } = Deno.upgradeWebSocket(req);
  return response;
}
serve(reqHandler, { port: 8000 });