import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { NotifierHubStack } from '../lib/notifier-hub.stack';
import { LocalStage } from '../common/stages/local.stage';
import { DevStage } from '../common/stages/dev.stage';

const stage = process.env.CDK_STAGE ?? 'local';
const config = stage === 'dev' ? DevStage : LocalStage;

const app = new cdk.App();

new NotifierHubStack(app, 'NotifierHubStack', {
  config,
  env: {
    account: config.account,
    region:  config.region,
  },
});
