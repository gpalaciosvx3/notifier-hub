import { APIGatewayProxyResultV2 } from 'aws-lambda';
import { CustomException } from '../errors/custom.exception';
import { ErrorDictionary } from '../errors/error.dictionary';

export class ApiGwHelper {
  static succes<T>(statusCode: number, datos: T): APIGatewayProxyResultV2 {
    return { statusCode, body: JSON.stringify(datos) };
  }

  static error(error: unknown): APIGatewayProxyResultV2 {
    const excepcion = error instanceof CustomException ? error : new CustomException(ErrorDictionary.INTERNAL_ERROR);
    return { statusCode: excepcion.statusCode, body: JSON.stringify(excepcion.toResponseBody()) };
  }
}
