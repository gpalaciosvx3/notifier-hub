import { createEnqueueHandler } from '../../../common/bootstrap';
import { EnqueueModule } from './enqueue.module';
import { EnqueueController } from '../controller/enqueue.controller';

export const handler = createEnqueueHandler(EnqueueModule, EnqueueController);

