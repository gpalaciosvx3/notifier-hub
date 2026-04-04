import { Injectable } from '@nestjs/common';
import { NotificationEntity } from '../../../common/entities/notification.entity';
import { QueryService } from '../../domain/service/query.service';
import { SearchNotificationCommand } from '../../domain/commands/search-notification.command';
import { QueryType } from '../../domain/constants/query-type.constants';
import { QueryRequestDto } from '../dtos/query.request.dto';

@Injectable()
export class GetNotificationUseCase {
  constructor(private readonly service: QueryService) {}

  execute(dto: QueryRequestDto): Promise<NotificationEntity | NotificationEntity[]> {
    const command = dto.tipo === QueryType.BY_ID
      ? SearchNotificationCommand.byId(dto.notificationId)
      : SearchNotificationCommand.byStatus(dto.status);
    return this.service.search(command);
  }
}
