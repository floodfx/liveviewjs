import fs from "fs";
import { nanoid } from "nanoid";
import { html, SessionData } from "..";
import { FileSystemAdaptor, FlashAdaptor, SerDe, SessionFlashAdaptor, WsAdaptor } from "../adaptor";
import { JsonSerDe } from "../adaptor/jsonSerDe";
import { TestNodeFileSystemAdatptor } from "../adaptor/testFilesAdatptor";
import { createLiveView, LiveView, LiveViewMountParams, LiveViewWrapperTemplate } from "../live";
import { PubSub, SingleProcessPubSub } from "../pubsub";
import { LiveViewSocket } from "../socket";
import { TestWsAdaptor } from "../test/wsAdaptor";
import { UploadConfig } from "../upload";
import { BinaryUploadSerDe } from "../upload/binaryUploadSerDe";
import { LiveViewManager } from "./liveViewManager";
import { PhxEventUpload, PhxFlash, PhxFormPayload, PhxIncomingMessage, PhxJoinIncoming } from "./types";

describe("test liveview manager uploads", () => {
  let mgr: LiveViewManager;
  let wsAdaptor: TestWsAdaptor;
  let send: jest.Mock;
  let subscribeToClose: jest.Mock;
  let subscribeToMessages: jest.Mock;

  beforeEach(() => {
    send = jest.fn();
    wsAdaptor = new TestWsAdaptor(send);
    mgr = newMgr({ wsAdaptor });
  });
  afterEach(() => {
    if (mgr) {
      (mgr as any).shutdown();
    }
  });

  it("test onAllowUpload", async () => {
    const joinId = "phx-v70rBYbBXTaWKYkyZ-yy_";

    await mgr.handleJoin(phxJoinIncoming());

    await mgr.handleSubscriptions({
      type: "allow_upload",
      message: [
        "joinRef",
        "msgRef",
        joinId,
        "allow_upload",
        {
          ref: "uploadRef",
          entries: [
            {
              name: "filename",
              type: "mimetype",
              size: 1000, // bytes
              last_modified: 1661570303752, // timestamp
              ref: "0",
            },
          ],
        },
      ],
    });
    // second send response is the allow_upload response
    console.log("send", send.mock);
    expect(send.mock.calls[1][0]).toMatchInlineSnapshot(
      `"[\\"joinRef\\",\\"msgRef\\",\\"phx-v70rBYbBXTaWKYkyZ-yy_\\",\\"phx_reply\\",{\\"response\\":{\\"diff\\":{},\\"config\\":{\\"chunk_size\\":64000,\\"max_entries\\":10,\\"max_file_size\\":10485760},\\"entries\\":{\\"0\\":\\"{\\\\\\"name\\\\\\":\\\\\\"filename\\\\\\",\\\\\\"type\\\\\\":\\\\\\"mimetype\\\\\\",\\\\\\"size\\\\\\":1000,\\\\\\"last_modified\\\\\\":1661570303752,\\\\\\"ref\\\\\\":\\\\\\"0\\\\\\"}\\",\\"ref\\":\\"uploadRef\\"}},\\"status\\":\\"ok\\"}]"`
    );
  });

  it("test onPhxJoinUpload", async () => {
    const joinId = "phx-UfsaM3mwEygZi3w0ZSteZ";
    await mgr.handleJoin(phxJoinIncoming());
    await mgr.handleSubscriptions({
      type: "phx_join_upload",
      message: ["joinRef", "msgRef", `lvu:${joinId}`, "phx_join", { token: "token" }],
    });
    // second send response is the onPhxJoinUpload response
    expect(send.mock.calls[1][0]).toMatchInlineSnapshot(
      `"[\\"joinRef\\",\\"msgRef\\",\\"lvu:phx-UfsaM3mwEygZi3w0ZSteZ\\",\\"phx_reply\\",{\\"response\\":{},\\"status\\":\\"ok\\"}]"`
    );
  });

  it("test onBinaryUpload", async () => {
    const joinId = newJoinId();
    const send = jest.fn();
    const onClose = jest.fn();
    const onMessage = jest.fn();
    const uploadName = "testBinaryUpload";
    mgr = newMgr({
      wsAdaptor,
      liveView: createLiveView({
        mount: async (socket) => {
          // need to call socket.allowUpload first to configure the uploadConfig
          await socket.allowUpload(uploadName);
        },
        handleEvent(event, socket) {
          // having this defined with squash warning but not actually used
        },
        render: (ctx, meta) => {
          return html`
            ${meta.uploads[uploadName]?.entries.map((entry) => {
              return html`<div>${entry.progress}</div>`;
            })}
          `;
        },
      }),
    });
    await mgr.handleJoin(phxJoinIncoming());

    const uploadRef = ((mgr as any).uploadConfigs[uploadName] as UploadConfig).ref;
    const entryRef = "0";
    // send the entry
    await mgr.onEvent(newFormUploadEvent(joinId, uploadRef, uploadName, entryRef));

    // initiate upload
    const byteSize = 1000; // 1kb
    await mgr.onAllowUpload([
      "joinRef",
      "msgRef",
      joinId,
      "allow_upload",
      {
        ref: uploadRef,
        entries: [
          {
            name: "filename",
            type: "mimetype",
            size: byteSize, // bytes
            last_modified: 1661570303752, // timestamp
            ref: entryRef,
          },
        ],
      },
    ]);

    await mgr.onPhxJoinUpload(["joinRef", "msgRef", `lvu:${joinId}`, "phx_join", { token: "token" }]);

    const data = await new BinaryUploadSerDe().serialize({
      joinRef: "joinRef",
      msgRef: "msgRef",
      topic: `lvu:${entryRef}`,
      event: "binary_upload",
      payload: Buffer.alloc(byteSize),
    });

    // call upload_binary through handleSubscriptions
    await mgr.handleSubscriptions({
      type: "upload_binary",
      message: { data },
    });

    // get tempFilePath from entry
    const entry = ((mgr as any).uploadConfigs[uploadName] as UploadConfig).entries[entryRef];

    const { size } = fs.statSync(entry.getTempFile());
    expect(size).toBe(byteSize);
  });

  it("test onProgressUpload", async () => {
    const joinId = "phx-o5LsszTRfwXyYXmj18vjA";
    const uploadName = "uploadName";
    mgr = newMgr({
      wsAdaptor,
      liveView: createLiveView({
        mount: async (socket) => {
          // need to call socket.allowUpload first to configure the uploadConfig
          await socket.allowUpload(uploadName);
        },
        handleEvent(event, socket) {
          // having this defined with squash warning but not actually used
        },
        render: (ctx, meta) => {
          return html`
            ${meta.uploads[uploadName]?.entries.map((entry) => {
              return html`<div>${entry.progress}</div>`;
            })}
          `;
        },
      }),
    });
    await mgr.handleJoin(phxJoinIncoming());

    // the uploadRef is the ref created by "allowUpload" in mount
    const uploadRef = ((mgr as any).uploadConfigs[uploadName] as UploadConfig).ref;
    const entryRef = "0";
    await mgr.onEvent(newFormUploadEvent(joinId, uploadRef, uploadName, entryRef));

    // initiate upload
    await mgr.onAllowUpload([
      "joinRef",
      "msgRef",
      joinId,
      "allow_upload",
      {
        ref: uploadRef,
        entries: [
          {
            name: "filename",
            type: "mimetype",
            size: 1000, // bytes
            last_modified: 1661570303752, // timestamp
            ref: entryRef,
          },
        ],
      },
    ]);

    // join upload
    await mgr.onPhxJoinUpload(["joinRef", "msgRef", `lvu:${uploadRef}`, "phx_join", { token: "token" }]);

    // technically, onBinaryUpload will be called by client but we can skip
    // send progress
    await mgr.handleSubscriptions({
      type: "progress",
      message: [
        "joinRef",
        "msgRef",
        `lv:${joinId}`,
        "progress",
        {
          entry_ref: "0",
          ref: uploadRef,
          event: null,
          progress: 17,
        },
      ],
    });

    // fifth send response is the onProgressUpload response
    expect(send.mock.calls[4][0]).toMatchInlineSnapshot(
      `"[\\"joinRef\\",\\"msgRef\\",\\"lv:phx-o5LsszTRfwXyYXmj18vjA\\",\\"phx_reply\\",{\\"response\\":{\\"diff\\":{\\"0\\":{\\"d\\":[[\\"17\\"]]}}},\\"status\\":\\"ok\\"}]"`
    );
  });

  it("test cancelUpload", async () => {
    const joinId = "phx-lAqkK7LrmoAuZGCMcgVuw";
    const uploadName = "uploadName";
    mgr = newMgr({
      wsAdaptor,
      liveView: createLiveView({
        mount: async (socket) => {
          // need to call socket.allowUpload first to configure the uploadConfig
          await socket.allowUpload(uploadName);
        },
        handleEvent(event, socket) {
          // having this defined with squash warning but not actually used
        },
        render: (ctx, meta) => {
          return html`
            ${meta.uploads[uploadName]?.entries.map((entry) => {
              return html`<div>${entry.progress}</div>`;
            })}
          `;
        },
      }),
    });
    await mgr.handleJoin(phxJoinIncoming());

    // the uploadRef is the ref created by "allowUpload" in mount
    const uploadRef = ((mgr as any).uploadConfigs[uploadName] as UploadConfig).ref;
    const entryRef = "0";
    await mgr.onEvent(newFormUploadEvent(joinId, uploadRef, uploadName, entryRef));

    // refetch the uploadConfig
    let uploadConfig = (mgr as any).uploadConfigs[uploadName] as UploadConfig;
    expect(uploadConfig.entries.length).toEqual(1);

    // now cancel the upload
    await (mgr as any).socket.cancelUpload(uploadName, entryRef);

    // refetch the uploadConfig
    uploadConfig = (mgr as any).uploadConfigs[uploadName] as UploadConfig;
    expect(uploadConfig.entries.length).toEqual(0);
  });

  it("test consumeUploadedEntries and uploadedEntries", async () => {
    const joinId = "phx-o5LsszTRfwXyYXmj18vjA";
    const uploadName = "uploadName";
    mgr = newMgr({
      wsAdaptor,
      liveView: createLiveView({
        mount: async (socket) => {
          // need to call socket.allowUpload first to configure the uploadConfig
          await socket.allowUpload(uploadName);
        },
        handleEvent(event, socket) {
          // having this defined with squash warning but not actually used
        },
        render: (ctx, meta) => {
          return html`
            ${meta.uploads[uploadName]?.entries.map((entry) => {
              return html`<div>${entry.progress}</div>`;
            })}
          `;
        },
      }),
    });
    await mgr.handleJoin(phxJoinIncoming());

    // the uploadRef is the ref created by "allowUpload" in mount
    const uploadRef = ((mgr as any).uploadConfigs[uploadName] as UploadConfig).ref;
    const entryRef = "0";
    await mgr.onEvent(newFormUploadEvent(joinId, uploadRef, uploadName, entryRef));

    // initiate upload
    await mgr.onAllowUpload([
      "joinRef",
      "msgRef",
      joinId,
      "allow_upload",
      {
        ref: uploadRef,
        entries: [
          {
            name: "filename",
            type: "mimetype",
            size: 1000, // bytes
            last_modified: 1661570303752, // timestamp
            ref: entryRef,
          },
        ],
      },
    ]);

    // join upload
    await mgr.onPhxJoinUpload(["joinRef", "msgRef", `lvu:${uploadRef}`, "phx_join", { token: "token" }]);

    // try to consume entries before complete which throws
    await expect(() =>
      ((mgr as any).socket as LiveViewSocket).consumeUploadedEntries(uploadName, async (_, e) => e)
    ).rejects.toThrow();

    // expect uploadedEntries to have 0 completed and 1 pending
    let { completed, inProgress } = await ((mgr as any).socket as LiveViewSocket).uploadedEntries(uploadName);
    expect(completed.length).toEqual(0);
    expect(inProgress.length).toEqual(1);

    // technically, onBinaryUpload will be called by client but we can skip
    // mark upload as complete
    await mgr.onProgressUpload([
      "joinRef",
      "msgRef",
      `lv:${joinId}`,
      "progress",
      {
        entry_ref: "0",
        ref: uploadRef,
        event: null,
        progress: 100,
      },
    ]);

    // now that uploaded is complete, we can get uploaded entries (before consume)
    // expect uploadedEntries to have 1 completed and 0 pending
    const uploadedEntries = await ((mgr as any).socket as LiveViewSocket).uploadedEntries(uploadName);
    expect(uploadedEntries.inProgress.length).toEqual(0);
    expect(uploadedEntries.completed.length).toEqual(1);

    // now that upload is complete, we can consume the entries
    const entries = await ((mgr as any).socket as LiveViewSocket).consumeUploadedEntries(
      uploadName,
      async (meta, entry) => {
        return entry;
      }
    );
    expect(entries.length).toEqual(1);

    // consuming entries from a non-created upload should return empty array
    const entries2 = await ((mgr as any).socket as LiveViewSocket).consumeUploadedEntries(
      "uploadName2",
      async (meta, entry) => {
        return entry;
      }
    );
    expect(entries2.length).toEqual(0);
  });
});

