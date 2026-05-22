import { Injectable } from '@nestjs/common';
import { DynamoClient } from '../../../common/dynamo/dynamo.client';
import { TemplateDbRepository } from '../../domain/repository/template.db.repository';
import { TemplateRecord } from '../../domain/types/template-record.types';

@Injectable()
export class TemplateDbRepositoryImpl extends TemplateDbRepository {
  constructor(
    private readonly dynamo: DynamoClient,
    private readonly tableName: string,
  ) {
    super();
  }

  async findActiveByTemplateId(templateId: string): Promise<TemplateRecord | null> {
    const items = await this.dynamo.query<TemplateRecord>(this.tableName, {
      keyCondition: '#templateId = :templateId',
      attributeNames: { '#templateId': 'templateId' },
      attributeValues: { ':templateId': templateId },
      scanIndexForward: false,
      limit: 1,
    });
    const item = items[0];
    return item?.active ? item : null;
  }
}
