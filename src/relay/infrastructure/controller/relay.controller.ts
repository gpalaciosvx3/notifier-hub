import { Injectable } from '@nestjs/common';
import { DynamoStreamHandlerEvent } from '../../../common/middleware/types/lambda-event.types';
import { RelayEventUseCase } from '../../application/use-cases/relay-event.usecase';
import { ProcessRecordResult } from '../../../common/types/process-record-result.types';
import { HandleExecution } from '../../../common/decorator/handle-execution.decorator';

@Injectable()
export class RelayController {
  constructor(private readonly useCase: RelayEventUseCase) {}

  @HandleExecution('OutboxRelay')
  async handle(event: DynamoStreamHandlerEvent): Promise<ProcessRecordResult[]> {
    return this.useCase.executeBatch(event.parsed.records);
  }
}
