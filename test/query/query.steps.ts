import 'reflect-metadata';
import { loadFeature, defineFeature } from 'jest-cucumber';
import { QueryService } from '../../src/query/domain/service/query.service';
import { GetNotificationUseCase } from '../../src/query/application/use-cases/get-notification.usecase';
import { GetNotificationsByRecipientUseCase } from '../../src/query/application/use-cases/get-notifications-by-recipient.usecase';
import { NotificationDbRepository } from '../../src/query/domain/repository/notification.db.repository';
import { NotificationEntity } from '../../src/common/entities/notification.entity';
import { NotificationChannel } from '../../src/common/constants/notification-channel.constants';
import { NotificationProvider } from '../../src/common/constants/notification-provider.constants';
import { NotificationStatus } from '../../src/common/constants/notification-status.constants';
import { CustomException, ValidationException } from '../../src/common/errors/custom.exception';
import { NotificationSummary, PagedResult } from '../../src/query/domain/types/query-output.types';

const feature = loadFeature('./test/query/features/query.feature');

const buildNotification = (): NotificationEntity =>
  NotificationEntity.build({
    channel: NotificationChannel.EMAIL,
    provider: NotificationProvider.SES,
    to: 'user@example.com',
    subject: 'Hello',
    body: 'Test body',
    callbackUrl: 'https://example.com/callback',
  });

