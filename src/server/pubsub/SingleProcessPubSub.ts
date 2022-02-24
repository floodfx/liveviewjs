import { EventEmitter } from 'events';
import { Publisher, Subscriber } from ".";


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

export const createPubSub = <T>() => new SingleProcessPubSub<T>();