import 'reflect-metadata';
import { loadFeature, defineFeature } from 'jest-cucumber';
import { RelayService } from '../../src/relay/domain/service/relay.service';
import { OutboxEventDbRepository } from '../../src/relay/domain/repository/outbox-event.db.repository';
import { BrokerPublishStrategy } from '../../src/relay/domain/strategy/broker-publish.strategy';
import { OutboxEventEntity } from '../../src/common/entities/outbox-event.entity';
import { OutboxEventType } from '../../src/common/constants/outbox-event-type.constants';
import { OutboxEventBrokerType } from '../../src/common/constants/outbox-event-broker-type.constants';

const feature = loadFeature('./test/relay/features/relay.feature');

const brokerTypeFor = (eventType: OutboxEventType): OutboxEventBrokerType => ({
  [OutboxEventType.NOTIFICATION_CREATED]: OutboxEventBrokerType.SQS_NOTIFICATION,
  [OutboxEventType.NOTIFICATION_SCHEDULED]: OutboxEventBrokerType.SCHEDULER,
  [OutboxEventType.WEBHOOK_REQUESTED]: OutboxEventBrokerType.SQS_WEBHOOK,
}[eventType]);

defineFeature(feature, test => {
  test('El relay publica el evento según su tipo y lo marca como publicado', ({ given, when, then, and }) => {
    let service: RelayService;
    let event: OutboxEventEntity;
    const mockNotificationStrategy = { publish: jest.fn().mockResolvedValue(undefined) } as unknown as BrokerPublishStrategy;
    const mockScheduledStrategy = { publish: jest.fn().mockResolvedValue(undefined) } as unknown as BrokerPublishStrategy;
    const mockWebhookStrategy = { publish: jest.fn().mockResolvedValue(undefined) } as unknown as BrokerPublishStrategy;
    const mockOutboxDb = { markPublished: jest.fn().mockResolvedValue(undefined) } as unknown as OutboxEventDbRepository;

    const strategyMocks: Record<string, BrokerPublishStrategy> = {
      notificacion: mockNotificationStrategy,
      scheduler: mockScheduledStrategy,
      webhook: mockWebhookStrategy,
    };

    given(/un evento de outbox de tipo "(.+)" con payload válido/, (tipoEvento: string) => {
      service = new RelayService(mockOutboxDb, mockNotificationStrategy, mockScheduledStrategy, mockWebhookStrategy);
      event = OutboxEventEntity.build({
        eventType: tipoEvento as OutboxEventType,
        brokerType: brokerTypeFor(tipoEvento as OutboxEventType),
        payload: { notificationId: 'NOTIF-001', notification: {}, scheduledAt: '2026-06-01T10:00:00.000Z' },
      });
    });

    when('el servicio relay procesa el evento', async () => {
      await service.relay(event);
    });

    then(/la estrategia "(.+)" es invocada para publicar/, (estrategia: string) => {
      expect((strategyMocks[estrategia].publish as jest.Mock)).toHaveBeenCalledWith(event);
    });

    and('el evento es marcado como publicado en el repositorio de outbox', () => {
      expect(mockOutboxDb.markPublished).toHaveBeenCalledWith(event.eventId, expect.any(String));
    });
  });

  test('Fallo de publicación no actualiza publishedAt', ({ given, and, when, then }) => {
    let service: RelayService;
    let event: OutboxEventEntity;
    let error: Error;
    const mockNotificationStrategy = { publish: jest.fn().mockRejectedValue(new Error('SQS unavailable')) } as unknown as BrokerPublishStrategy;
    const mockScheduledStrategy = { publish: jest.fn() } as unknown as BrokerPublishStrategy;
    const mockWebhookStrategy = { publish: jest.fn() } as unknown as BrokerPublishStrategy;
    const mockOutboxDb = { markPublished: jest.fn() } as unknown as OutboxEventDbRepository;

    given(/un evento de outbox de tipo "(.+)" con payload válido/, () => {
      service = new RelayService(mockOutboxDb, mockNotificationStrategy, mockScheduledStrategy, mockWebhookStrategy);
      event = OutboxEventEntity.build({
        eventType: OutboxEventType.NOTIFICATION_CREATED,
        brokerType: OutboxEventBrokerType.SQS_NOTIFICATION,
        payload: { notificationId: 'NOTIF-001' },
      });
    });

    and('la estrategia de notificación lanza un error al publicar', () => {
      // ya configurado en el mock
    });

    when('el servicio relay intenta procesar el evento', async () => {
      try { await service.relay(event); } catch (e) { error = e as Error; }
    });

    then('el evento no es marcado como publicado en el repositorio de outbox', () => {
      expect(error).toBeDefined();
      expect(mockOutboxDb.markPublished).not.toHaveBeenCalled();
    });
  });
});
