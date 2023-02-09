"use strict";(self.webpackChunkliveviewjs_com=self.webpackChunkliveviewjs_com||[]).push([[4221],{876:(e,t,n)=>{n.d(t,{Zo:()=>u,kt:()=>v});var r=n(2784);function i(e,t,n){return t in e?Object.defineProperty(e,t,{value:n,enumerable:!0,configurable:!0,writable:!0}):e[t]=n,e}function a(e,t){var n=Object.keys(e);if(Object.getOwnPropertySymbols){var r=Object.getOwnPropertySymbols(e);t&&(r=r.filter((function(t){return Object.getOwnPropertyDescriptor(e,t).enumerable}))),n.push.apply(n,r)}return n}function o(e){for(var t=1;t<arguments.length;t++){var n=null!=arguments[t]?arguments[t]:{};t%2?a(Object(n),!0).forEach((function(t){i(e,t,n[t])})):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(n)):a(Object(n)).forEach((function(t){Object.defineProperty(e,t,Object.getOwnPropertyDescriptor(n,t))}))}return e}function s(e,t){if(null==e)return{};var n,r,i=function(e,t){if(null==e)return{};var n,r,i={},a=Object.keys(e);for(r=0;r<a.length;r++)n=a[r],t.indexOf(n)>=0||(i[n]=e[n]);return i}(e,t);if(Object.getOwnPropertySymbols){var a=Object.getOwnPropertySymbols(e);for(r=0;r<a.length;r++)n=a[r],t.indexOf(n)>=0||Object.prototype.propertyIsEnumerable.call(e,n)&&(i[n]=e[n])}return i}var l=r.createContext({}),p=function(e){var t=r.useContext(l),n=t;return e&&(n="function"==typeof e?e(t):o(o({},t),e)),n},u=function(e){var t=p(e.components);return r.createElement(l.Provider,{value:t},e.children)},c={inlineCode:"code",wrapper:function(e){var t=e.children;return r.createElement(r.Fragment,{},t)}},d=r.forwardRef((function(e,t){var n=e.components,i=e.mdxType,a=e.originalType,l=e.parentName,u=s(e,["components","mdxType","originalType","parentName"]),d=p(n),v=i,m=d["".concat(l,".").concat(v)]||d[v]||c[v]||a;return n?r.createElement(m,o(o({ref:t},u),{},{components:n})):r.createElement(m,o({ref:t},u))}));function v(e,t){var n=arguments,i=t&&t.mdxType;if("string"==typeof e||i){var a=n.length,o=new Array(a);o[0]=d;var s={};for(var l in t)hasOwnProperty.call(t,l)&&(s[l]=t[l]);s.originalType=e,s.mdxType="string"==typeof e?e:i,o[1]=s;for(var p=2;p<a;p++)o[p]=n[p];return r.createElement.apply(null,o)}return r.createElement.apply(null,n)}d.displayName="MDXCreateElement"},6609:(e,t,n)=>{n.r(t),n.d(t,{assets:()=>l,contentTitle:()=>o,default:()=>c,frontMatter:()=>a,metadata:()=>s,toc:()=>p});var r=n(7896),i=(n(2784),n(876));const a={sidebar_position:3},o="NodeJS - Build a LiveView",s={unversionedId:"quick-starts/nodejs-build-first-liveview",id:"quick-starts/nodejs-build-first-liveview",title:"NodeJS - Build a LiveView",description:"Since you've already downloaded the LiveViewJS repo, it should be easy to create a new",source:"@site/docs/02-quick-starts/nodejs-build-first-liveview.md",sourceDirName:"02-quick-starts",slug:"/quick-starts/nodejs-build-first-liveview",permalink:"/docs/quick-starts/nodejs-build-first-liveview",draft:!1,tags:[],version:"current",sidebarPosition:3,frontMatter:{sidebar_position:3},sidebar:"tutorialSidebar",previous:{title:"NodeJS - Run the Examples",permalink:"/docs/quick-starts/nodejs-run-examples"},next:{title:"Deno - Run the Examples",permalink:"/docs/quick-starts/deno-run-examples"}},l={},p=[{value:"Create a new LiveView in Express",id:"create-a-new-liveview-in-express",level:2},{value:"Setup a new Route",id:"setup-a-new-route",level:2},{value:"Start the Express Server",id:"start-the-express-server",level:2},{value:"See the LiveView in Action",id:"see-the-liveview-in-action",level:2},{value:"Next Steps",id:"next-steps",level:2},{value:"Great start!",id:"great-start",level:2}],u={toc:p};function c(e){let{components:t,...a}=e;return(0,i.kt)("wrapper",(0,r.Z)({},u,a,{components:t,mdxType:"MDXLayout"}),(0,i.kt)("h1",{id:"nodejs---build-a-liveview"},"NodeJS - Build a LiveView"),(0,i.kt)("p",null,"Since you've already ",(0,i.kt)("a",{parentName:"p",href:"get-liveviewjs-repo"},"downloaded the ",(0,i.kt)("strong",{parentName:"a"},"LiveViewJS")," repo"),", it should be easy to create a new\nLiveView and add it to your webserver. Let's get started!"),(0,i.kt)("h2",{id:"create-a-new-liveview-in-express"},"Create a new LiveView in Express"),(0,i.kt)("p",null,"Since we are using Express to serve our LiveViews, we'll create a new LiveView in the ",(0,i.kt)("inlineCode",{parentName:"p"},"packages/express")," directory."),(0,i.kt)("p",null,"Use your favorite editor to create a new file ",(0,i.kt)("inlineCode",{parentName:"p"},"packages/express/src/example/liveview/hello.ts")," and add the following\ncode and hit save:"),(0,i.kt)("pre",null,(0,i.kt)("code",{parentName:"pre",className:"language-ts"},'import { createLiveView, html } from "liveviewjs";\n\nexport const helloLiveView = createLiveView({\n  render: () => html`Hello World!`,\n});\n')),(0,i.kt)("p",null,"Congratulations! You've just created your first LiveView! It doesn't do much yet but let's get it running in the\nbrowser."),(0,i.kt)("h2",{id:"setup-a-new-route"},"Setup a new Route"),(0,i.kt)("p",null,"Let's add a route to this LiveView to see it in our browser. Edit ",(0,i.kt)("inlineCode",{parentName:"p"},"packages/express/src/example/index.ts")," and make the\nfollowing highlighted changes:"),(0,i.kt)("pre",null,(0,i.kt)("code",{parentName:"pre",className:"language-ts",metastring:'title="packages/express/src/example/index.ts" {3,7}',title:'"packages/express/src/example/index.ts"',"{3,7}":!0},'...\nimport { htmlPageTemplate, wrapperTemplate } from "./liveViewRenderers";\nimport { helloLiveView } from "./liveview/hello";\n\n// map request paths to LiveViews\nconst router: LiveViewRouter = {\n  "/hello": helloLiveView,\n  "/autocomplete": autocompleteLiveView,\n...\n')),(0,i.kt)("p",null,"Great! We've now setup our new LiveView to be served at the ",(0,i.kt)("inlineCode",{parentName:"p"},"/hello")," path. Let's start the server and see it in action."),(0,i.kt)("h2",{id:"start-the-express-server"},"Start the Express Server"),(0,i.kt)("p",null,"First, load the NPM dependencies:"),(0,i.kt)("pre",null,(0,i.kt)("code",{parentName:"pre",className:"language-bash"},"# install the NPM dependencies\nnpm install\n")),(0,i.kt)("p",null,"Then, start the express server:"),(0,i.kt)("pre",null,(0,i.kt)("code",{parentName:"pre",className:"language-bash"},"# start express server\nnpm run start -w packages/express\n")),(0,i.kt)("admonition",{type:"info"},(0,i.kt)("p",{parentName:"admonition"},"You will probably see a warning from NodeJS about using an experimental feature:"),(0,i.kt)("pre",{parentName:"admonition"},(0,i.kt)("code",{parentName:"pre"},"ExperimentalWarning: The Fetch API is an experimental feature. This feature could change at any time\n(Use `node --trace-warnings ...` to show where the warning was created)\n")),(0,i.kt)("p",{parentName:"admonition"},"The feature we are using is the built-in ",(0,i.kt)("inlineCode",{parentName:"p"},"fetch")," method. Feel free to ignore this warning.")),(0,i.kt)("h2",{id:"see-the-liveview-in-action"},"See the LiveView in Action"),(0,i.kt)("p",null,"Point your browser to ",(0,i.kt)("a",{parentName:"p",href:"http://localhost:4001/hello"},"http://localhost:4001/hello"),", and you should see something like the\nfollowing: ",(0,i.kt)("img",{alt:"LiveViewJS Hello World Screenshot",src:n(1906).Z,width:"1630",height:"632"})),(0,i.kt)("h2",{id:"next-steps"},"Next Steps"),(0,i.kt)("p",null,"Ok, we got our first LiveView running but it isn't very interactive. Let's make it more interesting by adding a button\nthat toggles between using text and emojis to say hello. Update the ",(0,i.kt)("inlineCode",{parentName:"p"},"hello.ts")," file to the following:"),(0,i.kt)("pre",null,(0,i.kt)("code",{parentName:"pre",className:"language-ts",metastring:'title="packages/express/src/example/liveview/hello.ts"',title:'"packages/express/src/example/liveview/hello.ts"'},'import { createLiveView, html } from "liveviewjs";\n\nexport const helloLiveView = createLiveView({\n  mount: (socket) => {\n    socket.assign({ useEmoji: false });\n  },\n  handleEvent(event, socket) {\n    socket.assign({ useEmoji: !socket.context.useEmoji });\n  },\n  render: (context) => {\n    const msg = context.useEmoji ? "\ud83d\udc4b \ud83c\udf0e" : "Hello World";\n    return html`\n      ${msg}\n      <br />\n      <button phx-click="toggle">Toggle Message</button>\n    `;\n  },\n});\n')),(0,i.kt)("p",null,"Now, when you refresh the page, you should see a button that toggles between using text and emojis to say hello. It\nshould look something like this:"),(0,i.kt)("p",null,(0,i.kt)("img",{alt:"LiveViewJS Hello World Recording",src:n(7377).Z,width:"1630",height:"630"})),(0,i.kt)("admonition",{type:"info"},(0,i.kt)("p",{parentName:"admonition"},"You'll notice that ",(0,i.kt)("strong",{parentName:"p"},"LiveViewJS")," automatically rebuilds and reloads the server when you make changes to your\nLiveView code. This is a great way to iterate quickly on your LiveView.")),(0,i.kt)("h2",{id:"great-start"},"Great start!"),(0,i.kt)("p",null,"You've just created your first LiveView and added it to your webserver! There is a lot more to learn about\n",(0,i.kt)("strong",{parentName:"p"},"LiveViewJS")," but you are well on your way. We recommend you continue to the\n",(0,i.kt)("a",{parentName:"p",href:"/docs/category/anatomy-of-a-liveview"},"Anatomy of a LiveView")," section to start to learn more about how LiveViews work."))}c.isMDXComponent=!0},1906:(e,t,n)=>{n.d(t,{Z:()=>r});const r=n.p+"assets/images/liveviewjs_hello_liveview-09cb9e9d8588fb31e92cbefd4d4d6ddf.png"},7377:(e,t,n)=>{n.d(t,{Z:()=>r});const r=n.p+"assets/images/liveviewjs_hello_toggle_liveview_rec-dff5867dec6513c570aed325880c032f.gif"}}]);