import { NodeFileSystemAdatptor, NodeJwtSerDe } from "@liveviewjs/express";
import {
  APIGatewayProxyEventV2,
  APIGatewayProxyHandlerV2,
  APIGatewayProxyResultV2,
  APIGatewayProxyWebsocketEventV2,
  APIGatewayProxyWebsocketHandlerV2,
  Callback,
  Context,
} from "aws-lambda";
import { ApiGatewayManagementApi } from "aws-sdk";
import {
  FileSystemAdaptor,
  FlashAdaptor,
  handleHttpLiveView,
  HttpRequestAdaptor,
  LiveTitleOptions,
  LiveViewHtmlPageTemplate,
  LiveViewRouter,
  LiveViewServerAdaptor,
  LiveViewWrapperTemplate,
  matchRoute,
  PubSub,
  SerDe,
  SessionData,
  SessionFlashAdaptor,
  SingleProcessPubSub,
  WsAdaptor,
  WsMessageRouter,
} from "liveviewjs";
import { nanoid } from "nanoid";

/**
 * Adaptor that enables LiveView to send Websocket message back to the client
 */
class LambdaWSAdaptor implements WsAdaptor {
  // remember the event and callback so we can use them when send() is called
  event: APIGatewayProxyWebsocketEventV2;
  callback: Callback<APIGatewayProxyResultV2>;

  constructor(event: APIGatewayProxyWebsocketEventV2, callback: Callback<APIGatewayProxyResultV2<never>>) {
    this.event = event;
    this.callback = callback;
  }

  /**
   * Method called by LiveView to send a message back to the client.  Uses
   * the API Gateway Management API to send the message back to the client
   * based on the connectionId in the event that triggered the Lambda function.
   * @param message the message to send (provided by LiveView)
   * @param errorHandler errorHandler passed by LiveView to be called if there is an error
   */
  send(message: string, errorHandler?: (err: any) => void): void {
    const apigwManagementApi = new ApiGatewayManagementApi({
      apiVersion: "2018-11-29",
      endpoint: this.event.requestContext.domainName + "/" + this.event.requestContext.stage,
    });

    // use the connectionId from the event to send the message back to the client
    const connectionId = this.event.requestContext.connectionId;
    apigwManagementApi
      .postToConnection({ ConnectionId: connectionId, Data: message })
      .promise()
      .then(() => {
        // now that message was sent, use callback to report success
        this.callback(undefined, {
          statusCode: 200,
        });
      })
      .catch((err) => {
        if (errorHandler) {
          errorHandler(err);
        }
        // now that error was handled, use callback to report success
        // TODO should we return an error code here?
        this.callback(undefined, {
          statusCode: 200,
        });
      });
  }
}

/**
 * Options to pass into the LambdaLiveViewServer
 */
interface LambdaLiveViewServerOptions {
  serDe?: SerDe;
  serDeSigningSecret?: string;
  pubSub?: PubSub;
  flashAdaptor?: FlashAdaptor;
  fileSystemAdaptor?: FileSystemAdaptor;
  wrapperTemplate?: LiveViewWrapperTemplate;
}

/**
 * LiveViewServerAdaptor that enables LiveView to run in a Lambda function
 */
