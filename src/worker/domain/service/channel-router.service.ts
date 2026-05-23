import { Injectable, Logger } from '@nestjs/common';
import { NotificationSenderRepository } from '../repository/notification.sender.repository';
import { ErrorDictionary } from '../../../common/errors/error.dictionary';
import { CustomException } from '../../../common/errors/custom.exception';

@Injectable()
export class ChannelRouterService {
  private readonly logger = new Logger(ChannelRouterService.name);

  constructor(private readonly senders: Map<string, NotificationSenderRepository>) {}

  resolve(channel: string, provider: string): NotificationSenderRepository {
    const key = `${channel}:${provider}`;
    this.logger.log(`[PASO 1] Resolviendo remitente => key: ${key}`);
    const sender = this.senders.get(key);
    if (!sender) throw new CustomException(ErrorDictionary.UNRESOLVABLE_SENDER, key);
    return sender;
  }
}