const defaultCSRF = "defaultCSRF";

type NewMgrOpts = {
  pubSub?: PubSub;
  flashAdaptor?: FlashAdaptor;
  serDe?: SerDe;
  fileSystemAdaptor?: FileSystemAdaptor;
  wsAdaptor?: WsAdaptor;
  LiveViewRootRenderer?: LiveViewWrapperTemplate;
  liveView?: LiveView;
  cid?: string;
};
function newMgr(opts?: NewMgrOpts): LiveViewManager {
  const pubSub = opts?.pubSub ?? new SingleProcessPubSub();
  const flashAdaptor = opts?.flashAdaptor ?? new SessionFlashAdaptor();
  const serDe = opts?.serDe ?? new JsonSerDe();
  const fileSystemAdaptor = opts?.fileSystemAdaptor ?? new TestNodeFileSystemAdatptor();
  const wsAdaptor =
    opts?.wsAdaptor ?? ({ send: jest.fn(), subscribeToClose: jest.fn(), subscribeToMessages: jest.fn() } as WsAdaptor);
  const lv = opts?.liveView ?? createLiveView({ render: () => html`` });
  const cid = opts?.cid ?? nanoid();
  return new LiveViewManager(
    lv,
    cid,
    wsAdaptor,
    serDe,
    pubSub,
    flashAdaptor,
    fileSystemAdaptor,
    {},
    opts?.LiveViewRootRenderer
  );
}

