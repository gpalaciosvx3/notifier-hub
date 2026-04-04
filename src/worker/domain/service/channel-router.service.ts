import { NotificationSenderRepository } from '../repository/notification.sender.repository';
import { ErrorDictionary } from '../../../common/errors/error.dictionary';
import { CustomException } from '../../../common/errors/custom.exception';

export class ChannelRouterService {
  constructor(
    private readonly remitentes: Map<string, NotificationSenderRepository>,
  ) {}

  resolve(canal: string, proveedor: string): NotificationSenderRepository {
    const clave = `${canal}:${proveedor}`;
    const remitente = this.remitentes.get(clave);

    if (!remitente) throw new CustomException(ErrorDictionary.UNRESOLVABLE_SENDER, clave);

    return remitente;
  }
}
