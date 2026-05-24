import { DynamoStreamHandlerFactory } from '../../../common/bootstrap';
import { RelayModule } from './relay.module';
import { RelayController } from '../controller/relay.controller';

export const handler = new DynamoStreamHandlerFactory().build(RelayModule, RelayController);

