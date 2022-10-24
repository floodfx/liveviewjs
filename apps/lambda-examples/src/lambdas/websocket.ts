import { liveView } from "src/example";

/**
 * Use the liveView middleware to handle Websocket requests
 */
export const handler = liveView.wsMiddleware();
