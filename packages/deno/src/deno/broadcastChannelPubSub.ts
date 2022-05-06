import { PubSub, SubscriberFunction } from "../deps.ts";

/**
 * BroadcastChannel pubsub implementation.  See: https://deno.com/deploy/docs/runtime-broadcast-channel
 */
export class BroadcastChannelPubSub implements PubSub {
  private channels: Record<string, BroadcastChannel> = {};

  public subscribe<T>(topic: string, subscriber: SubscriberFunction<T>): Promise<string> {
    const channel = new BroadcastChannel(topic);
    channel.onmessage = (ev) => subscriber(ev.data);
    // store connection id for unsubscribe and return for caller
    const subId = crypto.randomUUID();
    this.channels[subId] = channel;
    return Promise.resolve(subId);
  }

  public async broadcast<T>(topic: string, data: T) {
    return await new BroadcastChannel(topic).postMessage(data);
  }

  public async unsubscribe(_topic: string, subscriberId: string) {
    // get channel by sub id
    const channel = this.channels[subscriberId];
    if (channel) {
      // unsubscribe and delete
      channel.onmessage = null;
      delete this.channels[subscriberId];
    }
    return await Promise.resolve();
  }
}
