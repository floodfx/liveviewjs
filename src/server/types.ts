import { PhxSocket } from "./socket/types";
import { HtmlSafeString } from "./templates";


export interface LiveViewContext<T> {
  data: T;
}

export interface LiveViewTemplate extends HtmlSafeString {
}

export interface LiveViewComponent<T> {

  mount: (params: any, session: any, socket: PhxSocket) => LiveViewContext<T>;
  render: (context: LiveViewContext<T>) => LiveViewTemplate;

}

// TODO: support event returing Partial<T>?
export interface LiveViewExternalEventListener<T, E extends string, P> {
  handleEvent: (event: Lowercase<E>, params: P, socket: PhxSocket) => LiveViewContext<T>;
}

// TODO: support event returing Partial<T>?
export interface LiveViewInternalEventListener<T, E> {
  handleInfo: (event: E, socket: PhxSocket) => LiveViewContext<T>;
}

export interface LiveViewRouter {
  [key: string]: LiveViewComponent<any>;
}