type PhxJoinIncomingOpts = {
  csrfToken?: string;
  paramCsrfOverride?: string;
  signingSecret?: string;
  url?: string;
  redirect?: string;
  flash?: PhxFlash | null;
  signingSecretOverride?: string;
  joinId?: string;
};
function phxJoinIncoming(opts?: PhxJoinIncomingOpts): PhxJoinIncoming {
  const session: Partial<SessionData> = {
    _csrf_token: opts?.csrfToken ?? defaultCSRF,
  };
  const params: LiveViewMountParams = {
    _csrf_token: opts?.paramCsrfOverride ?? opts?.csrfToken ?? defaultCSRF,
    _mounts: 0,
  };
  const url = opts?.url ?? opts?.redirect ?? "http://localhost:4444/test";
  const jwtSession = JSON.stringify(session);
  return [
    "4",
    "4",
    `lv:${opts?.joinId ?? nanoid()}`,
    "phx_join",
    {
      url,
      params,
      session: jwtSession,
      static: "",
    },
  ];
}

const newJoinId = () => `phx-${nanoid()}`;

function newFormUploadEvent(
  joinId: string,
  uploadRef: string,
  uploadName: string,
  entryRef: string
): PhxIncomingMessage<PhxFormPayload> {
  return [
    "joinRef",
    "msgRef",
    joinId,
    "event",
    {
      event: "validate",
      type: "form",
      uploads: {
        [uploadRef]: [
          {
            name: "filename",
            path: "path",
            ref: entryRef,
            size: 1000, // bytes
            last_modified: 1661570303752, // timestamp
            type: "text/html",
          } as PhxEventUpload,
        ],
      },
      value: `_csrf_token=${defaultCSRF}&_target=${uploadName}`,
    },
  ];
}
