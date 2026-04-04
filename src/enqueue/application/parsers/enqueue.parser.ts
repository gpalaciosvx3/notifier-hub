import { Injectable } from '@nestjs/common';
import { APIGatewayProxyEventV2 } from 'aws-lambda';
import { ZodIssue } from 'zod';
import { EnqueueNotificationRequestDto, EnqueueNotificationSchema } from '../dtos/enqueue-notification.request.dto';
import { ValidationException } from '../../../common/errors/custom.exception';
import { ErrorDictionary } from '../../../common/errors/error.dictionary';

@Injectable()
export class EnqueueEventParser {
  parse(event: APIGatewayProxyEventV2): EnqueueNotificationRequestDto {
    const result = EnqueueNotificationSchema.safeParse(JSON.parse(event.body ?? '{}'));
    if (!result.success) throw new ValidationException(ErrorDictionary.VALIDATION_ERROR, result.error.issues as ZodIssue[]);
    return result.data;
  }
}
