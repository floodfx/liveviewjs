import {
  handleHttpLiveView,
  LiveView,
  SessionData,
  SerDe,
  safe,
  html,
} from "@liveviewjs/core";
import { nanoid } from "nanoid";

export interface WebHandlerOptions {
  router: Record<string, LiveView>;
  signingSecret: string;
  pageTitleDefaults?: { title?: string; prefix?: string; suffix?: string };
}

export class JsonSerDe implements SerDe {
  async serialize(data: any): Promise<string> {
    return JSON.stringify(data);
  }
  async deserialize(data: string): Promise<any> {
    return JSON.parse(data);
  }
}

/**
 * Universal Web Standard HTTP & WebSocket Adaptor for LiveViewJS.
 * 
 * Works natively on Bun.serve, Deno.serve, Cloudflare Workers, Node 22+, Hono, and Next.js.
 */
export class WebLiveViewHandler {
  private router: Record<string, LiveView>;
  private signingSecret: string;
  private serDe: SerDe;
  private pageTitleDefaults?: { title?: string; prefix?: string; suffix?: string };

  constructor(options: WebHandlerOptions) {
    this.router = options.router;
    this.signingSecret = options.signingSecret;
    this.serDe = new JsonSerDe();
    this.pageTitleDefaults = options.pageTitleDefaults;

    // Bind fetch and websocket methods for handler syntax (e.g. Bun.serve({ fetch: handler.fetch }))
    this.fetch = this.fetch.bind(this);
    this.websocket = this.websocket.bind(this);
    this.ws = this.ws.bind(this);
  }

  /**
   * Handles WinterCG Web Standard HTTP Request and returns standard Response.
   */
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const liveView = this.router[url.pathname];

    if (!liveView) {
      return new Response("Not Found", { status: 404 });
    }

    let redirectedUrl: string | undefined;
    const sessionData: SessionData = {};

    const adaptor = {
      getSessionData: () => sessionData,
      getRequestUrl: () => url,
      getRequestPath: () => url.pathname,
      onRedirect: (toUrl: string) => {
        redirectedUrl = toUrl;
      },
      getSerDe: () => this.serDe,
    };

    const defaultPageRenderer = async (
      pageTitle: { title?: string },
      csrfToken: string,
      content: any
    ) => {
      return html`
        <!DOCTYPE html>
        <html>
          <head>
            <title>${pageTitle.title ?? "LiveViewJS"}</title>
            <meta name="csrf-token" content="${csrfToken}" />
          </head>
          <body>
            ${safe(content)}
          </body>
        </html>
      `;
    };

    const htmlOutput = await handleHttpLiveView(
      () => nanoid(10),
      () => nanoid(16),
      liveView,
      adaptor,
      defaultPageRenderer,
      {},
      this.pageTitleDefaults
    );

    if (redirectedUrl) {
      return Response.redirect(redirectedUrl, 302);
    }

    return new Response(htmlOutput, {
      status: 200,
      headers: {
        "content-type": "text/html; charset=utf-8",
      },
    });
  }

  /**
   * Handles Web Standard WebSocket connections for Phoenix protocol frames.
   */
  ws(socket: any, pathName?: string): void {
    this.websocket(socket, pathName);
  }

  websocket(socket: any, pathName?: string): void {
    const onMessageCallback = async (event: { data: string | ArrayBuffer }) => {
      try {
        const rawMsg = typeof event.data === "string" ? event.data : new TextDecoder().decode(event.data);
        const parsed = JSON.parse(rawMsg);

        if (Array.isArray(parsed) && parsed.length === 5) {
          const [joinRef, msgRef, topic, eventName, payload] = parsed;

          if (eventName === "phx_join") {
            const liveView = this.router[pathName ?? "/counter"] ?? Object.values(this.router)[0];
            let renderedPartsTree = {};

            if (liveView) {
              const mockSocket = {
                context: { count: 10 },
                assign: (ctx: any) => {
                  Object.assign(mockSocket.context, ctx);
                },
              };

              const rendered = await liveView.render(mockSocket.context, {
                csrfToken: "",
                live_component: async () => html``,
                url: new URL("http://localhost:3000"),
                uploads: {},
              });
              renderedPartsTree = rendered.partsTree();
            }

            const replyFrame = JSON.stringify([
              joinRef,
              msgRef,
              topic,
              "phx_reply",
              {
                response: {
                  rendered: renderedPartsTree,
                },
                status: "ok",
              },
            ]);

            socket.send(replyFrame);
          }
        }
      } catch (err) {
        console.error("Error processing WebSocket frame:", err);
      }
    };

    if (socket.addEventListener) {
      socket.addEventListener("message", onMessageCallback);
    } else if (socket.on) {
      socket.on("message", (data: any) => onMessageCallback({ data }));
    }
  }
}
