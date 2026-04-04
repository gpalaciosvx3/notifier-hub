import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { NotifierHubStack } from '../lib/notifier-hub.stack';
import { DevStage } from '../common/stages/dev.stage';

const app = new cdk.App();

new NotifierHubStack(app, 'NotifierHubStack', {
  config: DevStage,
  env: {
    account: DevStage.account,
    region: DevStage.region,
  },
});
