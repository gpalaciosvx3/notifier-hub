import { APIGatewayProxyResultV2 } from 'aws-lambda';
import { CustomException } from '../errors/custom.exception';
import { ErrorDictionary } from '../errors/error.dictionary';

export class ApiGwHelper {
  static succes<T>(statusCode: number, datos: T): APIGatewayProxyResultV2 {
    return { statusCode, body: JSON.stringify(datos) };
  }

  static error(error: unknown): APIGatewayProxyResultV2 {
    if (error instanceof CustomException) {
      return { statusCode: error.statusCode, body: JSON.stringify(error.toResponseBody()) };
    }
    const detalle = error instanceof Error ? error.message : String(error);
    const excepcion = new CustomException(ErrorDictionary.INTERNAL_ERROR, detalle);
    return { statusCode: excepcion.statusCode, body: JSON.stringify(excepcion.toResponseBody()) };
  }
}
