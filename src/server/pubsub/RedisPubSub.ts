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
    const redisSub = this.redis.duplicate();
    await redisSub.connect();
    redisSub.subscribe(topic, (data: string) => {
      listener(JSON.parse(data) as T);
    });
  }

  public async broadcast(topic: string, data: T) {
    console.log(`Broadcasting to ${topic}`);
    if (!this.redis.isOpen) {
      await this.redis.connect();
    }
    await this.redis.publish(topic, JSON.stringify(data));
  }

  public async unsubscribe(topic: string, listener: (data: T) => void) {
    this.redis.unsubscribe(topic);
  }

}