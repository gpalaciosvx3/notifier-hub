import { StageConfig } from '../types/stage-config.types';

export const DevStage: StageConfig = {
  account: process.env.CDK_DEFAULT_ACCOUNT ?? '',
  region:  process.env.CDK_DEFAULT_REGION  ?? 'us-east-1',
  sesSourceEmail: process.env.SES_SOURCE_EMAIL ?? '',
};
