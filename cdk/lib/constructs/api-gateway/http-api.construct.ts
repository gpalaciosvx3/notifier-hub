import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { Construct } from 'constructs';
import { ResourceConstants } from '../../../common/constants/resource.constants';

interface HttpApiProps {
  enqueueFn: lambda.IFunction;
  queryFn: lambda.IFunction;
}

export class HttpApiConstruct extends Construct {
  readonly url: string;

  constructor(scope: Construct, id: string, props: HttpApiProps) {
    super(scope, id);

    const api = new apigateway.RestApi(this, 'Api', {
      restApiName: ResourceConstants.API_NAME,
      description: 'API HTTP para recepción y consulta de notificaciones multicanal',
      deployOptions: {
        stageName: 'prod',
      },
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: ['GET', 'POST', 'OPTIONS'],
        allowHeaders: ['Content-Type', 'Authorization', 'x-api-key'],
      },
    });

    const apiKey = new apigateway.ApiKey(this, 'ApiKey', {
      apiKeyName: `${ResourceConstants.API_NAME}-KEY`,
      description: 'API Key para acceso al API de notificaciones',
    });

    const usagePlan = new apigateway.UsagePlan(this, 'UsagePlan', {
      name: `${ResourceConstants.API_NAME}-PLAN`,
      apiStages: [{ api, stage: api.deploymentStage }],
      throttle: { rateLimit: 100, burstLimit: 200 },
    });

    usagePlan.addApiKey(apiKey);

    const enqueueIntegration = new apigateway.LambdaIntegration(props.enqueueFn);
    const queryIntegration = new apigateway.LambdaIntegration(props.queryFn);

    const v1 = api.root.addResource('v1');

    const notify = v1.addResource('notify');
    notify.addMethod('POST', enqueueIntegration, { apiKeyRequired: true });

    const notifications = v1.addResource('notifications');
    notifications.addMethod('GET', queryIntegration, { apiKeyRequired: true });
    notifications.addResource('{id}').addMethod('GET', queryIntegration, { apiKeyRequired: true });

    this.url = api.url;
  }
}
