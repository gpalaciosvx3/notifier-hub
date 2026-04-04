import { Injectable } from '@nestjs/common';
import { NotificationDbRepository } from '../../domain/repository/notification.db.repository';
import { NotificationSqsRepository } from '../../domain/repository/notification.sqs.repository';
import { NotificationService } from '../../domain/service/notification.service';
import { BuildNotificationCommand } from '../../domain/commands/build-notification.command';
import { EnqueueNotificationRequestDto } from '../dtos/enqueue-notification.request.dto';

@Injectable()
export class EnqueueNotificationUseCase {
  constructor(
    private readonly service: NotificationService,
    private readonly dbRepository: NotificationDbRepository,
    private readonly sqsRepository: NotificationSqsRepository,
  ) {}

  async execute(dto: EnqueueNotificationRequestDto): Promise<string> {
    const command = new BuildNotificationCommand(dto.channel, dto.to, dto.body, dto.provider, dto.subject);
    const notification = this.service.build(command);
    await this.dbRepository.create(notification);
    await this.sqsRepository.enqueue(notification);
    return notification.notificationId;
  }
}
