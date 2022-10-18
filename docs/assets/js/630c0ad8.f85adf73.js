"use strict";(self.webpackChunkliveviewjs_com=self.webpackChunkliveviewjs_com||[]).push([[7911],{876:(e,t,n)=>{n.d(t,{Zo:()=>d,kt:()=>m});var a=n(2784);function i(e,t,n){return t in e?Object.defineProperty(e,t,{value:n,enumerable:!0,configurable:!0,writable:!0}):e[t]=n,e}function o(e,t){var n=Object.keys(e);if(Object.getOwnPropertySymbols){var a=Object.getOwnPropertySymbols(e);t&&(a=a.filter((function(t){return Object.getOwnPropertyDescriptor(e,t).enumerable}))),n.push.apply(n,a)}return n}function r(e){for(var t=1;t<arguments.length;t++){var n=null!=arguments[t]?arguments[t]:{};t%2?o(Object(n),!0).forEach((function(t){i(e,t,n[t])})):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(n)):o(Object(n)).forEach((function(t){Object.defineProperty(e,t,Object.getOwnPropertyDescriptor(n,t))}))}return e}function s(e,t){if(null==e)return{};var n,a,i=function(e,t){if(null==e)return{};var n,a,i={},o=Object.keys(e);for(a=0;a<o.length;a++)n=o[a],t.indexOf(n)>=0||(i[n]=e[n]);return i}(e,t);if(Object.getOwnPropertySymbols){var o=Object.getOwnPropertySymbols(e);for(a=0;a<o.length;a++)n=o[a],t.indexOf(n)>=0||Object.prototype.propertyIsEnumerable.call(e,n)&&(i[n]=e[n])}return i}var l=a.createContext({}),c=function(e){var t=a.useContext(l),n=t;return e&&(n="function"==typeof e?e(t):r(r({},t),e)),n},d=function(e){var t=c(e.components);return a.createElement(l.Provider,{value:t},e.children)},h={inlineCode:"code",wrapper:function(e){var t=e.children;return a.createElement(a.Fragment,{},t)}},p=a.forwardRef((function(e,t){var n=e.components,i=e.mdxType,o=e.originalType,l=e.parentName,d=s(e,["components","mdxType","originalType","parentName"]),p=c(n),m=i,u=p["".concat(l,".").concat(m)]||p[m]||h[m]||o;return n?a.createElement(u,r(r({ref:t},d),{},{components:n})):a.createElement(u,r({ref:t},d))}));function m(e,t){var n=arguments,i=t&&t.mdxType;if("string"==typeof e||i){var o=n.length,r=new Array(o);r[0]=p;var s={};for(var l in t)hasOwnProperty.call(t,l)&&(s[l]=t[l]);s.originalType=e,s.mdxType="string"==typeof e?e:i,r[1]=s;for(var c=2;c<o;c++)r[c]=n[c];return a.createElement.apply(null,r)}return a.createElement.apply(null,n)}p.displayName="MDXCreateElement"},1217:(e,t,n)=>{n.r(t),n.d(t,{assets:()=>l,contentTitle:()=>r,default:()=>h,frontMatter:()=>o,metadata:()=>s,toc:()=>c});var a=n(7896),i=(n(2784),n(876));const o={sidebar_position:1},r="Lifecycle of a LiveView",s={unversionedId:"lifecycle-of-a-liveview/intro",id:"lifecycle-of-a-liveview/intro",title:"Lifecycle of a LiveView",description:"We are going to look at the lifecycle of LiveViews in detail to see when each LiveView method (e.g.,  mount,",source:"@site/docs/05-lifecycle-of-a-liveview/intro.md",sourceDirName:"05-lifecycle-of-a-liveview",slug:"/lifecycle-of-a-liveview/intro",permalink:"/docs/lifecycle-of-a-liveview/intro",draft:!1,tags:[],version:"current",sidebarPosition:1,frontMatter:{sidebar_position:1},sidebar:"tutorialSidebar",previous:{title:"Lifecycle of a LiveView",permalink:"/docs/category/lifecycle-of-a-liveview"},next:{title:"User Events",permalink:"/docs/category/user-events"}},l={},c=[{value:"HTTP and Websocket",id:"http-and-websocket",level:2},{value:"HTTP Request Phase",id:"http-request-phase",level:3},{value:"Advantages of HTML",id:"advantages-of-html",level:4},{value:"Websocket Phase",id:"websocket-phase",level:3},{value:"Websocket Join Phase",id:"websocket-join-phase",level:4}],d={toc:c};function h(e){let{components:t,...o}=e;return(0,i.kt)("wrapper",(0,a.Z)({},d,o,{components:t,mdxType:"MDXLayout"}),(0,i.kt)("h1",{id:"lifecycle-of-a-liveview"},"Lifecycle of a LiveView"),(0,i.kt)("p",null,"We are going to look at the lifecycle of LiveViews in detail to see when each LiveView method (e.g.,  ",(0,i.kt)("inlineCode",{parentName:"p"},"mount"),",\n",(0,i.kt)("inlineCode",{parentName:"p"},"handleEvent"),", ",(0,i.kt)("inlineCode",{parentName:"p"},"render"),", etc) are called during the lifecycle so you can better understand how to use them."),(0,i.kt)("h2",{id:"http-and-websocket"},"HTTP and Websocket"),(0,i.kt)("p",null,"There are two major parts of a lifecycle:"),(0,i.kt)("ol",null,(0,i.kt)("li",{parentName:"ol"},"HTTP request phase"),(0,i.kt)("li",{parentName:"ol"},"Websocket phase")),(0,i.kt)("h3",{id:"http-request-phase"},"HTTP Request Phase"),(0,i.kt)("p",null,"Just like any other web page, all LiveViews start with a HTTP request to a URL (e.g.,  ",(0,i.kt)("inlineCode",{parentName:"p"},"GET /my-liveview"),") and this route\nis served by a webserver (e.g.,  Express). If that route is a LiveView route, the webserver hands off the request to the\n",(0,i.kt)("strong",{parentName:"p"},"LiveViewJS")," library for processing."),(0,i.kt)("p",null,"The ",(0,i.kt)("strong",{parentName:"p"},"LiveViewJS")," library then creates a new LiveView instance and starts the HTTP request phase which consists of:"),(0,i.kt)("ol",null,(0,i.kt)("li",{parentName:"ol"},(0,i.kt)("inlineCode",{parentName:"li"},"mount")," - The LiveView is mounted and the context is initialized"),(0,i.kt)("li",{parentName:"ol"},(0,i.kt)("inlineCode",{parentName:"li"},"handleParams")," - The LiveView is given a chance to handle any params passed in the URL (e.g.\n",(0,i.kt)("inlineCode",{parentName:"li"},"GET /my-liveview?foo=bar"),")"),(0,i.kt)("li",{parentName:"ol"},(0,i.kt)("inlineCode",{parentName:"li"},"render")," - The LiveView is rendered based on the ",(0,i.kt)("inlineCode",{parentName:"li"},"context")," and the HTML is returned to the webserver")),(0,i.kt)("p",null,"The webserver then returns the HTML to the browser. Below is a sequence diagram showing the HTTP request phase:"),(0,i.kt)("p",null,(0,i.kt)("img",{alt:"Http Request Phase",src:n(9581).Z,width:"1302",height:"1093"})),(0,i.kt)("h4",{id:"advantages-of-html"},"Advantages of HTML"),(0,i.kt)("p",null,"The advantage of rendering the HTML initially is:"),(0,i.kt)("ul",null,(0,i.kt)("li",{parentName:"ul"},'"First paint" is extremely fast (it\'s just HTML)'),(0,i.kt)("li",{parentName:"ul"},"No waiting for MBs of JS to download"),(0,i.kt)("li",{parentName:"ul"},"Renders even if JS is disabled"),(0,i.kt)("li",{parentName:"ul"},"Search engine friendly (again it is only HTML)")),(0,i.kt)("h3",{id:"websocket-phase"},"Websocket Phase"),(0,i.kt)("p",null,"After the initial HTTP request and response, the LiveView client javascript automatically connects to the LiveView\nserver via a websocket. The websocket is used to send events from the browser to the LiveView server and to receive DOM\npatches from the LiveView server. The websocket phase breaks down into three parts:"),(0,i.kt)("ol",null,(0,i.kt)("li",{parentName:"ol"},'"Websocket Join" - Establish the websocket connection and run the initial LiveView lifecycle methods'),(0,i.kt)("li",{parentName:"ol"},'"Interactive" - The LiveView is interactive and can respond to user events or update based on server events'),(0,i.kt)("li",{parentName:"ol"},'"Shutdown" - The LiveView automatically cleans up and shuts down resources')),(0,i.kt)("h4",{id:"websocket-join-phase"},"Websocket Join Phase"),(0,i.kt)("p",null,'During the "Websocket Join" phase the LiveView runs the same initiliation methods as the HTTP request phase:'),(0,i.kt)("ol",null,(0,i.kt)("li",{parentName:"ol"},(0,i.kt)("inlineCode",{parentName:"li"},"mount")," - The LiveView is mounted and the context is initialized"),(0,i.kt)("li",{parentName:"ol"},(0,i.kt)("inlineCode",{parentName:"li"},"handleParams")," - The LiveView is given a chance to handle any params passed in the URL (e.g.\n",(0,i.kt)("inlineCode",{parentName:"li"},"GET /my-liveview?foo=bar"),")"),(0,i.kt)("li",{parentName:"ol"},(0,i.kt)("inlineCode",{parentName:"li"},"render")," - The LiveView is rendered based on the ",(0,i.kt)("inlineCode",{parentName:"li"},"context"))),(0,i.kt)("p",null,'But instead of sending back a full HTML page, the LiveView sends back a datastructure that breaks down the HTML into\n"static" and "dynamic" parts. This data structure allows future "diffs" to be sent to the client to update the DOM.\nBelow is a sequence diagram showing the "Websocket Join" phase:'),(0,i.kt)("p",null,(0,i.kt)("img",{alt:"Websocket Join",src:n(7563).Z,width:"1277",height:"990"})),(0,i.kt)("admonition",{title:"You may have noticed both the HTTP request phase and the Websocket Join phase run the same methods. This is",type:"info"},(0,i.kt)("p",{parentName:"admonition"},"because the LiveView is initialized (",(0,i.kt)("inlineCode",{parentName:"p"},"mount")," => ",(0,i.kt)("inlineCode",{parentName:"p"},"handleParams")," => ",(0,i.kt)("inlineCode",{parentName:"p"},"render"),") in both phases. The HTTP phase doesn't\nretain any state but the Websocket phase does keep state in memory so needs to re-run the initialization methods.\nImportantly, you may also want to handle HTTP vs Websocket differently in your LiveView so calling the initialization\nmethods in both phases is important. :::"),(0,i.kt)("h4",{parentName:"admonition",id:"interactive-phase"},"Interactive Phase"),(0,i.kt)("p",{parentName:"admonition"},'Once the Websocket has been established, the LiveView is in the "Interactive" phase. In this phase the LiveView can\nrespond to user events and server events.'),(0,i.kt)("p",{parentName:"admonition"},(0,i.kt)("strong",{parentName:"p"},"User events")," (clicks, form updates/submissions, keyboard input, etc) are sent from the browser to the LiveView server\nvia the websocket, routed to ",(0,i.kt)("inlineCode",{parentName:"p"},"handleEvent")," then ",(0,i.kt)("inlineCode",{parentName:"p"},"render"),". ",(0,i.kt)("strong",{parentName:"p"},"LiveViewJS"),' then calculates the "diffs", sends those diffs\nback to the client which automatically applies them to the DOM.'),(0,i.kt)("p",{parentName:"admonition"},(0,i.kt)("strong",{parentName:"p"},"Server events")," (from ",(0,i.kt)("inlineCode",{parentName:"p"},"socket.sendInfo")," or Pub/Sub subscriptions) are automatically received in the LiveView server,\nrouted to ",(0,i.kt)("inlineCode",{parentName:"p"},"handleInfo")," then to ",(0,i.kt)("inlineCode",{parentName:"p"},"render")," Similar to user events, ",(0,i.kt)("strong",{parentName:"p"},"LiveViewJS"),' then calculates the "diffs", sends those\ndiffs back to the client which automatically applies them to the DOM.'),(0,i.kt)("p",{parentName:"admonition"},'Below is a sequence diagram showing the "Interactive" phase:'),(0,i.kt)("p",{parentName:"admonition"},(0,i.kt)("img",{alt:"Interactive",src:n(7153).Z,width:"1285",height:"1814"})),(0,i.kt)("h3",{parentName:"admonition",id:"other-processes--phases"},"Other Processes / Phases"),(0,i.kt)("p",{parentName:"admonition"},"LiveViews have a couple of other processes that are important to understand but are automatically handled by\n",(0,i.kt)("strong",{parentName:"p"},"LiveViewJS")," so you don't need to worry about them."),(0,i.kt)("ol",{parentName:"admonition"},(0,i.kt)("li",{parentName:"ol"},'"Heartbeat" - The LiveView clientr sends a heartbeat message to the server every 30 seconds to ensure the websocket\nconnection is still alive'),(0,i.kt)("li",{parentName:"ol"},'"Shutdown" - The LiveView automatically cleans up and shuts down resources')),(0,i.kt)("p",{parentName:"admonition"},'Here are a couple of sequence diagrams showing the "Heartbeat" and "Shutdown" phases:'),(0,i.kt)("h4",{parentName:"admonition",id:"heartbeat"},"Heartbeat"),(0,i.kt)("p",{parentName:"admonition"},(0,i.kt)("img",{alt:"Heartbeat",src:n(3545).Z,width:"852",height:"628"})),(0,i.kt)("h4",{parentName:"admonition",id:"shutdown"},"Shutdown"),(0,i.kt)("p",{parentName:"admonition"},(0,i.kt)("img",{alt:"Shutdown",src:n(3430).Z,width:"845",height:"816"}))))}h.isMDXComponent=!0},3545:(e,t,n)=>{n.d(t,{Z:()=>a});const a=n.p+"assets/images/liveview-lifecycle-heartbeat-65d664e1b997bbc0737aee2d81e0575e.svg"},9581:(e,t,n)=>{n.d(t,{Z:()=>a});const a=n.p+"assets/images/liveview-lifecycle-http-phase-ea214711543a70a25c10e3bf28ab347b.svg"},3430:(e,t,n)=>{n.d(t,{Z:()=>a});const a=n.p+"assets/images/liveview-lifecycle-shutdown-7e64e2d957894e06dadbde8ebfce6dc0.svg"},7153:(e,t,n)=>{n.d(t,{Z:()=>a});const a=n.p+"assets/images/liveview-lifecycle-user-and-server-events-0c078ec9c402dedb80571d075a41922e.svg"},7563:(e,t,n)=>{n.d(t,{Z:()=>a});const a=n.p+"assets/images/liveview-lifecycle-websocket-join-a167e1df602ab471b5bba9187ccf6ae2.svg"}}]);