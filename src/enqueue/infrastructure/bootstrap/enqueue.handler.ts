import { EnqueueHandlerFactory } from '../../../common/bootstrap';
import { EnqueueModule } from './enqueue.module';
import { EnqueueController } from '../controller/enqueue.controller';

export const handler = new EnqueueHandlerFactory().build(EnqueueModule, EnqueueController);

