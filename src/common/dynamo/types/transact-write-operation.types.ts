export type PutTransactWriteOperation = {
  type: 'put';
  table: string;
  item: object;
};

export type UpdateTransactWriteOperation = {
  type: 'update';
  table: string;
  key: Record<string, unknown>;
  fields: Record<string, unknown>;
};

export type TransactWriteOperation = PutTransactWriteOperation | UpdateTransactWriteOperation;
