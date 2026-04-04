import { Injectable } from '@nestjs/common';
import { PublishCommand } from '@aws-sdk/client-sns';
import { snsClient } from '../../../common/config/aws.config';
import { SnsSenderRepository } from '../../domain/repository/notification.sender.repository';

@Injectable()
export class SnsSenderRepositoryImpl extends SnsSenderRepository {
  async send(para: string, _asunto: string | undefined, cuerpo: string): Promise<void> {
    await snsClient.send(
      new PublishCommand({ PhoneNumber: para, Message: cuerpo }),
    );
  }
}
