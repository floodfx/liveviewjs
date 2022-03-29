import { HtmlSafeString } from "../templates";
import { LiveView, LiveViewContext } from "./live_view";

export interface LiveViewTemplate extends HtmlSafeString {}

export interface LiveViewRouter {
  [key: string]: LiveView<LiveViewContext, unknown>;
}
