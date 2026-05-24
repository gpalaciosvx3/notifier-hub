import { NotificationChannel } from '../../../common/constants/notification-channel.constants';
import { NotificationProvider } from '../../../common/constants/notification-provider.constants';

export type InlineEnqueueRequest = {
  channel: NotificationChannel;
  provider?: NotificationProvider;
  to: string;
  subject?: string;
  body: string;
  callbackUrl: string;
  scheduledAt?: string;
};

export type TemplateEnqueueRequest = {
  templateId: string;
  to: string;
  variables?: Record<string, unknown>;
  callbackUrl: string;
  scheduledAt?: string;
};

export type EnqueueRequest = InlineEnqueueRequest | TemplateEnqueueRequest;

export const isTemplateEnqueueRequest = (req: EnqueueRequest): req is TemplateEnqueueRequest =>
  'templateId' in req;
