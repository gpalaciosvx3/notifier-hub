import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { NotifierHubStack } from '../lib/notifier-hub.stack';

const app = new cdk.App();

new NotifierHubStack(app, 'NotifierHubStack', {
  sesSourceEmail: process.env.SES_SOURCE_EMAIL ?? '',
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT || '000000000000',
    region: process.env.CDK_DEFAULT_REGION ?? 'us-east-1',
  },
});
