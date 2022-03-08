import { SessionData } from "express-session";
import { LiveComponent, LiveViewSocket, LiveViewTemplate } from ".";


/**
 * Paramter passed into the `mount` function of a LiveViewComponent.
 */
export interface LiveViewMountParams {
  /**
   * The cross site request forgery token from the `LiveView` html page.
   */
  ["_csrf_token"]: string
  /**
   * The number of mounts for this `LiveView` component.
   */
  ["_mounts"]: number
}


export interface LiveViewComponent<Context, Params> {

  mount(params: LiveViewMountParams, session: Partial<SessionData>, socket: LiveViewSocket<Context>): Context | Promise<Context>;
  render(context: Context): LiveViewTemplate;
  handleParams(params: StringPropertyValues<Params>, url: string, socket: LiveViewSocket<Context>): Context | Promise<Context>;

}

// TODO: support event returing Partial<T>?
export interface LiveViewExternalEventListener<Context, Event extends string, Params> {
  handleEvent(event: Event, params: StringPropertyValues<Params>, socket: LiveViewSocket<Context>): Context | Promise<Context>;
}

// TODO: support event returing Partial<T>?
export interface LiveViewInternalEventListener<T, E> {
  handleInfo(event: E, socket: LiveViewSocket<T>): T | Promise<T>;
}

// params on url are strings
export type StringPropertyValues<Type> = { [Property in keyof Type]: string;};


interface LiveViewMetadata {
  csrfToken: string
  liveComponent: <Context, LC extends LiveComponent<Context>>(liveComponent: LC, params: StringPropertyValues<Context>) => LiveViewTemplate
}