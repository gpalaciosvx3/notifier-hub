import { Injectable } from '@nestjs/common';
import { SQSEvent, SQSBatchResponse } from 'aws-lambda';
import { ProcessBatchUseCase } from '../../application/use-cases/process-batch.usecase';
import { SqsEventParser } from '../../application/parsers/sqs.parser';

@Injectable()
export class WorkerController {
  constructor(
    private readonly parser: SqsEventParser,
    private readonly useCase: ProcessBatchUseCase,
  ) {}

  handle(event: SQSEvent): Promise<SQSBatchResponse> {
    return this.useCase.execute(this.parser.parse(event));
  }
}
