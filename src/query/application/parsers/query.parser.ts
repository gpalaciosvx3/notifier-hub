import { Injectable } from '@nestjs/common';
import { APIGatewayProxyEventV2 } from 'aws-lambda';
import { NotificationStatus } from '../../../common/constants/notification-status.constants';
import { QueryType } from '../../domain/constants/query-type.constants';
import { QueryRequestDto } from '../dtos/query.request.dto';

@Injectable()
export class QueryEventParser {
  parse(event: APIGatewayProxyEventV2): QueryRequestDto {
    return event.pathParameters?.id
      ? { tipo: QueryType.BY_ID, notificationId: event.pathParameters.id }
      : { tipo: QueryType.BY_STATUS, status: event.queryStringParameters?.status as NotificationStatus ?? NotificationStatus.PENDING };
  }
}
