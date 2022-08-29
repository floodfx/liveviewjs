export type SubscriberFunction<T> = (data: T) => void;

export type SubscriberId = string;

/**
 * A Subscriber allows you to subscribe and unsubscribe to a PubSub topic providing a callback function.
 */
export interface Subscriber {
  subscribe<T extends { type: string }>(topic: string, subscriber: SubscriberFunction<T>): Promise<SubscriberId>;
  unsubscribe(topic: string, subscriberId: SubscriberId): Promise<void>;
}

/**
 * A Publisher allows you to publish data to a PubSub topic.
 */
export interface Publisher {
  broadcast<T extends { type: string }>(topic: string, data: T): Promise<void>;
}

/**
 * A PubSub implements both a Publisher and a Subscriber.
 */
export interface PubSub extends Subscriber, Publisher {}
