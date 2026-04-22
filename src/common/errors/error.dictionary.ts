import { HttpStatus } from '@nestjs/common';

export type InputError = {
  readonly code: string;
  readonly descripcion: string;
  readonly statusCode: number;
};

export class ErrorDictionary {
  static readonly INVALID_EMAIL: InputError = { 
    code: 'NTF-001', 
    descripcion: 'El campo "para" debe ser un correo electrónico válido con formato RFC', 
    statusCode: HttpStatus.BAD_REQUEST 
  };

  static readonly INVALID_PHONE: InputError = { 
    code: 'NTF-002', 
    descripcion: 'El campo "para" debe ser un número de teléfono con formato E.164', 
    statusCode: HttpStatus.BAD_REQUEST 
  };

  static readonly INVALID_PROVIDER: InputError = { 
    code: 'NTF-003', 
    descripcion: 'El proveedor no es compatible con el canal especificado', 
    statusCode: HttpStatus.BAD_REQUEST 
  };

  static readonly MISSING_SUBJECT: InputError = { 
    code: 'NTF-004', 
    descripcion: 'El asunto es obligatorio para notificaciones de tipo email', 
    statusCode: HttpStatus.BAD_REQUEST 
  };

  static readonly NOTIFICATION_NOT_FOUND: InputError = { 
    code: 'NTF-005', 
    descripcion: 'Notificación no encontrada', 
    statusCode: HttpStatus.NOT_FOUND 
  };

  static readonly UNRESOLVABLE_SENDER: InputError = { 
    code: 'NTF-006', 
    descripcion: 'No hay remitente registrado para la combinación canal:proveedor', 
    statusCode: HttpStatus.INTERNAL_SERVER_ERROR 
  };

  static readonly INTERNAL_ERROR: InputError = { 
    code: 'NTF-007', 
    descripcion: 'Ocurrió un error inesperado', 
    statusCode: HttpStatus.INTERNAL_SERVER_ERROR 
  };

  static readonly ENV_VAR_MISSING: InputError = { 
    code: 'NTF-008', 
    descripcion: 'Variable de entorno requerida no encontrada', 
    statusCode: HttpStatus.INTERNAL_SERVER_ERROR 
  };  

  static readonly VALIDATION_ERROR: InputError = { 
    code: 'NTF-009', 
    descripcion: 'El cuerpo de la solicitud no es válido', 
    statusCode: HttpStatus.BAD_REQUEST 
  };

  static readonly DLQ_BATCH_INFRA_ERROR: InputError = {
    code: 'NTF-010',
    descripcion: 'Uno o más registros del batch DLQ fallaron por error de infraestructura',
    statusCode: HttpStatus.INTERNAL_SERVER_ERROR
  };

  static readonly NOTIFICATION_SEND_FAILED: InputError = {
    code: 'NTF-011',
    descripcion: 'Error al enviar la notificación a través del proveedor externo',
    statusCode: HttpStatus.INTERNAL_SERVER_ERROR
  };

  static readonly DYNAMO_UNAVAILABLE: InputError = {
    code: 'NTF-012',
    descripcion: 'Servicio de base de datos DynamoDB no disponible',
    statusCode: HttpStatus.SERVICE_UNAVAILABLE,
  };

  static readonly SQS_UNAVAILABLE: InputError = {
    code: 'NTF-013',
    descripcion: 'Servicio de mensajería SQS no disponible',
    statusCode: HttpStatus.SERVICE_UNAVAILABLE,
  };

  static readonly SES_UNAVAILABLE: InputError = {
    code: 'NTF-014',
    descripcion: 'Servicio de envío de email SES no disponible',
    statusCode: HttpStatus.SERVICE_UNAVAILABLE,
  };

  static readonly SNS_UNAVAILABLE: InputError = {
    code: 'NTF-015',
    descripcion: 'Servicio de mensajería SNS no disponible',
    statusCode: HttpStatus.SERVICE_UNAVAILABLE,
  };
}