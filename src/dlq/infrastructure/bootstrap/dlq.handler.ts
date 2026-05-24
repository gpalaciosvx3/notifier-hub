import { createSqsHandler } from '../../../common/bootstrap';
import { DlqModule } from './dlq.module';
import { DlqController } from '../controller/dlq.controller';

export const handler = createSqsHandler(DlqModule, DlqController);

