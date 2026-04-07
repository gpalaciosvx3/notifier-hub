import { Logger } from '@nestjs/common';
import { NotificationSenderRepository } from '../repository/notification.sender.repository';
import { ErrorDictionary } from '../../../common/errors/error.dictionary';
import { CustomException } from '../../../common/errors/custom.exception';

export class ChannelRouterService {
  private readonly logger = new Logger(ChannelRouterService.name);

  constructor(
    private readonly remitentes: Map<string, NotificationSenderRepository>,
  ) {}

  resolve(canal: string, proveedor: string): NotificationSenderRepository {
    const clave = `${canal}:${proveedor}`;
    const remitente = this.remitentes.get(clave);

    this.logger.log(`Resolviendo remitente para canal ${canal} y proveedor ${proveedor}: ${remitente ? 'encontrado' : 'no encontrado'}`);

    if (!remitente) throw new CustomException(ErrorDictionary.UNRESOLVABLE_SENDER, clave);

    return remitente;
  }
}
