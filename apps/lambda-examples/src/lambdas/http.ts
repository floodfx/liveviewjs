import { APIGatewayProxyHandlerV2 } from "aws-lambda";
import { ApiGatewayV2 } from "aws-sdk";
import fs from "fs";
import path from "path";
import { liveView } from "src/example";
import { indexHandler } from "src/example/indexHandler";

// read favicon.ico from the filesystem
const faviconIco = fs.readFileSync(path.join(__dirname, "public", "favicon.ico")).toString("base64");

// lazy load the index.js file
let indexJs: string | undefined;

// use the liveView middleware to handle HTTP requests
const httpHandler = liveView.httpMiddleware();

/**
 * Entry point for the Lambda function that handles HTTP requests
 */
export const handler: APIGatewayProxyHandlerV2 = async (event, context, cb) => {
  // route based on path
  switch (event.rawPath) {
    case "/js/index.js":
      // lazy load index.js
      if (!indexJs) {
        indexJs = await replacePlaceholderUrl(
          fs.readFileSync(path.join(__dirname, "public", "js", "index.js"), "utf8")
        );
      }
      return {
        statusCode: 200,
        headers: {
          "Content-Type": "application/javascript",
        },
        body: indexJs,
      };
    case "/favicon.ico":
      return {
        statusCode: 200,
        headers: {
          "Content-Type": "image/x-icon",
        },
        body: faviconIco,
        isBase64Encoded: true,
      };
    case "/":
      return await indexHandler(event, context, cb);
    default:
      // handle all other requests with the LiveViewServer
      return await httpHandler(event, context, cb);
  }
};

/**
 * Replace the placeholder URL in index.js with the actual URL
 * for the Websocket API Gateway
 */
async function replacePlaceholderUrl(data: string): Promise<string> {
  // look up an api gateway in current region
  // with the name "LiveViewJS WS APIG"
  const apiGatewayId = await findApiGatewayId("LiveViewJS WS APIG");
  return data.replace("WS_APIG_ID", apiGatewayId ?? "unknown");
}

/**
 * Look up an API Gateway by name
 * @param nextToken optional nextToken for pagination
 */
async function findApiGatewayId(name: string, nextToken?: string): Promise<string | undefined> {
  const apiGateway = new ApiGatewayV2();
  return new Promise((resolve, reject) => {
    apiGateway.getApis({ NextToken: nextToken }, async (err, data) => {
      if (err) {
        reject(err);
      } else {
        try {
          data.Items?.forEach((item) => {
            if (item.Name === name) {
              resolve(item.ApiId);
            }
          });
          if (data.NextToken) {
            resolve(await findApiGatewayId(name, data.NextToken));
          }
          resolve(undefined);
        } catch (e) {
          reject(e);
        }
      }
    });
  });
}
