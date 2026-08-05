import { describe, expect, it } from "bun:test";
import * as path from "node:path";
import {
  createModuleMapRouter,
  createFileSystemRouter,
  normalizeFilePathToRoute,
  matchRoute,
  resolveCascadingLayout,
  type LayoutProps,
} from "./index";

describe("@liveviewjs/router", () => {
  describe("normalizeFilePathToRoute", () => {
    it("converts file paths into URL route patterns", () => {
      expect(normalizeFilePathToRoute("index.tsx")).toBe("/");
      expect(normalizeFilePathToRoute("about.tsx")).toBe("/about");
      expect(normalizeFilePathToRoute("users/index.tsx")).toBe("/users");
      expect(normalizeFilePathToRoute("users/[id].tsx")).toBe("/users/:id");
      expect(normalizeFilePathToRoute("users/[id]/settings.tsx")).toBe("/users/:id/settings");
      expect(normalizeFilePathToRoute("docs/[...slug].tsx")).toBe("/docs/*");
    });
  });

  describe("matchRoute", () => {
    const routes = [
      { pathPattern: "/", component: "HomeView" },
      { pathPattern: "/about", component: "AboutView" },
      { pathPattern: "/users", component: "UsersListView" },
      { pathPattern: "/users/new", component: "NewUserView" },
      { pathPattern: "/users/:id", component: "UserProfileView" },
      { pathPattern: "/users/:id/settings", component: "UserSettingsView" },
      { pathPattern: "/docs/*", component: "DocsView" },
    ];

    it("matches exact static routes", () => {
      const match = matchRoute(routes, "/about");
      expect(match).toBeDefined();
      expect(match?.route.component).toBe("AboutView");
      expect(match?.params).toEqual({});
    });

    it("matches dynamic path parameters and extracts typed values", () => {
      const match = matchRoute(routes, "/users/42");
      expect(match).toBeDefined();
      expect(match?.route.component).toBe("UserProfileView");
      expect(match?.params).toEqual({ id: "42" });
    });

    it("extracts query parameters along with path parameters", () => {
      const match = matchRoute(routes, "/users/42/settings?theme=dark&tab=security");
      expect(match).toBeDefined();
      expect(match?.route.component).toBe("UserSettingsView");
      expect(match?.params).toEqual({ id: "42" });
      expect(match?.queryParams).toEqual({ theme: "dark", tab: "security" });
    });

    it("prioritizes exact static routes over dynamic parameter routes", () => {
      const match = matchRoute(routes, "/users/new");
      expect(match).toBeDefined();
      expect(match?.route.component).toBe("NewUserView");
      expect(match?.params).toEqual({});
    });

    it("matches catch-all wildcard routes", () => {
      const match = matchRoute(routes, "/docs/api/v2/overview");
      expect(match).toBeDefined();
      expect(match?.route.component).toBe("DocsView");
      expect(match?.params).toEqual({ slug: "api/v2/overview" });
    });
  });

  describe("resolveCascadingLayout", () => {
    it("wraps child content in layout component and passes nav context", () => {
      const rootLayout = (props: LayoutProps) =>
        `<header path="${props.currentPath}">${props.children}</header>`;

      const wrapped = resolveCascadingLayout({
        childContent: "<main>User 42</main>",
        layouts: [rootLayout],
        currentPath: "/users/42",
        pathParams: { id: "42" },
        queryParams: { sort: "asc" },
      });

      expect(wrapped).toBe('<header path="/users/42"><main>User 42</main></header>');
    });

    it("cascades multiple nested layouts from root to child", () => {
      const rootLayout = (props: LayoutProps) => `<div class="root">${props.children}</div>`;
      const userLayout = (props: LayoutProps) => `<div class="user-layout">${props.children}</div>`;

      const wrapped = resolveCascadingLayout({
        childContent: "<p>Settings</p>",
        layouts: [rootLayout, userLayout],
        currentPath: "/users/42/settings",
        pathParams: { id: "42" },
        queryParams: {},
      });

      expect(wrapped).toBe('<div class="root"><div class="user-layout"><p>Settings</p></div></div>');
    });

    it("allows views to opt out of layouts when layout is null", () => {
      const rootLayout = (props: LayoutProps) => `<div class="root">${props.children}</div>`;

      const wrapped = resolveCascadingLayout({
        childContent: "<html>Standalone Login Page</html>",
        layouts: [rootLayout],
        currentPath: "/login",
        pathParams: {},
        queryParams: {},
        optOut: true,
      });

      expect(wrapped).toBe("<html>Standalone Login Page</html>");
    });
  });

  describe("createModuleMapRouter", () => {
    it("builds type-safe route table from module map", () => {
      const mockModules = {
        "./liveviews/_layout.tsx": { default: () => "Layout" },
        "./liveviews/index.tsx": { default: "HomeView" },
        "./liveviews/users/[id].tsx": { default: "UserView" },
      };

      const router = createModuleMapRouter(mockModules);
      expect(router.routes.length).toBe(2);

      const match = router.match("/users/99");
      expect(match).toBeDefined();
      expect(match?.route.component).toBe("UserView");
      expect(match?.params).toEqual({ id: "99" });
    });
  });

  describe("createFileSystemRouter", () => {
    it("scans example directory and matches routes across disk runtimes", () => {
      const exampleDir = path.resolve(__dirname, "../../web/examples");
      const router = createFileSystemRouter({ dir: exampleDir });

      expect(router.routes.length).toBeGreaterThan(0);
    });
  });
});
