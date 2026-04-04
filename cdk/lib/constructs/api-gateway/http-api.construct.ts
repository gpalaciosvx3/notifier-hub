import * as apigatewayv2 from 'aws-cdk-lib/aws-apigatewayv2';
import { HttpLambdaIntegration } from 'aws-cdk-lib/aws-apigatewayv2-integrations';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Construct } from 'constructs';
import { ResourceConstants } from '../../../common/constants/resource.constants';

interface HttpApiProps {
  enqueueFn: NodejsFunction;
  queryFn: NodejsFunction;
}

export class HttpApiConstruct extends Construct {
  readonly url: string;

  constructor(scope: Construct, id: string, props: HttpApiProps) {
    super(scope, id);

    const api = new apigatewayv2.HttpApi(this, 'Api', {
      apiName: ResourceConstants.API_NAME,
      corsPreflight: {
        allowOrigins: ['*'],
        allowMethods: [apigatewayv2.CorsHttpMethod.POST, apigatewayv2.CorsHttpMethod.GET],
        allowHeaders: ['Content-Type', 'Authorization'],
      },
    });

    api.addRoutes({
      path: '/notify',
      methods: [apigatewayv2.HttpMethod.POST],
      integration: new HttpLambdaIntegration('EnqueueIntegration', props.enqueueFn),
    });

    api.addRoutes({
      path: '/notifications/{id}',
      methods: [apigatewayv2.HttpMethod.GET],
      integration: new HttpLambdaIntegration('QueryByIdIntegration', props.queryFn),
    });

    api.addRoutes({
      path: '/notifications',
      methods: [apigatewayv2.HttpMethod.GET],
      integration: new HttpLambdaIntegration('QueryByStatusIntegration', props.queryFn),
    });

    this.url = api.url ?? '';
  }
}
