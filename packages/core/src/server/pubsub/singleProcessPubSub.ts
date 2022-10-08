import crypto from "crypto";
import EventEmitter from "events";
import { Publisher, Subscriber, SubscriberFunction } from "./pubSub";

/**
 * A PubSub implementation that uses the Node.js EventEmitter as a backend.
 *
 * Should only be used in single process environments like local development
 * or a single instance.  In a multi-process environment, use RedisPubSub.
 */
const eventEmitter = new EventEmitter(); // use this singleton for all pubSub events

export class SingleProcessPubSub implements Subscriber, Publisher {
  private subscribers: Record<string, SubscriberFunction<any>> = {};

  public async subscribe<T>(topic: string, subscriber: SubscriberFunction<T>): Promise<string> {
    await eventEmitter.addListener(topic, subscriber);
    // store connection id for unsubscribe and return for caller
    const subId = crypto.randomBytes(10).toString("hex");
    this.subscribers[subId] = subscriber;
    return subId;
  }

  public async broadcast<T>(topic: string, data: T) {
    await eventEmitter.emit(topic, data);
  }

  public async unsubscribe(topic: string, subscriberId: string) {
    try {
      // get subscriber function from id
      const subscriber = this.subscribers[subscriberId];

      if (subscriber) {
        await eventEmitter.removeListener(topic, subscriber);
      }
      // remove subscriber from subscribers
      delete this.subscribers[subscriberId];
    } catch (err) {
      console.warn("error unsubscribing from topic", topic, err);
    }
  }
}
