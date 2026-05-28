import 'reflect-metadata';
import { loadFeature, defineFeature } from 'jest-cucumber';
import { ProcessingService } from '../../src/sender/domain/service/sender.service';
import { ProcessBatchUseCase } from '../../src/sender/application/use-cases/sender.usecase';
import { NotificationDbRepository } from '../../src/sender/domain/repository/sender-notification.db.repository';
import { NotificationSendStrategy } from '../../src/sender/domain/strategy/sender-notification-send.strategy';
import { NotificationEntity } from '../../src/common/entities/notification.entity';
import { NotificationChannel } from '../../src/common/constants/notification-channel.constants';
import { NotificationProvider } from '../../src/common/constants/notification-provider.constants';
import { NotificationStatus } from '../../src/common/constants/notification-status.constants';
import { CustomException } from '../../src/common/errors/custom.exception';
import { ErrorDictionary } from '../../src/common/errors/error.dictionary';
import { SqsMessage } from '../../src/common/middleware/types/lambda-event.types';
import { ProcessRecordResult } from '../../src/common/types/process-record-result.types';

const feature = loadFeature('./test/worker/features/worker.feature');

const buildNotification = (): NotificationEntity =>
  NotificationEntity.build({
    channel: NotificationChannel.EMAIL,
    provider: NotificationProvider.SES,
    to: 'user@example.com',
    subject: 'Hello',
    body: 'Test body',
    callbackUrl: 'https://example.com/callback',
  });

