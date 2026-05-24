import { SqsHandlerFactory } from '../../../common/bootstrap';
import { WorkerModule } from './worker.module';
import { WorkerController } from '../controller/worker.controller';

export const handler = new SqsHandlerFactory().build(WorkerModule, WorkerController);

