import { Injectable, Logger } from '@nestjs/common';
import { NotificationEntity } from '../../../common/entities/notification.entity';
import { CustomException } from '../../../common/errors/custom.exception';
import { ErrorDictionary } from '../../../common/errors/error.dictionary';
import { NotificationDbRepository } from '../repository/notification.db.repository';
import { SearchNotificationCommand } from '../commands/search-notification.command';
import { QueryType } from '../constants/query-type.constants';
import { NotificationSummaryMapper } from '../mapper/notification-summary.mapper';
import { NotificationSummary, PagedResult } from '../types/query-output.types';

@Injectable()
export class QueryService {
  private readonly logger = new Logger(QueryService.name);

  constructor(private readonly dbRepository: NotificationDbRepository) {}

  private readonly handlers: Record<QueryType, (command: SearchNotificationCommand) => Promise<NotificationEntity | NotificationEntity[]>> = {
    [QueryType.BY_ID]: (command) => this.getById(command.notificationId!),
    [QueryType.BY_STATUS]: (command) => this.dbRepository.findByStatus(command.status!),
  };

  search(command: SearchNotificationCommand): Promise<NotificationEntity | NotificationEntity[]> {
    return this.handlers[command.type](command);
  }

  async searchByRecipient(to: string, pageToken?: string): Promise<PagedResult<NotificationSummary>> {
    this.logger.log(`[PASO 1] Consultando notificaciones por destinatario => to: ${to}`);
    const paged = await this.dbRepository.findByRecipient(to, pageToken);
    this.logger.log(`[PASO 2] Mapeando resultados => count: ${paged.items.length}`);
    return { items: paged.items.map(NotificationSummaryMapper.fromEntity), nextPageToken: paged.nextPageToken };
  }

  private async getById(notificationId: string): Promise<NotificationEntity> {
    const notification = await this.dbRepository.findById(notificationId);
    if (!notification) throw new CustomException(ErrorDictionary.NOTIFICATION_NOT_FOUND);
    return notification;
  }
}
