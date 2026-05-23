export abstract class SchedulerRepository {
  abstract schedule(payload: string, scheduledAt: string, targetQueueUrl: string): Promise<void>;
}
