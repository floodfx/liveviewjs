import { renderedToHtml, updateRenderedWithDiff } from "./utils";
import { PhxReply, RenderedNode } from '../server/socket/types'
import io from "socket.io-client";
import morphdom from "morphdom";

var socket = io();

if (window) {
  (window as any).turnOn = () => {
    socket.emit("event", ["4", "64", "lv:phx-FssjlAMwe9RhogDq", "event", { type: "click", event: "on", value: { value: "" } }]);
  };

  (window as any).turnOff = () => {
    socket.emit("event", ["4", "64", "lv:phx-FssjlAMwe9RhogDq", "event", { type: "click", event: "off", value: { value: "" } }]);
  };

  (window as any).turnUp = () => {
    socket.emit("event", ["4", "64", "lv:phx-FssjlAMwe9RhogDq", "event", { type: "click", event: "up", value: { value: "" } }]);
  };

  (window as any).turnDown = () => {
    socket.emit("event", ["4", "64", "lv:phx-FssjlAMwe9RhogDq", "event", { type: "click", event: "down", value: { value: "" } }]);
  };
}

socket.on("connect", () => {
  console.log(socket.id); //
  socket.emit("phx_join", ["4", "4", "lv:phx-FsrMvfqMqliBmgJF", "phx_join", {
    params: { _csrf_token: "OnAPAm1NKwgPCQg4TAUMdnx3WSI6fj8Jm2Zk8yoEVhOgxUSG72hFT7se", _mounts: 0 },
    session: "SFMyNTY.g2gDaAJhBXQAAAAIZAACaWRtAAAAFHBoeC1Gc3JNdmZxTXFsaUJtZ0pGZAAMbGl2ZV9zZXNzaW9uaAJkAAdkZWZhdWx0bggAyL-egcCNyhZkAApwYXJlbnRfcGlkZAADbmlsZAAIcm9vdF9waWRkAANuaWxkAAlyb290X3ZpZXdkACJFbGl4aXIuTGl2ZVZpZXdTdHVkaW9XZWIuTGlnaHRMaXZlZAAGcm91dGVyZAAfRWxpeGlyLkxpdmVWaWV3U3R1ZGlvV2ViLlJvdXRlcmQAB3Nlc3Npb250AAAAAGQABHZpZXdkACJFbGl4aXIuTGl2ZVZpZXdTdHVkaW9XZWIuTGlnaHRMaXZlbgYAFjWyY34BYgABUYA.9ZElHc0CEv9Nu5S1JCoidU2S0uDDBqN1IsTcOMFTCrg",
    static: "SFMyNTY.g2gDaAJhBXQAAAADZAAKYXNzaWduX25ld2pkAAVmbGFzaHQAAAAAZAACaWRtAAAAFHBoeC1Gc3JNdmZxTXFsaUJtZ0pGbgYAFjWyY34BYgABUYA.X73SFphVgh0CYME6vGp47u3Q4jKg5Rh6i_UCQEdl0ac",
    url: "http://localhost:4000/light"
  }
  ]);
});

let cacheRendered: RenderedNode;
socket.on("phx_reply", function (message: PhxReply) {
  console.log("Reply: ", message);

  let html = "";

  // full rendered including dynamics and statics
  if (message[4].response.rendered) {
    // cache statics
    cacheRendered = message[4].response.rendered;
    html = renderedToHtml(cacheRendered);

  } else if (message[4].response.diff) {
    // update cachedRendered with diff data

    const diff = message[4].response.diff;
    const newRendered = updateRenderedWithDiff(cacheRendered, diff);
    html = renderedToHtml(newRendered);

  } else {
    console.error("Unknown response: ", message);
  }

  console.log("html", html);

  // find light element by id
  var lightElement = document.getElementById("light");
  morphdom(lightElement, html);


});


