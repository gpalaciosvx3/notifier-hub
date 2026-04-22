import 'reflect-metadata';
import { loadFeature, defineFeature } from 'jest-cucumber';
import { DlqBatchService } from '../../src/dlq/domain/service/dlq-batch.service';
import { MarkBatchFailedPermanentUseCase } from '../../src/dlq/application/use-cases/mark-batch-failed-permanent.usecase';
import { NotificationDbRepository } from '../../src/dlq/domain/repository/notification.db.repository';
import { CustomException } from '../../src/common/errors/custom.exception';
import { SqsMessage } from '../../src/common/middleware/types/lambda-event.types';

const feature = loadFeature('./test/dlq/features/dlq.feature');

const buildRecord = (notificationId: string): SqsMessage => ({
  messageId: `msg-${notificationId}`,
  body: { notificationId },
});

defineFeature(feature, test => {
  test('markFailed retorna <resultado> según la existencia del registro', ({ given, and, when, then }) => {
    const mockDb = { updateStatus: jest.fn() } as unknown as NotificationDbRepository;
    let service: DlqBatchService;
    let record: SqsMessage;
    let result: boolean;

    given(/un registro DLQ con notificationId "(.+)"/, (notificationId) => {
      record = buildRecord(notificationId);
      service = new DlqBatchService(mockDb);
    });

    and(/la actualización en DDB retorna (true|false) para "(.+)"/, (resultado) => {
      (mockDb.updateStatus as jest.Mock).mockResolvedValue(resultado === 'true');
    });

    when('el servicio de batch DLQ marca el registro como fallido', async () => {
      result = await service.markFailed(record);
    });

    then(/el resultado es (true|false)/, (expected) => {
      expect(result).toBe(expected === 'true');
    });
  });

  test('El caso de uso completa sin lanzar excepción cuando todos los registros son actualizados', ({ given, when, then }) => {
    const mockDlqBatchService = { markFailed: jest.fn().mockResolvedValue(true) } as unknown as DlqBatchService;
    let useCase: MarkBatchFailedPermanentUseCase;
    let records: SqsMessage[];
    let error: Error | undefined;

    given('un batch DLQ de 2 registros donde todas las actualizaciones tienen éxito', () => {
      useCase = new MarkBatchFailedPermanentUseCase(mockDlqBatchService);
      records = [buildRecord('NOTIF-001'), buildRecord('NOTIF-002')];
    });

    when('el caso de uso de marcar batch fallido permanente se ejecuta', async () => {
      try { await useCase.execute(records); } catch (e) { error = e as Error; }
    });

    then('no se lanza ninguna excepción', () => {
      expect(error).toBeUndefined();
    });
  });

  test('El caso de uso completa sin lanzar excepción cuando algunos registros no se encuentran', ({ given, when, then }) => {
    const mockDlqBatchService = {
      markFailed: jest.fn().mockResolvedValueOnce(true).mockResolvedValueOnce(false),
    } as unknown as DlqBatchService;
    let useCase: MarkBatchFailedPermanentUseCase;
    let records: SqsMessage[];
    let error: Error | undefined;

    given('un batch DLQ de 2 registros donde uno no se encuentra en DDB', () => {
      useCase = new MarkBatchFailedPermanentUseCase(mockDlqBatchService);
      records = [buildRecord('NOTIF-001'), buildRecord('NOTIF-999')];
    });

    when('el caso de uso de marcar batch fallido permanente se ejecuta', async () => {
      try { await useCase.execute(records); } catch (e) { error = e as Error; }
    });

    then('no se lanza ninguna excepción', () => {
      expect(error).toBeUndefined();
    });
  });

  test('El caso de uso lanza NTF-010 cuando ocurre un error de infraestructura', ({ given, when, then }) => {
    const mockDlqBatchService = {
      markFailed: jest.fn().mockResolvedValueOnce(true).mockRejectedValueOnce(new Error('DynamoDB unavailable')),
    } as unknown as DlqBatchService;
    let useCase: MarkBatchFailedPermanentUseCase;
    let records: SqsMessage[];
    let error: CustomException;

    given('un batch DLQ de 2 registros donde uno causa un error de infraestructura', () => {
      useCase = new MarkBatchFailedPermanentUseCase(mockDlqBatchService);
      records = [buildRecord('NOTIF-001'), buildRecord('NOTIF-002')];
    });

    when('el caso de uso de marcar batch fallido permanente se ejecuta', async () => {
      try { await useCase.execute(records); } catch (e) { error = e as CustomException; }
    });

    then('se lanza una CustomException con código "NTF-010"', () => {
      expect(error).toBeInstanceOf(CustomException);
      expect(error.code).toBe('NTF-010');
    });
  });
});
