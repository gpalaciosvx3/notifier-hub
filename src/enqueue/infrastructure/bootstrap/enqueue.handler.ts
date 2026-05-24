import { ApiGwHandlerFactory } from '../../../common/bootstrap';
import { requireIdempotencyKeyMiddleware } from '../../../common/middleware/idempotency.middleware';
import { EnqueueHandlerEvent } from '../../../common/middleware/types/lambda-event.types';
import { EnvConstants } from '../../../common/constants/env.constants';
import { EnqueueModule } from './enqueue.module';
import { EnqueueController } from '../controller/enqueue.controller';

export const handler = new ApiGwHandlerFactory<EnqueueHandlerEvent>()
  .build(EnqueueModule, EnqueueController, EnvConstants.REQUERIDAS_ENQUEUE)
  .use(requireIdempotencyKeyMiddleware());
