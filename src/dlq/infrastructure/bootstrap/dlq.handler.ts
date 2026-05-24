import { SqsHandlerFactory } from '../../../common/bootstrap';
import { DlqModule } from './dlq.module';
import { DlqController } from '../controller/dlq.controller';

export const handler = new SqsHandlerFactory().build(DlqModule, DlqController);

