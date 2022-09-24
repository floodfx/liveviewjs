"use strict";
(self.webpackChunkliveviewjs_com = self.webpackChunkliveviewjs_com || []).push([
  [1247],
  {
    876: (e, t, n) => {
      n.d(t, { Zo: () => d, kt: () => m });
      var r = n(2784);
      function o(e, t, n) {
        return (
          t in e
            ? Object.defineProperty(e, t, { value: n, enumerable: !0, configurable: !0, writable: !0 })
            : (e[t] = n),
          e
        );
      }
      function i(e, t) {
        var n = Object.keys(e);
        if (Object.getOwnPropertySymbols) {
          var r = Object.getOwnPropertySymbols(e);
          t &&
            (r = r.filter(function (t) {
              return Object.getOwnPropertyDescriptor(e, t).enumerable;
            })),
            n.push.apply(n, r);
        }
        return n;
      }
      function a(e) {
        for (var t = 1; t < arguments.length; t++) {
          var n = null != arguments[t] ? arguments[t] : {};
          t % 2
            ? i(Object(n), !0).forEach(function (t) {
                o(e, t, n[t]);
              })
            : Object.getOwnPropertyDescriptors
            ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(n))
            : i(Object(n)).forEach(function (t) {
                Object.defineProperty(e, t, Object.getOwnPropertyDescriptor(n, t));
              });
        }
        return e;
      }
      function l(e, t) {
        if (null == e) return {};
        var n,
          r,
          o = (function (e, t) {
            if (null == e) return {};
            var n,
              r,
              o = {},
              i = Object.keys(e);
            for (r = 0; r < i.length; r++) (n = i[r]), t.indexOf(n) >= 0 || (o[n] = e[n]);
            return o;
          })(e, t);
        if (Object.getOwnPropertySymbols) {
          var i = Object.getOwnPropertySymbols(e);
          for (r = 0; r < i.length; r++)
            (n = i[r]), t.indexOf(n) >= 0 || (Object.prototype.propertyIsEnumerable.call(e, n) && (o[n] = e[n]));
        }
        return o;
      }
      var p = r.createContext({}),
        s = function (e) {
          var t = r.useContext(p),
            n = t;
          return e && (n = "function" == typeof e ? e(t) : a(a({}, t), e)), n;
        },
        d = function (e) {
          var t = s(e.components);
          return r.createElement(p.Provider, { value: t }, e.children);
        },
        u = {
          inlineCode: "code",
          wrapper: function (e) {
            var t = e.children;
            return r.createElement(r.Fragment, {}, t);
          },
        },
        c = r.forwardRef(function (e, t) {
          var n = e.components,
            o = e.mdxType,
            i = e.originalType,
            p = e.parentName,
            d = l(e, ["components", "mdxType", "originalType", "parentName"]),
            c = s(n),
            m = o,
            h = c["".concat(p, ".").concat(m)] || c[m] || u[m] || i;
          return n
            ? r.createElement(h, a(a({ ref: t }, d), {}, { components: n }))
            : r.createElement(h, a({ ref: t }, d));
        });
      function m(e, t) {
        var n = arguments,
          o = t && t.mdxType;
        if ("string" == typeof e || o) {
          var i = n.length,
            a = new Array(i);
          a[0] = c;
          var l = {};
          for (var p in t) hasOwnProperty.call(t, p) && (l[p] = t[p]);
          (l.originalType = e), (l.mdxType = "string" == typeof e ? e : o), (a[1] = l);
          for (var s = 2; s < i; s++) a[s] = n[s];
          return r.createElement.apply(null, a);
        }
        return r.createElement.apply(null, n);
      }
      c.displayName = "MDXCreateElement";
    },
    9962: (e, t, n) => {
      n.r(t),
        n.d(t, {
          assets: () => p,
          contentTitle: () => a,
          default: () => u,
          frontMatter: () => i,
          metadata: () => l,
          toc: () => s,
        });
      var r = n(7896),
        o = (n(2784), n(876));
      const i = { sidebar_position: 1 },
        a = "Download the Repo",
        l = {
          unversionedId: "quick-starts/get-liveviewjs-repo",
          id: "quick-starts/get-liveviewjs-repo",
          title: "Download the Repo",
          description:
            "The fastest way to run the example or build your own LiveView is by downloading the LiveViewJS repo. This repo",
          source: "@site/docs/02-quick-starts/get-liveviewjs-repo.md",
          sourceDirName: "02-quick-starts",
          slug: "/quick-starts/get-liveviewjs-repo",
          permalink: "/docs/quick-starts/get-liveviewjs-repo",
          draft: !1,
          tags: [],
          version: "current",
          sidebarPosition: 1,
          frontMatter: { sidebar_position: 1 },
          sidebar: "tutorialSidebar",
          previous: { title: "Quick Starts", permalink: "/docs/category/quick-starts" },
          next: { title: "NodeJS - Run the Examples", permalink: "/docs/quick-starts/nodejs-run-examples" },
        },
        p = {},
        s = [
          { value: "Get the Code", id: "get-the-code", level: 2 },
          { value: "Node", id: "node", level: 3 },
          { value: "Deno", id: "deno", level: 3 },
        ],
        d = { toc: s };
      function u(e) {
        let { components: t, ...n } = e;
        return (0, o.kt)(
          "wrapper",
          (0, r.Z)({}, d, n, { components: t, mdxType: "MDXLayout" }),
          (0, o.kt)("h1", { id: "download-the-repo" }, "Download the Repo"),
          (0, o.kt)(
            "p",
            null,
            "The fastest way to run the example or build your own LiveView is by downloading the ",
            (0, o.kt)("strong", { parentName: "p" }, "LiveViewJS"),
            " repo. This repo\ncontains all the examples and configured webserver code for Express (NodeJS) and Oak (Deno)."
          ),
          (0, o.kt)("h2", { id: "get-the-code" }, "Get the Code"),
          (0, o.kt)(
            "p",
            null,
            "Either use ",
            (0, o.kt)("inlineCode", { parentName: "p" }, "git clone"),
            " or ",
            (0, o.kt)("inlineCode", { parentName: "p" }, "degit"),
            " to get the ",
            (0, o.kt)("strong", { parentName: "p" }, "LiveViewJS"),
            " GitHub repository."
          ),
          (0, o.kt)(
            "admonition",
            { type: "info" },
            (0, o.kt)(
              "mdxAdmonitionTitle",
              { parentName: "admonition" },
              (0, o.kt)("inlineCode", { parentName: "mdxAdmonitionTitle" }, "degit"),
              " is lightweight way to clone a repo without the .git parts."
            ),
            (0, o.kt)(
              "p",
              { parentName: "admonition" },
              (0, o.kt)("a", { parentName: "p", href: "https://github.com/Rich-Harris/degit" }, "More info"),
              ". :::"
            ),
            (0, o.kt)(
              "h3",
              { parentName: "admonition", id: "clone-the-liveviewjs-github-repository" },
              "Clone the ",
              (0, o.kt)("strong", { parentName: "h3" }, "LiveViewJS"),
              " GitHub repository:"
            ),
            (0, o.kt)(
              "pre",
              { parentName: "admonition" },
              (0, o.kt)(
                "code",
                { parentName: "pre", className: "language-bash" },
                "# clone the LiveViewJS repo\ngit clone https://github.com/floodfx/liveviewjs.git\n"
              )
            ),
            (0, o.kt)(
              "h3",
              { parentName: "admonition", id: "or-fetch-with-degit" },
              "OR fetch with ",
              (0, o.kt)("inlineCode", { parentName: "h3" }, "degit"),
              ":"
            ),
            (0, o.kt)(
              "pre",
              { parentName: "admonition" },
              (0, o.kt)(
                "code",
                { parentName: "pre", className: "language-bash" },
                "# copy the LiveViewJS repo\nnpx degit floodfx/liveviewjs liveviewjs\n"
              )
            ),
            (0, o.kt)(
              "h2",
              { parentName: "admonition", id: "change-to-the-liveviewjs-directory" },
              "Change to the LiveViewJS Directory"
            ),
            (0, o.kt)(
              "pre",
              { parentName: "admonition" },
              (0, o.kt)(
                "code",
                { parentName: "pre", className: "language-bash" },
                "# cd to the LiveViewJS directory\ncd liveviewjs\n"
              )
            ),
            (0, o.kt)("h2", { parentName: "admonition", id: "node-or-deno" }, "Node or Deno?"),
            (0, o.kt)(
              "p",
              { parentName: "admonition" },
              (0, o.kt)("strong", { parentName: "p" }, "LiveViewJS"),
              " runs on both Node and Deno but you'll probably want to start down one path or the other depending on what\nruntime you are more familiar with or are already using."
            )
          ),
          (0, o.kt)(
            "p",
            null,
            "other unless you are using Deno or Node specific APIs in your LiveView implementation. :::"
          ),
          (0, o.kt)("h3", { id: "node" }, "Node"),
          (0, o.kt)(
            "ul",
            null,
            (0, o.kt)(
              "li",
              { parentName: "ul" },
              (0, o.kt)("a", { parentName: "li", href: "nodejs-run-examples" }, "NodeJS - Run the Examples")
            ),
            (0, o.kt)(
              "li",
              { parentName: "ul" },
              (0, o.kt)(
                "a",
                { parentName: "li", href: "nodejs-build-first-liveview" },
                "NodeJS - Build your First LiveView"
              )
            )
          ),
          (0, o.kt)("h3", { id: "deno" }, "Deno"),
          (0, o.kt)(
            "ul",
            null,
            (0, o.kt)(
              "li",
              { parentName: "ul" },
              (0, o.kt)("a", { parentName: "li", href: "deno-run-examples" }, "Deno - Run the Examples")
            ),
            (0, o.kt)(
              "li",
              { parentName: "ul" },
              (0, o.kt)(
                "a",
                { parentName: "li", href: "deno-build-first-liveview" },
                "Deno - Build your First LiveView"
              )
            )
          )
        );
      }
      u.isMDXComponent = !0;
    },
  },
]);
