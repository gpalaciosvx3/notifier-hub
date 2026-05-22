import 'reflect-metadata';
import { loadFeature, defineFeature } from 'jest-cucumber';
import { NotificationService } from '../../src/enqueue/domain/service/notification.service';
import { BuildNotificationCommand } from '../../src/enqueue/domain/commands/build-notification.command';
import { EnqueueNotificationUseCase } from '../../src/enqueue/application/use-cases/enqueue-notification.usecase';
import { NotificationDbRepository } from '../../src/enqueue/domain/repository/notification.db.repository';
import { NotificationSqsRepository } from '../../src/enqueue/domain/repository/notification.sqs.repository';
import { TemplateDbRepository } from '../../src/enqueue/domain/repository/template.db.repository';
import { TemplateRenderService } from '../../src/enqueue/domain/service/template.render.service';
import { NotificationEntity } from '../../src/common/entities/notification.entity';
import { NotificationChannel } from '../../src/common/constants/notification-channel.constants';
import { NotificationProvider } from '../../src/common/constants/notification-provider.constants';
import { NotificationStatus } from '../../src/common/constants/notification-status.constants';
import { CustomException, ValidationException } from '../../src/common/errors/custom.exception';

const feature = loadFeature('./test/enqueue/features/enqueue.feature');

defineFeature(feature, test => {
  test('Construir una notificación de email válida crea una entidad PENDING', ({ given, when, then, and }) => {
    let service: NotificationService;
    let command: BuildNotificationCommand;
    let entity: NotificationEntity;
    const mockDb = { create: jest.fn() } as unknown as NotificationDbRepository;
    const mockSqs = { enqueue: jest.fn() } as unknown as NotificationSqsRepository;

    given('un comando de construcción para canal "email", destinatario "user@example.com", asunto "Hello", proveedor "ses" y cuerpo "Test body"', () => {
      service = new NotificationService(NotificationProvider.SES, NotificationProvider.SNS, mockDb, mockSqs);
      command = new BuildNotificationCommand(NotificationChannel.EMAIL, 'user@example.com', 'Test body', NotificationProvider.SES, 'Hello');
    });

    when('el servicio de notificación construye la entidad', () => {
      entity = service.build(command);
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

  test('Construir una notificación con datos inválidos lanza la excepción correspondiente', ({ given, when, then }) => {
    let service: NotificationService;
    let command: BuildNotificationCommand;
    let error: CustomException;
    const mockDb = { create: jest.fn() } as unknown as NotificationDbRepository;
    const mockSqs = { enqueue: jest.fn() } as unknown as NotificationSqsRepository;

    given(/un comando de construcción para canal "(.+)", destinatario "(.+)", asunto "(.*)", proveedor "(.+)" y cuerpo "Test body"/, (canal, destinatario, asunto, proveedor) => {
      service = new NotificationService(NotificationProvider.SES, NotificationProvider.SNS, mockDb, mockSqs);
      command = new BuildNotificationCommand(
        canal as NotificationChannel,
        destinatario,
        'Test body',
        proveedor as NotificationProvider,
        asunto || undefined,
      );
    });

    when('el servicio de notificación intenta construir la entidad', () => {
      try { service.build(command); } catch (e) { error = e as CustomException; }
    });

    then(/se lanza una CustomException con código "(.+)"/, (codigo) => {
      expect(error).toBeInstanceOf(CustomException);
      expect(error.code).toBe(codigo);
    });
  });

  test('Construir una notificación de SMS válida crea una entidad PENDING', ({ given, when, then, and }) => {
    let service: NotificationService;
    let command: BuildNotificationCommand;
    let entity: NotificationEntity;
    const mockDb = { create: jest.fn() } as unknown as NotificationDbRepository;
    const mockSqs = { enqueue: jest.fn() } as unknown as NotificationSqsRepository;

    given('un comando de construcción para canal "sms", destinatario "+15551234567", proveedor "sns" y cuerpo "Test body"', () => {
      service = new NotificationService(NotificationProvider.SES, NotificationProvider.SNS, mockDb, mockSqs);
      command = new BuildNotificationCommand(NotificationChannel.SMS, '+15551234567', 'Test body', NotificationProvider.SNS);
    });

    when('el servicio de notificación construye la entidad', () => {
      entity = service.build(command);
    });

    then('el estado de la entidad es "PENDING"', () => {
      expect(entity.status).toBe(NotificationStatus.PENDING);
    });

    and('el canal de la entidad es "sms"', () => {
      expect(entity.channel).toBe(NotificationChannel.SMS);
    });
  });

  test('Encolar una notificación válida la persiste y encola', ({ given, when, then, and }) => {
    const mockDb = { create: jest.fn().mockResolvedValue(undefined) } as unknown as NotificationDbRepository;
    const mockSqs = { enqueue: jest.fn().mockResolvedValue(undefined) } as unknown as NotificationSqsRepository;
    let useCase: EnqueueNotificationUseCase;
    let payload: unknown;
    let notificationId: string;

    given('un payload de encolar válido con canal "email", destinatario "user@example.com", asunto "Hello" y cuerpo "Test body"', () => {
      const mockTemplateRepo = { findActiveByTemplateId: jest.fn() } as unknown as TemplateDbRepository;
      useCase = new EnqueueNotificationUseCase(new NotificationService(NotificationProvider.SES, NotificationProvider.SNS, mockDb, mockSqs), mockTemplateRepo, new TemplateRenderService());
      payload = { channel: 'email', to: 'user@example.com', subject: 'Hello', body: 'Test body', provider: 'ses' };
    });

    when('el caso de uso de encolar se ejecuta', async () => {
      notificationId = await useCase.execute(payload);
    });

    then('se retorna un ID de notificación', () => {
      expect(typeof notificationId).toBe('string');
      expect(notificationId.length).toBeGreaterThan(0);
    });

    and('la notificación es guardada en la base de datos', () => {
      expect(mockDb.create).toHaveBeenCalledTimes(1);
    });

    and('la notificación es enviada a la cola', () => {
      expect(mockSqs.enqueue).toHaveBeenCalledTimes(1);
    });
  });

  test('Encolar un payload sin canal lanza una ValidationException', ({ given, when, then }) => {
    const mockDb = { create: jest.fn() } as unknown as NotificationDbRepository;
    const mockSqs = { enqueue: jest.fn() } as unknown as NotificationSqsRepository;
    let useCase: EnqueueNotificationUseCase;
    let payload: unknown;
    let error: ValidationException;

    given('un payload de encolar sin el campo canal', () => {
      const mockTemplateRepo = { findActiveByTemplateId: jest.fn() } as unknown as TemplateDbRepository;
      useCase = new EnqueueNotificationUseCase(new NotificationService(NotificationProvider.SES, NotificationProvider.SNS, mockDb, mockSqs), mockTemplateRepo, new TemplateRenderService());
      payload = { to: 'user@example.com', body: 'Test body' };
    });

    when('el caso de uso de encolar se ejecuta', async () => {
      try { await useCase.execute(payload); } catch (e) { error = e as ValidationException; }
    });

    then('se lanza una ValidationException con código "NTF-009"', () => {
      expect(error).toBeInstanceOf(ValidationException);
      expect(error.code).toBe('NTF-009');
    });
  });
});
