import { SqsHandlerFactory } from '../../../common/bootstrap';
import { WebhookDispatcherModule } from './webhook-dispatcher.module';
import { WebhookDispatcherController } from '../controller/webhook-dispatcher.controller';

export const handler = new SqsHandlerFactory().build(WebhookDispatcherModule, WebhookDispatcherController);

