import { Phx } from "../protocol/phx";

// export interface PhxUploadMsg {
//   joinRef: string;
//   messageRef: string;
//   topic: string;
//   event: string;
//   data: Buffer;
// }

export class BinaryUploadSerDe {
  deserialize(data: Buffer): Phx.UploadMsg {
    // read first 5 bytes to get sizes of parts
    const sizesOffset = 5;
    const sizes = data.subarray(0, sizesOffset);
    const startSize = parseInt(sizes[0].toString());
    // istanbul ignore next
    if (startSize !== 0) {
      // istanbul ignore next
      throw Error(`Unexpected startSize from uploadBinary: ${sizes.subarray(0, 1).toString()}`);
    }
    const joinRefSize = parseInt(sizes[1].toString());
    const messageRefSize = parseInt(sizes[2].toString());
    const topicSize = parseInt(sizes[3].toString());
    const eventSize = parseInt(sizes[4].toString());

    // console.log("sizes", startSize, joinRefSize, messageRefSize, topicSize, eventSize);

    // read header and header parts
    const headerLength = startSize + joinRefSize + messageRefSize + topicSize + eventSize;

    const header = data.subarray(sizesOffset, sizesOffset + headerLength).toString();
    let start = 0;
    let end = joinRefSize;
    const joinRef = header.slice(0, end).toString();
    start += joinRefSize;
    end += messageRefSize;
    const msgRef = header.slice(start, end).toString();
    start += messageRefSize;
    end += topicSize;
    const topic = header.slice(start, end).toString();
    start += topicSize;
    end += eventSize;
    const event = header.slice(start, end).toString();
    // console.log(`onUploadBinary header: joinRef:${joinRef}, messageRef:${messageRef}, topic:${topic}, event:${event}`);

    // adjust data index based on message length
    const dataStartIndex = sizesOffset + headerLength;

    // get rest of data
    const payload = data.subarray(dataStartIndex);
    return {
      joinRef,
      msgRef,
      topic,
      event,
      payload,
    };
  }
  serialize(value: Phx.UploadMsg): Buffer {
    const { joinRef, msgRef, topic, event, payload } = value;
    const joinRefSize = Buffer.byteLength(joinRef);
    const messageRefSize = Buffer.byteLength(msgRef);
    const topicSize = Buffer.byteLength(topic);
    const eventSize = Buffer.byteLength(event);
    const dataLength = payload.length;
    const headerLength = joinRefSize + messageRefSize + topicSize + eventSize;
    const sizes = Buffer.from([0, joinRefSize, messageRefSize, topicSize, eventSize]);
    const header = Buffer.from(`${joinRef}${msgRef}${topic}${event}`);
    const buffer = Buffer.concat([sizes, header, payload], sizes.length + headerLength + dataLength);
    return buffer;
  }
}
