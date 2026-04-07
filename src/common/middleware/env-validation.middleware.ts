import { FactoryProvider, Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { CustomException } from '../errors/custom.exception';
import { ErrorDictionary } from '../errors/error.dictionary';

@Injectable()
export class EnvValidationMiddleware implements OnApplicationBootstrap {
  constructor(private readonly required: readonly string[]) {}

  static register(required: readonly string[]): FactoryProvider {
    return {
      provide: EnvValidationMiddleware,
      useFactory: () => new EnvValidationMiddleware(required),
    };
  }

  onApplicationBootstrap(): void {
    const faltante = this.required.find(nombre => !process.env[nombre]);
    if (faltante) throw new CustomException(ErrorDictionary.ENV_VAR_MISSING, faltante);
  }
}
