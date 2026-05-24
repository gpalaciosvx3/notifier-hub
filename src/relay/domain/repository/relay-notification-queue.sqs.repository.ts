export abstract class NotificationQueueSqsRepository {
  abstract publish(payload: string): Promise<void>;
}
