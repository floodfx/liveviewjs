import { WebSocket } from "ws";
import { LiveViewContext } from "../component";

export interface LiveViewSocket<T extends LiveViewContext> {
  id: string;
  connected: boolean; // true for websocket, false for http request
  context: T;
  ws?: WebSocket;
  assign: (context: Partial<T>) => T;
  send: (event: unknown) => void;
  repeat: (fn: () => void, intervalMillis: number) => void;
  pageTitle: (newPageTitle: string) => void;
  subscribe: (topic: string) => void;
  pushPatch: (path: string, params: Record<string, string | number>) => void;
  pushEvent: (event: string, params: Record<string, any>) => void;
}

// export class WSLiveViewSocket<T extends {[key: string]: unknown}> implements LiveViewSocket<T> {

//   readonly id: string;
//   readonly connected: boolean; // true for websocket, false for http request
//   readonly ws?: WebSocket;
//   readonly context: T;

//   constructor() {

//   }
//   subscribe: (topic: string) => void;
//   pushPatch: (path: string, params: Record<string, string | number>) => void;
//   pushEvent: (event: string, params: Record<string, any>) => void;

//   assign(context: Partial<T>): T {
//     const partialData = fromJS(context);
//     return mergeDeep(partialData, this.context).toJS() as T;
//   }

//   send(event: unknown) {

//   }

//   repeat(fn: () => void, intervalMillis: number) {

//   }

//   pageTitle: (newTitle: string) {
//     this.pageTitle = newTitle
//   }
//   subscribe: (topic: string) => {
//     const subId = PubSub.subscribe(topic, (event) => this.sendInternal(event))
//     this.subscriptionIds[topic] = subId;
//   },
//   pushPatch: (params: PushPatchPathAndParams) => {
//     this.onPushPatch(params);
//   },
//   pushEvent: (event: string, params: Record<string, any>) => {
//     this.onPushEvent(event, params);
//   }

// }