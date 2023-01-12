import { AllowUploadEntries } from "../socket/ws/wsUploadHandler";
import { Parts } from "../templates";
import { UploadConfigOptions } from "../upload";
import { Phx } from "./phx";

/**
 * PhxReply is a namespace for Phx protocol related types and functions typically send from the server to the client.
 */
export namespace PhxReply {
  //TODO can we union multiple tuple types to make this more strict?
  /**
   * Reply are the messages typically send from the server to the client.
   */
  export type Reply = [
    joinRef: string | null,
    msgRef: string | null,
    topic: string,
    event: "phx_reply" | "diff" | "live_redirect" | "live_patch",
    payload:
      | {
          status?: Status;
          response?: Response;
        }
      | Parts // for diff
      | Phx.LiveNavPushPayload // for live_redirect and live_patch
  ];

  /**
   * Response contains different properties depending on the reply type.
   */
  export type Response = {
    rendered?: { [key: string]: unknown };
    diff?: { [key: string]: unknown };
    config?: UploadConfigOptions;
    entries?: { [key: string]: unknown };
  };

  /**
   * Status is the status of the reply.
   */
  export type Status = "ok";

  /**
   * renderedReply builds a reply that contains the full rendered HTML for a LiveView.
   * @param msg the original, incoming message (used to get the joinRef, msgRef, and topic)
   * @param parts the "tree" of parts that will be used to render the client-side LiveView
   * @returns the reply message
   */
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

  /**
   * diff builds a diff message which only contains the parts of the LiveView that have changed.
   * As opposed to "diffReply" messages, "diff" messages are sent without an original, incoming message but rather because of
   * a "server-side" event that triggers a change in the `LiveView`
   * @param joinRef optional joinRef
   * @param topic the topic (typically the LiveView's socket id)
   * @param diff the "diffed" parts of the LiveView that have changed
   * @returns a diff message
   */
  export function diff(joinRef: string | null, topic: string, diff: Parts): Reply {
    return [joinRef, null, topic, "diff", diff];
  }

  /**
   * diffReply builds a diff reply message which only contains the parts of the LiveView that have changed.
   * As opposed to "diff" messages, "diffReply" messages are sent in response to an incoming message from the client.
   * @param msg the original, incoming message (used to get the joinRef, msgRef, and topic)
   * @param diff the "diffed" parts of the LiveView that have changed
   * @returns a diff reply message
   */
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

  /**
   * allowUploadReply builds a reply that contains the upload configuration, the entries to be uploaded,
   * and the "diff" of the LiveView that will be used to render the client-side LiveView.
   * It is part of the file upload messages flow.
   * @param msg the original, incoming message (used to get the joinRef, msgRef, and topic)
   * @param diff the "tree" of parts that will be used to render the client-side LiveView
   * @param config the upload configuration
   * @param entries the entries to be uploaded
   * @returns the reply message
   */
  export function allowUploadReply(
    msg: Phx.Msg,
    diff: Parts,
    config: UploadConfigOptions,
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

  /**
   * heartbeat builds a heartbeat reply message which is used to respond to a heartbeat message from the client.
   * @param msg the original, incoming message (used to get the joinRef, msgRef, and topic)
   * @returns a heartbeat reply message
   */
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

  /**
   * serialize serializes a reply message to a string.
   * @param msg the message to serialize
   * @returns a string representation of the message
   */
  export function serialize(msg: Reply): string {
    return JSON.stringify(msg);
  }
}
