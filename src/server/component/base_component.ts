import { SessionData } from "express-session";
import { LiveViewComponent, LiveViewMountParams, LiveViewSocket, LiveViewTemplate, StringPropertyValues } from "./types";
import { LiveViewComponentManager } from "../socket/component_manager";

export abstract class BaseLiveViewComponent<T, P> implements LiveViewComponent<T, P> {

  private componentManager: LiveViewComponentManager;

  abstract mount(params: LiveViewMountParams, session: Partial<SessionData>, socket: LiveViewSocket<T>): T;
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

  csrfToken(): string | undefined {
    if (this.componentManager) {
      return this.componentManager.csrfToken;
    }
  }

  registerComponentManager(manager: LiveViewComponentManager) {
    this.componentManager = manager;
  }

}