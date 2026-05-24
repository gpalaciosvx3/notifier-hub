import { Injectable, Logger } from '@nestjs/common';
import { NotificationDbRepository } from '../../enqueue/domain/repository/notification.db.repository';

@Injectable()
export class IdempotencyMiddleware {
  private readonly logger = new Logger(IdempotencyMiddleware.name);

  constructor(private readonly notificationRepository: NotificationDbRepository) {}

  async check(idempotencyKey?: string): Promise<string | null> {
    if (!idempotencyKey) return null;
    this.logger.log(`Verificando idempotencia => idempotencyKey: ${idempotencyKey}`);
    const existing = await this.notificationRepository.findNotificationIdByIdempotencyKey(idempotencyKey);
    if (existing) {
      this.logger.log(`Resultado idempotente => notificationId: ${existing}`);
    }
    return existing;
  }
}
