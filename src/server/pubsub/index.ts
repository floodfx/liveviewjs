
export type SubscriberFunction<T> = (data: T) => void

export interface Subscriber<T> {
  subscribe(topic: string, subscriber: SubscriberFunction<T>): string | Promise<string>;
  unsubscribe(topic: string, subscriberId: string): void;
}

export interface Publisher<T> {
  broadcast(topic: string, data: T): void;
}

