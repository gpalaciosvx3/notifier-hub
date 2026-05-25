import { Injectable, Logger } from '@nestjs/common';
import { SesClient } from '../../../common/ses/ses.client';
import { SesSenderRepository } from '../../domain/repository/sender-channel.repository';

@Injectable()
export class SesSenderRepositoryImpl extends SesSenderRepository {
  private readonly logger = new Logger(SesSenderRepositoryImpl.name);

  constructor(
    private readonly sesClient: SesClient,
    private readonly sourceEmail: string,
  ) {
    super();
  }

  async send(para: string, asunto: string | undefined, cuerpo: string): Promise<void> {
    this.logger.log(`[SES] source="${this.sourceEmail}" to="${para}"`);
    await this.sesClient.sendEmail(this.sourceEmail, para, asunto, cuerpo);
  }
}
