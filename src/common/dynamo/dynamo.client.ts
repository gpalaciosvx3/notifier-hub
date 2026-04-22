import { Injectable } from '@nestjs/common';
import {
  PutCommand,
  UpdateCommand,
  GetCommand,
  QueryCommand,
  NativeAttributeValue,
} from '@aws-sdk/lib-dynamodb';
import { dynamoDbClient } from '../config/aws.config';
import { QueryOptions } from './types/query-options';
import { awsError } from '../errors/aws-error.mapper';
import { ErrorDictionary } from '../errors/error.dictionary';
import { AwsErrorCodes } from '../constants/aws-errors.constants';

@Injectable()
export class DynamoClient {
  async put(table: string, item: object): Promise<void> {
    await awsError(
      () => dynamoDbClient.send(new PutCommand({ TableName: table, Item: item as Record<string, NativeAttributeValue> })),
      ErrorDictionary.DYNAMO_UNAVAILABLE,
    );
  }

  async updateFields(
    table: string,
    key: Record<string, unknown>,
    fields: Record<string, unknown>,
  ): Promise<void> {
    const expression = this.buildUpdateExpression(fields);
    await awsError(
      () => dynamoDbClient.send(new UpdateCommand({
        TableName: table,
        Key: key,
        UpdateExpression: expression.update,
        ExpressionAttributeNames: expression.names,
        ExpressionAttributeValues: expression.values,
      })),
      ErrorDictionary.DYNAMO_UNAVAILABLE,
    );
  }

  async updateFieldsWithCondition(
    table: string,
    key: Record<string, unknown>,
    fields: Record<string, unknown>,
    condition: { field: string; value: unknown },
  ): Promise<boolean> {
    const expression = this.buildUpdateExpression(fields);
    if (!expression.names[`#${condition.field}`]) {
      expression.names[`#${condition.field}`] = condition.field;
    }
    return awsError(
      async () => {
        await dynamoDbClient.send(new UpdateCommand({
          TableName: table,
          Key: key,
          UpdateExpression: expression.update,
          ConditionExpression: `#${condition.field} = :condValue`,
          ExpressionAttributeNames: expression.names,
          ExpressionAttributeValues: { ...expression.values, ':condValue': condition.value },
        }));
        return true;
      },
      ErrorDictionary.DYNAMO_UNAVAILABLE,
      [{ code: AwsErrorCodes.DYNAMO_CONDITIONAL_CHECK_FAILED, result: false }],
    );
  }

  async updateIfExists(
    table: string,
    key: Record<string, unknown>,
    fields: Record<string, unknown>,
  ): Promise<boolean> {
    const expression = this.buildUpdateExpression(fields);
    const pkField = Object.keys(key)[0];
    expression.names['#__pk'] = pkField;
    return awsError(
      async () => {
        await dynamoDbClient.send(new UpdateCommand({
          TableName: table,
          Key: key,
          UpdateExpression: expression.update,
          ConditionExpression: 'attribute_exists(#__pk)',
          ExpressionAttributeNames: expression.names,
          ExpressionAttributeValues: expression.values,
        }));
        return true;
      },
      ErrorDictionary.DYNAMO_UNAVAILABLE,
      [{ code: AwsErrorCodes.DYNAMO_CONDITIONAL_CHECK_FAILED, result: false }],
    );
  }

  async get<T>(table: string, key: Record<string, unknown>): Promise<T | null> {
    return awsError(async () => {
      const result = await dynamoDbClient.send(new GetCommand({ TableName: table, Key: key }));
      return (result.Item as T) ?? null;
    }, ErrorDictionary.DYNAMO_UNAVAILABLE);
  }

  async query<T>(table: string, options: QueryOptions): Promise<T[]> {
    return awsError(async () => {
      const result = await dynamoDbClient.send(new QueryCommand({
        TableName: table,
        IndexName: options.index,
        KeyConditionExpression: options.keyCondition,
        ExpressionAttributeNames: options.attributeNames,
        ExpressionAttributeValues: options.attributeValues,
      }));
      return (result.Items as T[]) ?? [];
    }, ErrorDictionary.DYNAMO_UNAVAILABLE);
  }

  private buildUpdateExpression(fields: Record<string, unknown>): { update: string; names: Record<string, string>; values: Record<string, unknown> } {
    const names: Record<string, string> = {};
    const values: Record<string, unknown> = {};
    const parts: string[] = [];

    for (const [field, value] of Object.entries(fields)) {
      names[`#${field}`] = field;
      values[`:${field}`] = value;
      parts.push(`#${field} = :${field}`);
    }

    return { update: `SET ${parts.join(', ')}`, names, values };
  }
}