export class LambdaLiveViewServer
  implements LiveViewServerAdaptor<APIGatewayProxyHandlerV2<any>, APIGatewayProxyWebsocketHandlerV2>
{
  private router: LiveViewRouter;
  private serDe: SerDe;
  private flashAdapter: FlashAdaptor;
  private pubSub: PubSub;
  private fileSystem: FileSystemAdaptor;
  private htmlPageTemplate: LiveViewHtmlPageTemplate;
  private liveTitleOptions: LiveTitleOptions;
  private wrapperTemplate?: LiveViewWrapperTemplate;
  private _wsRouter: WsMessageRouter;

  constructor(
    router: LiveViewRouter,
    htmlPageTemplate: LiveViewHtmlPageTemplate,
    liveTitleOptions: LiveTitleOptions,
    options?: LambdaLiveViewServerOptions
  ) {
    this.router = router;
    this.serDe = options?.serDe ?? new NodeJwtSerDe(options?.serDeSigningSecret ?? nanoid());
    this.flashAdapter = options?.flashAdaptor ?? new SessionFlashAdaptor();
    this.pubSub = options?.pubSub ?? new SingleProcessPubSub();
    this.fileSystem = options?.fileSystemAdaptor ?? new NodeFileSystemAdatptor();
    this.htmlPageTemplate = htmlPageTemplate;
    this.liveTitleOptions = liveTitleOptions;
    this.wrapperTemplate = options?.wrapperTemplate;
    this._wsRouter = new WsMessageRouter(
      this.router,
      this.pubSub,
      this.flashAdapter,
      this.serDe,
      this.fileSystem,
      this.wrapperTemplate
    );
  }

  /**
   * Websocket "middleware" that handles incoming APIG websocket events
   * @returns the APIGatewayProxyWebsocketHandlerV2 that can be used as the handler for a Lambda function
   */
  wsMiddleware(): APIGatewayProxyWebsocketHandlerV2 {
    return (event: APIGatewayProxyWebsocketEventV2, context: Context, callback: Callback<APIGatewayProxyResultV2>) => {
      const connectionId = event.requestContext.connectionId;
      context.callbackWaitsForEmptyEventLoop = true;

      // route websocket requests based on the routeKey
      switch (event.requestContext.routeKey) {
        case "$connect":
          callback(null, { statusCode: 200 });
          break;
        case "$disconnect":
          // pass websocket close events to LiveViewJS
          this._wsRouter.onClose(connectionId);
          callback(null, { statusCode: 200 });
          break;
        default: // case "$default":
          // decode binary data from the client
          const isBinary = event.isBase64Encoded;
          const data = isBinary ? Buffer.from(event.body!, "base64") : event.body;

          // now pass to LiveView to handle
          const adaptor = new LambdaWSAdaptor(event, callback);
          this._wsRouter.onMessage(connectionId, data, adaptor, isBinary);
          callback(null, { statusCode: 200 });
      }
    };
  }

  /**
   * HTTP "middleware" that handles incoming APIG HTTP events
   * @returns the APIGatewayProxyHandlerV2 that can be used as the handler for a Lambda function
   */
  httpMiddleware(): APIGatewayProxyHandlerV2<any> {
    return async (event: APIGatewayProxyEventV2, context: Context, callback: Callback<APIGatewayProxyResultV2>) => {
      try {
        const adaptor = new ApiGatewayEventAdaptor(event, context, this.serDe);
        const { getRequestPath } = adaptor;

        // look up LiveView for route
        const matchResult = matchRoute(this.router, getRequestPath());
        if (!matchResult) {
          return { statusCode: 404, body: "Not Found" };
        }
        const [liveview, mr] = matchResult;

        // defer to liveviewjs to handle the request
        const rootViewHtml = await handleHttpLiveView(
          nanoid,
          nanoid,
          liveview,
          adaptor,
          this.htmlPageTemplate,
          mr.params,
          this.liveTitleOptions,
          this.wrapperTemplate
        );

        // check if LiveView calls for a redirect and if so, do it
        if (adaptor.redirect) {
          return {
            statusCode: 302,
            headers: {
              Location: adaptor.redirect,
            },
          };
        }

        // otherwise render the LiveView HTML
        return {
          statusCode: 200,
          headers: {
            "Content-Type": "text/html",
          },
          body: rootViewHtml,
        };
      } catch (error) {
        console.error("Error handling request", error);
        return {
          statusCode: 500,
          body: "Internal Server Error",
        };
      }
    };
  }

  get wsRouter(): WsMessageRouter {
    return this._wsRouter;
  }
}

/**
 * Adaptor for API Gateway HTTP requests
 */
class ApiGatewayEventAdaptor implements HttpRequestAdaptor {
  redirect: string | undefined;
  private event: APIGatewayProxyEventV2;
  private context: Context;
  private serDe: SerDe;
  constructor(event: APIGatewayProxyEventV2, context: Context, serDe: SerDe) {
    this.event = event;
    this.context = context;
    this.serDe = serDe;
  }

  getSessionData = (): SessionData => {
    return {}; // TODO use cookies?
  };
  getRequestParameters = (): { [key: string]: any } => {
    return this.event.queryStringParameters ?? {};
  };
  getRequestUrl = (): URL => {
    const protocol = this.event.headers["x-forwarded-proto"] || "http";
    const host = this.event.headers.host;
    const path = this.event.rawPath;
    return new URL(protocol + "://" + host + path);
  };
  getRequestPath = (): string => {
    return this.event.requestContext.http.path;
  };
  onRedirect = (to: string) => {
    this.redirect = to;
  };
  getSerDe = (): SerDe => {
    return this.serDe;
  };
}
