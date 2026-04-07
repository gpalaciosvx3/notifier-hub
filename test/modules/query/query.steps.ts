import 'reflect-metadata';
import { loadFeature, defineFeature } from 'jest-cucumber';
import { QueryService } from '../../../src/query/domain/service/query.service';
import { GetNotificationUseCase } from '../../../src/query/application/use-cases/get-notification.usecase';
import { NotificationDbRepository } from '../../../src/query/domain/repository/notification.db.repository';
import { SearchNotificationCommand } from '../../../src/query/domain/commands/search-notification.command';
import { NotificationEntity } from '../../../src/common/entities/notification.entity';
import { NotificationChannel } from '../../../src/common/constants/notification-channel.constants';
import { NotificationProvider } from '../../../src/common/constants/notification-provider.constants';
import { NotificationStatus } from '../../../src/common/constants/notification-status.constants';
import { CustomException, ValidationException } from '../../../src/common/errors/custom.exception';

const feature = loadFeature('./test/modules/query/features/query.feature');

const buildNotification = (id?: string): NotificationEntity =>
  NotificationEntity.build({
    channel: NotificationChannel.EMAIL,
    provider: NotificationProvider.SES,
    to: 'user@example.com',
    subject: 'Hello',
    body: 'Test body',
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
      result = await service.search(SearchNotificationCommand.byId('NOTIF-001'));
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
      try { await service.search(SearchNotificationCommand.byId('NOTIF-999')); } catch (e) { error = e as CustomException; }
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
      result = await service.search(SearchNotificationCommand.byStatus(NotificationStatus.PENDING));
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
});
