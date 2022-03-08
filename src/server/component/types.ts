import { WebSocket } from "ws";
import { HtmlSafeString } from "../templates";
import { LiveViewComponent } from "./live_view";

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

export interface PushPatchPathAndParams {
  to: { path: string, params: Record<string, unknown> }
}

export interface LiveViewSocket<T> {
  id: string;
  connected: boolean; // true for websocket, false for http request
  context: T;
  ws?: WebSocket;
  sendInternal: (event: unknown) => void;
  repeat: (fn: () => void, intervalMillis: number) => void;
  pageTitle: (newPageTitle: string) => void;
  subscribe: (topic: string) => void;
  pushPatch: (params: PushPatchPathAndParams) => void;
}

export interface LiveViewTemplate extends HtmlSafeString {
}



export interface LiveViewRouter {
  [key: string]: LiveViewComponent<unknown, unknown>;
}


