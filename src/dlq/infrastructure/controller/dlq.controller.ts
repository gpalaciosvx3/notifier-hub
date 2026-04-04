import { Injectable } from '@nestjs/common';
import { SQSEvent } from 'aws-lambda';
import { MarkBatchFailedPermanentUseCase } from '../../application/use-cases/mark-batch-failed-permanent.usecase';
import { SqsEventParser } from '../../../worker/application/parsers/sqs.parser';

@Injectable()
export class DlqController {
  constructor(
    private readonly parser: SqsEventParser,
    private readonly useCase: MarkBatchFailedPermanentUseCase,
  ) {}

  handle(event: SQSEvent): Promise<void> {
    return this.useCase.execute(this.parser.parse(event));
  }
}
