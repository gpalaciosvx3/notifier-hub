export const WebhookDispatcherConstants = {
  MAX_RETRIES: 3,
  RETRY_DELAYS_MS: [2_000, 8_000, 32_000],
} as const;
