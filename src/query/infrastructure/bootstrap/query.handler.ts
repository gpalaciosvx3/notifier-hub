import { ApiGwHandlerFactory } from '../../../common/bootstrap';
import { EnvConstants } from '../../../common/constants/env.constants';
import { QueryModule } from './query.module';
import { QueryController } from '../controller/query.controller';

export const handler = new ApiGwHandlerFactory().build(QueryModule, QueryController, EnvConstants.REQUERIDAS_QUERY);

