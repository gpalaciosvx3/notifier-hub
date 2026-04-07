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

@Injectable()
export class DynamoClient {
  async put(table: string, item: object): Promise<void> {
    await dynamoDbClient.send(
      new PutCommand({ TableName: table, Item: item as Record<string, NativeAttributeValue> }),
    );
  }

  async updateFields(
    table: string,
    key: Record<string, unknown>,
    fields: Record<string, unknown>,
  ): Promise<void> {
    const expression = this.buildUpdateExpression(fields);
    await dynamoDbClient.send(
      new UpdateCommand({
        TableName: table,
        Key: key,
        UpdateExpression: expression.update,
        ExpressionAttributeNames: expression.names,
        ExpressionAttributeValues: expression.values,
      }),
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

    try {
      await dynamoDbClient.send(
        new UpdateCommand({
          TableName: table,
          Key: key,
          UpdateExpression: expression.update,
          ConditionExpression: `#${condition.field} = :condValue`,
          ExpressionAttributeNames: expression.names,
          ExpressionAttributeValues: { ...expression.values, ':condValue': condition.value },
        }),
      );
      return true;
    } catch (error: unknown) {
      if (error instanceof Error && error.name === 'ConditionalCheckFailedException') {
        return false;
      }
      throw error;
    }
  }

  async updateIfExists(
    table: string,
    key: Record<string, unknown>,
    fields: Record<string, unknown>,
  ): Promise<boolean> {
    const expression = this.buildUpdateExpression(fields);
    const pkField = Object.keys(key)[0];
    expression.names['#__pk'] = pkField;

    try {
      await dynamoDbClient.send(
        new UpdateCommand({
          TableName: table,
          Key: key,
          UpdateExpression: expression.update,
          ConditionExpression: 'attribute_exists(#__pk)',
          ExpressionAttributeNames: expression.names,
          ExpressionAttributeValues: expression.values,
        }),
      );
      return true;
    } catch (error: unknown) {
      if (error instanceof Error && error.name === 'ConditionalCheckFailedException') {
        return false;
      }
      throw error;
    }
  }

  async get<T>(table: string, key: Record<string, unknown>): Promise<T | null> {
    const result = await dynamoDbClient.send(
      new GetCommand({ TableName: table, Key: key }),
    );
    return (result.Item as T) ?? null;
  }

  async query<T>(table: string, options: QueryOptions): Promise<T[]> {
    const result = await dynamoDbClient.send(
      new QueryCommand({
        TableName: table,
        IndexName: options.index,
        KeyConditionExpression: options.keyCondition,
        ExpressionAttributeNames: options.attributeNames,
        ExpressionAttributeValues: options.attributeValues,
      }),
    );
    return (result.Items as T[]) ?? [];
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
