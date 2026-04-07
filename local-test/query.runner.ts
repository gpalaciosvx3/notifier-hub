import 'dotenv/config';
import { APIGatewayProxyEventV2 } from 'aws-lambda';
import { handler } from '../src/query/infrastructure/bootstrap/query.handler';
import { NotificationStatus } from '../src/common/constants/notification-status.constants';

function buildEvent(pathParams: Record<string, string>, queryParams: Record<string, string>): APIGatewayProxyEventV2 {
  return {
    version: '2.0',
    routeKey: 'GET /notifications',
    rawPath: '/notifications',
    rawQueryString: new URLSearchParams(queryParams).toString(),
    headers: {},
    requestContext: {
      accountId: '000000000000',
      apiId: 'local',
      domainName: 'localhost',
      domainPrefix: 'local',
      http: { method: 'GET', path: '/notifications', protocol: 'HTTP/1.1', sourceIp: '127.0.0.1', userAgent: 'local-runner' },
      requestId: 'local-req-query',
      routeKey: 'GET /notifications',
      stage: '$default',
      time: new Date().toISOString(),
      timeEpoch: Date.now(),
    },
    pathParameters: Object.keys(pathParams).length ? pathParams : undefined,
    queryStringParameters: Object.keys(queryParams).length ? queryParams : undefined,
    isBase64Encoded: false,
  };
}

// Cambia el ID o el status según lo que quieras probar
const BY_ID     = buildEvent({ id: 'REEMPLAZA_CON_UN_ID_REAL' }, {});
const BY_STATUS = buildEvent({}, { status: NotificationStatus.PENDING });

const event = process.argv[2] === 'id' ? BY_ID : BY_STATUS;

handler(event).then(result => {
  if (typeof result === 'object') {
    console.log('status:', result.statusCode);
    console.log('body:  ', JSON.parse(result.body as string));
  }
}).catch(console.error);
