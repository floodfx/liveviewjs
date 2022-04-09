import { HtmlSafeString } from "../templates";
import { LiveView } from "./liveView";

export interface LiveViewTemplate extends HtmlSafeString {}

export interface LiveViewRouter {
  [key: string]: LiveView;
}
