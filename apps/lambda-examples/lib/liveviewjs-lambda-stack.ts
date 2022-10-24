import { HttpApi, HttpMethod, WebSocketApi, WebSocketStage } from "@aws-cdk/aws-apigatewayv2-alpha";
import { HttpLambdaIntegration, WebSocketLambdaIntegration } from "@aws-cdk/aws-apigatewayv2-integrations-alpha";
import { CfnOutput, Stack, StackProps } from "aws-cdk-lib";
import { PolicyStatement } from "aws-cdk-lib/aws-iam";
import { Runtime } from "aws-cdk-lib/aws-lambda";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import { Construct } from "constructs";

/**
 * The CDK Stack for LiveViewJS that deploys the HTTP and WebSocket API Gateway endpoints
 * along with the Lambda functions that handle the requests.
 */
export class LiveViewJSLambdaStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // Lambda function for Websocket requests
    const websocketLambdaFn = new NodejsFunction(this, "LiveViewJS WS Fn", {
      entry: "src/lambdas/websocket.ts",
      runtime: Runtime.NODEJS_16_X,
    });

    // API Gateway for Websocket requests
    const webSocketApi = new WebSocketApi(this, "LiveViewJS WS APIG", {
      connectRouteOptions: { integration: new WebSocketLambdaIntegration("connect", websocketLambdaFn) },
      disconnectRouteOptions: { integration: new WebSocketLambdaIntegration("disconnect", websocketLambdaFn) },
      defaultRouteOptions: { integration: new WebSocketLambdaIntegration("default", websocketLambdaFn) },
    });
    // grant permissions for the Lambda function to send messages back to the client
    webSocketApi.grantManageConnections(websocketLambdaFn);

    // The stage for the Websocket API Gateway
    new WebSocketStage(this, "LiveViewJS WS APIG Stage", {
      webSocketApi,
      // the stageName must be "websocket" because that is part of the
      // URL that the LiveViewJS client will connect to
      stageName: "websocket", //
      autoDeploy: true,
    });

    // Lambda function for HTTP requests
    const httpLambdaFn = new NodejsFunction(this, "LiveViewJS HTTP Fn", {
      entry: "src/lambdas/http.ts",
      runtime: Runtime.NODEJS_16_X,
      bundling: {
        commandHooks: {
          beforeBundling(inputDir: string, outputDir: string) {
            return [
              // run esbuild to bundle the client-side JS
              `npm run build:client -w apps/lambda-examples`,
              // copy public folder to outputDir
              `cp -r ${inputDir}/apps/lambda-examples/public ${outputDir}`,
            ];
          },
          afterBundling() {
            // no-op
            return [];
          },
          beforeInstall() {
            // no-op
            return [];
          },
        },
      },
    });
    const arnToReadApiGateways = this.formatArn({
      service: "apigateway",
      resource: "/apis",
      account: "", // arn requires empty account for some reason
    });
    httpLambdaFn.addToRolePolicy(
      new PolicyStatement({ actions: ["apigateway:GET"], resources: [arnToReadApiGateways] })
    );

    // API Gateway for HTTP requests
    const httpApi = new HttpApi(this, "LiveViewJS HTTP APIG");
    // Route all requests to the Lambda function
    httpApi.addRoutes({
      path: "/{proxy+}",
      methods: [HttpMethod.ANY],
      integration: new HttpLambdaIntegration("http", httpLambdaFn),
    });

    // print out the LiveViewJS App URL
    new CfnOutput(this, "URL", { value: httpApi.url! });
  }
}
