import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { CustomException } from '../errors/custom.exception';
import { ErrorDictionary } from '../errors/error.dictionary';
import { EnvConstants } from '../constants/env.constants';

@Injectable()
export class EnvValidationMiddleware implements OnApplicationBootstrap {
  onApplicationBootstrap(): void {
    const faltante = EnvConstants.REQUERIDAS.find(nombre => !process.env[nombre]);
    if (faltante) throw new CustomException(ErrorDictionary.ENV_VAR_MISSING, faltante);
  }
}
