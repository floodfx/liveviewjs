export type SubscriberFunction<T> = (data: T) => void;

export interface Subscriber {
  subscribe<T>(topic: string, subscriber: SubscriberFunction<T>): Promise<string>;
  unsubscribe(topic: string, subscriberId: string): Promise<void>;
}

export interface Publisher {
  broadcast<T>(topic: string, data: T): Promise<void>;
}

export interface PubSub extends Subscriber, Publisher {}
