import { AllowUploadConstraints, AllowUploadEntries } from "../socket/ws/wsUploadHandler";
import { Parts } from "../templates";
import { Phx } from "./phx";

export namespace PhxReply {
  export type Reply = [
    joinRef: string | null,
    msgRef: string | null,
    topic: string,
    event: "phx_reply" | "diff",
    payload:
      | {
          status?: Status;
          response?: Response;
        }
      | Parts // for diff
  ];

  export type Response = {
    rendered?: { [key: string]: unknown };
    diff?: { [key: string]: unknown };
    config?: { [key: string]: unknown };
    entries?: { [key: string]: unknown };
  };

  export type Status = "ok" | "error";

  export function renderedReply(msg: Phx.Msg, parts: Parts): Reply {
    return [
      msg[Phx.MsgIdx.joinRef],
      msg[Phx.MsgIdx.msgRef],
      msg[Phx.MsgIdx.topic],
      "phx_reply",
      {
        status: "ok",
        response: {
          rendered: parts,
        },
      },
    ];
  }

  export function diff(joinRef: string | null, topic: string, diff: Parts): Reply {
    return [joinRef, null, topic, "diff", diff];
  }

  export function diffReply(msg: Phx.Msg, diff: Parts): Reply {
    return [
      msg[Phx.MsgIdx.joinRef],
      msg[Phx.MsgIdx.msgRef],
      msg[Phx.MsgIdx.topic],
      "phx_reply",
      {
        status: "ok",
        response: {
          diff,
        },
      },
    ];
  }

  export function allowUploadReply(
    msg: Phx.Msg,
    diff: Parts,
    config: AllowUploadConstraints,
    entries: AllowUploadEntries
  ): Reply {
    return [
      msg[Phx.MsgIdx.joinRef],
      msg[Phx.MsgIdx.msgRef],
      msg[Phx.MsgIdx.topic],
      "phx_reply",
      {
        status: "ok",
        response: {
          diff,
          config,
          entries,
        },
      },
    ];
  }

  export function heartbeat(msg: Phx.Msg): Reply {
    return [
      null,
      msg[Phx.MsgIdx.msgRef],
      "phoenix",
      "phx_reply",
      {
        status: "ok",
        response: {},
      },
    ];
  }

  export function serialize(msg: Reply): string {
    return JSON.stringify(msg);
  }
}
