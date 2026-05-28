import 'reflect-metadata';
import { loadFeature, defineFeature } from 'jest-cucumber';
import { DlqBatchService } from '../../src/dlq/domain/service/dlq-batch.service';
import { MarkBatchFailedPermanentUseCase } from '../../src/dlq/application/use-cases/dlq.usecase';
import { NotificationDbRepository } from '../../src/dlq/domain/repository/dlq-notification.db.repository';
import { ProcessRecordResult } from '../../src/common/types/process-record-result.types';
import { SqsMessage } from '../../src/common/middleware/types/lambda-event.types';
import { NotificationChannel } from '../../src/common/constants/notification-channel.constants';

const feature = loadFeature('./test/dlq/features/dlq.feature');

const buildNotificationFailedRecord = (
  notificationId: string,
  callbackUrl: string,
): SqsMessage => ({
  messageId: `msg-${notificationId}`,
  sequenceNumber: `msg-${notificationId}`,
  body: { notificationId, channel: NotificationChannel.EMAIL, callbackUrl },
});

defineFeature(feature, (test) => {
  test('handleNotificationFailed marca la notificación como FAILED_PERMANENT y persiste el evento outbox', ({
    given,
    when,
    then,
  }) => {
    let mockDb: NotificationDbRepository;
    let service: DlqBatchService;
    let notificationId: string;
    let callbackUrl: string;

    given(
      /un registro DLQ de notificación con notificationId "(.+)" y callbackUrl "(.+)"/,
      (nid, url) => {
        notificationId = nid;
        callbackUrl = url;
        mockDb = {
          updateStatusWithOutboxEvent: jest.fn().mockResolvedValue(undefined),
        } as unknown as NotificationDbRepository;
        service = new DlqBatchService(mockDb);
      },
    );

    when('el servicio de batch DLQ maneja el fallo de notificación', async () => {
      await service.handleNotificationFailed({
        notificationId,
        channel: NotificationChannel.EMAIL,
        callbackUrl,
      });
    });

    then(
      'se realiza la escritura atómica de estado FAILED_PERMANENT y evento outbox WEBHOOK_REQUESTED',
      () => {
        expect(mockDb.updateStatusWithOutboxEvent).toHaveBeenCalledTimes(1);
      },
    );
  });

  test('El caso de uso completa cuando todos los registros son actualizados', ({
    given,
    when,
    then,
  }) => {
    const mockDlqBatchService = {
      handleNotificationFailed: jest.fn().mockResolvedValue(undefined),
      handleWebhookFailed: jest.fn().mockResolvedValue(undefined),
    } as unknown as DlqBatchService;
    let useCase: MarkBatchFailedPermanentUseCase;
    let records: SqsMessage[];
    let error: Error | undefined;

    given(
      'un batch DLQ de 2 registros NOTIFICATION_FAILED donde todas las actualizaciones tienen éxito',
      () => {
        useCase = new MarkBatchFailedPermanentUseCase(mockDlqBatchService);
        records = [
          buildNotificationFailedRecord('NOTIF-001', 'https://cb.example.com/1'),
          buildNotificationFailedRecord('NOTIF-002', 'https://cb.example.com/2'),
        ];
      },
    );

    when('el caso de uso de marcar batch fallido permanente se ejecuta', async () => {
      try {
        await useCase.executeBatch(records);
      } catch (e) {
        error = e as Error;
      }
    });

    then('no se lanza ninguna excepción', () => {
      expect(error).toBeUndefined();
    });
  });

  test('El caso de uso marca el registro como reintentable cuando ocurre un error de infraestructura', ({
    given,
    when,
    then,
  }) => {
    const mockDlqBatchService = {
      handleNotificationFailed: jest
        .fn()
        .mockResolvedValueOnce(undefined)
        .mockRejectedValueOnce(new Error('DynamoDB unavailable')),
      handleWebhookFailed: jest.fn(),
    } as unknown as DlqBatchService;
    let useCase: MarkBatchFailedPermanentUseCase;
    let records: SqsMessage[];
    let results: ProcessRecordResult[];

    given(
      'un batch DLQ de 2 registros NOTIFICATION_FAILED donde uno causa un error de infraestructura',
      () => {
        useCase = new MarkBatchFailedPermanentUseCase(mockDlqBatchService);
        records = [
          buildNotificationFailedRecord('NOTIF-001', 'https://cb.example.com/1'),
          buildNotificationFailedRecord('NOTIF-002', 'https://cb.example.com/2'),
        ];
      },
    );

    when('el caso de uso de marcar batch fallido permanente se ejecuta', async () => {
      results = await useCase.executeBatch(records);
    });

    then('el resultado contiene 1 registro reintentable', () => {
      expect(results.filter((r) => r.retry)).toHaveLength(1);
    });
  });

  test('handle WEBHOOK_FAILED actualiza webhookStatus a FAILED sin modificar el estado de la notificación', ({
    given,
    when,
    then,
    and,
  }) => {
    const mockDb = {
      updateWebhookStatus: jest.fn().mockResolvedValue(undefined),
      updateStatus: jest.fn(),
      updateStatusWithOutboxEvent: jest.fn(),
    } as unknown as NotificationDbRepository;
    let service: DlqBatchService;
    let notificationId: string;

    given('un mensaje WEBHOOK_FAILED con notificationId "NOTIF-001"', () => {
      notificationId = 'NOTIF-001';
      service = new DlqBatchService(mockDb);
    });

    when('el servicio de batch DLQ maneja el fallo de webhook', async () => {
      await service.handleWebhookFailed({ notificationId, sentAt: new Date().toISOString() });
    });

    then('el webhookStatus es actualizado a FAILED', () => {
      expect(mockDb.updateWebhookStatus).toHaveBeenCalledTimes(1);
    });

    and('el estado de la notificación no es modificado', () => {
      expect(mockDb.updateStatus).not.toHaveBeenCalled();
      expect(mockDb.updateStatusWithOutboxEvent).not.toHaveBeenCalled();
    });
  });

  test('El caso de uso descarta sin error registros con messageType desconocido', ({
    given,
    when,
    then,
  }) => {
    const mockDlqBatchService = {
      handleNotificationFailed: jest.fn(),
      handleWebhookFailed: jest.fn(),
    } as unknown as DlqBatchService;
    let useCase: MarkBatchFailedPermanentUseCase;
    let records: SqsMessage[];

    given('un batch DLQ de 1 registro con messageType desconocido', () => {
      useCase = new MarkBatchFailedPermanentUseCase(mockDlqBatchService);
      records = [
        {
          messageId: 'msg-001',
          sequenceNumber: 'msg-001',
          body: { messageType: 'UNKNOWN_TYPE', notificationId: 'NOTIF-001' },
        },
      ];
    });

    when('el caso de uso de marcar batch fallido permanente se ejecuta', async () => {
      await useCase.executeBatch(records);
    });

    then('el servicio de dominio no es invocado', () => {
      expect(mockDlqBatchService.handleNotificationFailed).not.toHaveBeenCalled();
      expect(mockDlqBatchService.handleWebhookFailed).not.toHaveBeenCalled();
    });
  });
});
