import { EventEmitter } from 'events';
import { Publisher, Subscriber } from ".";

/**
 * A PubSub implementation that uses the Node.js EventEmitter as a backend.
 *
 * Should only be used in single process environments like local development
 * or a single instance.  In a multi-process environment, use RedisPubSub.
 */
class SingleProcessPubSub<T> implements Subscriber<T>, Publisher<T> {

  private eventEmitter: EventEmitter;

  constructor() {
    this.eventEmitter = new EventEmitter();
  }

  public async subscribe(topic: string, listener: (data: T) => void) {
    this.eventEmitter.on(topic, listener);
  }

  public async broadcast(topic: string, data: T) {
    this.eventEmitter.emit(topic, data);
  }

  public async unsubscribe(topic: string, listener: (data: T) => void) {
    this.eventEmitter.off(topic, listener);
  }

}

export const PubSub = new SingleProcessPubSub<unknown>();