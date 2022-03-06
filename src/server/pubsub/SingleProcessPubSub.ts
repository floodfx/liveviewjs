import { EventEmitter } from 'events';
import { nanoid } from 'nanoid';
import { Publisher, Subscriber, SubscriberFunction } from ".";

/**
 * A PubSub implementation that uses the Node.js EventEmitter as a backend.
 *
 * Should only be used in single process environments like local development
 * or a single instance.  In a multi-process environment, use RedisPubSub.
 */
class SingleProcessPubSub<T> implements Subscriber<T>, Publisher<T> {

  private eventEmitter: EventEmitter;
  private subscribers: Record<string, SubscriberFunction<T>> = {};

  constructor() {
    this.eventEmitter = new EventEmitter();
  }

  public async subscribe(topic: string, subscriber: SubscriberFunction<T>): Promise<string> {
    this.eventEmitter.on(topic, subscriber);
    // store connection id for unsubscribe and return for caller
    const subscriberId = nanoid();
    this.subscribers[subscriberId] = subscriber;
    return subscriberId;
  }

  public async broadcast(topic: string, data: T) {
    this.eventEmitter.emit(topic, data);
  }

  public async unsubscribe(topic: string, subscriberId: string) {
    // get subscriber function from id
    const subscriber = this.subscribers[subscriberId];
    this.eventEmitter.off(topic, subscriber);
    // remove subscriber from subscribers
    delete this.subscribers[subscriberId];
  }

}

export const PubSub = new SingleProcessPubSub<unknown>();