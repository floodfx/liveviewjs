# 🖼 LiveViewJS for AWS Lambda (NodeJS)

The is a proof-of-concept that shows how you can host a "serverless" LiveViewJS application on AWS Lambda and API Gateway. The project loads the examples from the [LiveViewJS](https://liveviewjs.com) but you can adapt this to host your own LiveViewJS application.

## Status
This is a proof-of-concept and is NOT production ready for large volumes.  In particular, the following issues need to be addressed:
- API Gateway Websocket requests may not be handled in order that they were received (thus race conditions can occur)
- LiveViewJS currently keeps LiveView state in memory which may break in the 
case multiple lambda functions attempt to handle requests from the same LiveView

We can address these issue by storing LiveView state in a different data store (e.g. DynamoDB) and using a queue to ensure that requests are handled in order.  

## Summary AWS Architecture
The set of AWS resources that are created are pretty simple:
- API Gateway Websocket API passing requests to a Single Lambda function
- API Gateway HTTP API passing requests to a Single Lambda function

## Pre-requisites
You should have an AWS account and have the AWS CLI installed and configured with your credentials.

Run `npm install` to install dependencies.

## Deploy
This project uses AWS CDK to setup the infrastructure and deploy the code.

Deploy to AWS Lambda using `cdk deploy [--profile YOUR_AWS_PROFILE]`.

When the 

## Teardown
After you are done with the project you can remove the stack from your AWS account by running:

`cdk destroy [--profile YOUR_AWS_PROFILE]`
