import { createDynamoStreamHandler } from '../../../common/bootstrap';
import { RelayModule } from './relay.module';
import { RelayController } from '../controller/relay.controller';

export const handler = createDynamoStreamHandler(RelayModule, RelayController);

