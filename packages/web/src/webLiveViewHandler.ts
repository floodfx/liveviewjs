import {
  handleHttpLiveView,
  LiveView,
  SessionData,
  SerDe,
  WsAdaptor,
  WsHandler,
  SingleProcessPubSub,
  SessionFlashAdaptor,
  FileSystemAdaptor,
  nanoid,
  safe,
  html,
} from "@liveviewjs/core";

export interface WebHandlerOptions {
  router: Record<string, LiveView>;
  signingSecret?: string;
  pageTitleDefaults?: { title?: string; prefix?: string; suffix?: string };
  wsPath?: string;
}

export class JsonSerDe implements SerDe {
  async serialize(data: any): Promise<string> {
    return JSON.stringify(data);
  }
  async deserialize(data: string): Promise<any> {
    if (!data || data === "") return {};
    try {
      return JSON.parse(data);
    } catch {
      return {};
    }
  }
}

export class DefaultFileSystemAdaptor implements FileSystemAdaptor {
  tempPath(lastPathPart: string): string {
    return `/tmp/${lastPathPart}`;
  }
  writeTempFile(dest: string, data: Buffer): void {}
  createOrAppendFile(dest: string, src: string): void {}
}

/**
 * Web Standard WebSocket Adaptor bridging native WebSockets to LiveViewJS WsHandler.
 */
export class WebStandardWsAdaptor implements WsAdaptor {
  private socket: any;
  private messageListeners: Array<(data: Buffer, isBinary: boolean) => Promise<void> | void> = [];
  private closeListeners: Array<() => void> = [];
  private isClosedState = false;

  constructor(socket: any) {
    this.socket = socket;

    const onMessage = async (event: { data: string | ArrayBuffer }) => {
      const isBinary = typeof event.data !== "string";
      const buffer = isBinary
        ? Buffer.from(event.data as ArrayBuffer)
        : Buffer.from(event.data as string, "utf-8");

      for (const listener of this.messageListeners) {
        await listener(buffer, isBinary);
      }
    };

    const onClose = () => {
      this.isClosedState = true;
      for (const listener of this.closeListeners) {
        listener();
      }
    };

    socket._onMessage = onMessage;
    socket._onClose = onClose;

    if (socket.addEventListener) {
      socket.addEventListener("message", onMessage);
      socket.addEventListener("close", onClose);
    } else if (socket.on) {
      socket.on("message", (data: any, isBinary?: boolean) => {
        onMessage({ data });
      });
      socket.on("close", onClose);
    }
  }

  subscribeToMessages(cb: (data: Buffer, isBinary: boolean) => void): void {
    this.messageListeners.push(cb);
  }

  subscribeToClose(cb: () => void): void {
    this.closeListeners.push(cb);
  }

  send(message: string, errorHandler?: (err: any) => void): void {
    try {
      this.socket.send(message);
    } catch (err) {
      if (errorHandler) errorHandler(err);
    }
  }

  isClosed(): boolean {
    return this.isClosedState;
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
  private wsPath: string;
  private pubSub = new SingleProcessPubSub();
  private flashAdaptor = new SessionFlashAdaptor();
  private fileSysAdaptor = new DefaultFileSystemAdaptor();

  constructor(options: WebHandlerOptions) {
    this.router = options.router;
    this.signingSecret = options.signingSecret ?? "default-secret-key-1234567890";
    this.serDe = new JsonSerDe();
    this.pageTitleDefaults = options.pageTitleDefaults;
    this.wsPath = options.wsPath ?? "/live/websocket";

    // Bind fetch and websocket methods for handler syntax (e.g. Bun.serve(handler.bun()))
    this.fetch = this.fetch.bind(this);
    this.websocket = this.websocket.bind(this);
    this.ws = this.ws.bind(this);
    this.handleMessage = this.handleMessage.bind(this);
    this.handleClose = this.handleClose.bind(this);
    this.bun = this.bun.bind(this);
  }

  /**
   * One-line Bun.serve configuration options: Bun.serve(handler.bun({ port: 3000 }))
   */
  bun(options?: { port?: number; hostname?: string }): any {
    const handlerSelf = this;
    return {
      port: options?.port ?? 3000,
      hostname: options?.hostname,
      fetch(req: Request, serverRef: any) {
        const url = new URL(req.url);
        if (
          req.headers.get("upgrade")?.toLowerCase() === "websocket" ||
          url.pathname.startsWith(handlerSelf.wsPath)
        ) {
          const success = serverRef.upgrade(req, {
            data: { pathName: url.pathname },
          });
          if (success) return undefined;
        }
        return handlerSelf.fetch(req);
      },
      websocket: {
        open(ws: any) {
          handlerSelf.websocket(ws, ws.data?.pathName);
        },
        async message(ws: any, message: any) {
          await handlerSelf.handleMessage(ws, message);
        },
        close(ws: any) {
          handlerSelf.handleClose(ws);
        },
      },
    };
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
   * Direct message dispatch helper for Bun.serve / Deno.serve websocket options.
   */
  async handleMessage(socket: any, message: string | Buffer): Promise<void> {
    if (socket._onMessage) {
      await socket._onMessage({ data: message });
    }
  }

  /**
   * Direct close dispatch helper for Bun.serve / Deno.serve websocket options.
   */
  handleClose(socket: any): void {
    if (socket._onClose) {
      socket._onClose();
    }
  }

  /**
   * Handles Web Standard WebSocket connections using core WsHandler engine.
   */
  ws(socket: any, pathName?: string): void {
    this.websocket(socket, pathName);
  }

  websocket(socket: any, pathName?: string): void {
    const wsAdaptor = new WebStandardWsAdaptor(socket);

    const wsHandler = new WsHandler(wsAdaptor, {
      serDe: this.serDe,
      router: this.router,
      fileSysAdaptor: this.fileSysAdaptor,
      flashAdaptor: this.flashAdaptor,
      pubSub: this.pubSub,
    });
  }
}
