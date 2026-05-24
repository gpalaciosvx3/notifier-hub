import { Injectable } from '@nestjs/common';
import { SnsClient } from '../../../common/sns/sns.client';
import { SnsSenderRepository } from '../../domain/repository/sender-channel.repository';

@Injectable()
export class SnsSenderRepositoryImpl extends SnsSenderRepository {
  constructor(private readonly snsClient: SnsClient) {
    super();
  }

  async send(para: string, _asunto: string | undefined, cuerpo: string): Promise<void> {
    await this.snsClient.publish(para, cuerpo);
  }
}
