export abstract class WebhookQueueSqsRepository {
  abstract publish(payload: string): Promise<void>;
}
