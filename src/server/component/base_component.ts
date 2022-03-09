import { SessionData } from "express-session";
import { LiveViewComponent, LiveViewMetadata, LiveViewMountParams, LiveViewSocket, LiveViewTemplate, StringPropertyValues } from ".";

export abstract class BaseLiveViewComponent<T, P> implements LiveViewComponent<T, P> {

  abstract mount(params: LiveViewMountParams, session: Partial<SessionData>, socket: LiveViewSocket<T>): T | Promise<T>;
  abstract render(context: T, meta: LiveViewMetadata): LiveViewTemplate | Promise<LiveViewTemplate>;

  handleParams(params: StringPropertyValues<P>, url: string, socket: LiveViewSocket<T>): T | Promise<T> {
    return socket.context;
  }

}