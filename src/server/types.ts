import { SessionData } from "express-session";
import { WebSocket } from "ws";
import { LiveViewComponentManager } from "./socket/component_manager";
import { PhxOutgoingLivePatchPush } from "./socket/types";
import { HtmlSafeString } from "./templates";

export interface LiveViewSocket<T> {
  id: string;
  connected: boolean; // true for websocket, false for http request
  context: T;
  ws?: WebSocket;
  sendInternal: (event: unknown) => void;
  repeat: (fn: () => void, intervalMillis: number) => void;
}

export interface LiveViewTemplate extends HtmlSafeString {
}

export interface LiveViewMountParams {
  ["_csrf_token"]: string;
  ["_mounts"]: number
}

export interface LiveViewSessionParams {
  [key: string]: string;
}

// params on url are strings
export type StringPropertyValues<Type> = { [Property in keyof Type]: string; };

export interface LiveViewComponent<T, P> {

  mount(params: LiveViewMountParams, session: Partial<SessionData>, socket: LiveViewSocket<T>): T;
  render(context: T): LiveViewTemplate;
  handleParams(params: StringPropertyValues<P>, url: string, socket: LiveViewSocket<T>): T;

}

// TODO: support event returing Partial<T>?
export interface LiveViewExternalEventListener<T, E extends string, P> {
  handleEvent(event: E, params: StringPropertyValues<P>, socket: LiveViewSocket<T>): T;
}

// TODO: support event returing Partial<T>?
export interface LiveViewInternalEventListener<T, E> {
  handleInfo(event: E, socket: LiveViewSocket<T>): T;
}

export interface LiveViewRouter {
  [key: string]: LiveViewComponent<unknown, unknown>;
}

export abstract class BaseLiveViewComponent<T, P> implements LiveViewComponent<T, P> {

  private componentManager: LiveViewComponentManager;

  abstract mount(params: any, session: any, socket: LiveViewSocket<T>): T;
  abstract render(context: T): LiveViewTemplate;

  handleParams(params: StringPropertyValues<P>, url: string, socket: LiveViewSocket<T>): T {
    return socket.context;
  }

  pushPatch(socket: LiveViewSocket<unknown>, patch: { to: { path: string, params: StringPropertyValues<any> } }) {
    if (this.componentManager) {
      this.componentManager.onPushPatch(socket, patch);
    } else {
      console.error("component manager not registered for component", this);
    }
  }

  registerComponentManager(manager: LiveViewComponentManager) {
    this.componentManager = manager;
  }

}
