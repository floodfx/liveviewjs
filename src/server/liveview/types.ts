import { PhxSocket } from "../socket/types";
import escapeHtml, { HtmlSafeString } from "./templates";


export interface LiveViewContext<T> {
  data: T;
}

export interface LiveViewTemplate extends HtmlSafeString {
}

export interface LiveViewComponent<T> {

  mount: (params: any, session: any, socket: PhxSocket) => LiveViewContext<T>;
  render: (context: LiveViewContext<T>) => LiveViewTemplate;

}

export interface LiveViewExternalEventListener<T, E extends string, P> {
  handleEvent: (event: Lowercase<E>, params: P, socket: PhxSocket) => LiveViewContext<T>;
}

export interface LiveViewInternalEventListener<T, E extends string> {
  handleInfo: (event: Lowercase<E>, socket: PhxSocket) => LiveViewContext<T>;
}

export interface LiveViewRouter {
  [key: string]: LiveViewComponent<any>;
}

