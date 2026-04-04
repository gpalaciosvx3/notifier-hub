export interface QueryOptions {
  index?: string;
  keyCondition: string;
  attributeNames?: Record<string, string>;
  attributeValues: Record<string, unknown>;
}
