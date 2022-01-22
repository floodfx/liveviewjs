import escapeHtml, { HtmlSafeString } from "./templates";


export interface LiveViewContext<T> {
  data: T;
}

export interface LiveViewTemplate extends HtmlSafeString {
}

export interface LiveViewComponent<T> {

  mount: (params: any, session: any, socket: any) => LiveViewContext<T>;
  render: (context: LiveViewContext<T>) => LiveViewTemplate;

}

export interface LiveViewExternalEventListener<T, E extends string, P> {
  handleEvent: (event: Lowercase<E>, params: P, socket: any) => LiveViewContext<T>;
}

export interface LiveViewRouter {
  [key: string]: LiveViewComponent<any>;
}

