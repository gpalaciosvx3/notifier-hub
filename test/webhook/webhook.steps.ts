import 'reflect-metadata';
import { loadFeature, defineFeature } from 'jest-cucumber';
import { DispatchService } from '../../src/webhook-dispatcher/domain/service/dispatch.service';
import { DispatchBatchUseCase } from '../../src/webhook-dispatcher/application/use-cases/dispatch-batch.usecase';
import { NotificationDbRepository } from '../../src/webhook-dispatcher/domain/repository/notification.db.repository';
import { CallbackHttpRepository } from '../../src/webhook-dispatcher/domain/repository/callback.http.repository';
import { CallbackHttpRepositoryImpl } from '../../src/webhook-dispatcher/infrastructure/repository/callback.http.repository.impl';
import { WebhookEvent } from '../../src/webhook-dispatcher/domain/types/webhook-event.types';
import { WebhookStatus } from '../../src/common/constants/webhook-status.constants';
import { NotificationStatus } from '../../src/common/constants/notification-status.constants';
import { CustomException } from '../../src/common/errors/custom.exception';
import { ErrorDictionary } from '../../src/common/errors/error.dictionary';
import { SqsMessage } from '../../src/common/middleware/types/lambda-event.types';
import { ProcessRecordResult } from '../../src/common/types/process-record-result.types';

const feature = loadFeature('./test/webhook/features/webhook.feature');

