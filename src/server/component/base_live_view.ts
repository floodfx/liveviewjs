import { SessionData } from "express-session";
import { LiveView, LiveViewMeta, LiveViewMountParams, LiveViewSocket, LiveViewTemplate, StringPropertyValues } from ".";

export abstract class BaseLiveView<T, P> implements LiveView<T, P> {

  abstract mount(params: LiveViewMountParams, session: Partial<SessionData>, socket: LiveViewSocket<T>): T | Promise<T>;
  abstract render(context: T, meta: LiveViewMeta): LiveViewTemplate | Promise<LiveViewTemplate>;

  handleParams(params: StringPropertyValues<P>, url: string, socket: LiveViewSocket<T>): T | Promise<T> {
    return socket.context;
  }

}