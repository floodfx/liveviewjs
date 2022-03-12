import { SessionData } from "express-session";
import { LiveView, LiveViewMeta, LiveViewMountParams, LiveViewTemplate, StringPropertyValues } from ".";
import { LiveViewSocket } from "../socket/live_socket";
import { LiveViewContext } from "./live_view";

export abstract class BaseLiveView<Context extends LiveViewContext, Params> implements LiveView<Context, Params> {

  mount(params: LiveViewMountParams, session: Partial<SessionData>, socket: LiveViewSocket<Context>){
    // no-op
  }

  abstract render(context: Context, meta: LiveViewMeta): LiveViewTemplate | Promise<LiveViewTemplate>;

  handleParams(params: StringPropertyValues<Params>, url: string, socket: LiveViewSocket<Context>) {
    // no-op
  }

}