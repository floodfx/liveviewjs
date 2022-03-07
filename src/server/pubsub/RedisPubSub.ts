import { RedisClientOptions, RedisClientType } from '@node-redis/client';
import { nanoid } from 'nanoid';
import { createClient } from 'redis';
import { Publisher, Subscriber, SubscriberFunction } from '.';



/**
 * A PubSub implementation that uses Redis as a backend.
 *
 * See: https://github.com/redis/node-redis#pubsub
 */
class RedisPubSub<T> implements Subscriber<T>, Publisher<T> {

  private redis: RedisClientType;
  private subscribers: Record<string, RedisClientType> = {};

  constructor(options: RedisClientOptions) {
    this.redis = createClient(options);
    this.redis.connect();
  }

  public async subscribe(topic: string, subscriber: SubscriberFunction<T>): Promise<string> {
    // create new connection for each subscription
    const redisSub = this.redis.duplicate();
    await redisSub.connect();

    // parse data to JSON before passing to subscriber
    redisSub.subscribe(topic, (data: string) => {
      subscriber(JSON.parse(data) as T);
    });

    // store connection id for unsubscribe and return for caller
    const subscriberId = nanoid();
    this.subscribers[subscriberId] = redisSub;
    return subscriberId;
  }

  public async broadcast(topic: string, data: T): Promise<void> {
    if (!this.redis.isOpen) {
      await this.redis.connect();
    }
    await this.redis.publish(topic, JSON.stringify(data));
  }

  public async unsubscribe(topic: string, subscriberId: string): Promise<void> {
    // look up redis connection from subscriber id
    const redisSub = this.subscribers[subscriberId];
    await redisSub.unsubscribe(topic);
    // remove subscriber from subscribers
    delete this.subscribers[subscriberId];
  }

}

export const PubSub = new RedisPubSub(
  { url: process.env.REDIS_URL || "redis://localhost:6379" }
);