defineFeature(feature, (test) => {
  test('POST exitoso al callbackUrl actualiza webhookStatus a DELIVERED', ({
    given,
    and,
    when,
    then,
  }) => {
    let service: DispatchService;
    let mockHttp: CallbackHttpRepository;
    const event: WebhookEvent = {
      notificationId: 'NOTIF-001',
      status: NotificationStatus.SENT,
      callbackUrl: 'https://example.com/callback',
    };
    const mockDb = {
      updateWebhookStatus: jest.fn().mockResolvedValue(undefined),
      updateStatus: jest.fn(),
    } as unknown as NotificationDbRepository;

    given(
      'una notificación con callbackUrl "https://example.com/callback" y estado "SENT"',
      () => {},
    );

    and('el repositorio HTTP retorna éxito en el POST', () => {
      mockHttp = { post: jest.fn().mockResolvedValue(true) } as unknown as CallbackHttpRepository;
      service = new DispatchService(mockDb, mockHttp);
    });

    when('el servicio de despacho procesa el evento', async () => {
      await service.dispatch(event);
    });

    then(/^el repositorio actualiza webhookStatus a "(.+)"$/, () => {
      expect(mockDb.updateWebhookStatus).toHaveBeenCalledWith('NOTIF-001', WebhookStatus.DELIVERED);
    });

    and('el estado de la notificación no es modificado', () => {
      expect((mockDb as any).updateStatus).not.toHaveBeenCalled();
    });
  });

  test('POST fallido lanza error para reintento SQS sin actualizar webhookStatus', ({
    given,
    and,
    when,
    then,
  }) => {
    let service: DispatchService;
    let mockHttp: CallbackHttpRepository;
    let thrownError: unknown;
    const event: WebhookEvent = {
      notificationId: 'NOTIF-001',
      status: NotificationStatus.SENT,
      callbackUrl: 'https://example.com/callback',
    };
    const mockDb = {
      updateWebhookStatus: jest.fn(),
      updateStatus: jest.fn(),
    } as unknown as NotificationDbRepository;

    given(
      'una notificación con callbackUrl "https://example.com/callback" y estado "SENT"',
      () => {},
    );

    and('el repositorio HTTP retorna fallo en el POST', () => {
      mockHttp = { post: jest.fn().mockResolvedValue(false) } as unknown as CallbackHttpRepository;
      service = new DispatchService(mockDb, mockHttp);
    });

    when('el servicio de despacho procesa el evento', async () => {
      try {
        await service.dispatch(event);
      } catch (e) {
        thrownError = e;
      }
    });

    then(/^se lanza una CustomException con código "(.+)"$/, (code: string) => {
      expect(thrownError).toBeInstanceOf(CustomException);
      expect((thrownError as CustomException).code).toBe(code);
    });

    and('el webhookStatus no es actualizado', () => {
      expect(mockDb.updateWebhookStatus).not.toHaveBeenCalled();
    });
  });

  test('El impl HTTP reintenta el POST 3 veces antes de retornar false', ({
    given,
    when,
    then,
    and,
  }) => {
    let impl: CallbackHttpRepositoryImpl;
    let result: boolean;

    given('un endpoint que siempre falla al recibir el POST', () => {
      jest.useFakeTimers();
      global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 500 } as Response);
      impl = new CallbackHttpRepositoryImpl();
    });

    when('el impl HTTP intenta el POST', async () => {
      const postPromise = impl.post('https://example.com/callback', {
        notificationId: 'NOTIF-001',
      });
      await jest.runAllTimersAsync();
      result = await postPromise;
    });

    then('el fetch es invocado exactamente 3 veces', () => {
      expect(global.fetch).toHaveBeenCalledTimes(3);
    });

    and('se retorna false', () => {
      expect(result).toBe(false);
      jest.useRealTimers();
    });
  });

  test('Mensaje SQS sin callbackUrl genera registro descartado en el batch', ({
    given,
    when,
    then,
  }) => {
    let useCase: DispatchBatchUseCase;
    let records: SqsMessage[];
    let result: ProcessRecordResult[];

    given('un batch con un mensaje SQS sin campo callbackUrl', () => {
      useCase = new DispatchBatchUseCase(
        { dispatch: jest.fn() } as unknown as DispatchService,
      );
      records = [
        {
          messageId: 'msg-001',
          sequenceNumber: 'msg-001',
          body: { notificationId: 'NOTIF-001', status: 'SENT' },
        },
      ];
    });

    when('el caso de uso de batch se ejecuta', async () => {
      result = await useCase.executeBatch(records);
    });

    then('ese registro es descartado sin reintento', () => {
      expect(result.filter((r) => r.retry)).toHaveLength(0);
      expect(result.filter((r) => r.error)).toHaveLength(1);
    });
  });

  test('Batch donde todos los despachos tienen éxito no retorna reintentables', ({
    given,
    and,
    when,
    then,
  }) => {
    let useCase: DispatchBatchUseCase;
    let records: SqsMessage[];
    let result: ProcessRecordResult[];

    given('un batch de 2 mensajes SQS con callbackUrl válido', () => {
      useCase = new DispatchBatchUseCase(
        { dispatch: jest.fn().mockResolvedValue(undefined) } as unknown as DispatchService,
      );
      records = [
        {
          messageId: 'msg-001',
          sequenceNumber: 'msg-001',
          body: {
            notificationId: 'NOTIF-001',
            status: 'SENT',
            callbackUrl: 'https://example.com/callback',
          },
        },
        {
          messageId: 'msg-002',
          sequenceNumber: 'msg-002',
          body: {
            notificationId: 'NOTIF-002',
            status: 'SENT',
            callbackUrl: 'https://example.com/callback',
          },
        },
      ];
    });

    and('todos los despachos tienen éxito', () => {});

    when('el caso de uso de batch se ejecuta', async () => {
      result = await useCase.executeBatch(records);
    });

    then('la lista de registros reintentables está vacía', () => {
      expect(result.filter((r) => r.retry)).toHaveLength(0);
    });
  });

  test('Batch con un despacho fallido retorna ese registro como reintentable', ({
    given,
    and,
    when,
    then,
  }) => {
    let useCase: DispatchBatchUseCase;
    let records: SqsMessage[];
    let result: ProcessRecordResult[];

    given('un batch de 2 mensajes SQS con callbackUrl válido', () => {
      const mockDispatch = jest
        .fn()
        .mockRejectedValueOnce(
          new CustomException(ErrorDictionary.WEBHOOK_POST_FAILED, 'NOTIF-001'),
        )
        .mockResolvedValue(undefined);
      useCase = new DispatchBatchUseCase({ dispatch: mockDispatch } as unknown as DispatchService);
      records = [
        {
          messageId: 'msg-001',
          sequenceNumber: 'msg-001',
          body: {
            notificationId: 'NOTIF-001',
            status: 'SENT',
            callbackUrl: 'https://example.com/callback',
          },
        },
        {
          messageId: 'msg-002',
          sequenceNumber: 'msg-002',
          body: {
            notificationId: 'NOTIF-002',
            status: 'SENT',
            callbackUrl: 'https://example.com/callback',
          },
        },
      ];
    });

    and('el primer despacho falla', () => {});

    when('el caso de uso de batch se ejecuta', async () => {
      result = await useCase.executeBatch(records);
    });

    then('la lista de registros reintentables contiene 1 elemento', () => {
      expect(result.filter((r) => r.retry)).toHaveLength(1);
      expect(result.filter((r) => r.retry)[0].sequenceNumber).toBe('msg-001');
    });
  });
});
