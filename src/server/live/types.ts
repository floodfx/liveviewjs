import { HtmlSafeString } from "../templates";
import { AnyLiveContext, AnyLiveEvent, AnyLiveInfo, LiveView } from "./liveView";

export interface LiveViewTemplate extends HtmlSafeString {}

export interface LiveViewRouter {
  [key: string]: LiveView<AnyLiveContext, AnyLiveEvent, AnyLiveInfo>;
}
