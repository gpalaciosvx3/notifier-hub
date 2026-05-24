import { OutboxEventEntity } from '../../../common/entities/outbox-event.entity';

export abstract class BrokerPublishStrategy {
  abstract publish(event: OutboxEventEntity): Promise<void>;
}
