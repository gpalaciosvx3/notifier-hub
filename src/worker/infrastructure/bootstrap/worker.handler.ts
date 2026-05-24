import { createSqsHandler } from '../../../common/bootstrap';
import { WorkerModule } from './worker.module';
import { WorkerController } from '../controller/worker.controller';

export const handler = createSqsHandler(WorkerModule, WorkerController);