defineFeature(feature, test => {
  test('Buscar por ID retorna la notificación cuando existe', ({ given, when, then }) => {
    let service: QueryService;
    let result: NotificationEntity | NotificationEntity[];
    const notification = buildNotification();
    const mockDb = {
      findById: jest.fn().mockResolvedValue(notification),
      findByStatus: jest.fn(),
    } as unknown as NotificationDbRepository;

    given('una notificación con ID "NOTIF-001" existe en la base de datos', () => {
      service = new QueryService(mockDb);
    });

    when('el servicio de consulta busca por ID "NOTIF-001"', async () => {
      result = await service.search({ id: 'NOTIF-001' });
    });

    then('la entidad de notificación es retornada', () => {
      expect(result).toBe(notification);
    });
  });

  test('Buscar por ID lanza NTF-005 cuando la notificación no existe', ({ given, when, then }) => {
    let service: QueryService;
    let error: CustomException;
    const mockDb = {
      findById: jest.fn().mockResolvedValue(null),
      findByStatus: jest.fn(),
    } as unknown as NotificationDbRepository;

    given('ninguna notificación con ID "NOTIF-999" existe en la base de datos', () => {
      service = new QueryService(mockDb);
    });

    when('el servicio de consulta busca por ID "NOTIF-999"', async () => {
      try { await service.search({ id: 'NOTIF-999' }); } catch (e) { error = e as CustomException; }
    });

    then('se lanza una CustomException con código "NTF-005"', () => {
      expect(error).toBeInstanceOf(CustomException);
      expect(error.code).toBe('NTF-005');
    });
  });

  test('Buscar por estado retorna una lista de notificaciones coincidentes', ({ given, when, then }) => {
    let service: QueryService;
    let result: NotificationEntity | NotificationEntity[];
    const notifications = [buildNotification(), buildNotification()];
    const mockDb = {
      findById: jest.fn(),
      findByStatus: jest.fn().mockResolvedValue(notifications),
    } as unknown as NotificationDbRepository;

    given('2 notificaciones con estado "PENDING" existen en la base de datos', () => {
      service = new QueryService(mockDb);
    });

    when('el servicio de consulta busca por estado "PENDING"', async () => {
      result = await service.search({ status: NotificationStatus.PENDING });
    });

    then('se retorna una lista de 2 notificaciones', () => {
      expect(Array.isArray(result)).toBe(true);
      expect((result as NotificationEntity[]).length).toBe(2);
    });
  });

  test('Ejecutar el caso de uso con un payload inválido lanza ValidationException', ({ given, when, then }) => {
    let useCase: GetNotificationUseCase;
    let error: ValidationException;
    const mockDb = { findById: jest.fn(), findByStatus: jest.fn() } as unknown as NotificationDbRepository;

    given('un payload de consulta inválido sin campos reconocidos', () => {
      useCase = new GetNotificationUseCase(new QueryService(mockDb));
    });

    when('el caso de uso de consulta se ejecuta', async () => {
      try { await useCase.execute({}); } catch (e) { error = e as ValidationException; }
    });

    then('se lanza una ValidationException con código "NTF-009"', () => {
      expect(error).toBeInstanceOf(ValidationException);
      expect(error.code).toBe('NTF-009');
    });
  });

  test('Ejecutar el caso de uso con un ID válido delega al servicio de consulta', ({ given, when, then }) => {
    let useCase: GetNotificationUseCase;
    let result: NotificationEntity | NotificationEntity[];
    const notification = buildNotification();
    const mockDb = {
      findById: jest.fn().mockResolvedValue(notification),
      findByStatus: jest.fn(),
    } as unknown as NotificationDbRepository;

    given('una notificación con ID "NOTIF-001" existe en la base de datos', () => {
      useCase = new GetNotificationUseCase(new QueryService(mockDb));
    });

    when('el caso de uso de consulta se ejecuta con id "NOTIF-001"', async () => {
      result = await useCase.execute({ id: 'NOTIF-001' });
    });

    then('la entidad de notificación es retornada', () => {
      expect(result).toBe(notification);
      expect(mockDb.findById).toHaveBeenCalledWith('NOTIF-001');
    });
  });

  test('Consulta por destinatario con resultados retorna la lista ordenada de más reciente a más antigua', ({ given, when, then }) => {
    let useCase: GetNotificationsByRecipientUseCase;
    let result: PagedResult<NotificationSummary>;
    const notifications = [buildNotification(), buildNotification(), buildNotification()];
    const mockDb = {
      findById: jest.fn(),
      findByStatus: jest.fn(),
      findByRecipient: jest.fn().mockResolvedValue({ items: notifications, nextPageToken: undefined }),
    } as unknown as NotificationDbRepository;

    given('que existen 3 notificaciones para el destinatario "user@acme.com"', () => {
      useCase = new GetNotificationsByRecipientUseCase(new QueryService(mockDb));
    });

    when('el caso de uso de consulta por destinatario se ejecuta con to "user@acme.com"', async () => {
      result = await useCase.execute({ to: 'user@acme.com' });
    });

    then('se retorna una lista paginada con 3 elementos sin token de siguiente página', () => {
      expect(result.items).toHaveLength(3);
      expect(result.nextPageToken).toBeUndefined();
      expect(mockDb.findByRecipient).toHaveBeenCalledWith('user@acme.com', undefined);
    });
  });

  test('Consulta por destinatario sin resultados retorna lista vacía', ({ given, when, then }) => {
    let useCase: GetNotificationsByRecipientUseCase;
    let result: PagedResult<NotificationSummary>;
    const mockDb = {
      findById: jest.fn(),
      findByStatus: jest.fn(),
      findByRecipient: jest.fn().mockResolvedValue({ items: [], nextPageToken: undefined }),
    } as unknown as NotificationDbRepository;

    given('que no existen notificaciones para el destinatario "nuevo@acme.com"', () => {
      useCase = new GetNotificationsByRecipientUseCase(new QueryService(mockDb));
    });

    when('el caso de uso de consulta por destinatario se ejecuta con to "nuevo@acme.com"', async () => {
      result = await useCase.execute({ to: 'nuevo@acme.com' });
    });

    then('se retorna una lista paginada vacía sin error', () => {
      expect(result.items).toHaveLength(0);
      expect(result.nextPageToken).toBeUndefined();
    });
  });

  test('Consulta paginada retorna los primeros resultados y un token de siguiente página', ({ given, when, then }) => {
    let useCase: GetNotificationsByRecipientUseCase;
    let result: PagedResult<NotificationSummary>;
    const notifications = Array.from({ length: 20 }, () => buildNotification());
    const mockDb = {
      findById: jest.fn(),
      findByStatus: jest.fn(),
      findByRecipient: jest.fn().mockResolvedValue({ items: notifications, nextPageToken: 'NEXT-TOKEN' }),
    } as unknown as NotificationDbRepository;

    given('que existen 25 notificaciones para el destinatario "user@acme.com" y el repositorio indica que hay más resultados', () => {
      useCase = new GetNotificationsByRecipientUseCase(new QueryService(mockDb));
    });

    when('el caso de uso de consulta por destinatario se ejecuta con to "user@acme.com"', async () => {
      result = await useCase.execute({ to: 'user@acme.com' });
    });

    then('se retorna una lista paginada con 20 elementos y un token de siguiente página', () => {
      expect(result.items).toHaveLength(20);
      expect(result.nextPageToken).toBe('NEXT-TOKEN');
    });
  });

  test('Consulta con token de página retorna el siguiente bloque de resultados', ({ given, when, then }) => {
    let useCase: GetNotificationsByRecipientUseCase;
    let result: PagedResult<NotificationSummary>;
    const notifications = Array.from({ length: 5 }, () => buildNotification());
    const mockDb = {
      findById: jest.fn(),
      findByStatus: jest.fn(),
      findByRecipient: jest.fn().mockResolvedValue({ items: notifications, nextPageToken: undefined }),
    } as unknown as NotificationDbRepository;

    given('que existen 5 notificaciones en la segunda página para el destinatario "user@acme.com"', () => {
      useCase = new GetNotificationsByRecipientUseCase(new QueryService(mockDb));
    });

    when('el caso de uso de consulta por destinatario se ejecuta con to "user@acme.com" y pageToken "TOKEN-002"', async () => {
      result = await useCase.execute({ to: 'user@acme.com', pageToken: 'TOKEN-002' });
    });

    then('se retorna una lista paginada con 5 elementos sin token de siguiente página', () => {
      expect(result.items).toHaveLength(5);
      expect(result.nextPageToken).toBeUndefined();
      expect(mockDb.findByRecipient).toHaveBeenCalledWith('user@acme.com', 'TOKEN-002');
    });
  });
});
