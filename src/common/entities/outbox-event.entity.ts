import { ulid } from 'ulid';
import { OutboxEventType } from '../constants/outbox-event-type.constants';
import { OutboxEventBrokerType } from '../constants/outbox-event-broker-type.constants';
import { OutboxEventConstants } from '../constants/outbox-event.constants';

export class OutboxEventEntity {
  private constructor(
    public readonly eventId: string,
    public readonly eventType: OutboxEventType,
    public readonly brokerType: OutboxEventBrokerType,
    public readonly payload: Record<string, unknown>,
    public readonly createdAt: string,
    public readonly ttl: number,
    public readonly publishedAt?: string,
  ) {}

  static build(params: {
    eventType: OutboxEventType;
    brokerType: OutboxEventBrokerType;
    payload: Record<string, unknown>;
  }): OutboxEventEntity {
    const now = new Date().toISOString();
    return new OutboxEventEntity(
      ulid(),
      params.eventType,
      params.brokerType,
      params.payload,
      now,
      Math.floor(Date.now() / 1000) + OutboxEventConstants.TTL_SECONDS,
    );
  }

  static fromRecord(record: {
    eventId: string;
    eventType: OutboxEventType;
    brokerType: OutboxEventBrokerType;
    payload: Record<string, unknown>;
    createdAt: string;
    ttl: number;
    publishedAt?: string;
  }): OutboxEventEntity {
    return new OutboxEventEntity(
      record.eventId,
      record.eventType,
      record.brokerType,
      record.payload,
      record.createdAt,
      record.ttl,
      record.publishedAt,
    );
  }
}