defineFeature(feature, (test) => {
  test('El servicio de procesamiento envía y marca SENT cuando toma el lock', ({
    given,
    and,
    when,
    then,
  }) => {
    const mockSender = {
      send: jest.fn().mockResolvedValue(undefined),
    } as unknown as NotificationSendStrategy;
    const mockDb = {
      updateStatusConditional: jest.fn().mockResolvedValue(true),
      updateStatus: jest.fn().mockResolvedValue(undefined),
      updateStatusWithOutboxEvent: jest.fn().mockResolvedValue(undefined),
    } as unknown as NotificationDbRepository;
    let service: ProcessingService;
    let notification: NotificationEntity;

    given('una notificación PENDING con ID "NOTIF-001" para canal "email:ses"', () => {
      notification = buildNotification();
      service = new ProcessingService(mockDb, mockSender, mockSender);
    });

    and('la actualización condicional para "NOTIF-001" tiene éxito', () => {
      (mockDb.updateStatusConditional as jest.Mock).mockResolvedValue(true);
    });

    when('el servicio de procesamiento procesa la notificación', async () => {
      await service.processSafe(notification);
    });

    then('el método send del remitente es invocado', () => {
      expect(mockSender.send).toHaveBeenCalledTimes(1);
    });

    and('la notificación es marcada como "SENT"', () => {
      expect(mockDb.updateStatusWithOutboxEvent).toHaveBeenCalledWith(
        notification.notificationId,
        NotificationStatus.SENT,
        expect.anything(),
      );
    });
  });

  test('El servicio de procesamiento omite cuando no toma el lock', ({
    given,
    and,
    when,
    then,
  }) => {
    const mockSender = { send: jest.fn() } as unknown as NotificationSendStrategy;
    const mockDb = {
      updateStatusConditional: jest.fn().mockResolvedValue(false),
      updateStatus: jest.fn(),
    } as unknown as NotificationDbRepository;
    let service: ProcessingService;
    let notification: NotificationEntity;

    given('una notificación PENDING con ID "NOTIF-001" para canal "email:ses"', () => {
      notification = buildNotification();
      service = new ProcessingService(mockDb, mockSender, mockSender);
    });

    and('la actualización condicional para "NOTIF-001" falla', () => {
      (mockDb.updateStatusConditional as jest.Mock).mockResolvedValue(false);
    });

    when('el servicio de procesamiento procesa la notificación', async () => {
      await service.processSafe(notification);
    });

    then('el estado de la notificación no es actualizado', () => {
      expect(mockDb.updateStatus).not.toHaveBeenCalled();
    });
  });

  test('processSafe revierte la notificación a PENDING y relanza la excepción cuando el envío falla', ({
    given,
    and,
    when,
    then,
  }) => {
    const mockSender = {
      send: jest.fn(),
    } as unknown as NotificationSendStrategy;
    const mockDb = {
      updateStatusConditional: jest.fn().mockResolvedValue(true),
      updateStatus: jest.fn().mockResolvedValue(undefined),
      updateStatusWithOutboxEvent: jest.fn(),
    } as unknown as NotificationDbRepository;
    let service: ProcessingService;
    let notification: NotificationEntity;
    let thrownError: unknown;

    given('una notificación PENDING con ID "NOTIF-001" para canal "email:ses"', () => {
      notification = buildNotification();
      service = new ProcessingService(mockDb, mockSender, mockSender);
    });

    and('la actualización condicional para "NOTIF-001" tiene éxito', () => {
      (mockDb.updateStatusConditional as jest.Mock).mockResolvedValue(true);
    });

    and(/el remitente lanza "(.+)" al intentar enviar/, (tipoError) => {
      const error = tipoError.includes('CustomException')
        ? new CustomException(ErrorDictionary.UNRESOLVABLE_SENDER, 'email:unknown')
        : new Error('Connection timeout');
      (mockSender.send as jest.Mock).mockRejectedValue(error);
    });

    when('el servicio de procesamiento procesa de forma segura la notificación', async () => {
      try {
        await service.processSafe(notification);
      } catch (e) {
        thrownError = e;
      }
    });

    then('la notificación es revertida a "PENDING"', () => {
      expect(mockDb.updateStatus).toHaveBeenCalledWith(
        notification.notificationId,
        NotificationStatus.PENDING,
      );
    });

    and('la excepción original es relanzada', () => {
      expect(thrownError).toBeDefined();
    });
  });

  test('El caso de uso de batch no retorna registros reintentables cuando todos tienen éxito', ({
    given,
    when,
    then,
  }) => {
    const mockProcessingService = {
      processSafe: jest.fn().mockResolvedValue(undefined),
    } as unknown as ProcessingService;
    let useCase: ProcessBatchUseCase;
    let records: SqsMessage[];
    let result: ProcessRecordResult[];

    given('un batch de 2 registros SQS donde todo el procesamiento tiene éxito', () => {
      useCase = new ProcessBatchUseCase(mockProcessingService);
      records = [
        { messageId: 'msg-001', sequenceNumber: 'msg-001', body: { notificationId: 'NOTIF-001' } },
        { messageId: 'msg-002', sequenceNumber: 'msg-002', body: { notificationId: 'NOTIF-002' } },
      ];
    });

    when('el caso de uso de procesamiento de batch se ejecuta', async () => {
      result = await useCase.executeBatch(records);
    });

    then('la lista de registros reintentables está vacía', () => {
      expect(result.filter((r) => r.retry)).toHaveLength(0);
    });
  });

  test('El caso de uso de batch incluye el registro fallido como reintentable', ({
    given,
    when,
    then,
  }) => {
    const mockProcessingService = {
      processSafe: jest.fn().mockRejectedValue(new Error('SES error')),
    } as unknown as ProcessingService;
    let useCase: ProcessBatchUseCase;
    let records: SqsMessage[];
    let result: ProcessRecordResult[];

    given('un batch de 1 registro SQS donde el procesamiento falla', () => {
      useCase = new ProcessBatchUseCase(mockProcessingService);
      records = [
        { messageId: 'msg-001', sequenceNumber: 'msg-001', body: { notificationId: 'NOTIF-001' } },
      ];
    });

    when('el caso de uso de procesamiento de batch se ejecuta', async () => {
      result = await useCase.executeBatch(records);
    });

    then('la lista de registros reintentables contiene 1 elemento', () => {
      expect(result.filter((r) => r.retry)).toHaveLength(1);
      expect(result.filter((r) => r.retry)[0].sequenceNumber).toBe('msg-001');
    });
  });
});
