import { HtmlSafeString } from "../templates";
import { LiveView, LiveViewContext } from "./live_view";

// Validation errors for a type T should
// be keyed by the field name
export type LiveViewChangesetErrors<T> = {
  [Property in keyof T]?: string;
};

// Changeset represents the state of a form
// as it is validated and submitted by the user
export interface LiveViewChangeset<T> {
  action?: string; //
  changes: Partial<T>; // diff between initial and updated
  errors?: LiveViewChangesetErrors<T>; // validation errors by field name of T
  data: T | Partial<T>; // merged data
  valid: boolean; // true if no validation errors
}

export interface LiveViewTemplate extends HtmlSafeString {}

export interface LiveViewRouter {
  [key: string]: LiveView<LiveViewContext, unknown>;
}
