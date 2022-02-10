import { SessionData } from "express-session";
import { WebSocket } from "ws";
import { HtmlSafeString } from "../templates";

// Validation errors for a type T should
// be keyed by the field name
export type LiveViewChangesetErrors<T> = {
  [Property in keyof T]?: string
}

// Changeset represents the state of a form
// as it is validated and submitted by the user
export interface LiveViewChangeset<T> {
  action?: string //
  changes: Partial<T> // diff between initial and updated
  errors?: LiveViewChangesetErrors<T> // validation errors by field name of T
  data: T | Partial<T> // merged data
  valid: boolean // true if no validation errors
}

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

export interface LiveViewSessionParams extends Record<string, string> { }

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


