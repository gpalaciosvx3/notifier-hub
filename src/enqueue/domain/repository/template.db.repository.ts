import { TemplateRecord } from '../types/template-record.types';

export abstract class TemplateDbRepository {
  abstract findActiveByTemplateId(templateId: string): Promise<TemplateRecord | null>;
}
