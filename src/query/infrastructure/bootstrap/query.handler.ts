import { ApiGwHandlerFactory } from '../../../common/bootstrap';
import { QueryModule } from './query.module';
import { QueryController } from '../controller/query.controller';

export const handler = new ApiGwHandlerFactory().build(QueryModule, QueryController);

