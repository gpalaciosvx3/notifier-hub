import { NotificationChannel } from '../../../common/constants/notification-channel.constants';
import { NotificationProvider } from '../../../common/constants/notification-provider.constants';

export class BuildNotificationCommand {
  constructor(
    public readonly channel: NotificationChannel,
    public readonly to: string,
    public readonly body: string,
    public readonly provider?: NotificationProvider,
    public readonly subject?: string,
  ) {}
}
