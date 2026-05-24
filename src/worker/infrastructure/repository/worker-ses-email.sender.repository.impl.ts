import { Injectable } from '@nestjs/common';
import { SesClient } from '../../../common/ses/ses.client';
import { SesSenderRepository } from '../../domain/repository/worker-notification-sender.repository';

@Injectable()
export class SesSenderRepositoryImpl extends SesSenderRepository {
  constructor(
    private readonly sesClient: SesClient,
    private readonly sourceEmail: string,
  ) {
    super();
  }

  async send(para: string, asunto: string | undefined, cuerpo: string): Promise<void> {
    await this.sesClient.sendEmail(this.sourceEmail, para, asunto, cuerpo);
  }
}
