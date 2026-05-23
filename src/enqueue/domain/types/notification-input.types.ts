import { NotificationChannel } from '../../../common/constants/notification-channel.constants';
import { NotificationProvider } from '../../../common/constants/notification-provider.constants';

export type NotificationInput = {
  channel: NotificationChannel;
  to: string;
  body: string;
  callbackUrl: string;
  provider?: NotificationProvider;
  subject?: string;
  templateId?: string;
  templateVersion?: number;
};
