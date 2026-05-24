import { Injectable, Logger } from '@nestjs/common';
import { NotificationEntity } from '../../../common/entities/notification.entity';
import { CustomException } from '../../../common/errors/custom.exception';
import { ErrorDictionary } from '../../../common/errors/error.dictionary';
import { NotificationDbRepository } from '../repository/query-notification.db.repository';
import { RawSearchQuery, SearchQueryInput } from '../types/query-search-input.types';
import { QueryType } from '../constants/query-type.constants';
import { SearchQueryMapper } from '../mapper/query-search.mapper';
import { NotificationSummaryMapper } from '../mapper/query-notification-summary.mapper';
import { NotificationSummary, PagedResult } from '../types/query-output.types';

@Injectable()
export class QueryService {
  private readonly logger = new Logger(QueryService.name);

  constructor(private readonly dbRepository: NotificationDbRepository) {}

  search(raw: RawSearchQuery): Promise<NotificationEntity | NotificationEntity[]> {
    const input = SearchQueryMapper.fromDto(raw);
    this.logger.log(`[PASO 1] Resolviendo búsqueda => tipo: ${input.type}`);
    return this.handlers[input.type](input);
  }

  private readonly handlers: Record<
    QueryType,
    (input: SearchQueryInput) => Promise<NotificationEntity | NotificationEntity[]>
  > = {
    [QueryType.BY_ID]: (input) => this.getById(input.notificationId!),
    [QueryType.BY_STATUS]: (input) => this.dbRepository.findByStatus(input.status!),
  };

  async searchByRecipient(
    to: string,
    pageToken?: string,
  ): Promise<PagedResult<NotificationSummary>> {
    this.logger.log(`[PASO 1] Consultando notificaciones por destinatario => to: ${to}`);
    const paged = await this.dbRepository.findByRecipient(to, pageToken);
    this.logger.log(`[PASO 2] Mapeando resultados => count: ${paged.items.length}`);
    return {
      items: paged.items.map(NotificationSummaryMapper.fromEntity),
      nextPageToken: paged.nextPageToken,
    };
  }

  private async getById(notificationId: string): Promise<NotificationEntity> {
    this.logger.log(`[PASO 2] Buscando notificación por ID => notificationId: ${notificationId}`);
    const notification = await this.dbRepository.findById(notificationId);
    if (!notification) throw new CustomException(ErrorDictionary.NOTIFICATION_NOT_FOUND);
    return notification;
  }
}
