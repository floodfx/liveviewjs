import { routeDetails } from "@liveviewjs/examples";
import { APIGatewayProxyHandlerV2 } from "aws-lambda";

/**
 * Show the list of examples when the "index" route is requested
 */
export const indexHandler: APIGatewayProxyHandlerV2 = async (event, context, cb) => {
  // build route detail elements
  const routesContent = routeDetails.map((route) => {
    return `
      <div>
        <hr />
        <h3>${route.label}</h3>
        <p>${route.summary}</p>
        <p>
          <a href="${route.path}">👀 Live Demo</a>
          <br />
          <a href="https://github.com/floodfx/liveviewjs/tree/main/packages/examples/src/liveviews${
            route.gitPath ?? route.path
          }">📦 Source Code</a>
        </p>
        <p><strong>Tags</strong>
          ${route.tags.map((tag) => `<mark>${tag}</mark>`).join(", ")}
        </p>
        <hr />
      </div>`;
  });

  // render the page
  return {
    statusCode: 200,
    headers: {
      "Content-Type": "text/html",
    },
    body: `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="utf-8" />
          <meta http-equiv="X-UA-Compatible" content="IE=edge" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <title>Express Demo</title>
          <script
            defer
            type="text/javascript"
            src="https://cdn.deno.land/liveviewjs/versions/0.3.0/raw/packages/examples/dist/liveviewjs-examples.browser.js"></script>
          <link rel="stylesheet" href="https://unpkg.com/nprogress@0.2.0/nprogress.css" />
          <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@exampledev/new.css@1.1.2/new.min.css" />
        </head>
        <body>
          <h2>🙌 Welcome to the LiveViewJS Examples!</h2>
          <p>
            Below are various examples of LiveViewJS pages with links to the source code.
          </p>
          <p>
            If you have any questions feel free to <a href="https://github.com/floodfx/liveviewjs/issues">open an issue on GitHub</a>.
          </p>
          <p>
            <a href="http://liveviewjs.com">📚 Learn more about LiveViewJS</a>.
          </p>
          ${routesContent.join("")}
        </body>
      </html>
    `,
  };
};
