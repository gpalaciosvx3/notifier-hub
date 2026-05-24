import { SqsHandlerFactory } from '../../../common/bootstrap';
import { EnvConstants } from '../../../common/constants/env.constants';
import { SenderModule } from './sender.module';
import { SenderController } from '../controller/sender.controller';

export const handler = new SqsHandlerFactory().build(
  SenderModule,
  SenderController,
  EnvConstants.REQUERIDAS_SENDER,
);
