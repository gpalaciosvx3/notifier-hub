import { Logger } from '@nestjs/common';

export function HandleExecution(
  featureName: string,
  onError?: (error: unknown) => unknown,
): MethodDecorator {
  return (_target, _propertyKey, descriptor: PropertyDescriptor) => {
    const original = descriptor.value as (...args: unknown[]) => Promise<unknown>;

    descriptor.value = async function (...args: unknown[]) {
      const logger = new Logger(featureName);
      logger.log(`---------- INICIO: ${featureName} ----------`);
      try {
        return await original.apply(this, args);
      } catch (error) {
        logger.error(`Error en ${featureName}`, error);
        if (onError) return onError(error);
        throw error;
      } finally {
        logger.log(`---------- FIN: ${featureName} ----------`);
      }
    };

    return descriptor;
  };
}
