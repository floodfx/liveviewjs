import { nanoid } from "nanoid";
import { FileSystemAdaptor } from "../../../server/adaptor";
import { LiveViewTemplate } from "../../../server/live";
import { Phx } from "../../../server/protocol/phx";
import { PhxReply } from "../../../server/protocol/reply";
import { UploadConfig } from "../../../server/upload";
import { WsHandlerContext } from "./wsHandler";

export async function onUploadBinary(
  ctx: WsHandlerContext,
  msg: Phx.Msg<Buffer>,
  fileSystem: FileSystemAdaptor
): Promise<PhxReply.Reply[]> {
  // generate a random temp file path
  const randomTempFilePath = fileSystem.tempPath(nanoid());

  const [joinRef, msgRef, topic, event, payload] = msg;

  fileSystem.writeTempFile(randomTempFilePath, payload);
  // console.log("wrote temp file", randomTempFilePath, header.length, `"${header.toString()}"`);

  // split topic to get uploadRef
  const ref = topic.split(":")[1];

  // get activeUploadConfig by this.activeUploadRef
  const activeUploadConfig = Object.values(ctx.uploadConfigs).find((c) => c.ref === ctx.activeUploadRef);
  if (activeUploadConfig) {
    // find entry from topic ref
    const entry = activeUploadConfig.entries.find((e) => e.ref === ref);
    if (!entry) {
      // istanbul ignore next
      throw Error(`Could not find entry for ref ${ref} in uploadConfig ${JSON.stringify(activeUploadConfig)}`);
    }

    // use fileSystemAdaptor to get path to a temp file
    const entryTempFilePath = fileSystem.tempPath(entry.uuid);
    // create or append to entry's temp file
    fileSystem.createOrAppendFile(entryTempFilePath, randomTempFilePath);
    // tell the entry where it's temp file is
    entry.setTempFile(entryTempFilePath);
  }

  let returnDiff = true;
  Object.keys(ctx.uploadConfigs).forEach((key) => {
    const config = ctx.uploadConfigs[key];
    // match upload config on the active upload ref
    if (config.ref === ctx.activeUploadRef) {
      // check if ref progress > 0
      config.entries.forEach((entry) => {
        if (entry.ref === ref) {
          // only return diff if entry ref progress is 0
          returnDiff = entry.progress === 0;
        }
      });
    }
  });
  const replies = [];
  if (returnDiff) {
    replies.push(PhxReply.diff(joinRef, ctx.joinId, {}));
  }

  const m: Phx.Msg = [joinRef, msgRef, topic, event, {}];
  replies.push(PhxReply.renderedReply(m, {}));
  return replies;
}

export async function onProgressUpload(
  ctx: WsHandlerContext,
  payload: Phx.ProgressUploadPayload
): Promise<LiveViewTemplate> {
  const { ref, entry_ref, progress } = payload;
  // console.log("onProgressUpload handle", ref, entry_ref, progress);

  // iterate through uploadConfigs and find the one that matches the ref
  const uploadConfig = Object.values(ctx.uploadConfigs).find((config) => config.ref === ref);
  if (uploadConfig) {
    uploadConfig.entries = uploadConfig.entries.map((entry) => {
      if (entry.ref === entry_ref) {
        entry.updateProgress(progress);
      }
      return entry;
    });
    ctx.uploadConfigs[uploadConfig.name] = uploadConfig;
  } else {
    // istanbul ignore next
    console.error("Received progress upload but could not find upload config for ref", ref);
  }

  return await ctx.liveView.render(ctx.socket.context, ctx.defaultLiveViewMeta());
}

export type AllowUploadEntries = { [key: string]: string };
export type AllowUploadResult = {
  entries: AllowUploadEntries;
  config: UploadConfig;
  view: LiveViewTemplate;
};
export async function onAllowUpload(
  ctx: WsHandlerContext,
  payload: Phx.AllowUploadPayload
): Promise<AllowUploadResult> {
  const { ref, entries } = payload;

  ctx.activeUploadRef = ref;
  const uc = Object.values(ctx.uploadConfigs).find((c) => c.ref === ref);
  if (!uc) {
    // istanbul ignore next
    throw Error(`Could not find upload config for ref ${ref}`);
  }

  const entriesReply: { [key: string]: string } = {
    ref,
  };
  entries.forEach(async (entry) => {
    try {
      // this reply ends up been the "token" for the onPhxJoinUpload
      entriesReply[entry.ref] = JSON.stringify(entry);
    } catch (e) {
      // istanbul ignore next
      console.error("Error serializing entry", e);
    }
  });

  const view = await ctx.liveView.render(ctx.socket.context, ctx.defaultLiveViewMeta());
  return {
    entries: entriesReply,
    config: uc,
    view,
  };

  // // wrap in root template if there is one
  // view = await this.maybeWrapInRootTemplate(view);

  // // diff the new view with the old view
  // const newParts = view.partsTree(true);
  // let diff = deepDiff(this._parts!, newParts);
  // // reset parts to new parts
  // this._parts = newParts;

  // // add the rest of the things
  // diff = this.maybeAddPageTitleToParts(diff);
  // diff = this.maybeAddEventsToParts(diff);

  // const replyPayload = {
  //   response: {
  //     diff,
  //     config,
  //     entries: entriesReply,
  //   },
  //   status: "ok",
  // };

  // this.sendPhxReply(newPhxReply(message, replyPayload));

  // // maybe send any queued info messages
  // await this.maybeSendInfos();

  // // remove temp data
  // this.socket.updateContextWithTempAssigns();
}
