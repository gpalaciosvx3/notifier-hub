import { DynamoStreamHandlerFactory } from '../../../common/bootstrap';
import { EnvConstants } from '../../../common/constants/env.constants';
import { RelayModule } from './relay.module';
import { RelayController } from '../controller/relay.controller';

export const handler = new DynamoStreamHandlerFactory().build(
  RelayModule,
  RelayController,
  EnvConstants.REQUERIDAS_RELAY,
);
