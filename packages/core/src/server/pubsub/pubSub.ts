export type SubscriberFunction<T> = (data: T) => void;

export type SubscriberId = string;

export interface Subscriber {
  subscribe<T extends { type: string }>(topic: string, subscriber: SubscriberFunction<T>): Promise<SubscriberId>;
  unsubscribe(topic: string, subscriberId: SubscriberId): Promise<void>;
}

export interface Publisher {
  broadcast<T extends { type: string }>(topic: string, data: T): Promise<void>;
}

export interface PubSub extends Subscriber, Publisher {}
