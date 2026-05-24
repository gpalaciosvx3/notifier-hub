import { SqsHandlerFactory } from '../../../common/bootstrap';
import { EnvConstants } from '../../../common/constants/env.constants';
import { WorkerModule } from './worker.module';
import { WorkerController } from '../controller/worker.controller';

export const handler = new SqsHandlerFactory().build(
  WorkerModule,
  WorkerController,
  EnvConstants.REQUERIDAS_WORKER,
);
