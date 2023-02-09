"use strict";(self.webpackChunkliveviewjs_com=self.webpackChunkliveviewjs_com||[]).push([[1087],{876:(e,t,n)=>{n.d(t,{Zo:()=>d,kt:()=>m});var r=n(2784);function i(e,t,n){return t in e?Object.defineProperty(e,t,{value:n,enumerable:!0,configurable:!0,writable:!0}):e[t]=n,e}function a(e,t){var n=Object.keys(e);if(Object.getOwnPropertySymbols){var r=Object.getOwnPropertySymbols(e);t&&(r=r.filter((function(t){return Object.getOwnPropertyDescriptor(e,t).enumerable}))),n.push.apply(n,r)}return n}function o(e){for(var t=1;t<arguments.length;t++){var n=null!=arguments[t]?arguments[t]:{};t%2?a(Object(n),!0).forEach((function(t){i(e,t,n[t])})):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(n)):a(Object(n)).forEach((function(t){Object.defineProperty(e,t,Object.getOwnPropertyDescriptor(n,t))}))}return e}function s(e,t){if(null==e)return{};var n,r,i=function(e,t){if(null==e)return{};var n,r,i={},a=Object.keys(e);for(r=0;r<a.length;r++)n=a[r],t.indexOf(n)>=0||(i[n]=e[n]);return i}(e,t);if(Object.getOwnPropertySymbols){var a=Object.getOwnPropertySymbols(e);for(r=0;r<a.length;r++)n=a[r],t.indexOf(n)>=0||Object.prototype.propertyIsEnumerable.call(e,n)&&(i[n]=e[n])}return i}var c=r.createContext({}),l=function(e){var t=r.useContext(c),n=t;return e&&(n="function"==typeof e?e(t):o(o({},t),e)),n},d=function(e){var t=l(e.components);return r.createElement(c.Provider,{value:t},e.children)},p={inlineCode:"code",wrapper:function(e){var t=e.children;return r.createElement(r.Fragment,{},t)}},u=r.forwardRef((function(e,t){var n=e.components,i=e.mdxType,a=e.originalType,c=e.parentName,d=s(e,["components","mdxType","originalType","parentName"]),u=l(n),m=i,h=u["".concat(c,".").concat(m)]||u[m]||p[m]||a;return n?r.createElement(h,o(o({ref:t},d),{},{components:n})):r.createElement(h,o({ref:t},d))}));function m(e,t){var n=arguments,i=t&&t.mdxType;if("string"==typeof e||i){var a=n.length,o=new Array(a);o[0]=u;var s={};for(var c in t)hasOwnProperty.call(t,c)&&(s[c]=t[c]);s.originalType=e,s.mdxType="string"==typeof e?e:i,o[1]=s;for(var l=2;l<a;l++)o[l]=n[l];return r.createElement.apply(null,o)}return r.createElement.apply(null,n)}u.displayName="MDXCreateElement"},7850:(e,t,n)=>{n.r(t),n.d(t,{assets:()=>c,contentTitle:()=>o,default:()=>p,frontMatter:()=>a,metadata:()=>s,toc:()=>l});var r=n(7896),i=(n(2784),n(876));const a={sidebar_position:2},o="LiveView Paradigm",s={unversionedId:"overview/paradigm",id:"overview/paradigm",title:"LiveView Paradigm",description:"The LiveView model is simple. The server renders an HTML page when a user makes the initial HTTP request. That page",source:"@site/docs/01-overview/paradigm.md",sourceDirName:"01-overview",slug:"/overview/paradigm",permalink:"/docs/overview/paradigm",draft:!1,tags:[],version:"current",sidebarPosition:2,frontMatter:{sidebar_position:2},sidebar:"tutorialSidebar",previous:{title:"Introduction",permalink:"/docs/overview/introduction"},next:{title:"Packages & Runtimes",permalink:"/docs/overview/runtimes"}},c={},l=[{value:"How is this different from SPAs?",id:"how-is-this-different-from-spas",level:2}],d={toc:l};function p(e){let{components:t,...n}=e;return(0,i.kt)("wrapper",(0,r.Z)({},d,n,{components:t,mdxType:"MDXLayout"}),(0,i.kt)("h1",{id:"liveview-paradigm"},"LiveView Paradigm"),(0,i.kt)("p",null,"The LiveView model is simple. The server renders an HTML page when a user makes the initial HTTP request. That page\nthen connects to the server via a persistent web socket. From there, user-initiated events (clicks, form input, key\nevents, focus/blur events, etc) are sent over the web socket to the server in very small packets. When the server\nreceives the events, it runs the business logic for that LiveView, calculates the new rendered HTML, and then sends only\nthe diffs to the client. The client automatically updates the page with the diffs. The server can also send diffs back\nto the client based on events on the server or received from other clients (think chat, or other pub/sub scenarios)."),(0,i.kt)("admonition",{type:"info"},(0,i.kt)("p",{parentName:"admonition"},(0,i.kt)("strong",{parentName:"p"},"LiveViewJS")," solves the complex parts of LiveViews such as connecting and managing web sockets, diffing and\npatching the UI, routing events, real-time/multiplayer, file uploads, and more.")),(0,i.kt)("h2",{id:"how-is-this-different-from-spas"},"How is this different from SPAs?"),(0,i.kt)("p",null,"SPA-frameworks (React, Vue, Svelt, etc) only manage state and rendering on the client. You need a completely different\nbackend to handle business logic and persistence, typically a REST or GRAPHQL API (and related auth). This means you\nneed to write two code bases, one for the front-end and one for the back-end and then integrate them. ",(0,i.kt)("strong",{parentName:"p"},"LiveViewJS")," is\na single code base that handles both the front-end and back-end while enabling the same rich user experiences that a\nSPA enables. With ",(0,i.kt)("strong",{parentName:"p"},"LiveViewJS")," you write your business logic and persistence code in the same place as your front-end\ncode. This greatly simplifies the development process, reduces the number of moving parts, and increases development velocity."),(0,i.kt)("p",null,"It's worth re-reading Chris McCord's quote in ",(0,i.kt)("a",{parentName:"p",href:"introduction"},"the Introduction"),", or even better, read these docs and run the\nexamples! \ud83d\ude00 You'll see how easy it is to build rich, interactive, and responsive user experiences with ",(0,i.kt)("strong",{parentName:"p"},"LiveViewJS"),"\nand start to understand how much of an improvement and paradigm shift it is."))}p.isMDXComponent=!0}}]);