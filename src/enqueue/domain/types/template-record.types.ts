import { NotificationChannel } from '../../../common/constants/notification-channel.constants';
import { NotificationProvider } from '../../../common/constants/notification-provider.constants';

export type TemplateRecord = {
  templateId: string;
  version: number;
  channel: NotificationChannel;
  provider: NotificationProvider;
  subject: string;
  body: string;
  active: boolean;
  createdAt: string;
};
