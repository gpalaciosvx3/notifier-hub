export abstract class NotificationSenderRepository {
  abstract send(para: string, asunto: string | undefined, cuerpo: string): Promise<void>;
}

export abstract class SesSenderRepository extends NotificationSenderRepository {}
export abstract class SnsSenderRepository extends NotificationSenderRepository {}
