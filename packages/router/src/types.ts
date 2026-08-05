import type { LiveViewTemplate } from "@liveviewjs/core";

export interface LayoutProps {
  children: LiveViewTemplate | string;
  currentPath: string;
  pathParams: Record<string, string>;
  queryParams: Record<string, string>;
}

export type LayoutFunction = (props: LayoutProps) => LiveViewTemplate | string;

export interface RouteDefinition<T = any> {
  pathPattern: string;
  filePath?: string;
  component: T;
  layouts?: LayoutFunction[];
}

export interface MatchResult<T = any> {
  route: RouteDefinition<T>;
  params: Record<string, string>;
  queryParams: Record<string, string>;
}

export interface LayoutResolverOptions {
  childContent: LiveViewTemplate | string;
  layouts?: LayoutFunction[];
  currentPath: string;
  pathParams: Record<string, string>;
  queryParams: Record<string, string>;
  optOut?: boolean;
}
