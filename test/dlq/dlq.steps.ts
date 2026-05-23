import 'reflect-metadata';
import { loadFeature, defineFeature } from 'jest-cucumber';
import { DlqBatchService } from '../../src/dlq/domain/service/dlq-batch.service';
import { MarkBatchFailedPermanentUseCase } from '../../src/dlq/application/use-cases/mark-batch-failed-permanent.usecase';
import { NotificationDbRepository } from '../../src/dlq/domain/repository/notification.db.repository';
import { ProcessRecordResult } from '../../src/common/types/process-record-result.types';
import { SqsMessage } from '../../src/common/middleware/types/lambda-event.types';

const feature = loadFeature('./test/dlq/features/dlq.feature');

const buildRecord = (notificationId: string): SqsMessage => ({
  messageId: `msg-${notificationId}`,
  sequenceNumber: `msg-${notificationId}`,
  body: { notificationId, callbackUrl: 'https://example.com/callback' },
});

defineFeature(feature, test => {
  test('markFailed marca el registro como fallido permanente y retorna true', ({ given, when, then }) => {
    const mockDb = {
      updateStatusWithOutboxEvent: jest.fn().mockResolvedValue(undefined),
    } as unknown as NotificationDbRepository;
    let service: DlqBatchService;
    let record: SqsMessage;
    let result: boolean;

    given(/un registro DLQ con notificationId "(.+)"/, (notificationId) => {
      record = buildRecord(notificationId);
      service = new DlqBatchService(mockDb);
    });

    when('el servicio de batch DLQ marca el registro como fallido', async () => {
      result = await service.markFailed(record);
    });

    then('el resultado es true', () => {
      expect(result).toBe(true);
    });
  });

  test('El caso de uso completa cuando todos los registros son actualizados', ({ given, when, then }) => {
    const mockDlqBatchService = { markFailed: jest.fn().mockResolvedValue(true) } as unknown as DlqBatchService;
    let useCase: MarkBatchFailedPermanentUseCase;
    let records: SqsMessage[];
    let error: Error | undefined;

    given('un batch DLQ de 2 registros donde todas las actualizaciones tienen éxito', () => {
      useCase = new MarkBatchFailedPermanentUseCase(mockDlqBatchService);
      records = [buildRecord('NOTIF-001'), buildRecord('NOTIF-002')];
    });

    when('el caso de uso de marcar batch fallido permanente se ejecuta', async () => {
      try { await useCase.executeBatch(records); } catch (e) { error = e as Error; }
    });

    then('no se lanza ninguna excepción', () => {
      expect(error).toBeUndefined();
    });
  });

  test('El caso de uso marca el registro como reintentable cuando ocurre un error de infraestructura', ({ given, when, then }) => {
    const mockDlqBatchService = {
      markFailed: jest.fn().mockResolvedValueOnce(true).mockRejectedValueOnce(new Error('DynamoDB unavailable')),
    } as unknown as DlqBatchService;
    let useCase: MarkBatchFailedPermanentUseCase;
    let records: SqsMessage[];
    let results: ProcessRecordResult[];

    given('un batch DLQ de 2 registros donde uno causa un error de infraestructura', () => {
      useCase = new MarkBatchFailedPermanentUseCase(mockDlqBatchService);
      records = [buildRecord('NOTIF-001'), buildRecord('NOTIF-002')];
    });

    when('el caso de uso de marcar batch fallido permanente se ejecuta', async () => {
      results = await useCase.executeBatch(records);
    });

    then('el resultado contiene 1 registro reintentable', () => {
      expect(results.filter(r => r.retry)).toHaveLength(1);
    });
  });
});
