import { SqsHandlerFactory } from '../../../common/bootstrap';
import { EnvConstants } from '../../../common/constants/env.constants';
import { WebhookDispatcherModule } from './webhook-dispatcher.module';
import { WebhookDispatcherController } from '../controller/webhook-dispatcher.controller';

export const handler = new SqsHandlerFactory().build(
  WebhookDispatcherModule,
  WebhookDispatcherController,
  EnvConstants.REQUERIDAS_WEBHOOK_DISPATCHER,
);
