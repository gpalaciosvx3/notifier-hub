import 'reflect-metadata';
import { loadFeature, defineFeature } from 'jest-cucumber';
import { EnqueueNotificationService } from '../../src/enqueue/domain/service/enqueue-notification.service';
import { NotificationInput } from '../../src/enqueue/domain/types/notification-input.types';
import { EnqueueNotificationUseCase } from '../../src/enqueue/application/use-cases/enqueue-notification.usecase';
import { NotificationDbRepository } from '../../src/enqueue/domain/repository/notification.db.repository';
import { TemplateDbRepository } from '../../src/enqueue/domain/repository/template.db.repository';
import { TemplateRenderService } from '../../src/enqueue/domain/service/template-render.service';
import { NotificationEntity } from '../../src/common/entities/notification.entity';
import { NotificationChannel } from '../../src/common/constants/notification-channel.constants';
import { NotificationProvider } from '../../src/common/constants/notification-provider.constants';
import { NotificationStatus } from '../../src/common/constants/notification-status.constants';
import { CustomException, ValidationException } from '../../src/common/errors/custom.exception';
import { OutboxEventType } from '../../src/common/constants/outbox-event-type.constants';

const feature = loadFeature('./test/enqueue/features/enqueue.feature');

defineFeature(feature, (test) => {
  test('Construir una notificación de email válida crea una entidad PENDING', ({
    given,
    when,
    then,
    and,
  }) => {
    let service: EnqueueNotificationService;
    let input: NotificationInput;
    let entity: NotificationEntity;
    const mockDb = { createWithOutboxEvent: jest.fn() } as unknown as NotificationDbRepository;

    given(
      'un comando de construcción para canal "email", destinatario "user@example.com", asunto "Hello", proveedor "ses" y cuerpo "Test body"',
      () => {
        service = new EnqueueNotificationService(
          NotificationProvider.SES,
          NotificationProvider.SNS,
          mockDb,
        );
        input = {
          channel: NotificationChannel.EMAIL,
          to: 'user@example.com',
          body: 'Test body',
          callbackUrl: 'https://example.com/callback',
          provider: NotificationProvider.SES,
          subject: 'Hello',
        };
      },
    );

    when('el servicio de notificación construye la entidad', () => {
      entity = service.build(input);
    });

    then('el estado de la entidad es "PENDING"', () => {
      expect(entity.status).toBe(NotificationStatus.PENDING);
    });

    and('la entidad tiene un notificationId', () => {
      expect(entity.notificationId).toBeDefined();
    });

    and('el canal de la entidad es "email"', () => {
      expect(entity.channel).toBe(NotificationChannel.EMAIL);
    });
  });

  test('Construir una notificación con datos inválidos lanza la excepción correspondiente', ({
    given,
    when,
    then,
  }) => {
    let service: EnqueueNotificationService;
    let input: NotificationInput;
    let error: CustomException;
    const mockDb = { createWithOutboxEvent: jest.fn() } as unknown as NotificationDbRepository;

    given(
      /un comando de construcción para canal "(.+)", destinatario "(.+)", asunto "(.*)", proveedor "(.+)" y cuerpo "Test body"/,
      (canal, destinatario, asunto, proveedor) => {
        service = new EnqueueNotificationService(
          NotificationProvider.SES,
          NotificationProvider.SNS,
          mockDb,
        );
        input = {
          channel: canal as NotificationChannel,
          to: destinatario,
          body: 'Test body',
          callbackUrl: 'https://example.com/callback',
          provider: proveedor as NotificationProvider,
          subject: asunto || undefined,
        };
      },
    );

    when('el servicio de notificación intenta construir la entidad', () => {
      try {
        service.build(input);
      } catch (e) {
        error = e as CustomException;
      }
    });

    then(/se lanza una CustomException con código "(.+)"/, (codigo) => {
      expect(error).toBeInstanceOf(CustomException);
      expect(error.code).toBe(codigo);
    });
  });

  test('Construir una notificación de SMS válida crea una entidad PENDING', ({
    given,
    when,
    then,
    and,
  }) => {
    let service: EnqueueNotificationService;
    let input: NotificationInput;
    let entity: NotificationEntity;
    const mockDb = { createWithOutboxEvent: jest.fn() } as unknown as NotificationDbRepository;

    given(
      'un comando de construcción para canal "sms", destinatario "+15551234567", proveedor "sns" y cuerpo "Test body"',
      () => {
        service = new EnqueueNotificationService(
          NotificationProvider.SES,
          NotificationProvider.SNS,
          mockDb,
        );
        input = {
          channel: NotificationChannel.SMS,
          to: '+15551234567',
          body: 'Test body',
          callbackUrl: 'https://example.com/callback',
          provider: NotificationProvider.SNS,
        };
      },
    );

    when('el servicio de notificación construye la entidad', () => {
      entity = service.build(input);
    });

    then('el estado de la entidad es "PENDING"', () => {
      expect(entity.status).toBe(NotificationStatus.PENDING);
    });

    and('el canal de la entidad es "sms"', () => {
      expect(entity.channel).toBe(NotificationChannel.SMS);
    });
  });

  test('Encolar una notificación válida la persiste y registra el evento de outbox', ({
    given,
    when,
    then,
    and,
  }) => {
    const mockDb = {
      createWithOutboxEvent: jest.fn().mockResolvedValue(undefined),
    } as unknown as NotificationDbRepository;
    let useCase: EnqueueNotificationUseCase;
    let payload: unknown;
    let notificationId: string;

    given(
      'un payload de encolar válido con canal "email", destinatario "user@example.com", asunto "Hello" y cuerpo "Test body"',
      () => {
        const mockTemplateRepo = {
          findActiveByTemplateId: jest.fn(),
        } as unknown as TemplateDbRepository;
        useCase = new EnqueueNotificationUseCase(
          new EnqueueNotificationService(NotificationProvider.SES, NotificationProvider.SNS, mockDb),
          mockTemplateRepo,
          new TemplateRenderService(),
        );
        payload = {
          channel: 'email',
          to: 'user@example.com',
          subject: 'Hello',
          body: 'Test body',
          provider: 'ses',
          callbackUrl: 'https://example.com/callback',
        };
      },
    );

    when('el caso de uso de encolar se ejecuta', async () => {
      notificationId = await useCase.execute(payload);
    });

    then('se retorna un ID de notificación', () => {
      expect(typeof notificationId).toBe('string');
      expect(notificationId.length).toBeGreaterThan(0);
    });

    and('la notificación es guardada en la base de datos', () => {
      expect(mockDb.createWithOutboxEvent).toHaveBeenCalledTimes(1);
    });

    and('el evento de outbox es registrado junto a la notificación', () => {
      const [, outboxEvent] = (mockDb.createWithOutboxEvent as jest.Mock).mock.calls[0];
      expect(outboxEvent).toBeDefined();
    });
  });

  test('Encolar un payload sin canal lanza una ValidationException', ({ given, when, then }) => {
    const mockDb = { createWithOutboxEvent: jest.fn() } as unknown as NotificationDbRepository;
    let useCase: EnqueueNotificationUseCase;
    let payload: unknown;
    let error: ValidationException;

    given('un payload de encolar sin el campo canal', () => {
      const mockTemplateRepo = {
        findActiveByTemplateId: jest.fn(),
      } as unknown as TemplateDbRepository;
      useCase = new EnqueueNotificationUseCase(
        new EnqueueNotificationService(NotificationProvider.SES, NotificationProvider.SNS, mockDb),
        mockTemplateRepo,
        new TemplateRenderService(),
      );
      payload = { to: 'user@example.com', body: 'Test body' };
    });

    when('el caso de uso de encolar se ejecuta', async () => {
      try {
        await useCase.execute(payload);
      } catch (e) {
        error = e as ValidationException;
      }
    });

    then('se lanza una ValidationException con código "NTF-009"', () => {
      expect(error).toBeInstanceOf(ValidationException);
      expect(error.code).toBe('NTF-009');
    });
  });

  test(
    'Encolar una notificación con scheduledAt futuro la persiste con estado SCHEDULED',
    ({ given, when, then, and }) => {
      const mockDb = {
        createWithOutboxEvent: jest.fn().mockResolvedValue(undefined),
      } as unknown as NotificationDbRepository;
      let useCase: EnqueueNotificationUseCase;
      let payload: unknown;
      let notificationId: string;

      given(
        'un payload de encolar con canal "email", destinatario "user@example.com", asunto "Hello", cuerpo "Test body" y scheduledAt en el futuro',
        () => {
          const mockTemplateRepo = {
            findActiveByTemplateId: jest.fn(),
          } as unknown as TemplateDbRepository;
          useCase = new EnqueueNotificationUseCase(
            new EnqueueNotificationService(
              NotificationProvider.SES,
              NotificationProvider.SNS,
              mockDb,
            ),
            mockTemplateRepo,
            new TemplateRenderService(),
          );
          const futureDate = new Date(Date.now() + 60 * 60 * 1000).toISOString();
          payload = {
            channel: 'email',
            to: 'user@example.com',
            subject: 'Hello',
            body: 'Test body',
            provider: 'ses',
            callbackUrl: 'https://example.com/callback',
            scheduledAt: futureDate,
          };
        },
      );

      when('el caso de uso de encolar se ejecuta', async () => {
        notificationId = await useCase.execute(payload);
      });

      then('se retorna un ID de notificación', () => {
        expect(typeof notificationId).toBe('string');
        expect(notificationId.length).toBeGreaterThan(0);
      });

      and('la notificación es guardada con estado "SCHEDULED"', () => {
        const [notification] = (mockDb.createWithOutboxEvent as jest.Mock).mock.calls[0];
        expect(notification.status).toBe(NotificationStatus.SCHEDULED);
      });

      and('el evento de outbox es de tipo "NOTIFICATION_SCHEDULED"', () => {
        const [, outboxEvent] = (mockDb.createWithOutboxEvent as jest.Mock).mock.calls[0];
        expect(outboxEvent.eventType).toBe(OutboxEventType.NOTIFICATION_SCHEDULED);
      });
    },
  );

  test(
    'Encolar una notificación con scheduledAt pasado lanza ValidationException',
    ({ given, when, then }) => {
      const mockDb = {
        createWithOutboxEvent: jest.fn(),
      } as unknown as NotificationDbRepository;
      let useCase: EnqueueNotificationUseCase;
      let payload: unknown;
      let error: ValidationException;

      given('un payload de encolar con scheduledAt en el pasado', () => {
        const mockTemplateRepo = {
          findActiveByTemplateId: jest.fn(),
        } as unknown as TemplateDbRepository;
        useCase = new EnqueueNotificationUseCase(
          new EnqueueNotificationService(
            NotificationProvider.SES,
            NotificationProvider.SNS,
            mockDb,
          ),
          mockTemplateRepo,
          new TemplateRenderService(),
        );
        const pastDate = new Date(Date.now() - 60 * 60 * 1000).toISOString();
        payload = {
          channel: 'email',
          to: 'user@example.com',
          subject: 'Hello',
          body: 'Test body',
          provider: 'ses',
          callbackUrl: 'https://example.com/callback',
          scheduledAt: pastDate,
        };
      });

      when('el caso de uso de encolar se ejecuta', async () => {
        try {
          await useCase.execute(payload);
        } catch (e) {
          error = e as ValidationException;
        }
      });

      then('se lanza una ValidationException con código "NTF-009"', () => {
        expect(error).toBeInstanceOf(ValidationException);
        expect(error.code).toBe('NTF-009');
      });
    },
  );
});
