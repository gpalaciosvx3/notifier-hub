import { SqsHandlerFactory } from '../../../common/bootstrap';
import { EnvConstants } from '../../../common/constants/env.constants';
import { DlqModule } from './dlq.module';
import { DlqController } from '../controller/dlq.controller';

export const handler = new SqsHandlerFactory().build(DlqModule, DlqController, EnvConstants.REQUERIDAS_DLQ);

