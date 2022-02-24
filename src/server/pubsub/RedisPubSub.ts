import { RedisClientType, RedisClientOptions } from '@node-redis/client';
import { createClient } from 'redis';
import { Publisher, Subscriber } from '.';

/**
 * A PubSub implementation that uses Redis as a backend.
 *
 * See: https://github.com/redis/node-redis#pubsub
 */
export class RedisPubSub<T> implements Subscriber<T>, Publisher<T> {

  private redis: RedisClientType;

  constructor(options: RedisClientOptions) {
    this.redis = createClient(options);
  }

  public async subscribe(topic: string, listener: (data: T) => void) {
    this.redis.on(topic, (data: string) => {
      listener(JSON.parse(data) as T);
    });
  }

  public async broadcast(topic: string, data: T) {
    this.redis.publish(topic, JSON.stringify(data));
  }

  public async unsubscribe(topic: string, listener: (data: T) => void) {
    this.redis.unsubscribe(topic);
  }

}