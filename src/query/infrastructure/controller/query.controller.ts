import { Injectable } from '@nestjs/common';
import { HttpStatus } from '@nestjs/common';
import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { GetNotificationUseCase } from '../../application/use-cases/get-notification.usecase';
import { QueryEventParser } from '../../application/parsers/query.parser';
import { ApiGwHelper } from '../../../common/helpers/api-gw.helper';

@Injectable()
export class QueryController {
  constructor(
    private readonly parser: QueryEventParser,
    private readonly useCase: GetNotificationUseCase,
  ) {}

  async handle(event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> {
    try {
      return ApiGwHelper.exito(HttpStatus.OK, await this.useCase.execute(this.parser.parse(event)));
    } catch (error) {
      return ApiGwHelper.error(error);
    }
  }
}
