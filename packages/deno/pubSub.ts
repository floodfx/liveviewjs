import {
  Publisher,
  Subscriber,
  SubscriberFunction,
} from "./liveviewjs.ts";

// const broadcastChannel = new BroadcastChannel();

// export class SingleProcessPubSub<T> implements Subscriber, Publisher {
//   private subscribers: Record<string, SubscriberFunction<any>> = {};

//   public async subscribe<T>(
//     topic: string,
//     subscriber: SubscriberFunction<T>,
//   ): Promise<string> {
//     await eventEmitter.on(topic, subscriber);
//     // store connection id for unsubscribe and return for caller
//     const subId = crypto.randomBytes(10).toString("hex");
//     this.subscribers[subId] = subscriber;
//     return subId;
//   }

//   public async broadcast<T>(topic: string, data: T) {
//     await eventEmitter.emit(topic, data);
//   }

//   public async unsubscribe(topic: string, subscriberId: string) {
//     // get subscriber function from id
//     const subscriber = this.subscribers[subscriberId];
//     await eventEmitter.off(topic, subscriber);
//     // remove subscriber from subscribers
//     delete this.subscribers[subscriberId];
//   }
// }
