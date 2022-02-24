

export interface Subscriber<T> {
  subscribe(topic: string, listener: (data: T) => void): void;
  unsubscribe(topic: string, listener: (data: T) => void): void;
}

export interface Publisher<T> {
  broadcast(topic: string, data: T): void;
}