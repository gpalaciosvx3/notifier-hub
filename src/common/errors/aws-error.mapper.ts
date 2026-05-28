import { CustomException } from './custom.exception';
import { InputError } from './error.dictionary';
import { appLogger } from '../logger/lambda.logger';

type awsErrorHandler<T> = { code: string; result: T };

export async function awsError<T>(
  fn: () => Promise<T>,
  fallback: InputError,
  handlers: awsErrorHandler<T>[] = [],
): Promise<T> {
  try {
    return await fn();
  } catch (error: unknown) {
    if (error instanceof CustomException) throw error;
    const handler = handlers.find((h) => isAwsError(error, h.code));
    if (handler) return handler.result;
    const raw = error instanceof Error ? `${error.message}\n${error.stack}` : JSON.stringify(error);
    appLogger.error('AWS SDK error', { code: fallback.code, raw });
    throw new CustomException(fallback);
  }
}

export function isAwsError(error: unknown, code: string): boolean {
  return error instanceof Error && error.name === code;
}
