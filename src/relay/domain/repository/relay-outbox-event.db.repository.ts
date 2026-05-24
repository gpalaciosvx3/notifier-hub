export abstract class OutboxEventDbRepository {
  abstract markPublished(eventId: string, publishedAt: string): Promise<void>;
}
